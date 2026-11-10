// Starter course data from Task 8.
// This is in-memory demo data: CRUD changes reset when the server restarts.
const courses = [
  {
    id: "1",
    courseName: "Python Programming",
    courseCode: "CS101",
    instructor: "Dr. Priya",
    duration: "8 Weeks",
    category: "Programming",
    description: "Learn Python programming from beginner to advanced level.",
    status: "Active"
  },
  {
    id: "2",
    courseName: "Web Development",
    courseCode: "WD101",
    instructor: "Dr. Priya",
    duration: "10 Weeks",
    category: "Web Development",
    description: "Learn modern web development.",
    status: "Active"
  }
];

module.exports = courses;
