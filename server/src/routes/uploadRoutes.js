const express = require('express');
const controller = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, upload.array('images', 8), controller.uploadImages);

module.exports = router;
