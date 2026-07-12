const asyncHandler = require('express-async-handler');

// Generic CRUD factory for user-owned resources
const createCRUD = (Model) => ({
  // GET all for current user
  getAll: asyncHandler(async (req, res) => {
    const items = await Model.find({ user: req.user._id }).sort({ order: 1, createdAt: -1 });
    res.json(items);
  }),

  // GET one
  getOne: asyncHandler(async (req, res) => {
    const item = await Model.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) { res.status(404); throw new Error('Item not found'); }
    res.json(item);
  }),

  // CREATE
  create: asyncHandler(async (req, res) => {
    const item = await Model.create({ ...req.body, user: req.user._id });
    res.status(201).json(item);
  }),

  // UPDATE
  update: asyncHandler(async (req, res) => {
    const item = await Model.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) { res.status(404); throw new Error('Item not found'); }
    res.json(item);
  }),

  // DELETE
  remove: asyncHandler(async (req, res) => {
    const item = await Model.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) { res.status(404); throw new Error('Item not found'); }
    res.json({ message: 'Deleted successfully', id: req.params.id });
  }),

  // REORDER
  reorder: asyncHandler(async (req, res) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400); throw new Error('orderedIds must be an array');
    }
    const updates = orderedIds.map((id, index) =>
      Model.updateOne({ _id: id, user: req.user._id }, { order: index })
    );
    await Promise.all(updates);
    res.json({ message: 'Reordered successfully' });
  })
});

module.exports = createCRUD;
