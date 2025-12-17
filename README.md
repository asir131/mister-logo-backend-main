
# Mister Logo Backend

Express.js backend with email OTP verification, JWT access tokens, and refresh tokens.

## Setup

Create a `.env` file with:
```
PORT=5000
JWT_SECRET=safsdfgasefasfasfsaf
JWT_EXPIRES_IN=1h
MONGODB_URI=mongodb+srv://afaysal220:Faysal20122@blinkit.typzf.mongodb.net/mister

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=afaysal220@gmail.com
EMAIL_PASS=npzp eabo veuk tnlr
EMAIL_FROM=afaysal220@gmail.com
```

Install and run:
```
npm install
npm run dev   # dev with nodemon
# or
npm start     # production
```

## Routes

- `POST /api/auth/register` — body: `{ name, email, phoneNumber, password, confirmPassword }`. Sends a 5-digit OTP to the email.
- `POST /api/auth/verify-otp` — body: `{ email, otp }`. Completes registration, returns access token, refresh token, and user (no password hash).
- `POST /api/auth/login` — body: `{ email?, phoneNumber?, password }`. Email or phone is required. Returns access token, refresh token, and user.
- `POST /api/auth/refresh` — body: `{ refreshToken }`. Rotates refresh token and returns new access+refresh tokens and user.
- `POST /api/auth/forgot-password` — body: `{ email }`. Sends a 5-digit OTP to email if the account exists.
- `POST /api/auth/verify-reset-otp` — body: `{ email, otp }`. Verifies reset OTP and returns a short-lived reset token.
- `POST /api/auth/reset-password` — headers: `x-reset-token`, body: `{ newPassword, confirmPassword }`. Verifies reset token and updates password, returning new access+refresh tokens and user.

## Notes

- OTPs expire after 10 minutes and are stored in MongoDB with a TTL index.
- Users persist in MongoDB (`MONGODB_URI`).
- Refresh tokens are opaque, stored hashed in MongoDB, and rotated on each refresh.
