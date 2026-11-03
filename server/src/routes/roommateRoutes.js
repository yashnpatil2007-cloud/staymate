const express = require('express');
const controller = require('../controllers/roommateController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { roommateProfileSchema, roommateRequestSchema } = require('../validators/schemas');

const router = express.Router();
router.use(requireAuth);

router.get('/profile/me', controller.getMyProfile);
router.put('/profile/me', validate(roommateProfileSchema), controller.upsertMyProfile);
router.post('/profile/me', validate(roommateProfileSchema), controller.upsertMyProfile);
router.get('/requests/received', controller.getReceivedRequests);
router.get('/requests/sent', controller.getSentRequests);
router.get('/connections', controller.getConnections);
router.post('/requests', validate(roommateRequestSchema), controller.sendRequest);
router.patch('/requests/:id', controller.respondRequest);
router.delete('/requests/:id', controller.cancelRequest);
router.get('/', controller.listRoommates);
router.get('/:id', controller.getRoommate);

module.exports = router;
