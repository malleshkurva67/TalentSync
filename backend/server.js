const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ override: true });

const { pool } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const { authMiddleware } = require('./src/middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.locals.db = pool;

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'TalentSync API',
    status: 'running',
    message: 'Use /api/auth/register or /api/auth/login to continue.',
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: result ? 'connected' : 'disconnected',
      service: 'TalentSync API',
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      service: 'TalentSync API',
      message: 'MySQL is not configured yet. Use the schema.sql file to initialize the database.',
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const [userRows] = await pool.execute('SELECT id, email, role, is_active, created_at FROM users WHERE id = ?', [req.user.id]);

    if (!userRows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userRows[0];
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch profile.', error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`TalentSync API running on port ${PORT}`);
});

module.exports = app;
