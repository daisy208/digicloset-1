import { Pool } from 'pg';
import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

// Redis configuration for caching
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});
// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'virtualfit',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Connection pooling improvements
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Initialize database tables
export const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing database tables...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        brand_id UUID,
        avatar_url TEXT,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Brands table
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        logo_url TEXT,
        status VARCHAR(50) DEFAULT 'active',
        subscription_plan VARCHAR(50) DEFAULT 'starter',
        api_key VARCHAR(255) UNIQUE,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clothing items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clothing_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id UUID REFERENCES brands(id),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        style VARCHAR(100) NOT NULL,
        colors TEXT[] DEFAULT '{}',
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT NOT NULL,
        overlay_image_url TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        rating DECIMAL(3,2) DEFAULT 0,
        sizes TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Try-on sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS try_on_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        user_photo_url TEXT NOT NULL,
        clothing_items JSONB NOT NULL,
        lighting_settings JSONB NOT NULL,
        result_image_url TEXT,
        session_duration INTEGER,
        converted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Analytics events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        brand_id UUID REFERENCES brands(id),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_brand_id ON users(brand_id);
      CREATE INDEX IF NOT EXISTS idx_clothing_brand_id ON clothing_items(brand_id);
      CREATE INDEX IF NOT EXISTS idx_clothing_category ON clothing_items(category);
      CREATE INDEX IF NOT EXISTS idx_try_on_user_id ON try_on_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_brand_id ON analytics_events(brand_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
    `);

    // Insert sample data
    await insertSampleData(client);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Insert sample data for development
const insertSampleData = async (client: any) => {
  try {
    // Check if sample data already exists
    const existingBrands = await client.query('SELECT COUNT(*) FROM brands');
    if (parseInt(existingBrands.rows[0].count) > 0) {
      console.log('📊 Sample data already exists, skipping...');
      return;
    }

    console.log('📊 Inserting sample data...');

    // Insert sample brands
    const brandResult = await client.query(`
      INSERT INTO brands (name, logo_url, subscription_plan, api_key) VALUES
      ('Fashion Forward', 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=100', 'professional', 'vf_ff_demo_key_123'),
      ('StyleHub', 'https://images.pexels.com/photos/1103834/pexels-photo-1103834.jpeg?auto=compress&cs=tinysrgb&w=100', 'starter', 'vf_sh_demo_key_456'),
      ('Urban Threads', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100', 'enterprise', 'vf_ut_demo_key_789')
      RETURNING id, name;
    `);

    const brands = brandResult.rows;
    console.log(`✅ Inserted ${brands.length} sample brands`);

    // Insert sample clothing items
    const clothingItems = [
      {
        name: 'Classic White Button Shirt',
        category: 'tops',
        style: 'classic',
        colors: ['white', 'light-blue'],
        price: 89.99,
        image_url: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500',
        overlay_image_url: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=300',
        tags: ['professional', 'versatile', 'cotton'],
        rating: 4.5,
        sizes: ['XS', 'S', 'M', 'L', 'XL']
      },
      {
        name: 'Elegant Black Dress',
        category: 'dresses',
        style: 'formal',
        colors: ['black'],
        price: 149.99,
        image_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=500',
        overlay_image_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300',
        tags: ['evening', 'sophisticated', 'little-black-dress'],
        rating: 4.8,
        sizes: ['XS', 'S', 'M', 'L']
      },
      {
        name: 'Casual Denim Jacket',
        category: 'outerwear',
        style: 'casual',
        colors: ['blue', 'light-blue'],
        price: 79.99,
        image_url: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=500',
        overlay_image_url: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=300',
        tags: ['versatile', 'denim', 'layering'],
        rating: 4.3,
        sizes: ['S', 'M', 'L', 'XL']
      },
      {
        name: 'High-Waisted Trousers',
        category: 'bottoms',
        style: 'business',
        colors: ['black', 'navy', 'gray'],
        price: 95.99,
        image_url: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=500',
        overlay_image_url: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=300',
        tags: ['professional', 'high-waisted', 'tailored'],
        rating: 4.6,
        sizes: ['XS', 'S', 'M', 'L', 'XL']
      },
      {
        name: 'Bohemian Maxi Dress',
        category: 'dresses',
        style: 'bohemian',
        colors: ['floral', 'earth-tones'],
        price: 129.99,
        image_url: 'https://images.pexels.com/photos/1103834/pexels-photo-1103834.jpeg?auto=compress&cs=tinysrgb&w=500',
        overlay_image_url: 'https://images.pexels.com/photos/1103834/pexels-photo-1103834.jpeg?auto=compress&cs=tinysrgb&w=300',
        tags: ['flowy', 'vacation', 'comfortable'],
        rating: 4.4,
        sizes: ['S', 'M', 'L']
      },
      {
        name: 'Minimalist Blazer',
        category: 'outerwear',
        style: 'minimalist',
        colors: ['beige', 'black', 'white'],
        price: 179.99,
        image_url: 'https://images.pexels.com/photos/1036804/pexels-photo-1036804.jpeg?auto=compress&cs=tinysrgb&w=500',
        overlay_image_url: 'https://images.pexels.com/photos/1036804/pexels-photo-1036804.jpeg?auto=compress&cs=tinysrgb&w=300',
        tags: ['structured', 'clean-lines', 'versatile'],
        rating: 4.7,
        sizes: ['XS', 'S', 'M', 'L', 'XL']
      }
    ];

    for (const item of clothingItems) {
      const randomBrand = brands[Math.floor(Math.random() * brands.length)];
      await client.query(`
        INSERT INTO clothing_items (
          brand_id, name, category, style, colors, price, 
          image_url, overlay_image_url, tags, rating, sizes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        randomBrand.id,
        item.name,
        item.category,
        item.style,
        item.colors,
        item.price,
        item.image_url,
        item.overlay_image_url,
        item.tags,
        item.rating,
        item.sizes,
        JSON.stringify({ brand_name: randomBrand.name })
      ]);
    }

    console.log(`✅ Inserted ${clothingItems.length} sample clothing items`);

    // Insert sample admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await client.query(`
      INSERT INTO users (email, password_hash, name, role) VALUES
      ('admin@virtualfit.com', $1, 'Admin User', 'admin')
    `, [hashedPassword]);

    console.log('✅ Inserted sample admin user (admin@virtualfit.com / admin123)');

  } catch (error) {
    console.error('❌ Failed to insert sample data:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing database connections...');
  await pool.end();
  process.exit(0);
});