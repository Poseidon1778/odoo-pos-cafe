const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  openSession,
  closeSession,
  getCurrentSession,
  getAllSessions,
} = require('../controllers/sessionController');

router.post('/open', authMiddleware, openSession);
router.put('/close/:id', authMiddleware, closeSession);
router.get('/current', authMiddleware, getCurrentSession);
router.get('/', authMiddleware, getAllSessions);

module.exports = router;