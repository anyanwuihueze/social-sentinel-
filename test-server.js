const express = require('express');
const app = express();
const PORT = 3001;

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Local test works!' });
});

app.listen(PORT, () => {
  console.log(`✅ Local test server on http://localhost:${PORT}/health`);
});
