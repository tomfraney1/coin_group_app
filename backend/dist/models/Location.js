"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = void 0;
const db_1 = require("../utils/db");
class Location {
    static async create(locationData) {
        const result = await (0, db_1.query)(`INSERT INTO locations (name, address, city, state, zip)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [
            locationData.name,
            locationData.address,
            locationData.city,
            locationData.state,
            locationData.zip
        ]);
        return this.mapToLocation(result.rows[0]);
    }
    static async findAll() {
        const result = await (0, db_1.query)('SELECT * FROM locations ORDER BY created_at DESC');
        return result.rows.map(row => this.mapToLocation(row));
    }
    static async findById(id) {
        const result = await (0, db_1.query)('SELECT * FROM locations WHERE id = $1', [id]);
        return result.rows[0] ? this.mapToLocation(result.rows[0]) : null;
    }
    static async update(id, updates) {
        const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
        if (fields.length === 0)
            return null;
        const setClause = fields
            .map((field, index) => `${this.toSnakeCase(field)} = $${index + 2}`)
            .join(', ');
        const values = fields.map(field => updates[field]);
        const result = await (0, db_1.query)(`UPDATE locations SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id, ...values]);
        return result.rows[0] ? this.mapToLocation(result.rows[0]) : null;
    }
    static async delete(id) {
        const result = await (0, db_1.query)('DELETE FROM locations WHERE id = $1 RETURNING id', [id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }
    static mapToLocation(row) {
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
    static toSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.Location = Location;
