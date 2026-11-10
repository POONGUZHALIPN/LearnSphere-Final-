const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    department: {
      type: String,
      trim: true,
      default: "General",
      maxlength: 100
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
