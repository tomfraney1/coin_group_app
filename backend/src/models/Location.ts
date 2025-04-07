import { query, transaction } from '../utils/db';

export interface ILocation {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Location {
  static async create(locationData: Omit<ILocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ILocation> {
    const result = await query(
      `INSERT INTO locations (name, address, city, state, zip)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        locationData.name,
        locationData.address,
        locationData.city,
        locationData.state,
        locationData.zip
      ]
    );

    return this.mapToLocation(result.rows[0]);
  }

  static async findAll(): Promise<ILocation[]> {
    const result = await query('SELECT * FROM locations ORDER BY created_at DESC');
    return result.rows.map(row => this.mapToLocation(row));
  }

  static async findById(id: number): Promise<ILocation | null> {
    const result = await query(
      'SELECT * FROM locations WHERE id = $1',
      [id]
    );

    return result.rows[0] ? this.mapToLocation(result.rows[0]) : null;
  }

  static async update(id: number, updates: Partial<ILocation>): Promise<ILocation | null> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof ILocation] !== undefined);
    if (fields.length === 0) return null;

    const setClause = fields
      .map((field, index) => `${this.toSnakeCase(field)} = $${index + 2}`)
      .join(', ');
    const values = fields.map(field => updates[field as keyof ILocation]);

    const result = await query(
      `UPDATE locations SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows[0] ? this.mapToLocation(result.rows[0]) : null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM locations WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  private static mapToLocation(row: any): ILocation {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 