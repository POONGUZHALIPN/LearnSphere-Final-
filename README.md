# Final deployment note

The final version now uses the existing MongoDB-backed Render API for the LearnSphere frontend, student/admin authentication, course enrollment, progress, quizzes, and Task 9–14 features. Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for the safe update steps. Keep the existing GitHub remote, Render service, Atlas database, and Vercel project. **Older sections below describe the earlier JSON-only/port-3000 setup; for the final unified deployment, follow `DEPLOYMENT_GUIDE.md` and the updated `backend/README.md`.**

---

# LearnSphere — Full-Stack Student/Admin Learning Platform

LearnSphere is a beginner-friendly full-stack learning platform built with:

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Frontend development server:** Vite
- **Backend / local Mock API:** Node.js built-in `http` server
- **Data storage:** JSON files in `data/`
- **Authentication:** Session cookie + Node.js `crypto.scrypt` password hashing

The existing UI, colors, layout, navigation and learning flow are preserved. The main enhancement in this version is a proper local API/service layer for student data and Admin CRUD.

## 1. Run the project

### First time only

Open Command Prompt in the project folder:

```bash
npm install
```

### Option A — easiest: start backend + frontend together

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

The combined development launcher starts:

- Mock API / backend → `http://localhost:3000`
- Vite frontend → `http://localhost:5173`

You can also open `http://localhost:3000`; the Node server serves the same frontend pages directly.

### Option B — start them separately

Terminal 1 — Mock API:

```bash
npm run api
```

Terminal 2 — frontend:

```bash
npm run frontend
```

Then open:

```text
http://localhost:5173
```

## 2. Mock API

The local Mock API is implemented in `server.js`. It reads and writes `data/db.json`, so changes persist after API requests and remain available while the development data file is kept.

Health check:

```text
GET http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "LearnSphere Mock API"
}
```

### Student CRUD API

All admin student-management endpoints require an authenticated admin session.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | Get all students |
| GET | `/api/students/:id` | Get one student |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Replace/update editable student data |
| PATCH | `/api/students/:id` | Partially update student data |
| DELETE | `/api/students/:id` | Delete a student |

Password hashes are never returned by these endpoints.

Course catalog:

```text
GET /api/courses
```

Existing authentication endpoints remain available:

```text
POST /api/register
POST /api/login
POST /api/admin/login
POST /api/admin/register
POST /api/logout
GET  /api/me
```

Existing student learning endpoints also remain available:

```text
GET  /api/student/dashboard
GET  /api/courses/:course/content
POST /api/student/courses/:course/modules/:moduleId/complete
POST /api/student/courses/:course/quiz/submit
```

## 3. Admin functionality

After Admin Login, the Admin Dashboard loads student records from the Mock API.

The Students section now supports:

- View students from API
- Add student
- Edit student
- Delete student
- Loading state
- Empty state
- API error messages
- Duplicate email validation
- Course validation
- Password validation

Adding or editing a student does not require changing frontend JavaScript data manually.

## 4. Student functionality

Existing student functionality continues to use the API:

- Registration → `POST /api/register`
- Login → `POST /api/login`
- Dashboard → `GET /api/student/dashboard`
- Course content → API
- Module completion → API
- Quiz submission → API
- Password reset → API
- Password change → API

The shared API/service layer is in:

```text
public/js/api.js
```

It contains:

- `apiRequest()` — common GET/POST/PUT/PATCH/DELETE request helper
- `studentApi` — student CRUD service methods
- `courseApi` — course catalog service
- loading/error/toast helpers

## 5. Demo accounts

### Student

| Email | Password |
|---|---|
| aarav@example.com | password123 |
| sneha@example.com | password123 |
| rahul@example.com | password123 |
| priya@example.com | password123 |
| meera@example.com | password123 |

### Admin

| Email | Password |
|---|---|
| admin@learnsphere.com | admin123 |

Admin registration invite code:

```text
LEARNSPHERE2026
```

## 6. How to test Admin CRUD

1. Start the project:

```bash
npm run dev
```

2. Open:

```text
http://localhost:5173/admin-login
```

3. Login with:

```text
Email: admin@learnsphere.com
Password: admin123
```

4. Open the **Registered Students** section.

### Add

Click **Add Student**, enter:

- Name
- Email
- Degree
- Year
- Course
- Password

Click **Save Student**.

The new record is sent to:

```text
POST /api/students
```

and written to:

```text
data/db.json
```

### Edit

Click the pencil icon for a student.

Change the details and click **Update Student**.

The frontend sends:

```text
PUT /api/students/:id
```

### Delete

Click the trash icon.

Confirm the browser prompt.

The frontend sends:

```text
DELETE /api/students/:id
```

The table and dashboard statistics refresh automatically.

## 7. How to test Student Register/Login

### Register

Open:

```text
http://localhost:5173/register
```

Fill the existing registration form and submit it.

The frontend sends:

```text
POST /api/register
```

The student is stored in `data/db.json`.

### Login

Open:

```text
http://localhost:5173/login
```

Use the newly registered credentials or the demo account.

The backend verifies the stored password hash and creates a session.

## 8. Error handling

The shared API layer handles network failures with a user-friendly message:

```text
Unable to connect to the Mock API. Make sure the backend is running.
```

The Admin student-management page also handles:

- Loading
- Empty student list
- Failed GET
- Failed create/update/delete
- Duplicate email
- Invalid course
- Invalid password
- Unauthorized admin access

## 9. Project structure

```text
learnsphere-app/
│
├── server.js
├── dev-server.js
├── vite.config.js
├── package.json
├── start.bat
├── start.sh
│
├── data/
│   ├── db.json
│   └── courseContent.json
│
└── public/
    ├── index.html
    ├── css/
    │   └── theme.css
    │
    ├── js/
    │   ├── api.js
    │   ├── admin-dashboard.js
    │   ├── admin-login.js
    │   ├── admin-register.js
    │   ├── login.js
    │   ├── register.js
    │   ├── student-dashboard.js
    │   ├── course-player.js
    │   ├── account-settings.js
    │   └── forgot-password.js
    │
    └── pages/
        ├── login.html
        ├── register.html
        ├── admin-login.html
        ├── admin-register.html
        ├── admin-dashboard.html
        ├── student-dashboard.html
        ├── course-player.html
        ├── account-settings.html
        └── forgot-password.html
```

## 10. Important data note

`data/db.json` is the local development database.

Because the app uses a JSON file rather than a real database:

- Data is easy to inspect and learn from.
- CRUD changes are written directly to the file.
- Restarting the server does not remove student records.
- Sessions are still in memory, so restarting the server logs users out.

For a production application, the JSON storage would normally be replaced by a database such as MySQL or PostgreSQL.

## Existing UI preserved

This update intentionally does **not** replace the LearnSphere frontend with React or introduce a large architecture.

The existing HTML/CSS/JavaScript pages, routing, authentication, course player, dashboard design and learning flow are retained. Only the API/service and Admin student-management pieces required for CRUD were extended.


## Task 8 — Express Backend

A separate Express REST API has been added in `backend/` to implement the Backend Server Creation task. It runs on port `5000` and includes health check, versioned course CRUD routes, validation, 404 handling, and global error handling. See [`backend/README.md`](backend/README.md) for setup and endpoint details.

First install the backend dependencies once:

```bash
cd backend
npm install
cd ..
```

Then run it from the project root in a second terminal:

```bash
npm run backend:dev
```

This is kept separate from the existing LearnSphere application server on port `3000` so the existing student login, admin dashboard, and learning functionality remain unchanged.


## Task 9 — Student Registration, Login, and Course Management APIs

The Express backend in `backend/` now includes:

- `POST /api/v1/auth/register` — validates student details and hashes passwords with `bcryptjs`.
- `POST /api/v1/auth/login` — checks credentials against the stored password hash.
- Existing versioned course CRUD endpoints at `/api/v1/courses`.
- Validation and correct HTTP error responses for invalid input, duplicate email, and incorrect credentials.
- `npm test` in `backend/` runs course service and authentication service checks.

### Run both parts of LearnSphere

Terminal 1 (project root, existing website and local API):

```bash
npm run dev
```

Open `http://localhost:5173`.

Terminal 2 (project root):

```bash
npm run backend:dev
```

The Task 9 Express API runs at `http://localhost:5000`. The registration/login UI calls this API and also maintains the existing LearnSphere session so the student dashboard and learning features continue to work.

Task 9's direct Express registration store is in-memory for this exercise. Task 10 now issues a JWT after successful login and verifies it for protected course-write operations. The login service also supports existing students in `data/db.json`, so the bundled demo student credentials work through the Express login endpoint.


## Task 10 — JWT and student course applications

- Start the existing LearnSphere app with `npm run dev` (port 3000).
- Start the Express API in a second terminal with `cd backend`, `npm install`, and `npm run dev` (port 5000).
- Backend login returns a JWT. Create `backend/.env` from `backend/.env.example` and keep your private `JWT_SECRET` there; never commit `.env`.
- `GET /api/v1/courses` and `GET /api/v1/courses/:id` are public. `POST`, `PUT`, `PATCH`, and `DELETE /api/v1/courses/:id` require `Authorization: Bearer <token>`.
- Existing seeded LearnSphere student accounts can log in through the Express API as well as Task 9 accounts. The original dashboard session remains active for the learning UI.
- Students can use **Apply for Courses** on their dashboard to enroll in more than one catalog course. Duplicate applications are rejected, while other courses can be applied for independently.

## Task 11 — Database schema and collections

Task 11 adds Mongoose schemas for User, Course, Enrollment, LearningProgress, Notification, and Message, plus the relationship diagram and field/index documentation in `docs/database-schema.md`. It also adds `MONGO_URI` configuration. This task defines the schema only; the Express server is not connected to MongoDB yet. Database connection and database-backed CRUD are reserved for Task 12.

From `learnsphere-app/backend`, run `npm install` and `npm run test:schemas` to validate required fields and important indexes without needing MongoDB running.


## Task 12 — MongoDB integration

The Express API now connects to MongoDB through Mongoose before listening on port `5000`. Student registration/login and course CRUD use MongoDB-backed services. Existing Task 10 JWT behavior and the original port-3000 JSON-backed LearnSphere dashboard/session/learning flow remain compatible and unchanged.

### Configure and run

1. Install and start MongoDB Community Server locally, or create a MongoDB Atlas database.
2. In `backend/`, copy `.env.example` to `.env` and set `MONGO_URI` (the local default is `mongodb://127.0.0.1:27017/learnsphere`). Keep your own `JWT_SECRET` in this private `.env` file.
3. Run `npm install`, then `npm test` for offline unit/schema tests.
4. Run `npm run dev`. The API starts only after MongoDB connects. The first startup seeds the two starter courses if the `courses` collection is empty.
5. Open `http://localhost:5000/api/health`; it should report `database: "connected"`.

For live database verification, run `npm run test:db` from `backend/`. This checks real MongoDB connection, course create/read/update, and student register/login, then removes its temporary records. More setup and endpoint details are in [`backend/README.md`](backend/README.md). The Enrollment, LearningProgress, Notification, and Message models remain ready for their feature workflows in later tasks.

## Task 13 — Real-Time Chat and Notifications

Task 13 adds authenticated Socket.IO direct messaging and persistent notifications to the existing vanilla HTML/CSS/JavaScript frontend (the project is not a React application, so the task's React examples are implemented in the existing frontend architecture).

### Install dependencies

Run these commands from the project root:

```bash
npm install
cd backend
npm install
```

### Environment

Keep `backend/.env` local and never commit it. Copy `backend/.env.example` to `backend/.env` if needed and set a private `JWT_SECRET`, your MongoDB URI, and `CLIENT_URL=http://localhost:5173`.

### Run

Terminal 1 — backend:

```bash
cd backend
npm run dev
```

Terminal 2 — frontend:

```bash
cd ..
npm run frontend
```

Open `http://localhost:5173`, log in as a student, and open the Student Dashboard. The dashboard contains Chat and Notifications sections. Socket connection status is shown in the Chat panel.

### Two-student test (Activity 13.11)

1. Register or use two different student accounts.
2. Log in as Student A in one browser profile and Student B in another.
3. In each dashboard, note the displayed **Your student ID**. Enter Student B's ID in Student A's Recipient field, and vice versa.
4. Click **Load Chat History**, then send a message from A to B.
5. Verify B receives the message without refreshing and gets a notification.
6. Click **Mark as read** on B's notification.
7. Refresh both dashboards and load the same conversation to verify persisted history.
8. Log out or close one dashboard and verify its socket status changes to Disconnected. Unauthenticated socket rejection is also covered by the socket authentication test.

### API endpoints

- `GET /api/v1/messages/:userId` — authenticated conversation history (latest 100, chronological response).
- `GET /api/v1/notifications` — authenticated user's latest 50 notifications.
- `PATCH /api/v1/notifications/:id/read` — mark only the signed-in recipient's notification as read.

Socket events: client emits `send_message`; server emits `receive_message` to sender and recipient, and `new_notification` to the recipient. The sender identity is always taken from the authenticated socket, never from client input.

### Notes

- Existing `Message` and `Notification` Mongoose models are reused; no duplicate collections/models are introduced.
- The frontend uses `socket.io-client` through Vite and reads the existing `sessionStorage` JWT token.
- Do not share `.env` or JWT tokens. `node_modules` is intentionally excluded from the ZIP; `npm install` restores dependencies.

\n### Legacy student account compatibility (Task 13 fix)
Students who originally existed only in `data/db.json` (IDs such as `stu_001`)
are automatically migrated into MongoDB when they successfully log in. Their
password is re-hashed with bcrypt, and subsequent JWTs use the MongoDB ObjectId.
This is required because Task 11 Message and Notification schemas reference
MongoDB User documents. The original legacy JSON data is not deleted.
