const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/objectIdValidation");
const router = express.Router();

router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ notifications });
  } catch (error) { return next(error); }
});

router.patch("/:id/read", authenticateToken, validateObjectId("id"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid notification ID" });
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { isRead: true } }, { new: true, runValidators: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    return res.json({ notification });
  } catch (error) { return next(error); }
});
module.exports = router;
