# LearnSphere Express Backend — Tasks 8–14

The Express API now uses MongoDB through Mongoose for persistent student accounts and course records. The existing LearnSphere HTML/CSS/Vanilla JavaScript application and its port-3000 JSON-backed learning/session server are intentionally left unchanged so Task 10 frontend compatibility is preserved.

## 1. Requirements

- Node.js 18 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## 2. Configure MongoDB

From this `backend` folder, create your local environment file:

```cmd
copy .env.example .env
```

Open `.env` and set `MONGO_URI` to your MongoDB connection string. For a local MongoDB Community Server installation, use:

```env
MONGO_URI=mongodb://127.0.0.1:27017/learnsphere
```

Keep your own `JWT_SECRET` value in `.env`. Do not upload or commit `.env`; only `.env.example` belongs in source control.

## 3. Install and run

```cmd
npm install
npm test
npm run dev
```

The API starts at `http://localhost:5000` only after MongoDB connects successfully. On the first startup, the backend inserts the two starter courses if the `courses` collection is empty. It does not overwrite existing records on later restarts.

Check:

- `GET http://localhost:5000/`
- `GET http://localhost:5000/api/health` — reports both API and MongoDB connection status.

## 4. MongoDB-backed API

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Save a new student in MongoDB |
| POST | `/api/v1/auth/login` | Verify a MongoDB student and issue a JWT |

Registration JSON:

```json
{
  "name": "Arun Kumar",
  "email": "arun@example.com",
  "password": "LearnSecure123",
  "department": "Computer Science"
}
```

Passwords are hashed with bcrypt before storage. Passwords and password hashes are never returned in API responses. Existing demo accounts in the original `data/db.json` can still log in through the Task 10 compatibility fallback; that legacy application store is not modified by this backend task.

### Courses

Both `/api/v1/courses` and the compatibility path `/api/courses` are available.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/courses` | Retrieve all courses from MongoDB |
| GET | `/api/v1/courses/:id` | Retrieve one course |
| POST | `/api/v1/courses` | Create a course (JWT required) |
| PUT | `/api/v1/courses/:id` | Update a course (JWT required) |
| PATCH | `/api/v1/courses/:id` | Partially update a course (JWT required) |
| DELETE | `/api/v1/courses/:id` | Delete a course (JWT required) |

Example course JSON:

```json
{
  "courseName": "React Development",
  "courseCode": "REACT101",
  "instructor": "Dr. Anu",
  "duration": "8 Weeks",
  "category": "Web Development",
  "description": "Learn React from fundamentals to advanced concepts.",
  "status": "Active"
}
```

The API preserves the existing Task 8/10 response shape (`id`, `courseName`, `courseCode`, `instructor`, `duration`, `category`, `description`, `status`) while storing normalized course data in MongoDB.

## 5. Tests

Run the offline tests (they do not require MongoDB):

```cmd
npm test
```

These test the course service behavior, authentication behavior, legacy demo login compatibility, schema validation, and key unique indexes. The course/auth service unit tests mock Mongoose model methods; they do not claim to test a live database.

After MongoDB is installed and running and `.env` is configured, run the live database integration test:

```cmd
npm run test:db
```

It verifies a real connection, course create/read/update, student registration/login, and removes the temporary test records afterward.

## 6. Storage responsibilities

- Task 12: Express API student registration and course CRUD use MongoDB persistence.
- Existing main LearnSphere app: its port-3000 JSON-backed dashboard, sessions, course applications, lesson completion, and quiz flow remain unchanged for Task 10 compatibility.
- The `Enrollment`, `LearningProgress`, `Notification`, and `Message` Mongoose schemas are prepared from Task 11. Their feature routes/workflows can be connected in the next implementation tasks; this change does not pretend those workflows are already live.

## 7. Backend structure

```text
backend/
├── config/db.js
├── controllers/
├── data/courses.js          # one-time starter course seed data
├── middleware/
├── models/                  # six Mongoose models
├── routes/
├── services/                # MongoDB-backed auth and course services
├── test-course-service.js
├── test-auth-service.js
├── test-schemas.js
├── test-db-integration.js
├── .env.example
└── server.js
```


## Task 14 — Optimization, Security & Error Handling

Task 14 adds trusted-origin CORS for Express and Socket.IO, Helmet security headers, request body size limits, express-validator input validation, bcrypt password hashing verification, centralized 404/error responses, login rate limiting (10 attempts per 15 minutes), lean read queries, indexes, bounded course pagination, Morgan logging, protected course writes, process-level error handling, and graceful shutdown.

Socket.IO is initialized on the exact same `http.Server` instance used by `server.js` to listen on port 5000. The frontend's `VITE_SOCKET_URL` must point to `http://localhost:5000` during local development. This preserves Task 13 real-time chat and notifications while applying the Task 14 trusted-origin CORS policy.

Course listing accepts optional `page` and `limit` query parameters. Defaults are page 1 and 20 records; the maximum limit is 100. Invalid non-positive or non-integer values return HTTP 400.

The JSON-backed port-3000 LearnSphere application remains in place for its existing student/admin dashboard and student CRUD workflows. Those student CRUD routes remain admin-session protected and now validate field types, email format, and field lengths. The MongoDB-backed port-5000 API remains responsible for JWT authentication, courses, chat, and notifications.

### Task 14 packages

Install with `npm install` (the package manifest includes `express-validator`, `helmet`, and `express-rate-limit`).

### Security configuration

Copy `.env.example` to `.env` and set a private `JWT_SECRET`, your MongoDB URI, and the exact frontend origin in `CLIENT_URL`. Multiple trusted origins may be comma-separated. Never commit `.env`.

### Validation behavior

Registration requires a valid email, name, department, and a 12–72 character password. Login is limited to 10 attempts per 15 minutes per client IP. Invalid MongoDB IDs return HTTP 400. Unknown routes return 404. Validation errors return 400, duplicate records 409, authentication failures 401, forbidden access 403, and unexpected server errors a controlled 500 response.

### Run and test

```bash
npm install
npm test
npm run dev
```

Health check: `GET http://localhost:5000/api/health`. Use Postman for the Task 14 security test matrix.
