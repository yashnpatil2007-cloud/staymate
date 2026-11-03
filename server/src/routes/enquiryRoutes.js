const express = require('express');
const controller = require('../controllers/enquiryController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { enquirySchema } = require('../validators/schemas');

const router = express.Router();
router.use(requireAuth);

router.post('/', validate(enquirySchema), controller.createEnquiry);
router.get('/mine', controller.myEnquiries);
router.get('/received', controller.receivedEnquiries);
router.patch('/:id/status', controller.updateEnquiryStatus);

module.exports = router;
