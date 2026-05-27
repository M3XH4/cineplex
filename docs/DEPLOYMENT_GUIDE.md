# CinePlex Deployment Guide

This guide shows how to deploy CinePlex as a MERN stack app with Vercel for the frontend, Render or Railway for the backend, MongoDB Atlas for the database, and Cloudinary for media.

## 1. Push The Code To GitHub

1. Create a new repository on GitHub.
2. In the project root, commit your current changes.
3. Push the `backend`, `frontend`, and shared docs to GitHub.
4. Make sure `.env` files are not committed. Only commit `.env.example` files.

Example commands:

```powershell
git status
git add .
git commit -m "Prepare CinePlex for production deployment"
git push origin main
```

## 2. Configure MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Add your deployment IP address or allow access from anywhere during setup.
4. Copy the connection string and set it as `MONGO_URI` in the backend environment variables.
5. Use a database name such as `cineplex`.

## 3. Configure Cloudinary

1. Create a Cloudinary account.
2. Get your `cloud name`, `API key`, and `API secret`.
3. Add those values to the backend environment variables.
4. Store uploaded movie posters and cinema images in Cloudinary instead of local disk.

## 4. Deploy The Backend On Render

1. Create a new Render Web Service.
2. Connect your GitHub repository.
3. Select the backend folder as the root directory if Render asks for one.
4. Use these values:
   - Build command: `npm install`
   - Start command: `npm start`
5. Add the backend environment variables from `backend/.env.example`.
6. Set `NODE_ENV=production`.
7. Set `CLIENT_URL` to your Vercel frontend URL.
8. Deploy the service.

## 5. Deploy The Backend On Railway

1. Create a new Railway project.
2. Connect the GitHub repository.
3. Add the backend folder as the service source if needed.
4. Set the start command to `npm start`.
5. Add the backend environment variables from `backend/.env.example`.
6. Set `NODE_ENV=production`.
7. Set `CLIENT_URL` to your Vercel frontend URL.
8. Deploy and copy the public backend URL.

## 6. Deploy The Frontend On Vercel

1. Create a new Vercel project.
2. Import the same GitHub repository.
3. Set the project root to the `frontend` folder.
4. Use these settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add the frontend environment variables from `frontend/.env.example`.
6. Set `VITE_API_URL` to the deployed backend API URL, for example `https://your-backend.onrender.com/api`.
7. Set `VITE_TMDB_IMAGE_BASE_URL` if your image source changes.
8. Deploy the project.

## 7. Connect Frontend To Backend

1. Copy the final backend URL from Render or Railway.
2. Update the frontend `VITE_API_URL` value in Vercel.
3. Update the backend `CLIENT_URL` value so CORS only allows the deployed frontend URL.
4. Re-deploy both services after environment changes.
5. Confirm the browser can load login, register, search, booking, and admin pages without CORS errors.

## 8. Add Environment Variables

Backend environment variables:

- `PORT`
- `NODE_ENV`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_URL`
- `TMDB_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `STRIPE_SECRET_KEY`
- `EMAIL_USER`
- `EMAIL_PASS`

Frontend environment variables:

- `VITE_API_URL`
- `VITE_TMDB_IMAGE_BASE_URL`
- `VITE_STRIPE_PUBLIC_KEY`
- `VITE_SOCKET_URL` (optional, but useful if the websocket host differs from the API host)

## 9. Test The Deployed App

1. Open the Vercel frontend URL.
2. Confirm the home page loads movie listings.
3. Register a new customer account.
4. Log in and confirm protected routes work.
5. Open a movie detail page and verify showtimes.
6. Test booking, seat locking, checkout, and ticket history.
7. Log in with an admin account and test admin pages.
8. Hit the backend `/health` endpoint directly and confirm the response is healthy.

## 10. Local Production Test Commands

Backend:

```powershell
cd backend
npm.cmd start
```

Frontend:

```powershell
cd frontend
npm.cmd run build
npm.cmd run preview
```

## Troubleshooting

- If login fails in production, verify `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CLIENT_URL`.
- If the frontend cannot reach the API, verify `VITE_API_URL` and backend CORS.
- If seat locking does not sync, verify the Socket.IO URL and that WebSocket traffic is allowed by the host.
- If images do not load, verify the Cloudinary URLs and TMDB image base URL.
- If bookings fail, verify MongoDB Atlas connectivity and the production database user.
- If deployed auth cookies are not set, verify `NODE_ENV=production`, HTTPS, and the cookie `sameSite`/`secure` settings.
