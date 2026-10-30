const express = require('express');
const router = express.Router();
const {
  reserve,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  updateReservationStatus,
  getMetrics,
} = require('../controllers/reservationController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// User routes
router.post('/', authenticate, reserve);
router.get('/my', authenticate, getMyReservations);
router.patch('/:id/cancel', authenticate, cancelReservation);

// Admin routes
router.get('/metrics', authenticate, authorizeRole(['ADMIN']), getMetrics);
router.get('/', authenticate, authorizeRole(['ADMIN']), getAllReservations);
router.patch('/:id/status', authenticate, authorizeRole(['ADMIN']), updateReservationStatus);

module.exports = router;
