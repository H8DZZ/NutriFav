const { getStats, getUpcomingAppointments, getTasks } = require('./dataService.js');

async function initDashboard() {
    const welcomeHeading = document.querySelector('.welcome-heading');
    if (welcomeHeading) {
        const user = window.userData;
        if (user && user.nombre_admin) {
            const nombre = user.nombre_admin;
            const esFemenino = nombre.endsWith('a') || nombre.endsWith('A') || 
                              ['Elena', 'María', 'Ana', 'Laura', 'Carla', 'Paula', 'Sofía', 'Lucía', 'Andrea'].some(n => nombre.includes(n));
            const saludo = esFemenino ? 'Hola, Dra.' : 'Hola, Dr.';
            welcomeHeading.textContent = `${saludo} ${nombre}`;
        } else {
            welcomeHeading.textContent = 'Hola, Dr./Dra.';
        }
    }

    await loadStats();
    await loadAppointments();
    await loadTasks();
}



async function loadStats() {
    const stats = await getStats();
    const container = document.getElementById('statsContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="card stat-card">
            <span class="material-symbols-outlined stat-icon highlight">event_available</span>
            <div class="stat-number">${stats.citasHoy || 0}</div>
            <div class="stat-label">Citas para hoy</div>
        </div>
        <div class="card stat-card">
            <span class="material-symbols-outlined stat-icon primary">groups</span>
            <div class="stat-number">${stats.totalPacientes || 0}</div>
            <div class="stat-label">Pacientes Totales</div>
        </div>
    `;
}

async function loadAppointments() {
    const citas = await getUpcomingAppointments(5);
    const list = document.getElementById('appointmentsList');
    if (!list) return;
    if (citas.length === 0) {
        list.innerHTML = '<p class="empty-message">No hay citas próximas.</p>';
        return;
    }
    list.innerHTML = citas.map(c => {
        const fecha = new Date(c.fecha_cita);
        const dia = String(fecha.getDate()).padStart(2,'0');
        const mes = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][fecha.getMonth()];
        return `
            <a href="#" data-view="detalle-cita" data-id="${c.id_citas}" class="appointment-item">
                <div class="date-badge">
                    <span class="month">${mes}</span>
                    <span class="day">${dia}</span>
                </div>
                <div class="appointment-details">
                    <h3>${c.paciente_nombre}</h3>
                    <p>${c.hora_cita} • ${c.contexto_cita || 'Consulta'}</p>
                </div>
                <div class="appointment-right-group">
                    <span class="status-pill ${c.estado === 'CONFIRMADO' ? 'status-confirmed' : 'status-pending'}">${c.estado}</span>
                    <span class="material-symbols-outlined arrow-icon">chevron_right</span>
                </div>
            </a>
        `;
    }).join('');
}

async function loadTasks() {
    const tareas = await getTasks();
    const list = document.getElementById('taskList');
    if (!list) return;
    if (tareas.length === 0) {
        list.innerHTML = '<li class="task-item empty-message">No hay tareas pendientes.</li>';
        return;
    }
    const badgeMap = {
        'CLÍNICA': 'badge-clinical',
        'ADMINISTRATIVA': 'badge-admin',
        'SEGUIMIENTO DE PACIENTE': 'badge-followup'
    };
    list.innerHTML = tareas.map(t => {
        const id = t.id_tarea;
        const descripcion = t.detalle_tarea || 'Sin descripción';
        const categoria = t.categoria_tarea || 'ADMINISTRATIVA';
        return `
            <li class="task-item" data-id="${id}">
                <span class="material-symbols-outlined task-checkbox">check_box_outline_blank</span>
                <span class="task-text">${descripcion}</span>
                <span class="badge ${badgeMap[categoria] || 'badge-admin'}">${categoria}</span>
                <button class="btn-close" title="Eliminar"><span class="material-symbols-outlined">close</span></button>
            </li>
        `;
    }).join('');
}

module.exports = {
    initDashboard
};