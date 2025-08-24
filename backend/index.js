const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple rate limiting middleware
const rateLimitMap = new Map();
const rateLimit = (maxRequests = 60, windowMs = 60000) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const userLimit = rateLimitMap.get(ip);

        if (now > userLimit.resetTime) {
            userLimit.count = 1;
            userLimit.resetTime = now + windowMs;
            return next();
        }

        if (userLimit.count >= maxRequests) {
            return res.status(429).json({ error: 'Too many requests, please try again later' });
        }

        userLimit.count++;
        next();
    };
};

// Apply rate limiting to all routes
app.use(rateLimit(30, 60000)); // 30 requests per minute

// Add request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url} from ${req.ip || req.connection.remoteAddress}`);
    next();
});

const dbPath = path.join(__dirname, 'smartwaste.db');
const db = new Database(dbPath);

// Initialize tables
db.prepare(`CREATE TABLE IF NOT EXISTS rts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  rt_id INTEGER,
  role TEXT DEFAULT 'warga',
  status TEXT DEFAULT 'active',
  created_at TEXT,
  FOREIGN KEY(rt_id) REFERENCES rts(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  rt_id INTEGER,
  date TEXT,
  organic INTEGER DEFAULT 0,
  plastic INTEGER DEFAULT 0,
  electronic INTEGER DEFAULT 0,
  other INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  verified_by INTEGER,
  created_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(rt_id) REFERENCES rts(id),
  FOREIGN KEY(verified_by) REFERENCES users(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  points INTEGER DEFAULT 0
)`).run();

// Simple seed RTs and users
const seed = db.prepare('SELECT COUNT(*) as c FROM rts').get();
if (seed.c === 0) {
    const insert = db.prepare('INSERT INTO rts (name) VALUES (?)');
    insert.run('RT 01');
    insert.run('RT 02');
    insert.run('RT 03');

    // Seed sample users
    const userInsert = db.prepare('INSERT INTO users (name, phone, rt_id, role, created_at) VALUES (?,?,?,?,?)');
    const now = new Date().toISOString();
    userInsert.run('Budi Warga', '081234567890', 1, 'warga', now);
    userInsert.run('Siti Pengurus', '081234567891', 1, 'pengurus', now);
    userInsert.run('Ahmad Warga', '081234567892', 2, 'warga', now);
    userInsert.run('Rina Pengurus', '081234567893', 2, 'pengurus', now);
}

// Seed a simple challenge if none
const chCount = db.prepare('SELECT COUNT(*) as c FROM challenges').get();
if (chCount.c === 0) {
    const ins = db.prepare('INSERT INTO challenges (title, description, start_date, end_date, points) VALUES (?,?,?,?,?)');
    const today = new Date().toISOString().slice(0, 10);
    ins.run('Hari tanpa plastik sekali pakai', 'Usahakan tidak menggunakan plastik sekali pakai hari ini', today, today, 50);
}

// Endpoints
// Auth endpoints
app.post('/login', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    const user = db.prepare('SELECT u.*, r.name as rt_name FROM users u JOIN rts r ON u.rt_id = r.id WHERE u.phone = ? AND u.status = "active"').get(phone);
    if (!user) return res.status(404).json({ error: 'User not found or inactive' });
    res.json({ user: { id: user.id, name: user.name, phone: user.phone, rt_id: user.rt_id, rt_name: user.rt_name, role: user.role } });
});

app.post('/register', (req, res) => {
    const { name, phone, rt_id } = req.body;
    if (!name || !phone || !rt_id) return res.status(400).json({ error: 'Name, phone, and rt_id required' });
    try {
        const stmt = db.prepare('INSERT INTO users (name, phone, rt_id, created_at) VALUES (?,?,?,?)');
        const info = stmt.run(name, phone, rt_id, new Date().toISOString());
        res.json({ user_id: info.lastInsertRowid, message: 'Registration successful' });
    } catch (e) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ error: 'Phone number already registered' });
        } else {
            res.status(500).json({ error: 'Registration failed' });
        }
    }
});

app.get('/rts', (req, res) => {
    const rows = db.prepare('SELECT * FROM rts').all();
    res.json(rows);
});

app.post('/report', (req, res) => {
    const { user_id, date, organic = 0, plastic = 0, electronic = 0, other = 0 } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Check if user exists and get their RT
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = "active"').get(user_id);
    if (!user) return res.status(404).json({ error: 'User not found or inactive' });

    // Check daily limit (max 1 report per day per user)
    const today = date || new Date().toISOString().slice(0, 10);
    const existing = db.prepare('SELECT id FROM reports WHERE user_id = ? AND date = ?').get(user_id, today);
    if (existing) return res.status(400).json({ error: 'Already reported today' });

    // Validate reasonable limits (prevent absurd numbers)
    const maxDaily = 50; // max 50kg per category per day
    if (organic > maxDaily || plastic > maxDaily || electronic > maxDaily || other > maxDaily) {
        return res.status(400).json({ error: 'Daily limit exceeded (max 50kg per category)' });
    }

    const points = Math.max(0, Math.round((organic * 0.5 + plastic * 0.2 + electronic * 0.1 + other * 0.1)));
    const stmt = db.prepare('INSERT INTO reports (user_id, rt_id, date, organic, plastic, electronic, other, points, created_at) VALUES (?,?,?,?,?,?,?,?,?)');
    const info = stmt.run(user_id, user.rt_id, today, organic, plastic, electronic, other, points, new Date().toISOString());
    res.json({ id: info.lastInsertRowid, points, status: 'pending' });
});

app.get('/leaderboard', (req, res) => {
    const rows = db.prepare(`SELECT rts.id, rts.name, 
    IFNULL(SUM(CASE WHEN reports.status = 'approved' THEN reports.points ELSE 0 END),0) as total_points,
    COUNT(CASE WHEN reports.status = 'approved' THEN 1 END) as approved_reports,
    COUNT(CASE WHEN reports.status = 'pending' THEN 1 END) as pending_reports
    FROM rts
    LEFT JOIN reports ON reports.rt_id = rts.id
    GROUP BY rts.id
    ORDER BY total_points DESC`).all();
    res.json(rows);
});

// Approval endpoints (for pengurus)
app.get('/pending-reports/:rt_id', (req, res) => {
    const { rt_id } = req.params;
    const { pengurus_id } = req.query;

    // Verify pengurus role
    const pengurus = db.prepare('SELECT * FROM users WHERE id = ? AND role = "pengurus" AND rt_id = ?').get(pengurus_id, rt_id);
    if (!pengurus) return res.status(403).json({ error: 'Access denied: pengurus only' });

    const reports = db.prepare(`SELECT r.*, u.name as user_name 
    FROM reports r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.rt_id = ? AND r.status = 'pending' 
    ORDER BY r.created_at DESC`).all(rt_id);
    res.json(reports);
});

app.post('/approve-report', (req, res) => {
    const { report_id, pengurus_id, action } = req.body; // action: 'approve' or 'reject'
    if (!report_id || !pengurus_id || !action) return res.status(400).json({ error: 'report_id, pengurus_id, and action required' });

    // Get report and verify pengurus
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(report_id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const pengurus = db.prepare('SELECT * FROM users WHERE id = ? AND role = "pengurus" AND rt_id = ?').get(pengurus_id, report.rt_id);
    if (!pengurus) return res.status(403).json({ error: 'Access denied: pengurus only' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const stmt = db.prepare('UPDATE reports SET status = ?, verified_by = ? WHERE id = ?');
    stmt.run(newStatus, pengurus_id, report_id);

    res.json({ message: `Report ${newStatus}`, status: newStatus });
});

// Challenges endpoints
app.get('/challenges', (req, res) => {
    const rows = db.prepare('SELECT * FROM challenges ORDER BY id DESC').all();
    res.json(rows);
});

app.post('/challenges/complete', (req, res) => {
    const { rt_id, challenge_id } = req.body;
    if (!rt_id || !challenge_id) return res.status(400).json({ error: 'rt_id and challenge_id required' });
    const ch = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge_id);
    if (!ch) return res.status(404).json({ error: 'challenge not found' });
    const today = new Date().toISOString().slice(0, 10);
    const stmt = db.prepare('INSERT INTO reports (rt_id, date, points) VALUES (?,?,?)');
    const info = stmt.run(rt_id, today, ch.points);
    res.json({ awarded: ch.points, report_id: info.lastInsertRowid });
});

// AI Classification endpoint (built-in, rule-based)
app.post('/classify', (req, res) => {
    const { text = '', organic = 0, plastic = 0, electronic = 0, other = 0 } = req.body;

    // Simple rule-based classification
    let category = 'other';
    let recommendation = 'Usahakan untuk memilah sampah dengan benar';

    const textLower = text.toLowerCase();
    if (textLower.includes('plast') || textLower.includes('botol') || textLower.includes('kemasan')) {
        category = 'plastic';
        recommendation = 'Kurangi penggunaan plastik sekali pakai. Gunakan tas belanja sendiri dan botol minum yang bisa dipakai ulang.';
    } else if (textLower.includes('organ') || textLower.includes('sisa') || textLower.includes('makanan')) {
        category = 'organic';
        recommendation = 'Sampah organik bisa dijadikan kompos. Pisahkan dari sampah lain dan olah menjadi pupuk.';
    } else if (textLower.includes('elect') || textLower.includes('baterai') || textLower.includes('hp')) {
        category = 'electronic';
        recommendation = 'Sampah elektronik harus dibuang ke tempat khusus. Jangan campur dengan sampah biasa.';
    }

    // Calculate environmental impact score
    const totalWaste = organic + plastic + electronic + other;
    const ecoScore = Math.max(0, 100 - (plastic * 3 + electronic * 5 + other * 2 + organic * 0.5));

    res.json({
        category,
        recommendation,
        eco_score: Math.round(ecoScore),
        suggestion: totalWaste > 10 ? 'Coba kurangi timbulan sampah minggu depan' : 'Good job! Timbulan sampah terkendali'
    });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Backend running on port', port));
