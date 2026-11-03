const express = require('express');
const controller = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reviewSchema } = require('../validators/schemas');

const router = express.Router();

router.get('/listing/:listingType/:listingId', controller.listReviews);
router.get('/eligibility/:listingType/:listingId', requireAuth, controller.getEligibility);
router.post('/', requireAuth, validate(reviewSchema), controller.createReview);
router.delete('/:id', requireAuth, controller.deleteReview);

module.exports = router;
