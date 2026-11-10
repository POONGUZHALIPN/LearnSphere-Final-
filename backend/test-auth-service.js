const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const User = require("./models/User");
const { registerStudent, loginStudent } = require("./services/authService");

const records = [];
const originalFindOne = User.findOne;
const originalCreate = User.create;

User.findOne = (filter) => {
  const result = records.find((item) => item.email === filter.email) || null;
  return {
    select() { return this; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); }
  };
};

User.create = async (data) => {
  const user = {
    ...data,
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    toObject() { return { ...this }; }
  };
  records.push(user);
  return user;
};

async function run() {
  const created = await registerStudent({
    name: "Arun Kumar",
    email: "ARUN@example.com",
    password: "LearnSecure123",
    department: "Computer Science"
  });

  assert.equal(created.email, "arun@example.com");
  assert.equal(created.name, "Arun Kumar");
  assert.equal(Object.hasOwn(created, "passwordHash"), false);
  assert.equal(Object.hasOwn(created, "password"), false);

  await assert.rejects(
    () => registerStudent({ name: "Duplicate", email: "arun@example.com", password: "LearnSecure123", department: "Computer Science" }),
    (error) => error.statusCode === 409
  );

  const loggedIn = await loginStudent({ email: "arun@example.com", password: "LearnSecure123" });
  assert.equal(loggedIn.email, "arun@example.com");

  // Existing LearnSphere demo students can still log in through the legacy scrypt fallback.
  const legacyStudent = await loginStudent({ email: "aarav@example.com", password: "password123" });
  assert.equal(mongoose.isValidObjectId(legacyStudent.id), true);
  assert.equal(legacyStudent.email, "aarav@example.com");
  assert.equal(records.some((item) => item.email === "aarav@example.com"), true);

  await assert.rejects(
    () => loginStudent({ email: "arun@example.com", password: "WrongPassword123" }),
    (error) => error.statusCode === 401
  );

  console.log("Auth service checks passed (MongoDB model methods mocked; legacy JSON login compatibility passed).");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  });
