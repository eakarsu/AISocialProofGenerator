const pool = require('../config/database');

const createTables = async () => {
  try {
    // Users table with role, reset token, and email verification
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'editor',
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    const alterQueries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'editor'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)`
    ];

    for (const q of alterQueries) {
      await pool.query(q).catch(() => {});
    }

    // Testimonials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        role VARCHAR(255),
        original_text TEXT NOT NULL,
        ai_enhanced_text TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Case Studies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS case_studies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        industry VARCHAR(255),
        challenge TEXT NOT NULL,
        solution TEXT NOT NULL,
        results TEXT NOT NULL,
        metrics_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        source VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        original_review TEXT NOT NULL,
        ai_summary TEXT,
        sentiment VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Social Widgets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_widgets (
        id SERIAL PRIMARY KEY,
        widget_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        stats_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Success Metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS success_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        value VARCHAR(100) NOT NULL,
        context TEXT,
        ai_description TEXT,
        icon VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customer Quotes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_quotes (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        original_quote TEXT NOT NULL,
        polished_quote TEXT,
        use_case VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Video Testimonials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS video_testimonials (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        role VARCHAR(255),
        video_url VARCHAR(500),
        thumbnail_url VARCHAR(500),
        duration VARCHAR(50),
        original_transcript TEXT,
        ai_edited_transcript TEXT,
        ai_highlights TEXT,
        ai_summary TEXT,
        tags TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

module.exports = { createTables, pool };
