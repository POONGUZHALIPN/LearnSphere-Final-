const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const LEGACY_DB_PATH = path.join(__dirname, "../../data/db.json");

async function registerStudent({ name, email, password, department, degree, year, course }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser || findLegacyStudentByEmail(normalizedEmail)) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: passwordHash,
      department: String(department || degree || "General").trim(),
      degree: String(degree || department || "General").trim(),
      year: String(year || "1st Year").trim(),
      role: "student"
    });

    if (course) await createEnrollmentForCourse(user._id, course);
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

async function registerAdmin({ name, email, password, inviteCode }) {
  const expectedCode = process.env.ADMIN_INVITE_CODE || "LEARNSPHERE2026";
  if (!inviteCode || inviteCode !== expectedCode) {
    const error = new Error("Invalid admin invite code");
    error.statusCode = 403;
    throw error;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser || findLegacyAdminByEmail(normalizedEmail)) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  try {
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      department: "Administration",
      degree: "Administration",
      year: "Staff",
      role: "admin"
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
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (user) {
    if (user.role === "student" && await bcrypt.compare(password, user.password)) {
      return toSafeStudent(user);
    }
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Migrate accounts created by the original JSON-backed LearnSphere app.
  const legacyStudent = findLegacyStudentByEmail(normalizedEmail);
  if (legacyStudent && verifyLegacyPassword(password, legacyStudent.passwordHash)) {
    try {
      const migratedUser = await User.create({
        name: String(legacyStudent.name || "Student").trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        department: String(legacyStudent.degree || "General").trim(),
        degree: String(legacyStudent.degree || "General").trim(),
        year: String(legacyStudent.year || "1st Year").trim(),
        role: "student"
      });
      await migrateLegacyEnrollments(migratedUser, legacyStudent.courses || []);
      return toSafeStudent(migratedUser);
    } catch (migrationError) {
      if (migrationError && migrationError.code === 11000) {
        const existingUser = await User.findOne({ email: normalizedEmail }).select("+password");
        if (existingUser && existingUser.role === "student" &&
            await bcrypt.compare(password, existingUser.password)) return toSafeStudent(existingUser);
      }
      throw migrationError;
    }
  }

  const error = new Error("Invalid email or password");
  error.statusCode = 401;
  throw error;
}

async function loginAdmin({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (user) {
    if (user.role === "admin" && await bcrypt.compare(password, user.password)) {
      return toSafeStudent(user);
    }
    const error = new Error("Invalid admin email or password");
    error.statusCode = 401;
    throw error;
  }

  // Preserve the existing admin account from data/db.json and migrate it once
  // the correct credentials are supplied.
  const legacyAdmin = findLegacyAdminByEmail(normalizedEmail);
  if (legacyAdmin && verifyLegacyPassword(password, legacyAdmin.passwordHash)) {
    try {
      const migratedUser = await User.create({
        name: String(legacyAdmin.name || "Admin").trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        department: "Administration",
        degree: "Administration",
        year: "Staff",
        role: "admin"
      });
      return toSafeStudent(migratedUser);
    } catch (migrationError) {
      if (migrationError && migrationError.code === 11000) {
        const existingUser = await User.findOne({ email: normalizedEmail }).select("+password");
        if (existingUser && existingUser.role === "admin" &&
            await bcrypt.compare(password, existingUser.password)) return toSafeStudent(existingUser);
      }
      throw migrationError;
    }
  }

  const error = new Error("Invalid admin email or password");
  error.statusCode = 401;
  throw error;
}

async function createEnrollmentForCourse(userId, courseName) {
  const course = await Course.findOne({
    title: { $regex: `^${escapeRegex(String(courseName).trim())}$`, $options: "i" }
  });
  if (!course) {
    const error = new Error(`Course "${courseName}" is not available`);
    error.statusCode = 400;
    throw error;
  }
  const existing = await Enrollment.findOne({ student: userId, course: course._id });
  if (!existing) await Enrollment.create({ student: userId, course: course._id });
  return course;
}

async function migrateLegacyEnrollments(user, legacyCourses) {
  if (mongoose.connection.readyState !== 1) return;
  for (const item of legacyCourses) {
    const name = typeof item === "string" ? item : item.course;
    if (name) {
      try { await createEnrollmentForCourse(user._id, name); } catch (_) {}
    }
  }
}

function findLegacyStudentByEmail(email) {
  const db = readLegacyDb();
  return (db?.students || []).find((item) => String(item.email).toLowerCase() === email) || null;
}

function findLegacyAdminByEmail(email) {
  const db = readLegacyDb();
  return (db?.admins || []).find((item) => String(item.email).toLowerCase() === email) || null;
}

function readLegacyDb() {
  try { return JSON.parse(fs.readFileSync(LEGACY_DB_PATH, "utf8")); }
  catch (_) { return null; }
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
    degree: item.degree || item.department || "General",
    year: item.year || "1st Year",
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString()
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  registerStudent,
  registerAdmin,
  loginStudent,
  loginAdmin,
  createEnrollmentForCourse,
  toSafeStudent
};
