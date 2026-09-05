const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'talentsync-dev-secret',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    },
    process.env.JWT_SECRET || 'talentsync-dev-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

router.post('/register', async (req, res) => {
  try {
    const { role, email, password, fullName, companyName, phone, university, degree, graduationYear, skills, bio, contactPerson, companyWebsite, position } = req.body;

    const safeRole = role === 'recruiter' ? 'recruiter' : 'student';

    if (!email || !password || !safeRole) {
      return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email.toLowerCase().trim(), passwordHash, safeRole]
    );

    const userId = result.insertId;

    if (safeRole === 'student') {
      if (!fullName) {
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        return res.status(400).json({ message: 'Student full name is required.' });
      }

      await pool.execute(
        'INSERT INTO students (user_id, full_name, phone, university, degree, graduation_year, skills, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, fullName, phone || null, university || null, degree || null, graduationYear || null, skills || null, bio || null]
      );
    } else {
      if (!companyName) {
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        return res.status(400).json({ message: 'Recruiter company name is required.' });
      }

      await pool.execute(
        'INSERT INTO recruiters (user_id, company_name, company_website, position, contact_person, phone) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, companyName, companyWebsite || null, position || null, contactPerson || null, phone || null]
      );
    }

    const token = generateToken({ id: userId, email: email.toLowerCase().trim(), role: safeRole });
    const refreshToken = generateRefreshToken({ id: userId, email: email.toLowerCase().trim(), role: safeRole });

    return res.status(201).json({
      message: `${safeRole.charAt(0).toUpperCase() + safeRole.slice(1)} registered successfully.`,
      user: { id: userId, email: email.toLowerCase().trim(), role: safeRole },
      token,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      message: 'Login successful.',
      user: { id: user.id, email: user.email, role: user.role },
      token,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'talentsync-dev-secret');

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const token = generateToken({ id: decoded.id, email: decoded.email, role: decoded.role });
    return res.json({ token });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch profile.', error: error.message });
  }
});

module.exports = router;
