const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const {
  register,
  verifyOtp,
  login,
  refresh,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  facebookAuthSuccess,
} = require('../controllers/authController');
const { isFacebookConfigured } = require('../config/passport');

const router = express.Router();

function ensureFacebookConfigured(req, res, next) {
  if (!isFacebookConfigured) {
    return res.status(500).json({ error: 'Facebook auth is not configured.' });
  }
  return next();
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords must match'),
  ],
  register,
);

router.post(
  '/verify-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp')
      .trim()
      .isLength({ min: 5, max: 5 })
      .withMessage('OTP must be 5 digits'),
  ],
  verifyOtp,
);

router.post(
  '/login',
  [
    body('email')
      .optional({ nullable: true })
      .isEmail()
      .withMessage('Email must be valid'),
    body('phoneNumber')
      .optional({ nullable: true })
      .isString()
      .withMessage('Phone number must be a string'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password is required'),
  ],
  login,
);

router.post(
  '/refresh',
  [body('refreshToken').trim().notEmpty().withMessage('Refresh token is required')],
  refresh,
);

router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Valid email is required')],
  forgotPassword,
);

router.post(
  '/verify-reset-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp')
      .trim()
      .isLength({ min: 5, max: 5 })
      .withMessage('OTP must be 5 digits'),
  ],
  verifyResetOtp,
);

router.post(
  '/reset-password',
  [
    body('resetToken')
      .optional({ nullable: true })
      .custom((value, { req }) => {
        if (req.headers['x-reset-token']) return true;
        if (value) return true;
        throw new Error('Reset token is required in header x-reset-token');
      }),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords must match'),
  ],
  resetPassword,
);

router.get(
  '/facebook',
  ensureFacebookConfigured,
  passport.authenticate('facebook', { scope: ['email'] }),
);

router.get('/facebook/callback', ensureFacebookConfigured, (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res
        .status(401)
        .json({ error: info?.message || 'Facebook login failed.' });
    }
    req.user = user;
    return facebookAuthSuccess(req, res);
  })(req, res, next);
});

module.exports = router;
