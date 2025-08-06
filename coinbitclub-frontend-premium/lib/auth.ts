import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Mock database - em produção usar PostgreSQL
const users: any[] = [
  {
    id: '1',
    email: 'admin@coinbitclub.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Admin CoinBitClub',
    role: 'admin'
  }
];

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function generateToken(user: User): Promise<string> {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = users.find(u => u.email === email);
    if (!user) {
      return null;
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
