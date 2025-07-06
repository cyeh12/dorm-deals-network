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
app.options('*', cors()); // Explicitly handle CORS preflight requests
app.use(bodyParser.json());

// Health check endpoint (optional, for Heroku monitoring)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/dist')));

// API route: Register user
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    // Extract domain from email
    const emailDomain = email.split('@')[1];
    if (!emailDomain) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    // Find university by domain
    const uniResult = await pool.query('SELECT id FROM universities WHERE domain = $1', [emailDomain]);
    if (uniResult.rows.length === 0) {
      return res.status(400).json({ message: 'No university found for this email domain.' });
    }
    const university_id = uniResult.rows[0].id;

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert user with university_id
    await pool.query(
      'INSERT INTO users (name, email, password, university_id) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, university_id]
    );
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
});

// API route: List universities
app.get('/api/universities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM universities');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
});

// API route: Root
app.get('/', (req, res) => {
  res.send('Welcome to the College Student Marketplace API!');
});

// Catch-all route for React Router (client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist', 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
