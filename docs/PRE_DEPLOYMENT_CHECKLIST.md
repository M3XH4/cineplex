# CinePlex Pre-Deployment Checklist

Use this checklist before deploying CinePlex to Vercel, Render, Railway, or any other production host.

## Functional Checks

- Verify all frontend routes work: `/`, `/movie/:id`, `/search`, `/login`, `/register`, `/booking/:showtimeId`, `/checkout/:bookingId`, `/profile`, and `/admin`.
- Verify all backend API endpoints work in Postman or Insomnia.
- Test login, register, logout, refresh-token flow, and protected routes.
- Test customer access and admin/staff access separately.
- Test movie browsing, search, filters, and personalized recommendations.
- Test booking flow, seat selection, seat locking, checkout, QR ticket generation, and booking history.
- Test admin movie CRUD, showtime CRUD, cinema/room management, and analytics.
- Test responsive design on desktop, tablet, and mobile breakpoints.

## Code Cleanup

- Remove leftover `console.log`, `console.warn`, and debug-only `console.error` calls that are not needed in production.
- Remove unused files, unused imports, and dead code paths.
- Fix broken buttons, dead links, and missing pages.
- Add loading, error, and empty states where users can otherwise see a blank screen.

## Security and Production Readiness

- Validate all environment variables before starting the app.
- Keep API keys and secrets out of source control.
- Use MongoDB Atlas for production data.
- Use Cloudinary for production media uploads and delivery.
- Enable CORS only for the deployed frontend URL.
- Keep cookies and tokens secure with `httpOnly`, `secure`, and `sameSite` settings.
- Add rate limiting, Helmet, and request validation.
- Confirm file uploads, image URLs, and other assets are production-safe and optimized.

## Build and Deployment Checks

- Run the production frontend build.
- Start the backend in production mode locally.
- Preview the frontend production build locally.
- Confirm the frontend can reach the deployed backend API URL.
- Confirm the deployed backend can reach MongoDB Atlas, Cloudinary, Stripe, and email services.
- Confirm the app works over HTTPS in production.

## Quick Local Verification Commands

```powershell
cd backend
npm.cmd start
```

```powershell
cd frontend
npm.cmd run build
npm.cmd run preview
```
