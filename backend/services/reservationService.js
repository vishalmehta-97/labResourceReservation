const pool = require('../config/db');
const { createError } = require('../middlewares/errorMiddleware');
require('dotenv').config();

const MAX_BOOKING_HOURS = parseInt(process.env.MAX_BOOKING_HOURS) || 72;

/**
 * Create a reservation with full ACID-compliant pessimistic locking
 * to prevent double-booking race conditions.
 */
const createReservation = async ({ user_id, equipment_id, start_time, end_time, purpose }) => {
  // ─── Input Validation ───────────────────────────────────────────────────────
  if (!user_id || !equipment_id || !start_time || !end_time || !purpose) {
    throw createError('All fields (equipment_id, start_time, end_time, purpose) are required.', 400, 'VALIDATION_ERROR');
  }

  const purposeStr = purpose.trim();
  if (purposeStr.length < 5 || purposeStr.length > 255) {
    throw createError('Purpose must be between 5 and 255 characters.', 400, 'VALIDATION_ERROR');
  }

  const startDt = new Date(start_time);
  const endDt = new Date(end_time);
  const now = new Date();

  if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
    throw createError('Invalid date/time format.', 400, 'VALIDATION_ERROR');
  }

  if (startDt <= now) {
    throw createError('Reservation start time must be in the future.', 400, 'PAST_TIME');
  }

  if (endDt <= startDt) {
    throw createError('End time must be after start time.', 400, 'INVALID_TIME_RANGE');
  }

  const durationHours = (endDt - startDt) / (1000 * 60 * 60);
  if (durationHours > MAX_BOOKING_HOURS) {
    throw createError(
      `Maximum booking duration is ${MAX_BOOKING_HOURS} hours. Requested: ${durationHours.toFixed(1)} hours.`,
      400,
      'EXCEEDS_MAX_DURATION'
    );
  }

  // ─── MySQL datetime strings ──────────────────────────────────────────────────
  const toMysqlDatetime = (dt) => dt.toISOString().slice(0, 19).replace('T', ' ');
  const startStr = toMysqlDatetime(startDt);
  const endStr = toMysqlDatetime(endDt);

  // ─── Acquire dedicated connection for transaction ────────────────────────────
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Lock the equipment row for update (pessimistic locking)
    const [equipRows] = await conn.query(
      'SELECT id, name, status FROM equipment WHERE id = ? FOR UPDATE',
      [equipment_id]
    );

    if (equipRows.length === 0) {
      throw createError('Equipment not found.', 404, 'NOT_FOUND');
    }

    const equip = equipRows[0];

    if (equip.status !== 'AVAILABLE') {
      throw createError(
        `Equipment "${equip.name}" is not available for reservation (current status: ${equip.status}).`,
        409,
        'EQUIPMENT_NOT_AVAILABLE'
      );
    }

    // 2. Check for overlapping reservations with row-level locking
    const [conflicting] = await conn.query(
      `SELECT id, start_time, end_time FROM reservations
       WHERE equipment_id = ?
         AND status IN ('APPROVED', 'ACTIVE')
         AND NOT (end_time <= ? OR start_time >= ?)
       FOR UPDATE`,
      [equipment_id, startStr, endStr]
    );

    if (conflicting.length > 0) {
      const conflict = conflicting[0];
      throw createError(
        `Time slot conflict detected. Equipment is already reserved from ${conflict.start_time} to ${conflict.end_time}.`,
        409,
        'TIME_SLOT_CONFLICT'
      );
    }

    // 3. Insert the reservation
    const [insertResult] = await conn.query(
      `INSERT INTO reservations (user_id, equipment_id, start_time, end_time, purpose, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [user_id, equipment_id, startStr, endStr, purposeStr]
    );

    await conn.commit();

    // 4. Fetch the created reservation with details
    const [rows] = await pool.query(
      `SELECT r.*, e.name AS equipment_name, e.category, e.lab_location, u.name AS user_name, u.email AS user_email
       FROM reservations r
       JOIN equipment e ON r.equipment_id = e.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [insertResult.insertId]
    );

    return rows[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { createReservation };
