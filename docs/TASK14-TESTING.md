# LearnSphere Task 14 — Test Checklist

## 1. Install and run

1. Open a terminal in `learnsphere-app/backend`.
2. Copy `.env.example` to `.env` and set `MONGO_URI`, a private random `JWT_SECRET`, and `CLIENT_URL` to your actual frontend origin.
3. Run `npm install`, then `npm test`, then `npm run dev`.
4. Keep the MongoDB service/Atlas cluster running.

## 2. Basic checks

- `GET http://localhost:5000/` should return HTTP 200.
- `GET http://localhost:5000/api/health` should return HTTP 200 when MongoDB is connected.
- Send an API request from the configured frontend origin; it should pass CORS. Try a different browser origin; it should be blocked. Postman requests without an Origin header are allowed for API testing.
- Inspect response headers; Helmet security headers should be present.
- Inspect the backend terminal; Morgan should log HTTP method, path, status, and response time.
- Open the Chat area after login. The Socket.IO polling handshake must be served by the same port-5000 HTTP server; the browser status should show `Connected`, not `xhr poll error`.
- Open two student sessions and verify live message delivery, persisted history, notification delivery, and mark-as-read still work after Task 14 security changes.

## 3. Authentication and validation (Postman)

Use `POST http://localhost:5000/api/v1/auth/register` with JSON body:

```json
{ "name": "Test Student", "email": "test.student@example.com", "password": "LearnSecure123", "department": "Computer Science" }
```

Expected: HTTP 201. Repeat with the same email: HTTP 409. Try invalid email, missing name/department, or a password shorter than 12 characters: HTTP 400. Login with a wrong password: HTTP 401. A successful login returns a JWT.

Send 11 failed login requests within 15 minutes from the same client IP. The request exceeding the configured limit should return HTTP 429. The limiter is per-process by default; multi-instance production deployments should use a shared store.

## 4. Protected route checks

- Call a protected messages/notifications endpoint without a token: HTTP 401.
- Call with an invalid or expired token: HTTP 401.
- Use a student JWT to call `POST`, `PUT`, `PATCH`, or `DELETE /api/v1/courses`: HTTP 403.
- Use an admin JWT for course management. Since public registration creates student accounts only, use an explicitly provisioned test admin account for this check.
- The existing JSON-backed admin student CRUD endpoints on port 3000 remain admin-session protected. Verify a student session cannot call `PUT` or `PATCH /api/students/:id`; valid admin updates must still pass field validation.
- Use an invalid MongoDB ID in a course, message-history, or notification-read route: HTTP 400.
- Call an unknown API path: HTTP 404.

## 5. Password and data checks

Inspect the registered user's `password` field in MongoDB. It must be a bcrypt hash (not the original password). Never copy real passwords, JWTs, MongoDB credentials, or request bodies into logs or screenshots.

## 6. Error handling and shutdown

- Send malformed JSON and expect HTTP 400.
- Send a JSON body larger than 1 MB and expect HTTP 413.
- Press Ctrl+C while the backend is running. It should close the HTTP server and MongoDB connection cleanly.
- Restart with MongoDB unavailable to verify startup fails with a clear server-side message.

## 7. Final evidence

Capture Postman status codes, the health endpoint, Helmet response headers, rate-limit response, hashed password field (mask user data), Morgan request log, and clean Ctrl+C shutdown. Do not claim production deployment tests have passed unless they were actually run.
