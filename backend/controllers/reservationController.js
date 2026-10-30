const pool = require('../config/db');
const { createReservation } = require('../services/reservationService');
const { createError } = require('../middlewares/errorMiddleware');

const VALID_STATUS_TRANSITIONS = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['ACTIVE', 'REJECTED'],
  ACTIVE: ['COMPLETED'],
};

const reserve = async (req, res, next) => {
  try {
    const { equipment_id, start_time, end_time, purpose } = req.body;

    if (!equipment_id) {
      throw createError('equipment_id is required.', 400, 'VALIDATION_ERROR');
    }

    const reservation = await createReservation({
      user_id: req.user.id,
      equipment_id: parseInt(equipment_id),
      start_time,
      end_time,
      purpose,
    });

    return res.status(201).json({
      success: true,
      message: 'Reservation request submitted successfully. Awaiting admin approval.',
      data: { reservation },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*, e.name AS equipment_name, e.category, e.lab_location, e.serial_number
      FROM reservations r
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.user_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status.toUpperCase());
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: 'Your reservations retrieved.',
      data: { reservations: rows },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resId = parseInt(id);

    if (!Number.isInteger(resId)) {
      throw createError('Invalid reservation ID.', 400, 'VALIDATION_ERROR');
    }

    const [rows] = await pool.query(
      'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
      [resId, req.user.id]
    );

    if (rows.length === 0) {
      throw createError('Reservation not found or you do not have permission to cancel it.', 404, 'NOT_FOUND');
    }

    const res_record = rows[0];

    if (!['PENDING', 'APPROVED'].includes(res_record.status)) {
      throw createError(
        `Cannot cancel a reservation with status "${res_record.status}". Only PENDING or APPROVED reservations can be cancelled.`,
        409,
        'INVALID_STATUS_TRANSITION'
      );
    }

    await pool.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      ['CANCELLED', resId]
    );

    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully.',
      data: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const getAllReservations = async (req, res, next) => {
  try {
    const { status, equipment_id, user_id, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('r.status = ?');
      params.push(status.toUpperCase());
    }
    if (equipment_id) {
      conditions.push('r.equipment_id = ?');
      params.push(parseInt(equipment_id));
    }
    if (user_id) {
      conditions.push('r.user_id = ?');
      params.push(parseInt(user_id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM reservations r ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT r.*, e.name AS equipment_name, e.category, e.lab_location, e.serial_number,
              u.name AS user_name, u.email AS user_email
       FROM reservations r
       JOIN equipment e ON r.equipment_id = e.id
       JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      message: 'All reservations retrieved.',
      data: {
        reservations: rows,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const resId = parseInt(id);

    if (!Number.isInteger(resId)) {
      throw createError('Invalid reservation ID.', 400, 'VALIDATION_ERROR');
    }

    if (!status) {
      throw createError('Status is required.', 400, 'VALIDATION_ERROR');
    }

    const newStatus = status.toUpperCase();

    const [rows] = await pool.query(
      `SELECT r.*, e.name AS equipment_name FROM reservations r
       JOIN equipment e ON r.equipment_id = e.id
       WHERE r.id = ?`,
      [resId]
    );

    if (rows.length === 0) {
      throw createError('Reservation not found.', 404, 'NOT_FOUND');
    }

    const reservation = rows[0];
    const allowedTransitions = VALID_STATUS_TRANSITIONS[reservation.status] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw createError(
        `Invalid status transition from "${reservation.status}" to "${newStatus}". Allowed: ${allowedTransitions.join(', ') || 'none'}.`,
        409,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updateFields = { status: newStatus };
    if (newStatus === 'COMPLETED') {
      updateFields.returned_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    await pool.query(
      `UPDATE reservations SET status = ?, returned_at = COALESCE(?, returned_at) WHERE id = ?`,
      [newStatus, updateFields.returned_at || null, resId]
    );

    const [updated] = await pool.query(
      `SELECT r.*, e.name AS equipment_name, u.name AS user_name FROM reservations r
       JOIN equipment e ON r.equipment_id = e.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [resId]
    );

    return res.status(200).json({
      success: true,
      message: `Reservation status updated to "${newStatus}".`,
      data: { reservation: updated[0] },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const getMetrics = async (req, res, next) => {
  try {
    const [[totalEquipment]] = await pool.query('SELECT COUNT(*) AS count FROM equipment WHERE status != ?', ['RETIRED']);
    const [[currentlyLoaned]] = await pool.query(
      "SELECT COUNT(*) AS count FROM reservations WHERE status IN ('ACTIVE')"
    );
    const [[pendingApprovals]] = await pool.query(
      "SELECT COUNT(*) AS count FROM reservations WHERE status = 'PENDING'"
    );
    const [[maintenanceCount]] = await pool.query(
      "SELECT COUNT(*) AS count FROM equipment WHERE status = 'MAINTENANCE'"
    );
    const [[totalUsers]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'USER'");
    const [[approvedToday]] = await pool.query(
      "SELECT COUNT(*) AS count FROM reservations WHERE status = 'APPROVED' AND DATE(created_at) = CURDATE()"
    );

    return res.status(200).json({
      success: true,
      message: 'System metrics retrieved.',
      data: {
        metrics: {
          totalEquipment: totalEquipment.count,
          currentlyLoaned: currentlyLoaned.count,
          pendingApprovals: pendingApprovals.count,
          maintenanceCount: maintenanceCount.count,
          totalUsers: totalUsers.count,
          approvedToday: approvedToday.count,
        },
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  reserve,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  updateReservationStatus,
  getMetrics,
};
