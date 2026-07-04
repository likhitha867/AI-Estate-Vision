// backend/routes/pullModel.js
// -----------------------------------------------------
// This route forwards a request to the local Ollama daemon
// to pull (download) a model, e.g. "llama3.1:8b".
// Requires authentication via JWT middleware.
// -----------------------------------------------------
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // fallback for Node <18
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/ai/pull
 * Body: { model: "llama3.1:8b" }
 */
router.post('/', auth, async (req, res) => {
  const { model } = req.body;
  if (!model) {
    return res.status(400).json({ message: 'Model name is required' });
  }
  try {
    const ollamaRes = await fetch('http://127.0.0.1:11434/api/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model }),
    });

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text();
      return res.status(ollamaRes.status).json({ message: 'Failed to contact Ollama', detail: err });
    }

    const progress = await ollamaRes.text(); // contains streaming JSON lines
    res.json({ message: `Model "${model}" pull completed`, progress });
  } catch (e) {
    console.error('Ollama pull error:', e);
    res.status(500).json({ message: 'Unexpected error while pulling model' });
  }
});

module.exports = router;
