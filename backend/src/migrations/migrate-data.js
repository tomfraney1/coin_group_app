"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var dotenv = require("dotenv");
dotenv.config();
// Google Cloud SQL connection (through proxy)
var targetPool = new pg_1.Pool({
    user: 'coingroup',
    host: 'localhost',
    database: 'coingroup',
    password: '3KpFHS9mhap3Asur5XYt',
    port: 5433
});
async function migrateData() {
    var targetClient;
    try {
        console.log('Connecting to database...');
        targetClient = await targetPool.connect();
        console.log('Successfully connected to database');
        // Migrate users
        console.log('Fetching users from database...');
        var usersResult = await targetClient.query('SELECT * FROM users');
        console.log("Found ".concat(usersResult.rows.length, " users to migrate"));
        for (var _i = 0, _a = usersResult.rows; _i < _a.length; _i++) {
            var user = _a[_i];
            console.log("Migrating user: ".concat(user.email));
            await targetClient.query("INSERT INTO users (username, email, password, role, is_active, last_login, created_at)\n         VALUES ($1, $2, $3, $4, $5, $6, $7)\n         ON CONFLICT (email) DO NOTHING", [
                user.username,
                user.email,
                user.password,
                user.role,
                user.is_active,
                user.last_login,
                user.created_at
            ]);
        }
        // Migrate coin_locations
        console.log('Fetching coin locations from database...');
        var locationsResult = await targetClient.query('SELECT * FROM coin_locations');
        console.log("Found ".concat(locationsResult.rows.length, " coin locations to migrate"));
        for (var _b = 0, _c = locationsResult.rows; _b < _c.length; _b++) {
            var location_1 = _c[_b];
            console.log("Migrating coin location: ".concat(location_1.coin_id));
            await targetClient.query("INSERT INTO coin_locations (coin_id, location, user_id, timestamp, created_at)\n         VALUES ($1, $2, $3, $4, $5)\n         ON CONFLICT DO NOTHING", [
                location_1.coin_id,
                location_1.location,
                location_1.user_id,
                location_1.timestamp,
                location_1.created_at
            ]);
        }
        // Migrate migrations
        console.log('Fetching migrations from database...');
        var migrationsResult = await targetClient.query('SELECT * FROM migrations');
        console.log("Found ".concat(migrationsResult.rows.length, " migrations to migrate"));
        for (var _d = 0, _e = migrationsResult.rows; _d < _e.length; _d++) {
            var migration = _e[_d];
            console.log("Migrating migration: ".concat(migration.name));
            await targetClient.query("INSERT INTO migrations (name, executed_at)\n         VALUES ($1, $2)\n         ON CONFLICT DO NOTHING", [migration.name, migration.executed_at]);
        }
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Error during migration:', error);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        if (error.detail) {
            console.error('Error detail:', error.detail);
        }
        if (error.hint) {
            console.error('Error hint:', error.hint);
        }
    } finally {
        if (targetClient) {
            await targetClient.release();
        }
        await targetPool.end();
    }
}
migrateData();
