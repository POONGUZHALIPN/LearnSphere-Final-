# LearnSphere – Full-Stack Learning Management System

LearnSphere is a full-stack online learning platform designed for students and administrators. It provides student registration, authentication, course enrollment, learning progress tracking, quizzes, real-time messaging, and notifications.

## Live Application

- **Frontend:** https://learn-sphere-final-phi.vercel.app
- **Backend API:** https://learnsphere-backend-ua33.onrender.com
- **Backend Health Check:** https://learnsphere-backend-ua33.onrender.com/api/health

## Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap
- Vite

### Backend
- Node.js
- Express.js
- REST API
- Socket.IO
- JWT Authentication
- bcryptjs

### Database
- MongoDB
- MongoDB Atlas
- Mongoose

### Deployment and Development Tools
- Git and GitHub
- Render
- Vercel
- Visual Studio Code
- MongoDB Compass

## Main Features

### Student Features
- Student registration and login
- Secure password authentication
- Student dashboard
- Browse and apply for multiple courses
- Access course learning content
- Track module completion and learning progress
- Attempt quizzes and view results
- Real-time messaging
- Notifications
- Account and password management

### Admin Features
- Admin registration and login
- Admin dashboard
- Manage student records
- Add, edit, view, and delete students
- Manage and view course information
- Monitor student and course-related information

### Backend Features
- RESTful API integration
- MongoDB database connectivity
- JWT-based authentication
- Password hashing
- Course and student data management
- Real-time messaging using Socket.IO
- Persistent notifications
- API health check and error handling

## Project Architecture

The application follows a frontend-backend-database architecture.

1. **Frontend:** Provides the student and admin user interfaces.
2. **Backend:** Handles authentication, API requests, business logic, and real-time communication.
3. **Database:** MongoDB stores application data such as users, courses, enrollments, progress, messages, and notifications.

## Project Structure

```text
LearnSphere/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── public/
│   ├── css/
│   ├── js/
│   ├── pages/
│   └── index.html
│
├── docs/
├── package.json
├── vite.config.js
└── README.md
```

## Run the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/POONGUZHALIPN/LearnSphere-Final-.git
cd LearnSphere-Final-
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Configure environment variables

Create a private `.env` file inside the `backend/` directory using `.env.example` as a reference.

Configure the required values, including:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`

Use your own local or authorized MongoDB connection details. Never upload `.env` or expose database credentials and secret keys on GitHub.

### 5. Start the backend

From the `backend/` directory:

```bash
npm run dev
```

### 6. Start the frontend

Open another terminal in the project root:

```bash
npm run frontend
```

Open the local frontend URL displayed by the development server.

## Testing

Backend tests can be executed from the `backend/` directory:

```bash
npm test
```

Database integration tests, when configured with a test database:

```bash
npm run test:db
```

Health check:

```text
GET /api/health
```

## Deployment

The application is deployed using:

- **GitHub:** Source code repository and version control
- **Render:** Backend API hosting
- **MongoDB Atlas:** Cloud database
- **Vercel:** Frontend hosting

The deployed frontend communicates with the Render backend API, which connects to MongoDB Atlas.

## Security Notes

- Passwords are stored as hashes rather than plain text.
- JWT is used for authentication.
- Environment variables are used for private configuration.
- Never commit `.env` files, database passwords, or authentication secrets to GitHub.

## Project Status

**Deployment Status: Completed**

LearnSphere has been deployed and tested with its frontend, backend, and MongoDB database integration.

## Author

LearnSphere – Full-Stack Learning Platform Project
