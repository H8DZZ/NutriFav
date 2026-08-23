const { getQuery, allQuery, runQuery } = require('./database-renderer.js');

async function getPatients() {
    return await allQuery('SELECT * FROM pacientes ORDER BY nombre');
}

async function getPatientById(id) {
    return await getQuery('SELECT * FROM pacientes WHERE id_paciente = ?', [id]);
}

async function addPatient(data) {
    const lastPatient = await getQuery('SELECT expediente FROM pacientes ORDER BY id_paciente DESC LIMIT 1');
    let nextNumber = 1;
    if (lastPatient && lastPatient.expediente) {
        const match = lastPatient.expediente.match(/NF-(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }
    const expediente = `NF-${String(nextNumber).padStart(4, '0')}`;

    const sql = `
        INSERT INTO pacientes (
            nombre, edad, sexo, celular, email, direccion, estado, expediente,
            meta_peso, peso_actual, imc, grasa_corporal, resumen, ultima_consulta,
            alcoholismo, tabaquismo, drogas, otros_no_patologicos,
            diabetes, hipertension, enfermedad_renal, gastritis, colitis, otros_patologicos,
            antecedentes_heredofamiliares, cirugias, alergias_intolerancias,
            gineco_fum, gineco_fpm, gineco_menarca, gineco_anticonceptivo,
            embarazo_sdg, embarazo_gestas, embarazo_partos, embarazo_cesareas, embarazo_abortos,
            embarazo_trimestre, embarazo_observaciones,
            climaterio_menopausia, terapia_hormonal,
            actividad_tipo, actividad_frecuencia, actividad_duracion, actividad_tiempo_evolucion,
            laboratorios_recientes,
            quien_prepara_alimentos, nivel_apetito, hora_mayor_apetito,
            alimentos_preferidos, alimentos_no_agraden, alimentos_malestar, complemento_suplemento,
            objetivo,
            recordatorio_dietas_ant, recordatorio_dietas_tiempo,
            hora_despertar, hora_dormir, cuantas_comidas, descripcion_dieta_habitual,
            objetivo_peso
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.nombre, data.edad, data.sexo, data.celular, data.email, data.direccion, data.estado || 'Activo', expediente,
        data.meta_peso, data.peso_actual, data.imc, data.grasa_corporal, data.resumen, data.ultima_consulta,
        data.alcoholismo, data.tabaquismo, data.drogas, data.otros_no_patologicos,
        data.diabetes || 0, data.hipertension || 0, data.enfermedad_renal || 0, data.gastritis || 0, data.colitis || 0, data.otros_patologicos,
        data.antecedentes_heredofamiliares, data.cirugias, data.alergias_intolerancias,
        data.gineco_fum, data.gineco_fpm, data.gineco_menarca, data.gineco_anticonceptivo,
        data.embarazo_sdg, data.embarazo_gestas || 0, data.embarazo_partos || 0, data.embarazo_cesareas || 0, data.embarazo_abortos || 0,
        data.embarazo_trimestre || null, data.embarazo_observaciones || '',
        data.climaterio_menopausia || 0, data.terapia_hormonal,
        data.actividad_tipo, data.actividad_frecuencia, data.actividad_duracion, data.actividad_tiempo_evolucion,
        data.laboratorios_recientes,
        data.quien_prepara_alimentos, data.nivel_apetito, data.hora_mayor_apetito,
        data.alimentos_preferidos, data.alimentos_no_agraden, data.alimentos_malestar, data.complemento_suplemento,
        data.objetivo,
        data.recordatorio_dietas_ant || 0, data.recordatorio_dietas_tiempo,
        data.hora_despertar, data.hora_dormir, data.cuantas_comidas || 0, data.descripcion_dieta_habitual,
        data.objetivo_peso || 'bajar'
    ];
    const result = await runQuery(sql, params);
    return result.lastID;
}

async function updatePatient(id, data) {
    const fields = [];
    const params = [];

    if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
    if (data.edad !== undefined) { fields.push('edad = ?'); params.push(data.edad); }
    if (data.sexo !== undefined) { fields.push('sexo = ?'); params.push(data.sexo); }
    if (data.celular !== undefined) { fields.push('celular = ?'); params.push(data.celular); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.direccion !== undefined) { fields.push('direccion = ?'); params.push(data.direccion); }
    if (data.estado !== undefined) { fields.push('estado = ?'); params.push(data.estado); }
    if (data.expediente !== undefined) { fields.push('expediente = ?'); params.push(data.expediente); }
    if (data.meta_peso !== undefined) { fields.push('meta_peso = ?'); params.push(data.meta_peso); }
    if (data.peso_actual !== undefined) { fields.push('peso_actual = ?'); params.push(data.peso_actual); }
    if (data.imc !== undefined) { fields.push('imc = ?'); params.push(data.imc); }
    if (data.grasa_corporal !== undefined) { fields.push('grasa_corporal = ?'); params.push(data.grasa_corporal); }
    if (data.resumen !== undefined) { fields.push('resumen = ?'); params.push(data.resumen); }
    if (data.ultima_consulta !== undefined) { fields.push('ultima_consulta = ?'); params.push(data.ultima_consulta); }
    if (data.alcoholismo !== undefined) { fields.push('alcoholismo = ?'); params.push(data.alcoholismo); }
    if (data.tabaquismo !== undefined) { fields.push('tabaquismo = ?'); params.push(data.tabaquismo); }
    if (data.drogas !== undefined) { fields.push('drogas = ?'); params.push(data.drogas); }
    if (data.otros_no_patologicos !== undefined) { fields.push('otros_no_patologicos = ?'); params.push(data.otros_no_patologicos); }
    if (data.diabetes !== undefined) { fields.push('diabetes = ?'); params.push(data.diabetes); }
    if (data.hipertension !== undefined) { fields.push('hipertension = ?'); params.push(data.hipertension); }
    if (data.enfermedad_renal !== undefined) { fields.push('enfermedad_renal = ?'); params.push(data.enfermedad_renal); }
    if (data.gastritis !== undefined) { fields.push('gastritis = ?'); params.push(data.gastritis); }
    if (data.colitis !== undefined) { fields.push('colitis = ?'); params.push(data.colitis); }
    if (data.otros_patologicos !== undefined) { fields.push('otros_patologicos = ?'); params.push(data.otros_patologicos); }
    if (data.antecedentes_heredofamiliares !== undefined) { fields.push('antecedentes_heredofamiliares = ?'); params.push(data.antecedentes_heredofamiliares); }
    if (data.cirugias !== undefined) { fields.push('cirugias = ?'); params.push(data.cirugias); }
    if (data.alergias_intolerancias !== undefined) { fields.push('alergias_intolerancias = ?'); params.push(data.alergias_intolerancias); }
    if (data.gineco_fum !== undefined) { fields.push('gineco_fum = ?'); params.push(data.gineco_fum); }
    if (data.gineco_fpm !== undefined) { fields.push('gineco_fpm = ?'); params.push(data.gineco_fpm); }
    if (data.gineco_menarca !== undefined) { fields.push('gineco_menarca = ?'); params.push(data.gineco_menarca); }
    if (data.gineco_anticonceptivo !== undefined) { fields.push('gineco_anticonceptivo = ?'); params.push(data.gineco_anticonceptivo); }
    if (data.embarazo_sdg !== undefined) { fields.push('embarazo_sdg = ?'); params.push(data.embarazo_sdg); }
    if (data.embarazo_trimestre !== undefined) { fields.push('embarazo_trimestre = ?'); params.push(data.embarazo_trimestre); }
    if (data.embarazo_gestas !== undefined) { fields.push('embarazo_gestas = ?'); params.push(data.embarazo_gestas); }
    if (data.embarazo_partos !== undefined) { fields.push('embarazo_partos = ?'); params.push(data.embarazo_partos); }
    if (data.embarazo_cesareas !== undefined) { fields.push('embarazo_cesareas = ?'); params.push(data.embarazo_cesareas); }
    if (data.embarazo_abortos !== undefined) { fields.push('embarazo_abortos = ?'); params.push(data.embarazo_abortos); }
    if (data.embarazo_observaciones !== undefined) { fields.push('embarazo_observaciones = ?'); params.push(data.embarazo_observaciones); }
    if (data.climaterio_menopausia !== undefined) { fields.push('climaterio_menopausia = ?'); params.push(data.climaterio_menopausia); }
    if (data.terapia_hormonal !== undefined) { fields.push('terapia_hormonal = ?'); params.push(data.terapia_hormonal); }
    if (data.actividad_tipo !== undefined) { fields.push('actividad_tipo = ?'); params.push(data.actividad_tipo); }
    if (data.actividad_frecuencia !== undefined) { fields.push('actividad_frecuencia = ?'); params.push(data.actividad_frecuencia); }
    if (data.actividad_duracion !== undefined) { fields.push('actividad_duracion = ?'); params.push(data.actividad_duracion); }
    if (data.actividad_tiempo_evolucion !== undefined) { fields.push('actividad_tiempo_evolucion = ?'); params.push(data.actividad_tiempo_evolucion); }
    if (data.laboratorios_recientes !== undefined) { fields.push('laboratorios_recientes = ?'); params.push(data.laboratorios_recientes); }
    if (data.quien_prepara_alimentos !== undefined) { fields.push('quien_prepara_alimentos = ?'); params.push(data.quien_prepara_alimentos); }
    if (data.nivel_apetito !== undefined) { fields.push('nivel_apetito = ?'); params.push(data.nivel_apetito); }
    if (data.hora_mayor_apetito !== undefined) { fields.push('hora_mayor_apetito = ?'); params.push(data.hora_mayor_apetito); }
    if (data.alimentos_preferidos !== undefined) { fields.push('alimentos_preferidos = ?'); params.push(data.alimentos_preferidos); }
    if (data.alimentos_no_agraden !== undefined) { fields.push('alimentos_no_agraden = ?'); params.push(data.alimentos_no_agraden); }
    if (data.alimentos_malestar !== undefined) { fields.push('alimentos_malestar = ?'); params.push(data.alimentos_malestar); }
    if (data.complemento_suplemento !== undefined) { fields.push('complemento_suplemento = ?'); params.push(data.complemento_suplemento); }
    if (data.objetivo !== undefined) { fields.push('objetivo = ?'); params.push(data.objetivo); }
    if (data.recordatorio_dietas_ant !== undefined) { fields.push('recordatorio_dietas_ant = ?'); params.push(data.recordatorio_dietas_ant); }
    if (data.recordatorio_dietas_tiempo !== undefined) { fields.push('recordatorio_dietas_tiempo = ?'); params.push(data.recordatorio_dietas_tiempo); }
    if (data.hora_despertar !== undefined) { fields.push('hora_despertar = ?'); params.push(data.hora_despertar); }
    if (data.hora_dormir !== undefined) { fields.push('hora_dormir = ?'); params.push(data.hora_dormir); }
    if (data.cuantas_comidas !== undefined) { fields.push('cuantas_comidas = ?'); params.push(data.cuantas_comidas); }
    if (data.descripcion_dieta_habitual !== undefined) { fields.push('descripcion_dieta_habitual = ?'); params.push(data.descripcion_dieta_habitual); }
    if (data.objetivo_peso !== undefined) { fields.push('objetivo_peso = ?'); params.push(data.objetivo_peso); }

    if (fields.length === 0) {
        console.warn('No hay campos para actualizar');
        return;
    }

    fields.push('fecha_actualizacion = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE pacientes SET ${fields.join(', ')} WHERE id_paciente = ?`;
    await runQuery(sql, params);
}

async function deletePatient(id) {
    await runQuery('DELETE FROM citas WHERE id_paciente = ?', [id]);
    await runQuery('DELETE FROM seguimiento WHERE id_paciente = ?', [id]);
    await runQuery('DELETE FROM prescripciones WHERE id_paciente = ?', [id]);
    await runQuery('DELETE FROM notas WHERE id_paciente = ?', [id]);
    await runQuery('DELETE FROM fotos WHERE id_paciente = ?', [id]);
    await runQuery('DELETE FROM planes WHERE id_paciente = ?', [id]);
    await runQuery('DELETE FROM pacientes WHERE id_paciente = ?', [id]);
}

async function updatePatientStatus(id, estado) {
    await runQuery('UPDATE pacientes SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_paciente = ?', [estado, id]);
}

async function getAllAppointments(adminId = null) {
    let sql = `
        SELECT c.*, p.nombre as paciente_nombre
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id_paciente
    `;
    const params = [];
    if (adminId) {
        sql += ' WHERE c.id_admin = ?';
        params.push(adminId);
    }
    sql += ' ORDER BY c.fecha_cita DESC, c.hora_cita DESC';
    return await allQuery(sql, params);
}

async function updateAppointment(id, data) {
    const sql = `
        UPDATE citas SET
            contexto_cita = ?,
            nota = ?,
            documento = ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_citas = ?
    `;
    await runQuery(sql, [
        data.contexto_cita || null,
        data.nota || null,
        data.documento || null,
        id
    ]);
}

async function getAppointmentById(id) {
    return await getQuery(`
        SELECT c.*, p.nombre as paciente_nombre
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id_paciente
        WHERE c.id_citas = ?
    `, [id]);
}

async function getAppointmentsForDay(year, month, day, adminId = null) {
    const fecha = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    let sql = `
        SELECT c.*, p.nombre as paciente_nombre
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id_paciente
        WHERE c.fecha_cita = ?
    `;
    const params = [fecha];
    if (adminId) {
        sql += ' AND c.id_admin = ?';
        params.push(adminId);
    }
    sql += ' ORDER BY c.hora_cita';
    return await allQuery(sql, params);
}

async function getUpcomingAppointments(limit = 5, adminId = null) {
    const today = new Date().toISOString().split('T')[0];
    let sql = `
        SELECT c.*, p.nombre as paciente_nombre
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id_paciente
        WHERE c.fecha_cita >= ?
    `;
    const params = [today];
    if (adminId) {
        sql += ' AND c.id_admin = ?';
        params.push(adminId);
    }
    sql += ' ORDER BY c.fecha_cita, c.hora_cita LIMIT ?';
    params.push(limit);
    return await allQuery(sql, params);
}

async function addAppointment(data) {
    const sql = `
        INSERT INTO citas (id_admin, id_paciente, fecha_cita, hora_cita, estado, contexto_cita, nota, documento)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await runQuery(sql, [
        data.id_admin || 1,
        data.id_paciente,
        data.fecha_cita,
        data.hora_cita,
        data.estado || 'Confirmada',
        data.contexto_cita,
        data.nota,
        data.documento
    ]);
    return result.lastID;
}

async function updateAppointmentStatus(id, estado) {
    await runQuery('UPDATE citas SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_citas = ?', [estado, id]);
}

async function getTasks() {
    return await allQuery('SELECT * FROM tareas ORDER BY fecha_creacion DESC');
}

async function addTask(task) {
    const result = await runQuery(
        'INSERT INTO tareas (id_admin, detalle_tarea, categoria_tarea) VALUES (?, ?, ?)',
        [task.id_admin || 1, task.detalle_tarea, task.categoria_tarea]
    );
    return result.lastID;
}

async function deleteTask(id) {
    await runQuery('DELETE FROM tareas WHERE id_tarea = ?', [id]);
}

async function getSeguimientos(pacienteId) {
    if (pacienteId) {
        return await allQuery('SELECT * FROM seguimiento WHERE id_paciente = ? ORDER BY fecha_sesion DESC', [pacienteId]);
    }
    return await allQuery('SELECT * FROM seguimiento ORDER BY fecha_sesion DESC');
}

async function getSeguimientoById(id) {
    return await getQuery('SELECT * FROM seguimiento WHERE id_sesion = ?', [id]);
}

async function addSeguimiento(data) {
    let imc = null;
    if (data.peso_kg && data.altura_cm) {
        const alturaM = data.altura_cm / 100;
        imc = data.peso_kg / (alturaM * alturaM);
    }

    const sql = `
        INSERT INTO seguimiento (
            id_paciente, fecha_sesion, peso_kg, altura_cm, imc, grasa_corporal, masa_muscular,
            peso_habitual, masa_osea, grasa_visceral,
            circunferencia_cintura, circunferencia_cadera, circunferencia_cuello, circunferencia_pecho,
            circunferencia_biceps_relajado, circunferencia_biceps_contraido, circunferencia_gluteo,
            circunferencia_muslo, circunferencia_cuadricep_relajado, circunferencia_cuadricep_contraido,
            circunferencia_pantorrilla,
            pliegue_bicipital, pliegue_tricipital, pliegue_subescapular, pliegue_supraileaco,
            pliegue_abdominal, pliegue_muslo, pliegue_pantorrilla,
            presion_sistolica, presion_diastolica, frecuencia_cardiaca,
            observaciones_sesion, estado_paciente
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.id_paciente,
        data.fecha_sesion,
        data.peso_kg || null,
        data.altura_cm || null,
        imc,
        data.grasa_corporal || null,
        data.masa_muscular || null,
        data.peso_habitual || null,
        data.masa_osea || null,
        data.grasa_visceral || null,
        data.circunferencia_cintura || null,
        data.circunferencia_cadera || null,
        data.circunferencia_cuello || null,
        data.circunferencia_pecho || null,
        data.circunferencia_biceps_relajado || null,
        data.circunferencia_biceps_contraido || null,
        data.circunferencia_gluteo || null,
        data.circunferencia_muslo || null,
        data.circunferencia_cuadricep_relajado || null,
        data.circunferencia_cuadricep_contraido || null,
        data.circunferencia_pantorrilla || null,
        data.pliegue_bicipital || null,
        data.pliegue_tricipital || null,
        data.pliegue_subescapular || null,
        data.pliegue_supraileaco || null,
        data.pliegue_abdominal || null,
        data.pliegue_muslo || null,
        data.pliegue_pantorrilla || null,
        data.presion_sistolica || null,
        data.presion_diastolica || null,
        data.frecuencia_cardiaca || null,
        data.observaciones_sesion || null,
        data.estado_paciente || 'Pendiente'
    ];
    const result = await runQuery(sql, params);
    return result.lastID;
}

async function getDietasByPaciente(pacienteId) {
    return await allQuery(`
        SELECT p.*, pr.nombre_plan
        FROM prescripciones p
        LEFT JOIN planes pr ON pr.id_paciente = p.id_paciente
        WHERE p.id_paciente = ?
        ORDER BY p.fecha_emision DESC
    `, [pacienteId]);
}

async function getPrescripciones(pacienteId) {
    return await allQuery('SELECT * FROM prescripciones WHERE id_paciente = ? ORDER BY fecha_emision DESC', [pacienteId]);
}

async function updatePrescripcion(id, data) {
    const sql = `
        UPDATE prescripciones SET
            objetivo_plan = ?, estado = ?, nombre_plan = ?, subtitulo = ?, icono = ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_prescripcion = ?
    `;
    await runQuery(sql, [
        data.objetivo_plan,
        data.estado,
        data.nombre_plan,
        data.subtitulo,
        data.icono,
        id
    ]);
}

async function getAdministradores() {
    return await allQuery('SELECT id_admin, nombre_admin, rol FROM administradores ORDER BY nombre_admin');
}

async function getAdministradorById(id) {
    return await getQuery('SELECT id_admin, nombre_admin, rol FROM administradores WHERE id_admin = ?', [id]);
}

async function getNotas(pacienteId) {
    return await allQuery('SELECT * FROM notas WHERE id_paciente = ? ORDER BY fecha DESC', [pacienteId]);
}

async function addNota(data) {
    const result = await runQuery(
        'INSERT INTO notas (id_paciente, contenido, fecha, tipo) VALUES (?, ?, ?, ?)',
        [data.id_paciente, data.contenido, data.fecha, data.tipo || 'normal']
    );
    return result.lastID;
}

async function getFotosByPaciente(pacienteId) {
    return await allQuery('SELECT * FROM fotos WHERE id_paciente = ? ORDER BY fecha DESC', [pacienteId]);
}

async function addFoto(data) {
    const result = await runQuery(
        'INSERT INTO fotos (id_paciente, url, fecha, angulo, descripcion, es_principal) VALUES (?, ?, ?, ?, ?, ?)',
        [data.id_paciente, data.url, data.fecha, data.angulo, data.descripcion, data.es_principal || 0]
    );
    return result.lastID;
}

async function deleteFoto(id) {
    await runQuery('DELETE FROM fotos WHERE id_foto = ?', [id]);
}

async function getPlans() {
    return await allQuery(`
        SELECT p.*, pac.nombre as paciente_nombre
        FROM planes p
        JOIN pacientes pac ON p.id_paciente = pac.id_paciente
        ORDER BY p.fecha_creacion DESC
    `);
}

async function getPlansByPaciente(pacienteId) {
    return await allQuery(`
        SELECT p.*, pac.nombre as paciente_nombre
        FROM planes p
        JOIN pacientes pac ON p.id_paciente = pac.id_paciente
        WHERE p.id_paciente = ?
        ORDER BY p.fecha_creacion DESC
    `, [pacienteId]);
}

async function getPlanById(id) {
    const plan = await getQuery(`
        SELECT p.*, pac.nombre as paciente_nombre
        FROM planes p
        JOIN pacientes pac ON p.id_paciente = pac.id_paciente
        WHERE p.id_plan = ?
    `, [id]);
    if (plan) {
        try {
            plan.comidas_por_dia = plan.comidas_por_dia ? JSON.parse(plan.comidas_por_dia) : {};
        } catch (e) {
            plan.comidas_por_dia = {};
        }
        if (typeof plan.comidas_por_dia !== 'object') plan.comidas_por_dia = {};
        plan.comidasPorDia = plan.comidas_por_dia;

        try {
            plan.horas_nombres = plan.horas_nombres ? JSON.parse(plan.horas_nombres) : {};
        } catch (e) {
            plan.horas_nombres = {};
        }
        if (typeof plan.horas_nombres !== 'object') plan.horas_nombres = {};

        plan.observaciones = plan.observaciones || '';
    }
    return plan;
}

async function addPlan(data) {
    const comidasJSON = data.comidas_por_dia ? JSON.stringify(data.comidas_por_dia) : null;
    const horasNombresJSON = data.horas_nombres ? JSON.stringify(data.horas_nombres) : null;
    const observaciones = data.observaciones || '';
    const result = await runQuery(
        `INSERT INTO planes (id_paciente, nombre_plan, meta_calorias, estado, comidas_por_dia, horas_nombres, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            data.id_paciente,
            data.nombre_plan,
            data.meta_calorias || 1600,
            data.estado || 'Activo',
            comidasJSON,
            horasNombresJSON,
            observaciones
        ]
    );
    return result.lastID;
}

async function updatePlan(id, data) {
    const comidasJSON = data.comidas_por_dia ? JSON.stringify(data.comidas_por_dia) : null;
    const horasNombresJSON = data.horas_nombres ? JSON.stringify(data.horas_nombres) : null;
    const observaciones = data.observaciones || '';
    await runQuery(
        `UPDATE planes SET
            nombre_plan = ?,
            meta_calorias = ?,
            estado = ?,
            comidas_por_dia = ?,
            horas_nombres = ?,
            observaciones = ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_plan = ?`,
        [
            data.nombre_plan,
            data.meta_calorias || 1600,
            data.estado || 'Activo',
            comidasJSON,
            horasNombresJSON,
            observaciones,
            id
        ]
    );
}

async function deletePlan(id) {
    await runQuery('DELETE FROM planes WHERE id_plan = ?', [id]);
}

async function getStats(adminId = null) {
    const hoy = new Date().toISOString().split('T')[0];
    let totalPacientesQuery = 'SELECT COUNT(*) as total FROM pacientes';
    let citasHoyQuery = 'SELECT COUNT(*) as total FROM citas WHERE fecha_cita = ?';
    const params = [hoy];
    
    if (adminId) {
        citasHoyQuery = 'SELECT COUNT(*) as total FROM citas WHERE fecha_cita = ? AND id_admin = ?';
        params.push(adminId);
    }
    
    const totalPacientes = await getQuery(totalPacientesQuery);
    const citasHoy = await getQuery(citasHoyQuery, params);
    return {
        totalPacientes: totalPacientes?.total || 0,
        citasHoy: citasHoy?.total || 0
    };
}

async function seedData() {
    const count = await getQuery('SELECT COUNT(*) as total FROM pacientes');
    if (count.total > 0) return;
    console.log('🌱 Sembrando datos de prueba...');
}

module.exports = {
    getPatients,
    getPatientById,
    addPatient,
    updatePatient,
    deletePatient,
    updatePatientStatus,
    getAllAppointments,
    getAppointmentById,
    getAppointmentsForDay,
    getUpcomingAppointments,
    addAppointment,
    updateAppointmentStatus,
    updateAppointment,
    getTasks,
    addTask,
    deleteTask,
    getSeguimientos,
    getSeguimientoById,
    addSeguimiento,
    getAdministradores,
    getAdministradorById,
    getDietasByPaciente,
    getPrescripciones,
    updatePrescripcion,
    getNotas,
    addNota,
    getFotosByPaciente,
    addFoto,
    deleteFoto,
    getPlans,
    getPlansByPaciente,
    getPlanById,
    addPlan,
    updatePlan,
    deletePlan,
    getStats,
    seedData
};