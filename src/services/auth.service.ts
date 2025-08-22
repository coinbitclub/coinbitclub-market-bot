
// ========================================
// MARKETBOT - AUTH SERVICE IMPLEMENTATION
// ========================================

import { Client } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  private client: Client;

  constructor(databaseUrl: string) {
    this.client = new Client({ connectionString: databaseUrl });
  }

  async login(email: string, password: string): Promise<any> {
    await this.client.connect();
    try {
      const result = await this.client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        throw new Error('Senha inválida');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      return { token, user: { id: user.id, email: user.email, name: user.name } };
    } finally {
      await this.client.end();
    }
  }

  async register(userData: any): Promise<any> {
    const { email, password, name } = userData;
    await this.client.connect();
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await this.client.query(
        'INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, name',
        [email, hashedPassword, name]
      );

      return result.rows[0];
    } finally {
      await this.client.end();
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}
