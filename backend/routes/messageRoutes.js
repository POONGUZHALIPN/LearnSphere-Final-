const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const { authenticateToken } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/objectIdValidation");
const router = express.Router();

router.get("/:userId", authenticateToken, validateObjectId("userId"), async (req, res, next) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.userId;
    if (!mongoose.isValidObjectId(myId) || !mongoose.isValidObjectId(otherId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const messages = await Message.find({
      $or: [
        { sender: myId, recipient: otherId },
        { sender: otherId, recipient: myId }
      ]
    }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ messages: messages.reverse() });
  } catch (error) { return next(error); }
});
module.exports = router;
