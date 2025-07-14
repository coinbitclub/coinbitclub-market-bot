// common/security.js
/**
 * Middleware que valida header x-webhook-secret.
 * @param {string} secretEnvVar - nome da variável de ambiente com o token esperado.
 */
export function validateHeaderToken(secretEnvVar) {
  return (req, res, next) => {
    const token = req.headers['x-webhook-secret'];
    if (!token || token !== process.env[secretEnvVar]) {
      return res.status(401).json({ error: 'Invalid webhook token' });
    }
    return next();
  };
}