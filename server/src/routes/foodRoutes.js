const express = require('express');
const controller = require('../controllers/foodController');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { foodSchema, mealPlanSchema } = require('../validators/schemas');

const router = express.Router();

router.get('/', optionalAuth, controller.listFood);
router.get('/mine', requireAuth, requireRole('food_provider', 'admin'), controller.myFood);
router.post('/', requireAuth, requireRole('food_provider', 'admin'), validate(foodSchema), controller.createFood);
router.post('/:id/plans', requireAuth, requireRole('food_provider', 'admin'), validate(mealPlanSchema), controller.createMealPlan);
router.patch('/:id/plans/:planId', requireAuth, requireRole('food_provider', 'admin'), validate(mealPlanSchema.partial()), controller.updateMealPlan);
router.delete('/:id/plans/:planId', requireAuth, requireRole('food_provider', 'admin'), controller.deleteMealPlan);
router.get('/:id', optionalAuth, controller.getFood);
router.patch('/:id', requireAuth, requireRole('food_provider', 'admin'), validate(foodSchema.partial()), controller.updateFood);
router.delete('/:id', requireAuth, requireRole('food_provider', 'admin'), controller.deleteFood);

module.exports = router;
