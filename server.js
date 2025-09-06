require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const files = [
    { path: MESSAGES_FILE, init: [] },
    { path: SUBSCRIBERS_FILE, init: [] },
    { path: STORIES_FILE, init: [] }
  ];
  for (const f of files) {
    try {
      await fs.access(f.path);
    } catch (e) {
      await fs.writeFile(f.path, JSON.stringify(f.init, null, 2));
    }
  }
}

async function readJSON(filePath) {
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error('readJSON error for', filePath, err);
    return [];
  }
}

async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Serve frontend static files from public
app.use(express.static(path.join(__dirname, 'public')));

// --------- API Routes ----------

// Contact: save message to data/messages.json
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) return res.json({ success: false, msg: 'Please provide name, email and message' });
  try {
    const list = await readJSON(MESSAGES_FILE);
    const entry = { id: genId(), name, email, subject: subject || '', message, createdAt: new Date().toISOString() };
    list.unshift(entry);
    await writeJSON(MESSAGES_FILE, list);
    return res.json({ success: true, msg: 'Message received. Thank you!' });
  } catch (err) {
    console.error('contact err', err);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Signup
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.json({ success: false, msg: 'Missing fields' });
  try {
    const users = await readJSON(SUBSCRIBERS_FILE);
    if (users.find(u => u.email === email)) return res.json({ success: false, msg: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = { id: genId(), name, email, passwordHash, isAdmin: false, createdAt: new Date().toISOString() };
    users.push(user);
    await writeJSON(SUBSCRIBERS_FILE, users);
   const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
return res.json({
  success: true,
  msg: 'User created',
  token,
  user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }
});

  } catch (err) {
    console.error('signup err', err);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.json({ success: false, msg: 'Missing fields' });
  try {
    const users = await readJSON(SUBSCRIBERS_FILE);
    const user = users.find(u => u.email === email);
    if (!user) return res.json({ success: false, msg: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.json({ success: false, msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
return res.json({
  success: true,
  msg: 'Logged in',
  token,
  user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }
});

  } catch (err) {
    console.error('login err', err);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, msg: 'No token provided' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, msg: 'Invalid token' });
  }
}

// Protected: get all contact messages (admin only)
app.get('/api/contacts', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ success: false, msg: 'Forbidden' });
  const messages = await readJSON(MESSAGES_FILE);
  res.json({ success: true, messages });
});

// Protected: list users (admin)
app.get('/api/users', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ success: false, msg: 'Forbidden' });
  const users = await readJSON(SUBSCRIBERS_FILE);
  const safe = users.map(u => ({ id: u.id, name: u.name, email: u.email, isAdmin: u.isAdmin, createdAt: u.createdAt }));
  res.json({ success: true, users: safe });
});

// Start server
(async () => {
  await ensureDataFiles();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
