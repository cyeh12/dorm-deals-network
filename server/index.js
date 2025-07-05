const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory user store for demo (replace with DB in production)
const users = [];

app.use(cors());
app.use(bodyParser.json());

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, email, password: hashedPassword });
  res.status(201).json({ message: 'User registered successfully.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
