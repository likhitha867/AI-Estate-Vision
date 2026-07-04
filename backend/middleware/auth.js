// backend/middleware/auth.js
module.exports = (req, res, next) => {
  // Authentication disabled: bypass check and supply a guest user payload
  req.user = { id: '60c72b2f9b1d8e2568cfef77', email: 'guest@aiestatevision.com' };
  next();
};
