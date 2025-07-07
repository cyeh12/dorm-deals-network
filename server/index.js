const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { Pool } = require('pg');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const app = express();
const PORT = process.env.PORT || 5000;

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
    
    // Return user data (excluding password)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        university: universityName,
        university_id: user.university_id,
        profile_image_url: user.profile_image_url // Include profile image URL
      }
    });
  } catch (err) {
    console.error('[DEBUG] Login error:', err);
    console.error('[DEBUG] Error message:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// API route: Post new item
app.post('/api/items', upload.single('image'), async (req, res) => {
  console.log('[DEBUG] Post item request received');
  console.log('[DEBUG] Request body:', req.body);
  
  const { title, description, category, price, condition, contact_method, contact_info, user_id } = req.body;
  let imageUrl;
  
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
app.delete('/api/items/:itemId', async (req, res) => {
  console.log('[DEBUG] Delete item request received');
  const { itemId } = req.params;
  
  try {
    console.log('[DEBUG] Deleting item:', itemId);
    
    // Check if item exists and get user_id for authorization
    const itemCheck = await pool.query('SELECT user_id FROM items WHERE id = $1', [itemId]);
    if (itemCheck.rows.length === 0) {
      console.log('[DEBUG] Item not found');
      return res.status(404).json({ message: 'Item not found.' });
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

// API route: Save an item
app.post('/api/users/:userId/saved-items/:itemId', async (req, res) => {
  const { userId, itemId } = req.params;
  try {
    await pool.query(
      'INSERT INTO saved_items (user_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, itemId]
    );
    res.json({ message: 'Item saved.' });
  } catch (err) {
    console.error('[DEBUG] Save item error:', err);
    res.status(500).json({ message: 'Error saving item.' });
  }
});

// API route: Unsave an item
app.delete('/api/users/:userId/saved-items/:itemId', async (req, res) => {
  const { userId, itemId } = req.params;
  try {
    await pool.query(
      'DELETE FROM saved_items WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    res.json({ message: 'Item unsaved.' });
  } catch (err) {
    console.error('[DEBUG] Unsave item error:', err);
    res.status(500).json({ message: 'Error unsaving item.' });
  }
});

// API route: Get all saved items for a user
app.get('/api/users/:userId/saved-items', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT items.* FROM saved_items
      JOIN items ON saved_items.item_id = items.id
      WHERE saved_items.user_id = $1
      ORDER BY saved_items.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Get saved items error:', err);
    res.status(500).json({ message: 'Error fetching saved items.' });
  }
});

// API route: Upload or update user profile image
app.post('/api/users/:userId/profile-image', upload.single('image'), async (req, res) => {
  console.log('[DEBUG] Profile image upload request received');
  const { userId } = req.params;
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
app.delete('/api/users/:userId/profile-image', async (req, res) => {
  console.log('[DEBUG] Profile image removal request received');
  const { userId } = req.params;
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
