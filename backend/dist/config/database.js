"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.pool = pool;
const connectDB = async () => {
    try {
        await pool.connect();
        console.log('PostgreSQL Connected');
    }
    catch (error) {
        console.error('Error connecting to PostgreSQL:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
