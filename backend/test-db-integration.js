require("dotenv").config();
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Course = require("./models/Course");
const User = require("./models/User");
const courseService = require("./services/courseService");
const { registerStudent, loginStudent } = require("./services/authService");

async function run() {
  await connectDB();
  const marker = `DBTEST-${Date.now()}`;
  let courseId;
  let testEmail;

  try {
    const course = await courseService.createCourse({
      courseName: `${marker} Course`,
      courseCode: marker,
      instructor: "Integration Test",
      duration: "2 Weeks",
      category: "Testing",
      description: "Temporary record created by the MongoDB integration test."
    });
    courseId = course.id;

    const fetched = await courseService.getCourseById(courseId);
    assert.equal(fetched.courseName, `${marker} Course`);

    const updated = await courseService.updateCourse(courseId, { instructor: "Updated Test Instructor" });
    assert.equal(updated.instructor, "Updated Test Instructor");

    testEmail = `${marker.toLowerCase()}@example.test`;
    const registered = await registerStudent({
      name: "MongoDB Integration Test",
      email: testEmail,
      password: "Integration123",
      department: "Testing"
    });
    assert.equal(registered.email, testEmail);

    const loggedIn = await loginStudent({ email: testEmail, password: "Integration123" });
    assert.equal(loggedIn.email, testEmail);

    console.log("MongoDB integration checks passed: connect, course create/read/update, user register/login.");
  } finally {
    if (courseId) await Course.findByIdAndDelete(courseId);
    if (testEmail) await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error("MongoDB integration test failed:", error.message);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
