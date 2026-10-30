const express = require('express');
const router = express.Router();
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  retireEquipment,
  getCategories,
} = require('../controllers/equipmentController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Public / Authenticated routes
router.get('/', authenticate, getAllEquipment);
router.get('/categories', authenticate, getCategories);
router.get('/:id', authenticate, getEquipmentById);

// Admin-only routes
router.post('/', authenticate, authorizeRole(['ADMIN']), createEquipment);
router.put('/:id', authenticate, authorizeRole(['ADMIN']), updateEquipment);
router.delete('/:id', authenticate, authorizeRole(['ADMIN']), retireEquipment);

module.exports = router;
