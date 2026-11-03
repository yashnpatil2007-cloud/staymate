const express = require('express');
const controller = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.listNotifications);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);
router.delete('/:id', controller.removeNotification);

module.exports = router;
