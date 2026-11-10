const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

const LEGACY_DB_PATH = path.join(__dirname, "../../data/db.json");

async function registerStudent({ name, email, password, department }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser || findLegacyStudentByEmail(normalizedEmail)) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      department: department.trim(),
      role: "student"
    });
    return toSafeStudent(user);
  } catch (error) {
    if (error && error.code === 11000) {
      const duplicate = new Error("Email is already registered");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    throw error;
  }
}

async function loginStudent({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (user && await bcrypt.compare(password, user.password)) {
    return toSafeStudent(user);
  }

  // Preserve Task 10 compatibility for accounts already stored by the
  // original LearnSphere app in data/db.json (scrypt password hashes).
  const legacyStudent = findLegacyStudentByEmail(normalizedEmail);
  if (legacyStudent && verifyLegacyPassword(password, legacyStudent.passwordHash)) {
    // Upgrade legacy JSON-only accounts to MongoDB on successful login.
    // Task 13 chat/notification schemas require real MongoDB ObjectId references.
    try {
      const migratedUser = await User.create({
        name: String(legacyStudent.name || "Student").trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        department: String(legacyStudent.degree || "General").trim(),
        role: "student"
      });
      return toSafeStudent(migratedUser);
    } catch (migrationError) {
      // A parallel login may have migrated the same account moments earlier.
      if (migrationError && migrationError.code === 11000) {
        const existingUser = await User.findOne({ email: normalizedEmail }).select("+password");
        if (existingUser) return toSafeStudent(existingUser);
      }
      throw migrationError;
    }
  }

  const error = new Error("Invalid email or password");
  error.statusCode = 401;
  throw error;
}

function findLegacyStudentByEmail(email) {
  try {
    const db = JSON.parse(fs.readFileSync(LEGACY_DB_PATH, "utf8"));
    return (db.students || []).find((item) => String(item.email).toLowerCase() === email) || null;
  } catch (_) {
    return null;
  }
}

function verifyLegacyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(":");
    if (!salt || !hash) return false;
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (_) {
    return false;
  }
}

function toSafeStudent(user) {
  const item = typeof user.toObject === "function" ? user.toObject() : user;
  return {
    id: String(item._id || item.id),
    name: item.name,
    email: item.email,
    role: item.role || "student",
    department: item.department || "General",
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString()
  };
}

module.exports = { registerStudent, loginStudent, toSafeStudent };
