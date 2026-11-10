const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

function initializeSocket(httpServer) {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by Socket.IO CORS"));
      },
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication token is required"));
      if (!process.env.JWT_SECRET) return next(new Error("Authentication is not configured"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      const user = await User.findById(decoded.sub).select("_id name email role");
      if (!user) return next(new Error("User not found"));
      socket.user = { id: String(user._id), name: user.name, email: user.email, role: user.role };
      return next();
    } catch (_) {
      return next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    console.log(`Authenticated socket connected: ${socket.user.email} (${userId})`);

    socket.on("send_message", async (data, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const recipientId = data && String(data.recipientId || "");
        const text = data && data.text;
        if (!mongoose.isValidObjectId(recipientId) || typeof text !== "string" || !text.trim() || text.trim().length > 2000) {
          return reply({ success: false, message: "Enter a valid recipient ID and a message (1–2000 characters)." });
        }
        if (recipientId === userId) return reply({ success: false, message: "You cannot send a message to yourself." });
        const recipient = await User.findById(recipientId).select("_id role");
        if (!recipient || recipient.role !== "student") return reply({ success: false, message: "Student recipient not found." });

        const saved = await Message.create({ sender: userId, recipient: recipientId, text: text.trim() });
        const payload = {
          _id: String(saved._id), sender: userId, recipient: recipientId,
          senderName: socket.user.name, text: saved.text, createdAt: saved.createdAt
        };
        io.to(`user:${userId}`).to(`user:${recipientId}`).emit("receive_message", payload);
        const notification = await Notification.create({
          recipient: recipientId,
          message: `New message from ${socket.user.name}`
        });
        io.to(`user:${recipientId}`).emit("new_notification", notification);
        return reply({ success: true, message: payload });
      } catch (error) {
        console.error("send_message failed:", error.message);
        return reply({ success: false, message: "Unable to send message. Please try again." });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.user.email} - ${reason}`);
    });
  });
  return io;
}

module.exports = initializeSocket;
