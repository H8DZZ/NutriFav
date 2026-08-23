const bcrypt = require('bcryptjs');
const { getQuery, runQuery } = require('./database');

const SALT_ROUNDS = 10;

async function validateUser(username, password) {
    try {
        const user = await getQuery(
            'SELECT id_admin, nombre_admin, mail_admin, contrasena, rol FROM administradores WHERE nombre_admin = ?',
            [username]
        );
        if (!user) {
            console.log('❌ Usuario no encontrado');
            return null;
        }
        const match = await bcrypt.compare(password, user.contrasena);
        if (!match) {
            console.log('❌ Contraseña incorrecta');
            return null;
        }
        console.log('✅ Login exitoso');
        const { contrasena, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error('Error en validateUser:', error.message);
        throw error;
    }
}

async function createUser(nombre, email, password, rol = 'nutriologo') {
    const existing = await getQuery('SELECT id_admin FROM administradores WHERE nombre_admin = ?', [nombre]);
    if (existing) {
        throw new Error(`El nombre de usuario "${nombre}" ya está en uso`);
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await runQuery(
        'INSERT INTO administradores (nombre_admin, mail_admin, contrasena, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hash, rol]
    );
    return result.lastID;
}

module.exports = {
    validateUser,
    createUser
};