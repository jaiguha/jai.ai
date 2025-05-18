// Add this endpoint to your server.js file

// Environment configuration endpoint
app.get('/api/config', (req, res) => {
  // Send only necessary environment variables to frontend
  res.json({
    apiKey: process.env.API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
    apiProvider: process.env.API_PROVIDER || 'anthropic', // Default to anthropic
    modelName: process.env.MODEL_NAME || 'claude-3-7-sonnet-20250219', // Default model
    apiBaseUrl: process.env.API_BASE_URL || '' // Optional base URL
  });
});

// Add this at the top of server.js
require('dotenv').config();
