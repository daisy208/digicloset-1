/**
 * DigiCloset AI microservice - Express
 * Exposes routes: /upload, /items, /recommend, /stats
 * Also provides /api/ai/chat as a simple proxy to OpenAI (if OPENAI_API_KEY provided)
 *
 * To run:
 *   cd ai-node
 *   npm install
 *   export MONGODB_URI="mongodb://..."   # optional for Mongo persistence
 *   export OPENAI_API_KEY="sk-..."
 *   node index.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai').default;
const sharp = require('sharp');

const PORT = process.env.PORT || 8081;
const MONGO_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'digicloset';
const IMAGE_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

const upload = multer({ dest: IMAGE_DIR });
const app = express();
app.use(cors());
app.use(bodyParser.json());

let db = null;
let itemsColl = null;

// Connect to Mongo if URI provided
async function initDb() {
  if (!MONGO_URI) {
    console.log("MONGODB_URI not provided - running with in-memory DB only.");
    // In-memory store fallback:
    db = { items: [] };
    itemsColl = null;
    return;
  }
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  itemsColl = db.collection('items');
  console.log("Connected to MongoDB:", MONGO_URI);
}
initDb().catch(err => console.error("DB init failed:", err));

// Simple in-memory store if no Mongo
const inMemory = {
  items: [],
  stats: { uploads: 0 }
};

// Helper: store item metadata (image path, tags, usage)
async function storeItem(meta) {
  if (itemsColl) {
    const res = await itemsColl.insertOne(meta);
    return res.insertedId;
  } else {
    meta._id = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2,8);
    inMemory.items.push(meta);
    return meta._id;
  }
}

// Route: upload image
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Optional: generate a web-friendly resized image with sharp
    const outPath = path.join(IMAGE_DIR, 'resized-' + file.filename + '.jpg');
    try {
      await sharp(file.path).resize(800, 800, { fit: 'inside' }).jpeg().toFile(outPath);
    } catch (e) {
      // ignore, use original
    }

    // Basic auto-tagging heuristic: filename + simple color detection (placeholder)
    const tags = [];
    if (file.originalname) {
      const name = file.originalname.toLowerCase();
      if (name.match(/shirt|tee/)) tags.push('top');
      if (name.match(/pant|jean|trouser/)) tags.push('bottom');
      if (name.match(/dress/)) tags.push('dress');
      if (name.match(/jacket|coat/)) tags.push('outerwear');
    }
    // usage count starts at 0
    const meta = {
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      resized: fs.existsSync(outPath) ? outPath : null,
      tags,
      usage: 0,
      uploadedAt: new Date()
    };
    const id = await storeItem(meta);
    inMemory.stats.uploads += 1;
    res.json({ id, meta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Route: list items
app.get('/items', async (req, res) => {
  try {
    if (itemsColl) {
      const docs = await itemsColl.find({}).toArray();
      res.json(docs);
    } else {
      res.json(inMemory.items);
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Route: recommend - basic AI / heuristic
app.post('/recommend', async (req, res) => {
  /**
   * Expects { itemIds: [id1,id2], occasion: "casual", prefs: {...} }
   * Returns array of recommendations (strings or item ids)
   */
  try {
    const body = req.body || {};
    const { itemIds = [], occasion = 'casual', prefs = {} } = body;

    // Load items
    let items = itemsColl ? await itemsColl.find({}).toArray() : inMemory.items.slice();

    // Mark used items and simple logic:
    const selected = items.filter(it => itemIds.includes(it._id?.toString ? it._id.toString() : it._id));

    // Simple rule-based outfit: if selected includes 'top' pick bottoms; if dress, suggest outerwear
    const recs = [];
    const hasTop = selected.some(s => (s.tags||[]).includes('top'));
    const hasBottom = selected.some(s => (s.tags||[]).includes('bottom'));
    const hasDress = selected.some(s => (s.tags||[]).includes('dress'));

    if (hasTop && !hasBottom) {
      // find bottoms
      const bottoms = items.filter(i => (i.tags||[]).includes('bottom'));
      if (bottoms.length) recs.push({ reason: 'pair with bottom', items: [bottoms[0]._id || bottoms[0].id] });
    }
    if (hasDress) {
      const outer = items.filter(i => (i.tags||[]).includes('outerwear'));
      if (outer.length) recs.push({ reason: 'add outerwear', items: [outer[0]._id || outer[0].id] });
    }
    // If no items selected, suggest top+bottom combo
    if (!selected.length) {
      const t = items.find(i => (i.tags||[]).includes('top'));
      const b = items.find(i => (i.tags||[]).includes('bottom'));
      if (t && b) recs.push({ reason: 'starter outfit', items: [t._id||t.id, b._id||b.id] });
    }

    // If OpenAI key provided, attempt a richer suggestion using chat completion
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (OPENAI_API_KEY) {
      try {
        const client = new OpenAI({ apiKey: OPENAI_API_KEY });
        const promptParts = [
          `You are a fashion assistant.`,
          `Occasion: ${occasion}`,
          `Preferences: ${JSON.stringify(prefs)}`,
          `Selected items: ${selected.map(s => s.originalname || s.filename).join(', ')}`,
          `Available items: ${items.map(i => i.originalname || i.filename).slice(0,30).join(', ')}`,
          `Suggest up to 3 outfit recommendations, each with a short explanation and item references (by filename).`
        ];
        const prompt = promptParts.join("\n");
        const resp = await client.chat.completions.create({
          model: "gpt-4o-mini", // change as needed
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300
        });
        const text = resp.choices?.[0]?.message?.content;
        if (text) {
          recs.unshift({ reason: 'AI suggestion', text });
        }
      } catch (aiErr) {
        console.log("AI call failed:", aiErr?.message || aiErr);
      }
    }

    res.json({ recommendations: recs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Route: stats
app.get('/stats', async (req, res) => {
  try {
    if (itemsColl) {
      const count = await itemsColl.countDocuments();
      // simple usage counts per tag
      const pipeline = [
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } }
      ];
      const agg = await itemsColl.aggregate(pipeline).toArray();
      res.json({ count, byTag: agg });
    } else {
      const count = inMemory.items.length;
      res.json({ count, byTag: [] , uploads: inMemory.stats.uploads});
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Simple health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Start server
app.listen(PORT, () => {
  console.log(`DigiCloset AI microservice listening on ${PORT}`);
});