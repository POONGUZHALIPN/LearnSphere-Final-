# LearnSphere — Final Deployment Guide

This version uses **one MongoDB-backed Express API** for the existing LearnSphere UI, Task 9–14 authentication, courses, chat and notifications. The old root `server.js` JSON demo server is retained for reference but is no longer started by `npm run dev` and is not required for deployment.

## Architecture

- **Frontend:** Vercel (`public/dist`)
- **Backend:** Existing Render service, with Render Root Directory set to `backend`
- **Database:** Existing MongoDB Atlas database, configured through the Render `MONGO_URI` environment variable
- **Authentication:** JWT Bearer token from `/api/v1/auth`
- **Frontend API URLs:** `public/js/config.js`

## Local Setup

### 1. Restore the environment file

Copy your existing `backend/.env` from your current project folder into the extracted project at `backend/.env`.

This preserves your existing MongoDB Atlas URI and JWT secret. If you still have the old project folder, do not recreate or rotate those values.

The `.env` file is intentionally not included in the project ZIP.

### 2. Install dependencies

From the project root, run:

```bash
npm run setup
```

This installs the frontend and backend packages.

### 3. Start the application

From the project root, run:

```bash
npm run dev
```

The application starts:

- Express API: `http://localhost:5000`
- Vite frontend: `http://localhost:5173`

The backend reads its environment variables from `backend/.env`.

### 4. Open the application

Open:

`http://localhost:5173`

If the combined command does not start on your machine, start the backend in one terminal:

```bash
cd backend
npm run dev
```

Then start the frontend in a second terminal from the project root:

```bash
npm run frontend
```

## Existing Render Service — Do Not Create Another One

Keep the existing Render service that runs the MongoDB-backed Express backend.

Confirm these settings:

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

### Required Render Environment Variables

- `MONGO_URI` — Your existing MongoDB Atlas connection string
- `JWT_SECRET` — Your existing long random secret
- `JWT_EXPIRES_IN` — `1h` or your existing value
- `NODE_ENV` — `production`
- `CLIENT_URL` — `https://learn-sphere-final-phi.vercel.app`
- `ADMIN_INVITE_CODE` — A private invite code you choose

Do not paste secret values into chat or commit them to GitHub.

If `CLIENT_URL` already contains the Vercel production domain, keep it. You can include the localhost origin too, comma-separated, if you still want local browser testing.

## Existing Vercel Project — Do Not Create Another One

Keep the existing Vercel project and production domain.

Confirm these settings:

- **Root Directory:** `./`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `public/dist`
- **Install Command:** `npm install`

The browser API URLs are read from `public/js/config.js`. The production URL in that file points to the existing Render service URL supplied for this project.

Keep the existing `VITE_SOCKET_URL` variable set to the same Render base URL so Socket.IO chat connects.

The older `VITE_API_URL` variable can remain; the shared classic JavaScript now reads `config.js`.

## Deploy the Modified Project to the Same GitHub Repository

The project uses the existing GitHub repository and remote configuration.

From the project root, run:

```bash
git status
git add .
git commit -m "Update LearnSphere deployment documentation"
git push origin main
```

If Git reports that there is nothing to commit, check `git status`.

Do not force-push.

Pushing to the existing `main` branch triggers the existing Vercel and Render deployments.

## After Deployment — Testing Checklist

Test the application in this order:

1. Open the Render `/api/health` endpoint. It should return `success: true` and `database: "connected"`.
2. Open the Vercel `/login` and `/admin-login` pages.
3. Register a test student using a password of at least 12 characters, then log in.
4. Check the student dashboard, course catalog, course application, module completion and quiz.
5. Check admin login, admin overview, student list, and add/edit/delete student functionality.
6. Check chat and notifications if enabled.

## Existing Account Compatibility

The backend can migrate existing student and admin accounts from the project's `data/db.json` to MongoDB on their first successful login.

It does not copy password hashes into API responses. Once migrated, the MongoDB account is used.

The admin registration invite code defaults to the project's previous demo code only when `ADMIN_INVITE_CODE` is not set.

Set your own private value in Render before allowing admin registration.

## Important Notes

- Do not reconnect Atlas or create a new database. Keep the current `MONGO_URI`.
- Do not create a new GitHub repository. Push to the existing remote.
- Do not create a new Vercel project. Use the existing project and domain.
- Never commit `backend/.env`.
- Never share database credentials, JWT secrets, or private invite codes.
- Keep the existing deployment URLs and service configurations.

## Deployment Status

**LearnSphere deployment completed.**

The frontend is hosted on Vercel, the Express backend is hosted on Render, and the application uses the existing MongoDB Atlas database.

### Project Links

- **GitHub Repository:** https://github.com/POONGUZHALIPN/LearnSphere-Final-
- **Live Frontend:** https://learn-sphere-final-phi.vercel.app
- **Backend Health Check:** https://learnsphere-backend-ua33.onrender.com/api/health
