"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transaction = exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};
exports.query = query;
const getClient = async () => {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const release = client.release.bind(client);
    // Monkey patch the query method to keep track of queries
    client.query = (queryConfig, ...args) => {
        client.lastQuery = typeof queryConfig === 'string' ? queryConfig : queryConfig.text;
        return originalQuery(queryConfig, ...args);
    };
    client.release = () => {
        client.query = originalQuery;
        client.release = release;
        return release();
    };
    return client;
};
exports.getClient = getClient;
const transaction = async (callback) => {
    const client = await (0, exports.getClient)();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
exports.default = pool;
