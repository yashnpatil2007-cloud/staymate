const express = require('express');
const controller = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/stats', controller.getStats);
router.get('/users', controller.listUsers);
router.patch('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);
router.get('/properties', controller.listProperties);
router.patch('/properties/:id', controller.moderateProperty);
router.get('/food', controller.listFood);
router.patch('/food/:id', controller.moderateFood);
router.get('/reports', controller.listReports);
router.patch('/reports/:id', controller.updateReport);
router.get('/reviews', controller.listReviews);
router.patch('/reviews/:id', controller.moderateReview);
router.delete('/reviews/:id', controller.deleteReview);

module.exports = router;
