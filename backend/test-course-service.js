const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Course = require("./models/Course");
const service = require("./services/courseService");

const records = [];
const original = {
  find: Course.find,
  findById: Course.findById,
  create: Course.create,
  findByIdAndUpdate: Course.findByIdAndUpdate,
  findByIdAndDelete: Course.findByIdAndDelete
};

function doc(data) {
  return { ...data, _id: data._id || new mongoose.Types.ObjectId(), toObject() { return { ...this }; } };
}

Course.find = () => ({
  sort() { return this; },
  skip() { return this; },
  limit() { return this; },
  lean: async () => records.slice()
});
Course.findById = (id) => ({
  lean: async () => records.find((item) => String(item._id) === String(id)) || null
});
Course.create = async (data) => {
  const created = doc(data);
  records.push(created);
  return created;
};
Course.findByIdAndUpdate = async (id, update) => {
  const current = records.find((item) => String(item._id) === String(id));
  if (!current) return null;
  Object.assign(current, update.$set);
  return current;
};
Course.findByIdAndDelete = async (id) => {
  const index = records.findIndex((item) => String(item._id) === String(id));
  if (index < 0) return null;
  return records.splice(index, 1)[0];
};

async function run() {
  const created = await service.createCourse({
    courseName: "Test Course",
    courseCode: "TST101",
    instructor: "Test Instructor",
    duration: "4 Weeks",
    category: "Testing",
    description: "A course used by the automated service test."
  });
  assert.ok(mongoose.isValidObjectId(created.id));
  assert.equal(created.courseName, "Test Course");
  assert.equal((await service.getAllCourses()).length, 1);
  assert.equal((await service.getCourseById(created.id)).courseName, "Test Course");

  const updated = await service.updateCourse(created.id, { instructor: "Updated Instructor" });
  assert.equal(updated.instructor, "Updated Instructor");
  assert.equal(updated.courseName, "Test Course", "Partial updates must preserve existing fields");

  assert.equal(await service.deleteCourse(created.id), true);
  assert.equal(await service.getCourseById(created.id), null);
  assert.equal(await service.deleteCourse(created.id), false);
  assert.equal(await service.getCourseById("not-an-object-id"), null);

  console.log("Course service CRUD checks passed (MongoDB model methods mocked; live DB tested separately).");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    Object.assign(Course, original);
  });
