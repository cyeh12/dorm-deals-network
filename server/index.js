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
