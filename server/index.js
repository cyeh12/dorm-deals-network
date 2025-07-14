const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { Pool } = require('pg');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 5000;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'college-marketplace',
    allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Database connection setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// JWT utility functions
const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

// Optional middleware for routes that can work with or without authentication
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

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
    
    // Fetch the new user to get profile_image_url
    const newUserRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const newUser = newUserRes.rows[0];
    res.status(201).json({ 
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        university_id: newUser.university_id,
        profile_image_url: newUser.profile_image_url
      }
    });
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
    
    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      university_id: user.university_id
    };
    
    const { accessToken, refreshToken } = generateTokens(tokenPayload);
    
    // Store refresh token in database (optional - for token revocation)
    try {
      await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [refreshToken, user.id]
      );
    } catch (tokenErr) {
      console.log('[DEBUG] Could not store refresh token (table might not have column yet)');
    }
    
    // Return user data with tokens
    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        university: universityName,
        university_id: user.university_id,
        profile_image_url: user.profile_image_url
      }
    });
  } catch (err) {
    console.error('[DEBUG] Login error:', err);
    console.error('[DEBUG] Error message:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// API route: Verify token and get current user
app.get('/api/verify-token', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Token verification request received');
  
  try {
    // Get updated user data
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get university info
    const uniResult = await pool.query('SELECT name FROM universities WHERE id = $1', [user.university_id]);
    const universityName = uniResult.rows.length > 0 ? uniResult.rows[0].name : 'Unknown University';
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        university: universityName,
        university_id: user.university_id,
        profile_image_url: user.profile_image_url
      }
    });
  } catch (err) {
    console.error('[DEBUG] Token verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// API route: Refresh token
app.post('/api/refresh-token', async (req, res) => {
  console.log('[DEBUG] Refresh token request received');
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }
  
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    // Check if user still exists and token matches
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rows.length === 0) {
      return res.status(403).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      university_id: user.university_id
    };
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);
    
    // Update refresh token in database
    try {
      await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [newRefreshToken, user.id]
      );
    } catch (tokenErr) {
      console.log('[DEBUG] Could not update refresh token');
    }
    
    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('[DEBUG] Refresh token error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// API route: Logout
app.post('/api/logout', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Logout request received');
  
  try {
    // Clear refresh token from database
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [req.user.userId]
    );
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[DEBUG] Logout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// API route: Post new item
app.post('/api/items', authenticateToken, upload.single('image'), async (req, res) => {
  console.log('[DEBUG] Post item request received');
  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Authenticated user:', req.user);
  
  const { title, description, category, price, condition, contact_method, contact_info } = req.body;
  const user_id = req.user.userId; // Get user_id from JWT token
  let imageUrl;
  
  if (!title || !description || !category || !price || !condition) {
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
    
    // Handle image upload
    if (req.file) {
      console.log('[DEBUG] Image file received:', req.file.originalname);
      imageUrl = req.file.path;
    } else {
      console.log('[DEBUG] No image file received');
    }
    
    console.log('[DEBUG] Inserting new item...');
    const result = await pool.query(
      `INSERT INTO items (title, description, category, price, condition, contact_method, contact_info, user_id, created_at, status, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'active', $9) 
       RETURNING *`,
      [title, description, category, price, condition, contact_method, finalContactInfo, user_id, imageUrl]
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
            status VARCHAR(20) DEFAULT 'active',
            image_url VARCHAR(255)
          )
        `);
        console.log('[DEBUG] Items table created successfully');
        
        // Retry the insert
        const retryResult = await pool.query(
          `INSERT INTO items (title, description, category, price, condition, contact_method, contact_info, user_id, created_at, status, image_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'active', $9) 
           RETURNING *`,
          [title, description, category, price, condition, contact_method, finalContactInfo, user_id, imageUrl]
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

// API route: Get current user's items (protected)
app.get('/api/my-items', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Get my items request received');
  const userId = req.user.userId;
  
  try {
    console.log('[DEBUG] Fetching items for authenticated user:', userId);
    const result = await pool.query(
      'SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    console.log('[DEBUG] Found', result.rows.length, 'items for user');
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get my items error:', err);
    if (err.message.includes('relation "items" does not exist')) {
      console.log('[DEBUG] Items table does not exist yet');
      res.json([]);
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// API route: Get user profile info by userId
app.get('/api/users/:userId', async (req, res) => {
  console.log('[DEBUG] Get user profile request received for user:', req.params.userId);
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT id, name, email, profile_image_url, university_id
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.log('[DEBUG] User not found:', userId);
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const user = result.rows[0];
    console.log('[DEBUG] User found:', user.name);
    
    let university_name = '';
    try {
      if (user.university_id) {
        const uniRes = await pool.query(
          'SELECT name FROM universities WHERE id = $1',
          [user.university_id]
        );
        university_name = (uniRes.rows && uniRes.rows[0] && uniRes.rows[0].name) ? uniRes.rows[0].name : '';
      }
    } catch (uniErr) {
      console.log('[DEBUG] Error fetching university:', uniErr.message);
      university_name = '';
    }
    
    const responseData = {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_image_url: user.profile_image_url,
      university_name
    };
    
    console.log('[DEBUG] Sending user profile response:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('[DEBUG] Get user profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// API route: Get all items (for browse page)
app.get('/api/items', async (req, res) => {
  console.log('[DEBUG] Get all items request received');
  
  try {
    console.log('[DEBUG] Fetching all active items...');
    const result = await pool.query(`
      SELECT items.*, users.name as seller_name, users.email as seller_email, 
             universities.name as university_name, universities.domain as university_domain
      FROM items 
      JOIN users ON items.user_id = users.id 
      LEFT JOIN universities ON users.university_id = universities.id
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

// API route: Get all students info
app.get('/api/students', async (req, res) => {
  console.log('[DEBUG] Get all students request received');
  
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        uni.name as university_name,
        uni.domain as university_domain
      FROM users u
      LEFT JOIN universities uni ON u.university_id = uni.id
      ORDER BY u.created_at DESC
    `);
    
    console.log('[DEBUG] Students retrieved:', result.rows.length);
    res.json({
      total_students: result.rows.length,
      students: result.rows
    });
  } catch (err) {
    console.error('[DEBUG] Error fetching students:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// API route: Delete item
app.delete('/api/items/:itemId', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Delete item request received');
  const { itemId } = req.params;
  const userId = req.user.userId;
  
  try {
    console.log('[DEBUG] Deleting item:', itemId, 'by user:', userId);
    
    // Check if item exists and verify ownership
    const itemCheck = await pool.query('SELECT user_id FROM items WHERE id = $1', [itemId]);
    if (itemCheck.rows.length === 0) {
      console.log('[DEBUG] Item not found');
      return res.status(404).json({ message: 'Item not found.' });
    }
    
    // Check if user owns the item
    if (itemCheck.rows[0].user_id !== userId) {
      console.log('[DEBUG] Unauthorized delete attempt');
      return res.status(403).json({ message: 'You can only delete your own items.' });
    }
    
    // Delete the item
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [itemId]);
    
    if (result.rows.length === 0) {
      console.log('[DEBUG] Failed to delete item');
      return res.status(500).json({ message: 'Failed to delete item.' });
    }
    
    console.log('[DEBUG] Item deleted successfully:', itemId);
    res.json({ message: 'Item deleted successfully', item: result.rows[0] });
  } catch (err) {
    console.error('[DEBUG] Delete item error:', err);
    if (err.message.includes('relation "items" does not exist')) {
      console.log('[DEBUG] Items table does not exist');
      res.status(404).json({ message: 'Item not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Database migration: Add image_url column to items table if it doesn't exist
const ensureImageColumn = async () => {
  try {
    await pool.query(`
      ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url VARCHAR(255)
    `);
    console.log('[DEBUG] Image column ensured in items table');
  } catch (err) {
    console.log('[DEBUG] Error ensuring image column (table might not exist yet):', err.message);
  }
};

// Call the migration
ensureImageColumn();

// Database migration: Add refresh_token column to users table if it doesn't exist
const ensureRefreshTokenColumn = async () => {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT
    `);
    console.log('[DEBUG] Refresh token column ensured in users table');
  } catch (err) {
    console.log('[DEBUG] Error ensuring refresh token column (table might not exist yet):', err.message);
  }
};

// Call the migration
ensureRefreshTokenColumn();

// Database migration: Add views column to items table if it doesn't exist
const ensureViewsColumn = async () => {
  try {
    await pool.query(`
      ALTER TABLE items ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0
    `);
    console.log('[DEBUG] Views column ensured in items table');
  } catch (err) {
    console.log('[DEBUG] Error ensuring views column (table might not exist yet):', err.message);
  }
};

// Call the migration
ensureViewsColumn();

// Database migration: Add saved_items table if it doesn't exist
const ensureSavedItemsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, item_id)
      )
    `);
    console.log('[DEBUG] saved_items table ensured');
  } catch (err) {
    console.log('[DEBUG] Error ensuring saved_items table:', err.message);
  }
};
// Call the migration
ensureSavedItemsTable();

// Database migration: Add messages table if it doesn't exist
const ensureMessagesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        is_read BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('[DEBUG] messages table ensured');
  } catch (err) {
    console.log('[DEBUG] Error ensuring messages table:', err.message);
  }
};
// Call the migration
ensureMessagesTable();

// API route: Send a message
app.post('/api/messages', authenticateToken, async (req, res) => {
  const { receiver_id, item_id, content } = req.body;
  const sender_id = req.user.userId; // Get sender from JWT token
  
  if (!receiver_id || !content) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, item_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [sender_id, receiver_id, item_id || null, content]
    );
    res.status(201).json({ message: 'Message sent.', messageObj: result.rows[0] });
  } catch (err) {
    console.error('[DEBUG] Send message error:', err);
    res.status(500).json({ message: 'Error sending message.' });
  }
});

// API route: Get all conversations for a user (latest message per user pair)
app.get('/api/users/:userId/conversations', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const authUserId = req.user.userId;
  
  // Check if user is accessing their own conversations
  if (parseInt(userId) !== authUserId) {
    return res.status(403).json({ message: 'You can only access your own conversations.' });
  }
  
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (other_user.id, m.item_id)
        m.*, 
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        other_user.name as other_user_name,
        other_user.profile_image_url as other_user_profile_image_url
      FROM messages m
      JOIN users other_user ON other_user.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY other_user.id, m.item_id, m.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get conversations error:', err);
    res.status(500).json({ message: 'Error fetching conversations.' });
  }
});

// API route: Get current user's conversations (protected)
app.get('/api/my-conversations', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (other_user.id, m.item_id)
        m.*, 
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        other_user.name as other_user_name,
        other_user.profile_image_url as other_user_profile_image_url
      FROM messages m
      JOIN users other_user ON other_user.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY other_user.id, m.item_id, m.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get my conversations error:', err);
    res.status(500).json({ message: 'Error fetching conversations.' });
  }
});

// API route: Get all messages between two users (optionally for an item)
app.get('/api/messages', authenticateToken, async (req, res) => {
  const { user2, item_id } = req.query;
  const user1 = req.user.userId; // Get user1 from JWT token
  
  if (!user2) {
    return res.status(400).json({ message: 'Missing user2 parameter.' });
  }
  
  try {
    let query = `SELECT * FROM messages WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))`;
    let params = [user1, user2];
    if (item_id) {
      query += ' AND item_id = $3';
      params.push(item_id);
    }
    query += ' ORDER BY created_at ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get messages error:', err);
    res.status(500).json({ message: 'Error fetching messages.' });
  }
});

// API route: Get count of unread messages for a user
// API route: Get count of unread messages for a user
app.get('/api/users/:userId/unread-messages-count', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const authUserId = req.user.userId;
  
  // Check if user is accessing their own unread count
  if (parseInt(userId) !== authUserId) {
    return res.status(403).json({ message: 'You can only access your own unread messages count.' });
  }
  
  console.log(`[DEBUG] Fetching unread messages count for user ${userId}`);
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = FALSE',
      [userId]
    );
    const count = parseInt(result.rows[0].count);
    console.log(`[DEBUG] Unread messages count for user ${userId}:`, count);
    console.log(`[DEBUG] Query result:`, result.rows[0]);
    res.json({ count });
  } catch (err) {
    console.error('[DEBUG] Get unread messages count error:', err);
    res.status(500).json({ message: 'Error fetching unread messages count.' });
  }
});

// API route: Get current user's unread messages count (protected)
app.get('/api/my-unread-messages-count', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  
  console.log(`[DEBUG] Fetching unread messages count for authenticated user ${userId}`);
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = FALSE',
      [userId]
    );
    const count = parseInt(result.rows[0].count);
    console.log(`[DEBUG] Unread messages count for user ${userId}:`, count);
    res.json({ count });
  } catch (err) {
    console.error('[DEBUG] Get my unread messages count error:', err);
    res.status(500).json({ message: 'Error fetching unread messages count.' });
  }
});

// API route: Get user's saved items
app.get('/api/my-saved-items', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get user_id from JWT token
  
  console.log(`[DEBUG] Fetching saved items for authenticated user ${userId}`);
  try {
    const result = await pool.query(`
      SELECT i.id, i.title, i.description, i.price, i.image_url, i.item_type, 
             i.created_at, u.name as seller_name, u.university
      FROM items i
      JOIN saved_items si ON i.id = si.item_id
      JOIN users u ON i.seller_id = u.id
      WHERE si.user_id = $1 AND i.status = 'available'
      ORDER BY si.created_at DESC
    `, [userId]);
    
    console.log(`[DEBUG] Found ${result.rows.length} saved items for user ${userId}`);
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get my saved items error:', err);
    res.status(500).json({ message: 'Error fetching saved items.' });
  }
});

// API route: Save/unsave an item
app.post('/api/items/:itemId/save', authenticateToken, async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.userId; // Get user_id from JWT token
  
  console.log(`[DEBUG] Toggle save for item ${itemId} by user ${userId}`);
  try {
    // Check if item is already saved
    const existingResult = await pool.query(
      'SELECT id FROM saved_items WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    
    if (existingResult.rows.length > 0) {
      // Unsave the item
      await pool.query(
        'DELETE FROM saved_items WHERE user_id = $1 AND item_id = $2',
        [userId, itemId]
      );
      console.log(`[DEBUG] Item ${itemId} unsaved by user ${userId}`);
      res.json({ saved: false, message: 'Item removed from saved items.' });
    } else {
      // Save the item
      await pool.query(
        'INSERT INTO saved_items (user_id, item_id) VALUES ($1, $2)',
        [userId, itemId]
      );
      console.log(`[DEBUG] Item ${itemId} saved by user ${userId}`);
      res.json({ saved: true, message: 'Item added to saved items.' });
    }
  } catch (err) {
    console.error('[DEBUG] Toggle save item error:', err);
    res.status(500).json({ message: 'Error updating saved items.' });
  }
});

// API route: Check if item is saved
app.get('/api/items/:itemId/saved', authenticateToken, async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.userId; // Get user_id from JWT token
  
  try {
    const result = await pool.query(
      'SELECT id FROM saved_items WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    
    const isSaved = result.rows.length > 0;
    res.json({ saved: isSaved });
  } catch (err) {
    console.error('[DEBUG] Check saved item error:', err);
    res.status(500).json({ message: 'Error checking saved status.' });
  }
});

// API route: Mark messages as read
app.post('/api/messages/mark-read', authenticateToken, async (req, res) => {
  const { other_user_id, item_id } = req.body;
  const user_id = req.user.userId; // Get user_id from JWT token
  
  if (!other_user_id) {
    return res.status(400).json({ message: 'Missing other_user_id.' });
  }
  
  try {
    let query = `UPDATE messages SET is_read = TRUE WHERE receiver_id = $1 AND sender_id = $2`;
    let params = [user_id, other_user_id];
    if (item_id) {
      query += ' AND item_id = $3';
      params.push(item_id);
    }
    await pool.query(query, params);
    res.json({ message: 'Messages marked as read.' });
  } catch (err) {
    console.error('[DEBUG] Mark messages read error:', err);
    res.status(500).json({ message: 'Error marking messages as read.' });
  }
});

// API route: Upload or update user profile image
app.post('/api/users/:userId/profile-image', authenticateToken, upload.single('image'), async (req, res) => {
  console.log('[DEBUG] Profile image upload request received');
  const { userId } = req.params;
  const authUserId = req.user.userId;
  
  // Check if user is updating their own profile
  if (parseInt(userId) !== authUserId) {
    return res.status(403).json({ message: 'You can only update your own profile image.' });
  }
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }
    const imageUrl = req.file.path;
    // Update user profile_image_url
    await pool.query('UPDATE users SET profile_image_url = $1 WHERE id = $2', [imageUrl, userId]);
    res.json({ message: 'Profile image updated successfully', profile_image_url: imageUrl });
  } catch (err) {
    console.error('[DEBUG] Profile image upload error:', err);
    res.status(500).json({ message: 'Error uploading profile image.' });
  }
});

// API route: Remove user profile image
app.delete('/api/users/:userId/profile-image', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Profile image removal request received');
  const { userId } = req.params;
  const authUserId = req.user.userId;
  
  // Check if user is removing their own profile image
  if (parseInt(userId) !== authUserId) {
    return res.status(403).json({ message: 'You can only remove your own profile image.' });
  }
  try {
    // Get current image publicId from Cloudinary URL if needed
    const userRes = await pool.query('SELECT profile_image_url FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const imageUrl = userRes.rows[0].profile_image_url;
    if (imageUrl) {
      // Extract publicId from Cloudinary URL
      const parts = imageUrl.split('/');
      const publicIdWithExt = parts[parts.length - 1];
      const publicId = publicIdWithExt.split('.')[0];
      await cloudinary.uploader.destroy(`college-marketplace/${publicId}`);
    }
    // Remove image URL from user
    await pool.query('UPDATE users SET profile_image_url = NULL WHERE id = $1', [userId]);
    res.json({ message: 'Profile image removed successfully' });
  } catch (err) {
    console.error('[DEBUG] Profile image removal error:', err);
    res.status(500).json({ message: 'Error removing profile image.' });
  }
});

// API route: Get single item (increment views only if not owner)
app.get('/api/items/:itemId', async (req, res) => {
  console.log('[DEBUG] Get single item request received');
  const { itemId } = req.params;
  const viewerId = req.query.viewerId;
  try {
    // Fetch item first
    const result = await pool.query(`
      SELECT items.*, users.name as seller_name, users.email as seller_email, 
             universities.name as university_name, universities.domain as university_domain
      FROM items 
      JOIN users ON items.user_id = users.id 
      LEFT JOIN universities ON users.university_id = universities.id
      WHERE items.id = $1
    `, [itemId]);
    if (result.rows.length === 0) {
      console.log('[DEBUG] Item not found');
      return res.status(404).json({ message: 'Item not found.' });
    }
    const item = result.rows[0];
    // Only increment views if viewerId is provided and not the owner
    if (viewerId && String(viewerId) !== String(item.user_id)) {
      await pool.query('UPDATE items SET views = views + 1 WHERE id = $1', [itemId]);
      // Re-fetch item with updated views
      const updatedResult = await pool.query(`
        SELECT items.*, users.name as seller_name, users.email as seller_email, 
               universities.name as university_name, universities.domain as university_domain
        FROM items 
        JOIN users ON items.user_id = users.id 
        LEFT JOIN universities ON users.university_id = universities.id
        WHERE items.id = $1
      `, [itemId]);
      res.json(updatedResult.rows[0]);
    } else {
      res.json(item);
    }
  } catch (err) {
    console.error('[DEBUG] Get single item error:', err);
    if (err.message.includes('relation "items" does not exist')) {
      console.log('[DEBUG] Items table does not exist');
      res.status(404).json({ message: 'Item not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// API route: Update item
app.put('/api/items/:itemId', upload.single('image'), async (req, res) => {
  console.log('[DEBUG] Update item request received');
  const { itemId } = req.params;
  const {
    title,
    description,
    category,
    price,
    condition,
    contact_method,
    contact_info,
    user_id,
    status
  } = req.body;
  let imageUrl;

  try {
    // Check if item exists
    const itemCheck = await pool.query('SELECT * FROM items WHERE id = $1', [itemId]);
    if (itemCheck.rows.length === 0) {
      console.log(`[DEBUG] Item with id ${itemId} not found for update.`);
      return res.status(404).json({ message: 'Item not found.' });
    }
    const oldItem = itemCheck.rows[0];

    // Only allow the owner to update
    if (user_id && String(user_id) !== String(oldItem.user_id)) {
      console.log('[DEBUG] Unauthorized update attempt by user:', user_id);
      return res.status(403).json({ message: 'You are not authorized to update this item.' });
    }

    // Handle image upload
    if (req.file) {
      console.log('[DEBUG] New image file received:', req.file.originalname);
      imageUrl = req.file.path;
    } else if (typeof req.body.image_url === 'string' && req.body.image_url.trim() !== '') {
      imageUrl = req.body.image_url;
    } else if (req.body.image_url === null || req.body.image_url === '') {
      imageUrl = null;
    } else {
      imageUrl = oldItem.image_url;
    }

    // Build update fields
    const updateFields = {
      title: title !== undefined ? title : oldItem.title,
      description: description !== undefined ? description : oldItem.description,
      category: category !== undefined ? category : oldItem.category,
      price: price !== undefined ? price : oldItem.price,
      condition: condition !== undefined ? condition : oldItem.condition,
      contact_method: contact_method !== undefined ? contact_method : oldItem.contact_method,
      contact_info: contact_info !== undefined ? contact_info : oldItem.contact_info,
      status: status !== undefined ? status : oldItem.status,
      image_url: imageUrl
    };

    // Update query
    const result = await pool.query(
      `UPDATE items SET
        title = $1,
        description = $2,
        category = $3,
        price = $4,
        condition = $5,
        contact_method = $6,
        contact_info = $7,
        status = $8,
        image_url = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *`,
      [
        updateFields.title,
        updateFields.description,
        updateFields.category,
        updateFields.price,
        updateFields.condition,
        updateFields.contact_method,
        updateFields.contact_info,
        updateFields.status,
        updateFields.image_url,
        itemId
      ]
    );

    console.log('[DEBUG] Item updated successfully:', result.rows[0].id);
    res.json({ message: 'Item updated successfully', item: result.rows[0] });
  } catch (err) {
    console.error('[DEBUG] Update item error:', err);
    res.status(500).json({ message: 'Error updating item.', error: err.message });
  }
});

// API route: Get user's saved items
app.get('/api/users/:userId/saved-items', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT items.*, users.name as seller_name, users.email as seller_email, 
             universities.name as university_name, universities.domain as university_domain
      FROM saved_items 
      JOIN items ON saved_items.item_id = items.id
      JOIN users ON items.user_id = users.id 
      LEFT JOIN universities ON users.university_id = universities.id
      WHERE saved_items.user_id = $1 AND items.status = 'active'
      ORDER BY saved_items.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get saved items error:', err);
    if (err.message.includes('relation "saved_items" does not exist')) {
      console.log('[DEBUG] saved_items table does not exist yet');
      res.json([]); // Return empty array if table doesn't exist
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// API route: Save an item (add to saved_items)
app.post('/api/users/:userId/saved-items/:itemId', async (req, res) => {
  const { userId, itemId } = req.params;
  try {
    // Check if already saved
    const existingResult = await pool.query(
      'SELECT id FROM saved_items WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ message: 'Item already saved.' });
    }
    
    // Save the item
    const result = await pool.query(
      'INSERT INTO saved_items (user_id, item_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [userId, itemId]
    );
    
    res.status(201).json({ message: 'Item saved successfully.', savedItem: result.rows[0] });
  } catch (err) {
    console.error('[DEBUG] Save item error:', err);
    if (err.message.includes('relation "saved_items" does not exist')) {
      console.log('[DEBUG] saved_items table does not exist yet');
      res.status(500).json({ message: 'Database not ready. Please try again.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// API route: Unsave an item (remove from saved_items)
app.delete('/api/users/:userId/saved-items/:itemId', async (req, res) => {
  const { userId, itemId } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM saved_items WHERE user_id = $1 AND item_id = $2 RETURNING *',
      [userId, itemId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Saved item not found.' });
    }
    
    res.json({ message: 'Item unsaved successfully.', removedItem: result.rows[0] });
  } catch (err) {
    console.error('[DEBUG] Unsave item error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// API route: Add test unread messages (for demo purposes)
app.post('/api/test/add-unread-messages', async (req, res) => {
  try {
    // Add a couple of test unread messages
    // Assuming user ID 1 exists and user ID 2 exists
    await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, item_id, content, is_read, created_at) 
       VALUES ($1, $2, $3, $4, FALSE, NOW()), ($5, $6, $7, $8, FALSE, NOW())`,
      [2, 1, 1, 'Hi! Is this item still available?', 3, 1, 2, 'I\'m interested in buying this. Can we meet up?']
    );
    console.log('[DEBUG] Test unread messages added');
    res.json({ message: 'Test unread messages added successfully' });
  } catch (err) {
    console.error('[DEBUG] Error adding test messages:', err);
    res.status(500).json({ message: 'Error adding test messages' });
  }
});

// Study Groups API Endpoints

// Get all study groups
app.get('/api/study-groups', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sg.*,
        u.name as creator_name,
        COUNT(m.user_id) as member_count
      FROM study_groups sg
      LEFT JOIN users u ON sg.created_by = u.id
      LEFT JOIN study_group_members m ON sg.id = m.group_id
      WHERE sg.is_active = true
      GROUP BY sg.id, u.name
      ORDER BY sg.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching study groups:', error);
    if (error.message.includes('relation "study_groups" does not exist')) {
      console.log('[DEBUG] Study groups table does not exist yet');
      res.json([]); // Return empty array if table doesn't exist
    } else {
      res.status(500).json({ message: 'Error fetching study groups' });
    }
  }
});

// Get user's study groups
app.get('/api/study-groups/my-groups/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        sg.*,
        u.name as creator_name,
        COUNT(m.user_id) as member_count
      FROM study_groups sg
      LEFT JOIN users u ON sg.created_by = u.id
      LEFT JOIN study_group_members m ON sg.id = m.group_id
      WHERE sg.id IN (
        SELECT group_id FROM study_group_members WHERE user_id = $1
      ) AND sg.is_active = true
      GROUP BY sg.id, u.name
      ORDER BY sg.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user study groups:', error);
    if (error.message.includes('relation "study_groups" does not exist') || 
        error.message.includes('relation "study_group_members" does not exist')) {
      console.log('[DEBUG] Study groups tables do not exist yet');
      res.json([]); // Return empty array if tables don't exist
    } else {
      res.status(500).json({ message: 'Error fetching user study groups' });
    }
  }
});

// Create a new study group
app.post('/api/study-groups', async (req, res) => {
  const { name, subject, description, location, max_members, schedule, creator_id } = req.body;
  const created_by = creator_id; // Map frontend field to DB field
  try {
    // Insert the study group
    const groupResult = await pool.query(`
      INSERT INTO study_groups (name, subject, description, location, max_members, schedule, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, subject, description, location, max_members, schedule, created_by]);

    const groupId = groupResult.rows[0].id;

    // Add the creator as the first member
    await pool.query(`
      INSERT INTO study_group_members (group_id, user_id, joined_at)
      VALUES ($1, $2, NOW())
    `, [groupId, created_by]);

    res.status(201).json(groupResult.rows[0]);
  } catch (error) {
    console.error('Error creating study group:', error);
    if (error.message.includes('relation "study_groups" does not exist')) {
      console.log('[DEBUG] Study groups table does not exist, creating it...');
      try {
        // Create tables
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
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS study_group_members (
            id SERIAL PRIMARY KEY,
            group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(group_id, user_id)
          )
        `);
        
        console.log('[DEBUG] Study groups tables created successfully');
        
        // Retry the insert
        const retryGroupResult = await pool.query(`
          INSERT INTO study_groups (name, subject, description, location, max_members, schedule, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [name, subject, description, location, max_members, schedule, created_by]);

        const retryGroupId = retryGroupResult.rows[0].id;

        // Add the creator as the first member
        await pool.query(`
          INSERT INTO study_group_members (group_id, user_id, joined_at)
          VALUES ($1, $2, NOW())
        `, [retryGroupId, created_by]);

        res.status(201).json(retryGroupResult.rows[0]);
      } catch (createErr) {
        console.error('[DEBUG] Error creating tables or inserting:', createErr);
        res.status(500).json({ message: 'Database error. Please try again.' });
      }
    } else {
      res.status(500).json({ message: 'Error creating study group' });
    }
  }
});

// Join a study group
app.post('/api/study-groups/:groupId/join', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.userId;

  try {
    // Check if user is already a member
    const existingMember = await pool.query(`
      SELECT * FROM study_group_members WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId]);

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Check if group is full
    const groupInfo = await pool.query(`
      SELECT sg.max_members, COUNT(sgm.user_id) as current_members
      FROM study_groups sg
      LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
      WHERE sg.id = $1
      GROUP BY sg.id, sg.max_members
    `, [groupId]);

    if (groupInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const { max_members, current_members } = groupInfo.rows[0];
    if (parseInt(current_members) >= max_members) {
      return res.status(400).json({ message: 'This study group is full' });
    }

    // Add user to the group
    await pool.query(`
      INSERT INTO study_group_members (group_id, user_id, joined_at)
      VALUES ($1, $2, NOW())
    `, [groupId, userId]);

    res.json({ message: 'Successfully joined the study group' });
  } catch (error) {
    console.error('Error joining study group:', error);
    res.status(500).json({ message: 'Error joining study group' });
  }
});

// Leave a study group
app.post('/api/study-groups/:groupId/leave', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.userId;

  try {
    // Remove user from the group
    const result = await pool.query(`
      DELETE FROM study_group_members WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId]);

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    res.json({ message: 'Successfully left the study group' });
  } catch (error) {
    console.error('Error leaving study group:', error);
    res.status(500).json({ message: 'Error leaving study group' });
  }
});

// Delete a study group (only creator can delete)
app.delete('/api/study-groups/:groupId', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.userId;

  try {
    // Check if user is the creator
    const group = await pool.query(`
      SELECT * FROM study_groups WHERE id = $1 AND created_by = $2
    `, [groupId, userId]);

    if (group.rows.length === 0) {
      return res.status(403).json({ message: 'Only the group creator can delete this group' });
    }

    // Soft delete the group
    await pool.query(`
      UPDATE study_groups SET is_active = false WHERE id = $1
    `, [groupId]);

    res.json({ message: 'Study group deleted successfully' });
  } catch (error) {
    console.error('Error deleting study group:', error);
    res.status(500).json({ message: 'Error deleting study group' });
  }
});

// Database migration: Add study groups tables if they don't exist
const ensureStudyGroupsTables = async () => {
  try {
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
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    // Add missing columns to existing tables (for production migration)
    try {
      await pool.query(`ALTER TABLE study_groups ADD COLUMN schedule VARCHAR(255)`);
      console.log('[DEBUG] Added schedule column to study_groups table');
    } catch (scheduleErr) {
      if (scheduleErr.message.includes('already exists')) {
        console.log('[DEBUG] schedule column already exists in study_groups table');
      } else {
        console.log('[DEBUG] Error adding schedule column:', scheduleErr.message);
      }
    }
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups(subject)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_groups_is_active ON study_groups(is_active)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON study_group_members(group_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON study_group_members(user_id)`);

    console.log('[DEBUG] study_groups tables ensured');
  } catch (err) {
    console.log('[DEBUG] Error ensuring study_groups tables:', err.message);
  }
};

// Call the migration
ensureStudyGroupsTables();

// API route: Get current user's study groups
app.get('/api/my-study-groups', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(`
      SELECT 
        sg.*,
        u.name as creator_name,
        COUNT(m.user_id) as member_count
      FROM study_groups sg
      LEFT JOIN users u ON sg.created_by = u.id
      LEFT JOIN study_group_members m ON sg.id = m.group_id
      WHERE sg.id IN (
        SELECT group_id FROM study_group_members WHERE user_id = $1
      ) AND sg.is_active = true
      GROUP BY sg.id, u.name
      ORDER BY sg.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get my study groups error:', err);
    res.status(500).json({ message: 'Error fetching your study groups.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
