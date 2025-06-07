const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

console.log('Starting server...');
console.log('Port:', PORT);
console.log('__dirname:', __dirname);

// Serve static files from dist/sama-rama/browser (or dist/sama-rama if different structure)
const staticPath = path.join(__dirname, 'dist', 'sama-rama', 'browser');
console.log('Static files path:', staticPath);

app.use(express.static(staticPath));

// Handle Angular routing, return all requests to Angular app
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🚀 Visit: https://your-app.herokuapp.com`);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  process.exit(0);
});