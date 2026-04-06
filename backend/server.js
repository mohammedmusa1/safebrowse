const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dataFile = path.join(__dirname, 'data', 'history.json');

// Ensure data directory and file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

// Dummy Phishing Logic
const evaluateUrl = (url) => {
  const suspiciousKeywords = ['login', 'secure', 'bank', 'update', 'verify', 'account'];
  const suspiciousDomains = ['.xyz', '.top', '.club', '.online'];

  let riskScore = 0;
  let reasons = [];

  const lowerUrl = url.toLowerCase();

  // Keyword check
  suspiciousKeywords.forEach(keyword => {
    if (lowerUrl.includes(keyword)) {
      riskScore += 20;
      reasons.push(`Contains suspicious keyword: ${keyword}`);
    }
  });

  // Domain ext check
  suspiciousDomains.forEach(domain => {
    if (lowerUrl.endsWith(domain) || lowerUrl.includes(domain + '/')) {
      riskScore += 40;
      reasons.push(`Uses high-risk top-level domain: ${domain}`);
    }
  });

  // Length check
  if (url.length > 70) {
    riskScore += 15;
    reasons.push('Unusually long URL structure');
  }

  // IP Address instead of domain
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  if (ipRegex.test(url)) {
    riskScore += 50;
    reasons.push('Uses IP address instead of domain name');
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  let status = 'Safe';
  if (riskScore > 60) status = 'Malicious';
  else if (riskScore > 30) status = 'Suspicious';

  if (reasons.length === 0) {
    reasons.push('No immediate threats detected');
  }

  return { riskScore, status, reasons };
};

// API Endpoints
app.post('/api/check', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const result = evaluateUrl(url);
  
  const historyEntry = {
    id: Date.now().toString(),
    url,
    ...result,
    timestamp: new Date().toISOString()
  };

  // Save to history.json
  const history = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  history.unshift(historyEntry); // Add to beginning
  fs.writeFileSync(dataFile, JSON.stringify(history, null, 2));

  res.json(historyEntry);
});

app.get('/api/history', (req, res) => {
  const history = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  res.json(history);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
