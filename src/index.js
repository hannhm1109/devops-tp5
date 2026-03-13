const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.APP_VERSION || 'dev',
    build: process.env.BUILD_NUMBER || 'local',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    hostname: os.hostname()
  });
});

app.get('/info', (req, res) => {
  res.json({
    app: 'devops-tp5',
    author: 'Hanane',
    school: 'ENSET Mohammedia',
    pipeline: ['GitHub', 'Jenkins', 'Docker Build', 'Docker Hub', 'Deploy'],
    node_version: process.version
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
