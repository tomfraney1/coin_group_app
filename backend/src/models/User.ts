import bcrypt from 'bcryptjs';
import { query, transaction } from '../utils/db';

export interface IUser {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'manager';
  isActive: boolean;
  createdAt?: Date;
  lastLogin?: Date;
}

export class User {
  static async create(userData: Omit<IUser, 'id' | 'createdAt'>): Promise<IUser> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const result = await query(
      `INSERT INTO users (username, email, password, role, is_active, last_login)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.username,
        userData.email,
        hashedPassword,
        userData.role,
        userData.isActive,
        userData.lastLogin
      ]
    );

    return this.mapToUser(result.rows[0]);
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  static async findById(id: number): Promise<IUser | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  static async update(id: number, updates: Partial<IUser>): Promise<IUser | null> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof IUser] !== undefined);
    if (fields.length === 0) return null;

    const setClause = fields
      .map((field, index) => `${this.toSnakeCase(field)} = $${index + 2}`)
      .join(', ');
    const values = fields.map(field => updates[field as keyof IUser]);

    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  static async getAll(): Promise<IUser[]> {
    const result = await query('SELECT * FROM users ORDER BY id ASC');
    return result.rows.map(row => this.mapToUser(row));
  }

  static async remove(id: number): Promise<void> {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }

  static async comparePassword(user: IUser, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, user.password);
  }

  private static mapToUser(row: any): IUser {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      lastLogin: row.last_login
    };
  }

  private static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 