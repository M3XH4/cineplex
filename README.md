# CinePlex

CinePlex is a MERN-based Cinema Management and Movie Recommendation Web System that helps cinema staff manage movies, schedules, seats, bookings, payments, and reports while giving customers a personalized movie discovery and ticket-booking experience.

Deployment docs are in [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) and the pre-deployment checklist is in [docs/PRE_DEPLOYMENT_CHECKLIST.md](docs/PRE_DEPLOYMENT_CHECKLIST.md).

The system combines cinema operations management with a recommendation engine that suggests movies based on user preferences, genres, ratings, watch history, trending films, and similar movie data.

## How to Run Locally

Requirements:

- Node.js and npm
- MongoDB running locally, or a MongoDB Atlas connection string

Backend:

```powershell
cd backend
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Backend health check: `http://localhost:5000/health`

Seeded accounts:

- Admin: `admin@cineplex.com` / `admin123`
- Staff: `staff@cineplex.com` / `staff123`
- Customer: `user@gmail.com` / `user123`

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by the script execution policy.

Recommended Tech Stack

Frontend

React.js
Vite
Tailwind CSS or Material UI
Redux Toolkit / Zustand
React Router
Axios
Framer Motion for animations

Backend

Node.js
Express.js
MongoDB
Mongoose
JWT authentication
Bcrypt for password hashing
Multer or Cloudinary for posters/images
Socket.IO for real-time seat updates

Database

MongoDB Atlas

Deployment

Frontend: Vercel or Netlify
Backend: Render, Railway, or AWS
Database: MongoDB Atlas
Media storage: Cloudinary
Movie Recommendation APIs

Use TMDB API as the main API because it provides movie details, posters, cast, genres, trending movies, search, and movie recommendations. TMDB has an official movie recommendation endpoint.

Other possible APIs:

OMDb API for IMDb-like movie metadata, ratings, plot, year, and poster data.
Watchmode API if you want streaming availability from Netflix, Disney+, Prime Video, and other services.
TasteDive API for similar movie recommendations based on user input.

Best setup: use TMDB API + your own recommendation logic.

Best Features
Customer Side
User registration and login
Browse now showing and upcoming movies
View movie details, trailer, cast, genre, duration, rating
Recommended movies based on:
liked movies
booking history
favorite genres
trending movies
similar movies from TMDB
Seat selection with real-time availability
Online ticket booking
Booking history
QR code ticket generation
Email confirmation
Movie reviews and ratings
Search and filter by genre, date, rating, language, or cinema branch
Admin Side
Admin dashboard
Add, update, and remove movies
Manage screening schedules
Manage cinema rooms and seat layouts
Monitor bookings and revenue
Manage users
View analytics:
most booked movies
peak booking hours
total revenue
occupancy rate
Cancel or reschedule screenings
Generate reports
Recommendation Logic

A practical recommendation flow:

Get user preferences from registration or profile.
Track user activity:
viewed movies
booked movies
liked movies
searched genres
Fetch similar movies from TMDB.
Rank recommendations using:
genre match
popularity
rating
release date
user history
Store recommended movie IDs in MongoDB for faster loading.

Example recommendation score:

score =
  genreMatch * 40 +
  userLikedActor * 15 +
  popularity * 20 +
  rating * 15 +
  recentRelease * 10
Suggested System Modules
Authentication Module
User Management Module
Movie Management Module
Cinema Room Management Module
Schedule Management Module
Booking and Seat Reservation Module
Payment Module
Recommendation Module
Review and Rating Module
Admin Analytics Module
Notification Module
Database Collections

Recommended MongoDB collections:

users
movies
cinemas
screeningSchedules
bookings
seats
payments
reviews
recommendations
notifications
How to Deliver the System Properly

Deliver it in phases:

Phase 1: Core Setup

Set up MERN project structure.
Build authentication.
Create admin and customer roles.

Phase 2: Movie and Schedule Management

Admin can manage movies, cinemas, rooms, and schedules.
Customer can browse movie listings.

Phase 3: Booking System

Seat selection.
Real-time seat locking using Socket.IO.
Booking confirmation.
QR ticket generation.

Phase 4: Recommendation System

Integrate TMDB API.
Build user preference tracking.
Add personalized recommendations.

Phase 5: Admin Dashboard

Revenue reports.
Booking analytics.
Movie performance charts.

Phase 6: Testing and Deployment

Test API endpoints with Postman.
Add validation and error handling.
Deploy frontend, backend, and database.
Prepare documentation and user manual.
