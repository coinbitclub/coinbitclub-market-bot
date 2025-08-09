
/**
 * Middleware para verificar IP autorizado em produção
 * IP fixo Railway: 132.255.160.140
 */
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.headers['x-forwarded-for'] ||
                   req.headers['x-real-ip'];
  
  const authorizedIPs = [
    '132.255.160.140',        // Railway IP fixo
    '127.0.0.1',           // Local development
    'localhost',           // Local development
    '::1',                 // IPv6 localhost
    process.env.ADMIN_IP   // Admin IP adicional
  ];
  
  // Log do IP para debug
  console.log(`🔍 IP Request: ${clientIP}`);
  
  // Em produção, verificar whitelist
  if (process.env.NODE_ENV === 'production') {
    const isAuthorized = authorizedIPs.some(ip => 
      ip && (clientIP === ip || clientIP.includes(ip))
    );
    
    if (!isAuthorized) {
      console.error(`🚫 IP não autorizado: ${clientIP}`);
      return res.status(403).json({
        error: 'IP_NOT_ALLOWED',
        message: 'Seu IP não está autorizado para operações de trading',
        ip: clientIP,
        authorized_ips: authorizedIPs.filter(ip => ip),
        timestamp: new Date().toISOString()
      });
    }
  }
  
  console.log(`✅ IP autorizado: ${clientIP}`);
  next();
};

module.exports = ipWhitelist;
