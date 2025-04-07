"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../utils/db");
class User {
    static async create(userData) {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, salt);
        const result = await (0, db_1.query)(`INSERT INTO users (username, email, password, role, is_active, last_login)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [
            userData.username,
            userData.email,
            hashedPassword,
            userData.role,
            userData.isActive,
            userData.lastLogin
        ]);
        return this.mapToUser(result.rows[0]);
    }
    static async findByEmail(email) {
        const result = await (0, db_1.query)('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
    }
    static async findById(id) {
        const result = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
    }
    static async update(id, updates) {
        const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
        if (fields.length === 0)
            return null;
        const setClause = fields
            .map((field, index) => `${this.toSnakeCase(field)} = $${index + 2}`)
            .join(', ');
        const values = fields.map(field => updates[field]);
        const result = await (0, db_1.query)(`UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`, [id, ...values]);
        return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
    }
    static async getAll() {
        const result = await (0, db_1.query)('SELECT * FROM users ORDER BY id ASC');
        return result.rows.map(row => this.mapToUser(row));
    }
    static async remove(id) {
        await (0, db_1.query)('DELETE FROM users WHERE id = $1', [id]);
    }
    static async comparePassword(user, candidatePassword) {
        return bcryptjs_1.default.compare(candidatePassword, user.password);
    }
    static mapToUser(row) {
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
    static toSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.User = User;
