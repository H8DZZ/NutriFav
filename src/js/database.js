const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../nutrifav.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ Error al conectar con SQLite:', err.message);
    else console.log('✅ Conectado a SQLite:', dbPath);
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

async function ensureColumns() {
    const col1 = await getQuery(
        "SELECT name FROM pragma_table_info('pacientes') WHERE name = 'embarazo_trimestre'"
    );
    if (!col1) {
        await runQuery('ALTER TABLE pacientes ADD COLUMN embarazo_trimestre INTEGER');
        console.log('✅ Columna embarazo_trimestre agregada');
    }
    const col2 = await getQuery(
        "SELECT name FROM pragma_table_info('pacientes') WHERE name = 'embarazo_observaciones'"
    );
    if (!col2) {
        await runQuery('ALTER TABLE pacientes ADD COLUMN embarazo_observaciones TEXT');
        console.log('✅ Columna embarazo_observaciones agregada');
    }

    const col3 = await getQuery(
        "SELECT name FROM pragma_table_info('planes') WHERE name = 'horas_nombres'"
    );
    if (!col3) {
        await runQuery('ALTER TABLE planes ADD COLUMN horas_nombres TEXT');
        console.log('✅ Columna horas_nombres agregada en planes');
    }
    const col4 = await getQuery(
        "SELECT name FROM pragma_table_info('planes') WHERE name = 'observaciones'"
    );
    if (!col4) {
        await runQuery('ALTER TABLE planes ADD COLUMN observaciones TEXT');
        console.log('✅ Columna observaciones agregada en planes');
    }

    const col5 = await getQuery(
        "SELECT name FROM pragma_table_info('pacientes') WHERE name = 'objetivo_peso'"
    );
    if (!col5) {
        await runQuery("ALTER TABLE pacientes ADD COLUMN objetivo_peso TEXT DEFAULT 'bajar'");
        console.log('✅ Columna objetivo_peso agregada en pacientes');
    }
}

async function initializeDatabase() {
    try {
        const row = await getQuery(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='pacientes'"
        );
        if (row) {
            console.log('✅ Las tablas ya existen.');
            await ensureColumns();
            await crearAdminSiNoExiste();
            return;
        }

        console.log('📦 Creando tablas por primera vez...');

        const sqlScript = `
            -- Tabla de administradores
            CREATE TABLE administradores (
                id_admin INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_admin TEXT NOT NULL,
                mail_admin TEXT UNIQUE NOT NULL,
                contrasena TEXT NOT NULL,
                rol TEXT DEFAULT 'nutriologo',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabla de pacientes (incluye objetivo_peso)
            CREATE TABLE pacientes (
                id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                edad INTEGER,
                sexo TEXT,
                celular TEXT,
                email TEXT,
                direccion TEXT,
                estado TEXT DEFAULT 'Activo',
                expediente TEXT UNIQUE,
                meta_peso REAL,
                peso_actual REAL,
                imc REAL,
                grasa_corporal REAL,
                resumen TEXT,
                ultima_consulta DATE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                alcoholismo TEXT,
                tabaquismo TEXT,
                drogas TEXT,
                otros_no_patologicos TEXT,
                diabetes INTEGER DEFAULT 0,
                hipertension INTEGER DEFAULT 0,
                enfermedad_renal INTEGER DEFAULT 0,
                gastritis INTEGER DEFAULT 0,
                colitis INTEGER DEFAULT 0,
                otros_patologicos TEXT,
                antecedentes_heredofamiliares TEXT,
                cirugias TEXT,
                alergias_intolerancias TEXT,
                gineco_fum DATE,
                gineco_fpm DATE,
                gineco_menarca TEXT,
                gineco_anticonceptivo TEXT,
                embarazo_sdg TEXT,
                embarazo_gestas INTEGER DEFAULT 0,
                embarazo_partos INTEGER DEFAULT 0,
                embarazo_cesareas INTEGER DEFAULT 0,
                embarazo_abortos INTEGER DEFAULT 0,
                embarazo_trimestre INTEGER,
                embarazo_observaciones TEXT,
                climaterio_menopausia INTEGER DEFAULT 0,
                terapia_hormonal TEXT,
                actividad_tipo TEXT,
                actividad_frecuencia TEXT,
                actividad_duracion TEXT,
                actividad_tiempo_evolucion TEXT,
                laboratorios_recientes TEXT,
                quien_prepara_alimentos TEXT,
                nivel_apetito TEXT,
                hora_mayor_apetito TEXT,
                alimentos_preferidos TEXT,
                alimentos_no_agraden TEXT,
                alimentos_malestar TEXT,
                complemento_suplemento TEXT,
                objetivo TEXT,
                recordatorio_dietas_ant INTEGER DEFAULT 0,
                recordatorio_dietas_tiempo TEXT,
                hora_despertar TEXT,
                hora_dormir TEXT,
                cuantas_comidas INTEGER DEFAULT 0,
                descripcion_dieta_habitual TEXT,
                objetivo_peso TEXT DEFAULT 'bajar'   -- NUEVO
            );

            -- Tabla de citas
            CREATE TABLE citas (
                id_citas INTEGER PRIMARY KEY AUTOINCREMENT,
                id_admin INTEGER,
                id_paciente INTEGER NOT NULL,
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                estado TEXT DEFAULT 'PENDIENTE',
                contexto_cita TEXT,
                nota TEXT,
                documento TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_admin) REFERENCES administradores(id_admin),
                FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE
            );

            -- Tabla de tareas
            CREATE TABLE tareas (
                id_tarea INTEGER PRIMARY KEY AUTOINCREMENT,
                id_admin INTEGER,
                detalle_tarea TEXT NOT NULL,
                categoria_tarea TEXT DEFAULT 'ADMINISTRATIVA',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_admin) REFERENCES administradores(id_admin)
            );

            -- Tabla de seguimiento
            CREATE TABLE seguimiento (
                id_sesion INTEGER PRIMARY KEY AUTOINCREMENT,
                id_paciente INTEGER NOT NULL,
                fecha_sesion DATE NOT NULL,
                peso_kg REAL,
                altura_cm REAL,
                imc REAL,
                grasa_corporal REAL,
                masa_muscular REAL,
                peso_habitual REAL,
                masa_osea REAL,
                grasa_visceral REAL,
                circunferencia_cintura REAL,
                circunferencia_cadera REAL,
                circunferencia_cuello REAL,
                circunferencia_pecho REAL,
                circunferencia_biceps_relajado REAL,
                circunferencia_biceps_contraido REAL,
                circunferencia_gluteo REAL,
                circunferencia_muslo REAL,
                circunferencia_cuadricep_relajado REAL,
                circunferencia_cuadricep_contraido REAL,
                circunferencia_pantorrilla REAL,
                pliegue_bicipital REAL,
                pliegue_tricipital REAL,
                pliegue_subescapular REAL,
                pliegue_supraileaco REAL,
                pliegue_abdominal REAL,
                pliegue_muslo REAL,
                pliegue_pantorrilla REAL,
                presion_sistolica INTEGER,
                presion_diastolica INTEGER,
                frecuencia_cardiaca INTEGER,
                observaciones_sesion TEXT,
                estado_paciente TEXT DEFAULT 'Pendiente',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE
            );

            -- Tabla de prescripciones
            CREATE TABLE prescripciones (
                id_prescripcion INTEGER PRIMARY KEY AUTOINCREMENT,
                id_paciente INTEGER NOT NULL,
                nombre_plan TEXT NOT NULL,
                objetivo_plan TEXT,
                subtitulo TEXT,
                icono TEXT DEFAULT 'nutrition',
                estado TEXT DEFAULT 'Activo',
                fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE
            );

            -- Tabla de planes
            CREATE TABLE planes (
                id_plan INTEGER PRIMARY KEY AUTOINCREMENT,
                id_paciente INTEGER NOT NULL,
                nombre_plan TEXT NOT NULL,
                meta_calorias INTEGER DEFAULT 1600,
                estado TEXT DEFAULT 'Activo',
                comidas_por_dia TEXT,
                horas_nombres TEXT,
                observaciones TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE
            );

            -- Tabla de notas
            CREATE TABLE notas (
                id_nota INTEGER PRIMARY KEY AUTOINCREMENT,
                id_paciente INTEGER NOT NULL,
                contenido TEXT NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tipo TEXT DEFAULT 'normal',
                FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE
            );

            -- Tabla de fotos
            CREATE TABLE fotos (
                id_foto INTEGER PRIMARY KEY AUTOINCREMENT,
                id_paciente INTEGER NOT NULL,
                url TEXT NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                angulo TEXT,
                descripcion TEXT,
                es_principal INTEGER DEFAULT 0,
                FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE
            );
        `;

        await execQuery(sqlScript);
        console.log('✅ Tablas creadas correctamente.');
        
        await crearAdminSiNoExiste();
        await ensureColumns();

    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error.message);
        throw error;
    }
}

async function crearAdminSiNoExiste() {
    try {
        const admin = await getQuery('SELECT id_admin FROM administradores WHERE mail_admin = ?', ['admin@nutrifav.com']);
        if (!admin) {
            console.log('🔄 Creando usuario admin...');
            await runQuery(
                `INSERT INTO administradores (nombre_admin, mail_admin, contrasena, rol)
                 VALUES (?, ?, ?, ?)`,
                ['admin', 'admin@nutrifav.com', '$2a$10$6fJh9M8Xp7zN7Wl5xF5GqO7m9X5vC7aQeHkLmNpRsTfUvWxYzZbCd', 'admin']
            );
            console.log('✅ Usuario admin creado: admin@nutrifav.com / admin123');
        } else {
            console.log('✅ Usuario admin ya existe');
        }
    } catch (error) {
        console.error('❌ Error al crear/verificar admin:', error.message);
        throw error;
    }
}

module.exports = {
    db,
    dbPath,
    runQuery,
    getQuery,
    allQuery,
    execQuery,
    initializeDatabase
};