// routes/skills.js
const express = require('express');
const router = express.Router();
const { Skill } = require('../models/SubModels');
const createCRUD = require('../controllers/crudController');
const { protect } = require('../middleware/authMiddleware');
const crud = createCRUD(Skill);
router.get('/', protect, crud.getAll);
router.get('/:id', protect, crud.getOne);
router.post('/', protect, crud.create);
router.put('/reorder', protect, crud.reorder);
router.put('/:id', protect, crud.update);
router.delete('/:id', protect, crud.remove);
module.exports = router;
