const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { createError } = require('../middlewares/errorMiddleware');
require('dotenv').config();

const SALT_ROUNDS = 10;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      throw createError('Name, email, and password are required.', 400, 'VALIDATION_ERROR');
    }

    const nameStr = name.trim();
    const emailStr = email.trim().toLowerCase();

    if (nameStr.length < 2 || nameStr.length > 100) {
      throw createError('Name must be between 2 and 100 characters.', 400, 'VALIDATION_ERROR');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      throw createError('Invalid email address format.', 400, 'VALIDATION_ERROR');
    }

    if (password.length < 6) {
      throw createError('Password must be at least 6 characters long.', 400, 'VALIDATION_ERROR');
    }

    // Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [emailStr]);
    if (existing.length > 0) {
      throw createError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Only allow ADMIN role assignment if explicitly requested and valid
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [nameStr, emailStr, password_hash, assignedRole]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const newUser = rows[0];
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: newUser, token },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('Email and password are required.', 400, 'VALIDATION_ERROR');
    }

    const emailStr = email.trim().toLowerCase();

    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?',
      [emailStr]
    );

    if (rows.length === 0) {
      throw createError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw createError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken(user);

    const { password_hash, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user: userWithoutPassword, token },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      throw createError('User not found.', 404, 'NOT_FOUND');
    }

    return res.status(200).json({
      success: true,
      message: 'User details retrieved.',
      data: { user: rows[0] },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
