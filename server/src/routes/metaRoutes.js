const express = require('express');
const controller = require('../controllers/metaController');

const router = express.Router();

router.get('/testimonials', controller.getTestimonials);
router.get('/places', controller.getPlaces);

module.exports = router;
