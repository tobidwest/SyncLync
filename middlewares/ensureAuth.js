// Simple middleware that ensures the user is authenticated

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.sendStatus(401);
}
module.exports = ensureAuth;
