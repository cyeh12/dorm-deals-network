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
app.post('/api/messages', async (req, res) => {
  const { sender_id, receiver_id, item_id, content } = req.body;
  if (!sender_id || !receiver_id || !content) {
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
app.get('/api/users/:userId/conversations', async (req, res) => {
  const { userId } = req.params;
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

// API route: Get all messages between two users (optionally for an item)
app.get('/api/messages', async (req, res) => {
  const { user1, user2, item_id } = req.query;
  if (!user1 || !user2) {
    return res.status(400).json({ message: 'Missing user ids.' });
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

// API route: Mark messages as read
app.post('/api/messages/mark-read', async (req, res) => {
  const { user_id, other_user_id, item_id } = req.body;
  if (!user_id || !other_user_id) {
    return res.status(400).json({ message: 'Missing user ids.' });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
