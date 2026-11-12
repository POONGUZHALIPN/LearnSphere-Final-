# LearnSphere — Final Deployment Guide

This version uses **one MongoDB-backed Express API** for the existing LearnSphere UI, Task 9–14 authentication, courses, chat and notifications. The old root `server.js` JSON demo server is retained for reference but is no longer started by `npm run dev` and is not required for deployment.

## Architecture

- Frontend: Vercel (`public/dist`)
- Backend: existing Render service, with Render Root Directory set to `backend`
- Database: existing MongoDB Atlas database, configured through the Render `MONGO_URI` environment variable
- Authentication: JWT Bearer token from `/api/v1/auth`
- Frontend API URLs: `public/js/config.js`

## Local setup

1. Copy your existing `backend/.env` from your current project folder into the extracted project at `backend/.env`. This preserves your Atlas URI and JWT secret. If you still have the old folder, do not recreate or rotate those values. The `.env` file is intentionally not included in the ZIP.
2. From the project root, install both frontend and backend packages:

   ```bash
   npm run setup
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

   The Express API starts on `http://localhost:5000` and Vite starts on `http://localhost:5173`. The backend reads `backend/.env`.

4. Open `http://localhost:5173`.

If the combined command does not start on your machine, start the backend in one terminal with `cd backend && npm run dev`, then start the frontend in a second terminal from the project root with `npm run frontend`.

## Existing Render service — do not create another one

Keep the existing Render service that runs the MongoDB-backed Express backend.

Confirm these settings:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Required Render environment variables:

- `MONGO_URI`: your existing MongoDB Atlas connection string
- `JWT_SECRET`: your existing long random secret
- `JWT_EXPIRES_IN`: `1h` (or your existing value)
- `NODE_ENV`: `production`
- `CLIENT_URL`: `https://learn-sphere-final-phi.vercel.app`
- `ADMIN_INVITE_CODE`: a private invite code you choose

Do not paste any secret values into chat or commit them to GitHub. If `CLIENT_URL` already contains the Vercel production domain, keep it. You can include the localhost origin too, comma-separated, if you still want local browser testing.

## Existing Vercel project — do not create another one

Keep the existing Vercel project and production domain.

Confirm:

- Root Directory: `./`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `public/dist`
- Install Command: `npm install`

The browser API URLs are read from `public/js/config.js`; the production URL in that file already points to the existing Render service URL supplied for this project. Keep the existing `VITE_SOCKET_URL` variable set to the same Render base URL so Socket.IO chat connects. The older `VITE_API_URL` variable can remain; the shared classic JavaScript now reads `config.js`.

## Deploy the modified project to the same GitHub repository

The supplied ZIP contains the existing `.git` folder and remote configuration. Extract it to a new folder, then:

```bash
git status
git add .
git commit -m "Unify LearnSphere frontend APIs with MongoDB backend"
git push origin main
```

If Git reports that there is nothing to commit, check `git status`; do not force-push. Pushing to the existing `main` branch triggers the existing Vercel and Render deployments.

## After deployment — test in this order

1. Render `/api/health` should return `success: true` and `database: "connected"`.
2. Vercel `/login` and `/admin-login` should load.
3. Register a test student using a password of at least 12 characters, then log in.
4. Check student dashboard, course catalog, course application, module completion and quiz.
5. Check admin login, admin overview, student list, add/edit/delete student.
6. Check chat/notifications if enabled.

## Existing account compatibility

The backend can migrate existing student and admin accounts from the project's `data/db.json` to MongoDB on their first successful login. It does not copy password hashes into API responses. Once migrated, the MongoDB account is used.

The admin registration invite code defaults to the project's previous demo code only when `ADMIN_INVITE_CODE` is not set. Set your own private value in Render before allowing admin registration.

## Important

- Do not reconnect Atlas or create a new database. Keep the current `MONGO_URI`.
- Do not create a new GitHub repository. Push to the existing remote.
- Do not create a new Vercel project. Use the existing project and domain.
- Never commit `backend/.env`.
