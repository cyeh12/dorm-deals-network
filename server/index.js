const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Barebones route to serve a simple HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Page</title>
    </head>
    <body>
      <h1>Hello from Express!</h1>
      <p>If you see this, your server is working.</p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
