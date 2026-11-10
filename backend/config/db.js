const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it to backend/.env before starting the API.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = connectDB;
