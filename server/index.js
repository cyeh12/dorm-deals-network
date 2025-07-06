const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 5000;

// Database connection setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Add middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/dist')));

// Catch-all route for React Router (client-side routing)
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist', 'index.html');
  console.log(`Serving index file from: ${indexPath}`);
  if (fs.existsSync(indexPath)) {
    console.log('index.html exists!');
  } else {
    console.log('index.html does NOT exist!');
  }
  res.sendFile(indexPath);
});

// API route: Register user
app.post('/api/register', async (req, res) => {
  console.log('[DEBUG] Registration request received');
  console.log('[DEBUG] Request body:', { ...req.body, password: '***' });
  
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    console.log('[DEBUG] Missing required fields');
    return res.status(400).json({ message: 'All fields are required.' });
  }
  
  try {
    // Extract domain from email
    const emailDomain = email.split('@')[1];
    console.log('[DEBUG] Extracted email domain:', emailDomain);
    
    if (!emailDomain) {
      console.log('[DEBUG] Invalid email format');
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    
    // Find university by domain
    console.log('[DEBUG] Searching for university with domain:', emailDomain);
    
    // Debug: Show all universities in database
    const allUniversities = await pool.query('SELECT * FROM universities');
    console.log('[DEBUG] All universities in database:', allUniversities.rows);
    
    const uniResult = await pool.query('SELECT id FROM universities WHERE domain = $1', [emailDomain]);
    console.log('[DEBUG] University query result:', uniResult.rows);
    
    if (uniResult.rows.length === 0) {
      console.log('[DEBUG] No university found for domain:', emailDomain);
      return res.status(400).json({ message: 'No university found for this email domain.' });
    }
    const university_id = uniResult.rows[0].id;
    console.log('[DEBUG] Found university ID:', university_id);

    // Check if user exists
    console.log('[DEBUG] Checking if user exists with email:', email);
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    console.log('[DEBUG] User check result:', userCheck.rows);
    
    if (userCheck.rows.length > 0) {
      console.log('[DEBUG] User already exists');
      return res.status(409).json({ message: 'User already exists.' });
    }
    
    // Hash password
    console.log('[DEBUG] Hashing password...');
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[DEBUG] Password hashed successfully');
    
    // Insert user with university_id
    console.log('[DEBUG] Inserting new user...');
    await pool.query(
      'INSERT INTO users (name, email, password, university_id) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, university_id]
    );
    console.log('[DEBUG] User inserted successfully');
    
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('[DEBUG] Registration error:', err);
    console.error('[DEBUG] Error message:', err.message);
    console.error('[DEBUG] Error stack:', err.stack);
    res.status(500).json({ message: 'Server error.' });
  }
});

// API route: Login user
app.post('/api/login', async (req, res) => {
  console.log('[DEBUG] Login request received');
  console.log('[DEBUG] Request body:', { ...req.body, password: '***' });
  
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('[DEBUG] Missing required fields');
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  
  try {
    // Find user by email
    console.log('[DEBUG] Searching for user with email:', email);
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('[DEBUG] User query result:', userResult.rows.length > 0 ? 'User found' : 'User not found');
    
    if (userResult.rows.length === 0) {
      console.log('[DEBUG] Invalid credentials - user not found');
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    console.log('[DEBUG] Verifying password...');
    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('[DEBUG] Password verification result:', isValidPassword ? 'Valid' : 'Invalid');
    
    if (!isValidPassword) {
      console.log('[DEBUG] Invalid credentials - wrong password');
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    // Get university info
    console.log('[DEBUG] Fetching university info for user...');
    const uniResult = await pool.query('SELECT name FROM universities WHERE id = $1', [user.university_id]);
    const universityName = uniResult.rows.length > 0 ? uniResult.rows[0].name : 'Unknown University';
    
    console.log('[DEBUG] Login successful for user:', user.name);
    
    // Return user data (excluding password)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        university: universityName,
        university_id: user.university_id
      }
    });
  } catch (err) {
    console.error('[DEBUG] Login error:', err);
    console.error('[DEBUG] Error message:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// API route: Post new item
app.post('/api/items', async (req, res) => {
  console.log('[DEBUG] Post item request received');
  console.log('[DEBUG] Request body:', req.body);
  
  const { title, description, category, price, condition, contact_method, contact_info, user_id } = req.body;
  
  if (!title || !description || !category || !price || !condition || !user_id) {
    console.log('[DEBUG] Missing required fields');
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }
  
  let finalContactInfo;
  
  try {
    // Verify user exists
    console.log('[DEBUG] Verifying user exists:', user_id);
    const userCheck = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      console.log('[DEBUG] User not found');
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Set default contact info to user's email if not provided
    finalContactInfo = contact_method === 'email' ? userCheck.rows[0].email : contact_info;
    
    console.log('[DEBUG] Inserting new item...');
    const result = await pool.query(
      `INSERT INTO items (title, description, category, price, condition, contact_method, contact_info, user_id, created_at, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'active') 
       RETURNING *`,
      [title, description, category, price, condition, contact_method, finalContactInfo, user_id]
    );
  
    console.log('[DEBUG] Item inserted successfully:', result.rows[0].id);
    
    res.status(201).json({
      message: 'Item posted successfully',
      item: result.rows[0]
    });
  } catch (err) {
    console.error('[DEBUG] Post item error:', err);
    console.error('[DEBUG] Error message:', err.message);
    
    // Check if it's a database table error
    if (err.message.includes('relation "items" does not exist')) {
      console.log('[DEBUG] Items table does not exist, creating it...');
      try {
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
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            status VARCHAR(20) DEFAULT 'active'
          )
        `);
        console.log('[DEBUG] Items table created successfully');
        
        // Retry the insert
        const retryResult = await pool.query(
          `INSERT INTO items (title, description, category, price, condition, contact_method, contact_info, user_id, created_at, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'active') 
           RETURNING *`,
          [title, description, category, price, condition, contact_method, finalContactInfo, user_id]
        );
        
        console.log('[DEBUG] Item inserted successfully after table creation:', retryResult.rows[0].id);
        
        res.status(201).json({
          message: 'Item posted successfully',
          item: retryResult.rows[0]
        });
      } catch (createErr) {
        console.error('[DEBUG] Error creating table or inserting:', createErr);
        res.status(500).json({ message: 'Database error. Please try again.' });
      }
    } else {
      res.status(500).json({ message: 'Server error. Please try again.' });
    }
  }
});

// API route: Get user's items
app.get('/api/users/:userId/items', async (req, res) => {
  console.log('[DEBUG] Get user items request received');
  const { userId } = req.params;
  
  try {
    console.log('[DEBUG] Fetching items for user:', userId);
    const result = await pool.query(
      'SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    console.log('[DEBUG] Found', result.rows.length, 'items for user');
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get user items error:', err);
    if (err.message.includes('relation "items" does not exist')) {
      console.log('[DEBUG] Items table does not exist yet');
      res.json([]); // Return empty array if table doesn't exist
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// API route: Get all items (for browse page)
app.get('/api/items', async (req, res) => {
  console.log('[DEBUG] Get all items request received');
  
  try {
    console.log('[DEBUG] Fetching all active items...');
    const result = await pool.query(`
      SELECT items.*, users.name as seller_name, users.email as seller_email 
      FROM items 
      JOIN users ON items.user_id = users.id 
      WHERE items.status = 'active' 
      ORDER BY items.created_at DESC
    `);
    
    console.log('[DEBUG] Found', result.rows.length, 'active items');
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get all items error:', err);
    if (err.message.includes('relation "items" does not exist')) {
      console.log('[DEBUG] Items table does not exist yet');
      res.json([]); // Return empty array if table doesn't exist
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

app.get('/api/universities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM universities');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
