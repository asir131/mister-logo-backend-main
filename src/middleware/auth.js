const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.sub) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    req.user = { id: decoded.sub };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
