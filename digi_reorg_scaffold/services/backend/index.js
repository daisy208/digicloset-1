
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 4000;

// PostgreSQL pool setup
const pool = new Pool();

// Test DB connection on startup
pool.connect()
	.then(client => {
		return client.query('SELECT NOW()')
			.then(res => {
				console.log('Connected to PostgreSQL at', res.rows[0].now);
				client.release();
			})
			.catch(err => {
				client.release();
				console.error('PostgreSQL connection error:', err.stack);
			});
	});

app.get('/health', (req,res) => res.json({status: 'ok'}));
app.get('/api/ping', (req,res) => res.json({pong: true}));

// Example DB route
app.get('/api/time', async (req, res) => {
	try {
		const result = await pool.query('SELECT NOW()');
		res.json({ time: result.rows[0].now });
	} catch (err) {
		res.status(500).json({ error: 'DB error', details: err.message });
	}
});

app.listen(port, ()=> console.log('Backend listening on', port));
