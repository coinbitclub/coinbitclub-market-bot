export function validateHeaderToken(secretEnvVar) {
  return (req, res, next) => {
    const token = req.headers['x-webhook-secret'];
    if (!token || token !== process.env[secretEnvVar]) {
      return res.status(401).json({ error: 'Invalid webhook token' });
    }
    next();
  };
}
