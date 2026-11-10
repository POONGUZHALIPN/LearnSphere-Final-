require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const { seedInitialCourses } = require("./services/courseService");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");
const initializeSocket = require("./config/socket");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const httpServer = http.createServer(app);
// Task 13 real-time messaging must share the exact HTTP server that listens below.
// Task 14 applies the same CLIENT_URL allow-list inside config/socket.js.
const io = initializeSocket(httpServer);
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    // Requests from tools such as Postman and same-origin server calls have no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error("Origin not allowed by CORS");
    error.statusCode = 403;
    return callback(error);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

app.disable("x-powered-by");
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (req, res) => {
  res.status(200).json({ message: "LearnSphere Express API is running" });
});

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    success: connected,
    message: connected ? "Backend and MongoDB are healthy" : "Backend is running but MongoDB is disconnected",
    database: connected ? "connected" : "disconnected",
    databaseName: connected ? mongoose.connection.name : null,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/courses", courseRoutes);

// Keep the 404 handler and centralized error handler after every API route.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let shuttingDown = false;

async function startServer() {
  await connectDB();
  await seedInitialCourses();
  return httpServer.listen(PORT, () => {
    console.log(`LearnSphere Express backend running at http://localhost:${PORT}`);
    console.log("Socket.IO server initialized with trusted CORS origins:", allowedOrigins.join(", "));
  });
}

async function gracefulShutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received. Closing LearnSphere connections...`);
  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out; forcing exit.");
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    await new Promise((resolve) => {
      if (!httpServer.listening) return resolve();
      io.close(resolve);
    });
    await mongoose.disconnect();
    clearTimeout(forceExit);
    console.log("Socket.IO, HTTP server, and MongoDB connections closed cleanly.");
    process.exit(exitCode);
  } catch (error) {
    console.error("Error during graceful shutdown:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
    gracefulShutdown("unhandledRejection", 1);
  });
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    gracefulShutdown("uncaughtException", 1);
  });
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  startServer().catch((error) => {
    console.error("Unable to start LearnSphere API:", error.message);
    console.error("Check MongoDB availability and MONGO_URI in backend/.env.");
    process.exit(1);
  });
}

module.exports = app;
module.exports.startServer = startServer;
module.exports.gracefulShutdown = gracefulShutdown;
module.exports.httpServer = httpServer;
module.exports.io = io;
