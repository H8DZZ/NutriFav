const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../nutrifav.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ Error al conectar con SQLite (renderer):', err.message);
    else console.log('✅ Conectado a SQLite (renderer):', dbPath);
});

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function execQuery(sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = {
    db,
    dbPath,
    runQuery,
    getQuery,
    allQuery,
    execQuery
};