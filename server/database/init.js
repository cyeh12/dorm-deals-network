#!/usr/bin/env node

/**
 * Database Initialization Script
 * Dorm Deals Network Marketplace
 * 
 * This script initializes the PostgreSQL database with all required tables,
 * indexes, and seed data for universities.
 * 
 * Usage:
 *   node database/init.js
 *   
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// University seed data
const UNIVERSITIES = [
  // Ivy League
  { name: 'Harvard University', domain: 'harvard.edu' },
  { name: 'Yale University', domain: 'yale.edu' },
  { name: 'Princeton University', domain: 'princeton.edu' },
  { name: 'Columbia University', domain: 'columbia.edu' },
  { name: 'University of Pennsylvania', domain: 'upenn.edu' },
  { name: 'Dartmouth College', domain: 'dartmouth.edu' },
  { name: 'Brown University', domain: 'brown.edu' },
  { name: 'Cornell University', domain: 'cornell.edu' },
  
  // Top Tech Universities
  { name: 'Massachusetts Institute of Technology', domain: 'mit.edu' },
  { name: 'Stanford University', domain: 'stanford.edu' },
  { name: 'California Institute of Technology', domain: 'caltech.edu' },
  { name: 'Carnegie Mellon University', domain: 'cmu.edu' },
  { name: 'Georgia Institute of Technology', domain: 'gatech.edu' },
  
  // Major State Universities
  { name: 'University of California, Berkeley', domain: 'berkeley.edu' },
  { name: 'University of California, Los Angeles', domain: 'ucla.edu' },
  { name: 'University of California, San Diego', domain: 'ucsd.edu' },
  { name: 'University of Michigan', domain: 'umich.edu' },
  { name: 'University of Illinois Urbana-Champaign', domain: 'illinois.edu' },
  { name: 'University of Washington', domain: 'uw.edu' },
  { name: 'University of Texas at Austin', domain: 'utexas.edu' },
  { name: 'University of Wisconsin-Madison', domain: 'wisc.edu' },
  { name: 'Pennsylvania State University', domain: 'psu.edu' },
  { name: 'Ohio State University', domain: 'osu.edu' },
  { name: 'University of Florida', domain: 'ufl.edu' },
  { name: 'University of Georgia', domain: 'uga.edu' },
  { name: 'University of North Carolina at Chapel Hill', domain: 'unc.edu' },
  { name: 'University of Virginia', domain: 'virginia.edu' },
  
  // Other Notable Universities
  { name: 'Duke University', domain: 'duke.edu' },
  { name: 'Northwestern University', domain: 'northwestern.edu' },
  { name: 'University of Chicago', domain: 'uchicago.edu' },
  { name: 'Vanderbilt University', domain: 'vanderbilt.edu' },
  { name: 'Rice University', domain: 'rice.edu' },
  { name: 'Johns Hopkins University', domain: 'jhu.edu' },
  { name: 'Washington University in St. Louis', domain: 'wustl.edu' },
  { name: 'University of Notre Dame', domain: 'nd.edu' },
  { name: 'Georgetown University', domain: 'georgetown.edu' },
  { name: 'University of Southern California', domain: 'usc.edu' },
  { name: 'New York University', domain: 'nyu.edu' },
  { name: 'Boston University', domain: 'bu.edu' },
  { name: 'Northeastern University', domain: 'northeastern.edu' },
  
  // California State Universities
  { name: 'San Diego State University', domain: 'sdsu.edu' },
  { name: 'California State University, Long Beach', domain: 'csulb.edu' },
  { name: 'San Francisco State University', domain: 'sfsu.edu' },
  { name: 'California State University, Fullerton', domain: 'fullerton.edu' },
  
  // Additional Major Universities
  { name: 'Arizona State University', domain: 'asu.edu' },
  { name: 'University of Arizona', domain: 'arizona.edu' },
  { name: 'University of Colorado Boulder', domain: 'colorado.edu' },
  { name: 'University of Oregon', domain: 'uoregon.edu' },
  { name: 'Oregon State University', domain: 'oregonstate.edu' },
  { name: 'University of Utah', domain: 'utah.edu' },
  { name: 'University of Nevada, Las Vegas', domain: 'unlv.edu' },
  
  // Test University for development
  { name: 'Test University', domain: 'test.edu' }
];

/**
 * Create base tables (universities and users)
 */
async function createBaseTables() {
  console.log('Creating base tables...');
  
  try {
    // Create universities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Universities table created');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        university_id INTEGER REFERENCES universities(id),
        profile_image_url VARCHAR(255),
        refresh_token TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Users table created');

  } catch (error) {
    console.error('Error creating base tables:', error.message);
    throw error;
  }
}

/**
 * Create application tables
 */
async function createApplicationTables() {
  console.log('Creating application tables...');
  
  try {
    // Create items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        condition VARCHAR(50) NOT NULL,
        contact_method VARCHAR(50) DEFAULT 'email',
        contact_info VARCHAR(255),
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'active',
        image_url VARCHAR(255),
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Items table created');

    // Create saved_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, item_id)
      )
    `);
    console.log('✓ Saved items table created');

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Messages table created');

    // Create study_groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS study_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        max_members INTEGER DEFAULT 8,
        schedule VARCHAR(255),
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Study groups table created');

    // Create study_group_members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS study_group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id)
      )
    `);
    console.log('✓ Study group members table created');

  } catch (error) {
    console.error('Error creating application tables:', error.message);
    throw error;
  }
}

/**
 * Create database indexes for performance
 */
async function createIndexes() {
  console.log('Creating database indexes...');
  
  const indexes = [
    // Users indexes
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id)',
    
    // Universities indexes
    'CREATE INDEX IF NOT EXISTS idx_universities_domain ON universities(domain)',
    
    // Items indexes
    'CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)',
    'CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)',
    'CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at)',
    
    // Saved items indexes
    'CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_saved_items_item_id ON saved_items(item_id)',
    
    // Messages indexes
    'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages(item_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read)',
    'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id)',
    
    // Study groups indexes
    'CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by)',
    'CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups(subject)',
    'CREATE INDEX IF NOT EXISTS idx_study_groups_active ON study_groups(is_active)',
    
    // Study group members indexes
    'CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON study_group_members(group_id)',
    'CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON study_group_members(user_id)'
  ];

  try {
    for (const indexSQL of indexes) {
      await pool.query(indexSQL);
    }
    console.log(`✓ Created ${indexes.length} database indexes`);
  } catch (error) {
    console.error('Error creating indexes:', error.message);
    throw error;
  }
}

/**
 * Seed universities data
 */
async function seedUniversities() {
  console.log('Seeding universities...');
  
  try {
    // Check if universities already exist
    const existingCount = await pool.query('SELECT COUNT(*) as count FROM universities');
    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(`✓ Universities already exist (${existingCount.rows[0].count} found)`);
      return;
    }

    // Insert universities
    let insertedCount = 0;
    for (const uni of UNIVERSITIES) {
      try {
        await pool.query(
          'INSERT INTO universities (name, domain) VALUES ($1, $2) ON CONFLICT (domain) DO NOTHING',
          [uni.name, uni.domain]
        );
        insertedCount++;
      } catch (error) {
        console.warn(`Warning: Could not insert ${uni.name}: ${error.message}`);
      }
    }
    
    console.log(`✓ Seeded ${insertedCount} universities`);
  } catch (error) {
    console.error('Error seeding universities:', error.message);
    throw error;
  }
}

/**
 * Verify database setup
 */
async function verifySetup() {
  console.log('Verifying database setup...');
  
  try {
    // Check tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'universities', 'items', 'saved_items', 'messages', 'study_groups', 'study_group_members')
      ORDER BY table_name
    `);
    
    console.log(`✓ Found ${tables.rows.length} tables:`, tables.rows.map(t => t.table_name).join(', '));
    
    // Check university count
    const uniCount = await pool.query('SELECT COUNT(*) as count FROM universities');
    console.log(`✓ Universities in database: ${uniCount.rows[0].count}`);
    
    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);
    
    console.log(`✓ Found ${indexes.rows.length} custom indexes`);
    
  } catch (error) {
    console.error('Error verifying setup:', error.message);
    throw error;
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  console.log('🚀 Starting database initialization...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');
    
    // Run initialization steps
    await createBaseTables();
    await createApplicationTables();
    await createIndexes();
    await seedUniversities();
    await verifySetup();
    
    console.log('\n✅ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  createBaseTables,
  createApplicationTables,
  createIndexes,
  seedUniversities,
  verifySetup
};
