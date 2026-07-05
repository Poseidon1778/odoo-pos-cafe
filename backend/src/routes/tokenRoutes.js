const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateToken, validateToken } = require('../controllers/tokenController');

router.post('/', authMiddleware, generateToken);
router.get('/:token', validateToken); // no auth — customer scans this

module.exports = router;