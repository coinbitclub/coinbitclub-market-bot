import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'coinbitclub-super-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  subscriptionStatus: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// Gerar token de acesso
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const secret = process.env.JWT_SECRET || 'coinbitclub-super-secret-key-2025';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    // @ts-ignore - ignorando erro de tipagem temporário
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    throw error;
  }
};

// Gerar refresh token
export const generateRefreshToken = (userId: string, tokenVersion: number = 1): string => {
  try {
    const secret = process.env.JWT_SECRET || 'coinbitclub-super-secret-key-2025';
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
    
    // @ts-ignore - ignorando erro de tipagem temporário
    return jwt.sign({ userId, tokenVersion }, secret, { expiresIn });
  } catch (error) {
    console.error('Erro ao gerar refresh token:', error);
    throw error;
  }
};

// Verificar token de acesso
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string, {
      issuer: 'coinbitclub',
      audience: 'coinbitclub-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    } else {
      throw new Error('Erro ao verificar token');
    }
  }
};

// Verificar refresh token
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string, {
      issuer: 'coinbitclub',
      audience: 'coinbitclub-refresh'
    }) as RefreshTokenPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido');
    } else {
      throw new Error('Erro ao verificar refresh token');
    }
  }
};

// Extrair token do header Authorization
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Middleware para verificar autenticação
export const authenticateRequest = (req: NextApiRequest): JWTPayload => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    throw new Error('Token de acesso não fornecido');
  }
  
  return verifyAccessToken(token);
};

// Middleware para verificar se é admin
export const requireAdmin = (req: NextApiRequest): JWTPayload => {
  const payload = authenticateRequest(req);
  
  if (!payload.isAdmin) {
    throw new Error('Acesso negado. Privilégios de administrador necessários.');
  }
  
  return payload;
};

// Gerar par de tokens (access + refresh)
export const generateTokenPair = (user: {
  id: string;
  email: string;
  isAdmin: boolean;
  subscriptionStatus: string;
}, tokenVersion: number = 1) => {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    subscriptionStatus: user.subscriptionStatus
  });
  
  const refreshToken = generateRefreshToken(user.id, tokenVersion);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN
  };
};

// Decodificar token sem verificar (para obter payload)
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Verificar se token está próximo do vencimento (dentro de 1 hora)
export const isTokenExpiringSoon = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60; // 1 hora em segundos
  
  return payload.exp - now < oneHour;
};

// Validar formato do token
export const isValidTokenFormat = (token: string): boolean => {
  return token.split('.').length === 3;
};
