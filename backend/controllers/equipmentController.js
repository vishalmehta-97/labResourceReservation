const pool = require('../config/db');
const { createError } = require('../middlewares/errorMiddleware');

const getAllEquipment = async (req, res, next) => {
  try {
    const { search = '', category = '', status = '', page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    let params = [];

    if (search.trim()) {
      conditions.push('(e.name LIKE ? OR e.serial_number LIKE ? OR e.lab_location LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category.trim()) {
      conditions.push('e.category = ?');
      params.push(category.trim());
    }

    if (status.trim()) {
      const validStatuses = ['AVAILABLE', 'MAINTENANCE', 'RETIRED'];
      if (!validStatuses.includes(status.trim().toUpperCase())) {
        throw createError('Invalid status filter.', 400, 'VALIDATION_ERROR');
      }
      conditions.push('e.status = ?');
      params.push(status.trim().toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM equipment e ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT e.* FROM equipment e ${whereClause} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      message: 'Equipment list retrieved.',
      data: {
        equipment: rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(parseInt(id))) {
      throw createError('Invalid equipment ID.', 400, 'VALIDATION_ERROR');
    }

    const [rows] = await pool.query('SELECT * FROM equipment WHERE id = ?', [parseInt(id)]);

    if (rows.length === 0) {
      throw createError('Equipment not found.', 404, 'NOT_FOUND');
    }

    // Get active bookings for this equipment
    const [activeBookings] = await pool.query(
      `SELECT r.id, r.start_time, r.end_time, r.status, r.purpose,
              u.name AS reserved_by
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.equipment_id = ?
         AND r.status IN ('APPROVED', 'ACTIVE')
         AND r.end_time > NOW()
       ORDER BY r.start_time ASC`,
      [parseInt(id)]
    );

    return res.status(200).json({
      success: true,
      message: 'Equipment details retrieved.',
      data: { equipment: rows[0], activeBookings },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const createEquipment = async (req, res, next) => {
  try {
    const { name, serial_number, category, lab_location, status, description } = req.body;

    if (!name || !serial_number || !category || !lab_location) {
      throw createError('Name, serial number, category, and lab location are required.', 400, 'VALIDATION_ERROR');
    }

    const validStatuses = ['AVAILABLE', 'MAINTENANCE', 'RETIRED'];
    const equipStatus = status ? status.toUpperCase() : 'AVAILABLE';
    if (!validStatuses.includes(equipStatus)) {
      throw createError('Invalid status value.', 400, 'VALIDATION_ERROR');
    }

    const [result] = await pool.query(
      `INSERT INTO equipment (name, serial_number, category, lab_location, status, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), serial_number.trim(), category.trim(), lab_location.trim(), equipStatus, description?.trim() || null]
    );

    const [rows] = await pool.query('SELECT * FROM equipment WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Equipment created successfully.',
      data: { equipment: rows[0] },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, serial_number, category, lab_location, status, description } = req.body;

    const equipId = parseInt(id);
    if (!Number.isInteger(equipId)) {
      throw createError('Invalid equipment ID.', 400, 'VALIDATION_ERROR');
    }

    const [existing] = await pool.query('SELECT * FROM equipment WHERE id = ?', [equipId]);
    if (existing.length === 0) {
      throw createError('Equipment not found.', 404, 'NOT_FOUND');
    }

    const current = existing[0];
    const validStatuses = ['AVAILABLE', 'MAINTENANCE', 'RETIRED'];
    const newStatus = status ? status.toUpperCase() : current.status;

    if (!validStatuses.includes(newStatus)) {
      throw createError('Invalid status value.', 400, 'VALIDATION_ERROR');
    }

    await pool.query(
      `UPDATE equipment SET
        name = ?, serial_number = ?, category = ?, lab_location = ?, status = ?, description = ?
       WHERE id = ?`,
      [
        name?.trim() || current.name,
        serial_number?.trim() || current.serial_number,
        category?.trim() || current.category,
        lab_location?.trim() || current.lab_location,
        newStatus,
        description !== undefined ? description?.trim() : current.description,
        equipId,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM equipment WHERE id = ?', [equipId]);

    return res.status(200).json({
      success: true,
      message: 'Equipment updated successfully.',
      data: { equipment: updated[0] },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const retireEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipId = parseInt(id);

    if (!Number.isInteger(equipId)) {
      throw createError('Invalid equipment ID.', 400, 'VALIDATION_ERROR');
    }

    const [existing] = await pool.query('SELECT * FROM equipment WHERE id = ?', [equipId]);
    if (existing.length === 0) {
      throw createError('Equipment not found.', 404, 'NOT_FOUND');
    }

    // Check for active/approved reservations before retiring
    const [activeRes] = await pool.query(
      `SELECT id FROM reservations WHERE equipment_id = ? AND status IN ('APPROVED', 'ACTIVE')`,
      [equipId]
    );

    if (activeRes.length > 0) {
      throw createError(
        'Cannot retire equipment with active or approved reservations. Cancel those reservations first.',
        409,
        'HAS_ACTIVE_RESERVATIONS'
      );
    }

    await pool.query('UPDATE equipment SET status = ? WHERE id = ?', ['RETIRED', equipId]);

    return res.status(200).json({
      success: true,
      message: 'Equipment retired successfully.',
      data: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT category FROM equipment WHERE status != ? ORDER BY category ASC',
      ['RETIRED']
    );
    const categories = rows.map((r) => r.category);

    return res.status(200).json({
      success: true,
      message: 'Categories retrieved.',
      data: { categories },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  retireEquipment,
  getCategories,
};
