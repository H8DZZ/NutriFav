const { getPatientById, getPlansByPaciente, updatePlan, addNota, getNotas, updatePatient, deletePlan } = require('./dataService.js');

let pacienteId = null;
let planes = [];
let notas = [];
let currentPage = 1;
const itemsPerPage = 10;

async function initPrescripciones(id) {
    if (!id) {
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;">ID de paciente no proporcionado.</p>';
        return;
    }

    pacienteId = parseInt(id);
    try {
        const paciente = await getPatientById(pacienteId);
        if (!paciente) {
            document.getElementById('appContent').innerHTML = '<p style="padding:40px;">Paciente no encontrado.</p>';
            return;
        }

        planes = await getPlansByPaciente(pacienteId);
        notas = await getNotas(pacienteId);

        renderizarPaciente(paciente);
        renderizarStats(planes);
        renderizarTabla(planes);
        renderizarResumen(paciente);
        renderizarNotas(notas);
        configurarEventos(paciente);

    } catch (error) {
        console.error('Error al cargar prescripciones:', error);
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;color:red;">Error al cargar las prescripciones.</p>';
    }
}

function renderizarPaciente(paciente) {
    const nombre = document.getElementById('pacienteNombre');
    if (nombre) nombre.textContent = paciente.nombre;
    const subtitle = document.getElementById('pacienteSubtitle');
    if (subtitle) subtitle.textContent = `Historial de planes y objetivos para ${paciente.nombre}.`;
    const btnCrear = document.getElementById('btnCrearPrescripcion');
    if (btnCrear) btnCrear.dataset.id = paciente.id_paciente;
    const avatar = document.getElementById('pacienteAvatar');
    if (avatar) {
        const initials = paciente.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatar.textContent = initials;
    }
}

function renderizarStats(planesList) {
    const total = planesList.length;
    const completados = planesList.filter(p => p.estado === 'Completado' || p.estado === 'completado').length;
    const activos = planesList.filter(p => p.estado === 'Activo' || p.estado === 'activo').length;
    const cancelados = planesList.filter(p => p.estado === 'Cancelado' || p.estado === 'cancelado').length;
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="card stat-card">
            <div class="stat-icon icon-primary"><span class="material-symbols-outlined">description</span></div>
            <div><p class="stat-label">Total Planes</p><p class="stat-value">${total}</p></div>
        </div>
        <div class="card stat-card">
            <div class="stat-icon icon-secondary"><span class="material-symbols-outlined">check_circle</span></div>
            <div><p class="stat-label">Completados</p><p class="stat-value">${completados}</p></div>
        </div>
        <div class="card stat-card">
            <div class="stat-icon icon-active"><span class="material-symbols-outlined">pending</span></div>
            <div><p class="stat-label">Activos</p><p class="stat-value">${activos}</p></div>
        </div>
        <div class="card stat-card">
            <div class="stat-icon icon-tertiary"><span class="material-symbols-outlined">cancel</span></div>
            <div><p class="stat-label">Cancelados</p><p class="stat-value">${cancelados}</p></div>
        </div>
    `;
}

function renderizarTabla(lista) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginados = lista.slice(start, end);

    if (paginados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">No hay planes nutricionales.</td></tr>`;
        const results = document.getElementById('resultsCount');
        if (results) results.textContent = 'Mostrando 0 resultados';
        renderizarPaginacion(lista.length);
        return;
    }

    tbody.innerHTML = paginados.map(p => {
        const statusClass = p.estado === 'Activo' || p.estado === 'activo' ? 'status-chip-active' : 
                           p.estado === 'Completado' || p.estado === 'completado' ? 'status-chip-completed' : 
                           'status-chip-cancelled';
        const iconClass = p.estado === 'Activo' || p.estado === 'activo' ? 'active-icon' : 
                         p.estado === 'Completado' || p.estado === 'completado' ? 'default-icon' : 
                         'error-icon';
        const date = new Date(p.fecha_creacion);
        const fechaStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const hace = calcularHace(date);

        return `
            <tr class="table-row" data-status="${p.estado}" data-date="${p.fecha_creacion}" data-id="${p.id_plan}">
                <td>
                    <div class="cell-flex">
                        <div class="plan-icon ${iconClass}"><span class="material-symbols-outlined">nutrition</span></div>
                        <div>
                            <p class="plan-title">${p.nombre_plan || 'Plan sin nombre'}</p>
                            <p class="plan-subtitle">${p.paciente_nombre || ''}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <p class="date-text">${fechaStr}</p>
                    <p class="date-relative">${hace}</p>
                </td>
                <td>
                    <div class="status-container">
                        <span class="status-display ${statusClass}" data-status="${p.estado}">${p.estado || 'Activo'}</span>
                        <div class="status-select">
                            <button class="option" data-value="Activo">Activo</button>
                            <button class="option" data-value="Completado">Completado</button>
                            <button class="option" data-value="Cancelado">Cancelado</button>
                        </div>
                    </div>
                </td>
                <td class="text-right">
                    <div class="row-actions">
                        <a href="#" data-view="editor-plan" data-id="${p.id_plan}" class="action-btn" title="Editar plan">
                            <span class="material-symbols-outlined">edit</span>
                        </a>
                        <button class="action-btn btn-eliminar-plan text-error" data-id="${p.id_plan}" data-nombre="${p.nombre_plan}" title="Eliminar plan">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const results = document.getElementById('resultsCount');
    if (results) results.textContent = `Mostrando ${paginados.length} de ${lista.length} resultados`;
    renderizarPaginacion(lista.length);
}

function renderizarPaginacion(total) {
    const totalPages = Math.ceil(total / itemsPerPage);
    const container = document.getElementById('paginationNumbers');
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        const prev = document.getElementById('prevPage');
        const next = document.getElementById('nextPage');
        if (prev) prev.style.display = 'none';
        if (next) next.style.display = 'none';
        return;
    }
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    if (prev) prev.style.display = 'flex';
    if (next) next.style.display = 'flex';
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    container.innerHTML = html;
    container.querySelectorAll('.page-num').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            aplicarFiltros();
        });
    });
}

function renderizarResumen(paciente) {
    const resumen = document.getElementById('resumenContenido');
    if (resumen) resumen.textContent = paciente.resumen || 'Sin resumen disponible.';
    const metrics = document.getElementById('resumenMetrics');
    if (metrics) {
        metrics.innerHTML = `
            <div class="metric-box"><p class="metric-label">Peso Actual</p><p class="metric-value">${paciente.peso_actual ? paciente.peso_actual.toFixed(1) + ' kg' : '—'}</p></div>
            <div class="metric-box"><p class="metric-label">IMC</p><p class="metric-value">${paciente.imc ? paciente.imc.toFixed(1) : '—'}</p></div>
            <div class="metric-box"><p class="metric-label">Grasa Corp.</p><p class="metric-value">${paciente.grasa_corporal ? paciente.grasa_corporal.toFixed(1) + '%' : '—'}</p></div>
        `;
    }
}

function renderizarNotas(lista) {
    const container = document.getElementById('notesList');
    if (!container) return;
    if (lista.length === 0) {
        container.innerHTML = '<p class="empty-message" style="padding:20px;text-align:center;color:var(--text-muted);">No hay notas.</p>';
        return;
    }
    container.innerHTML = lista.map(n => {
        const fecha = new Date(n.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const borderClass = n.tipo === 'importante' ? 'border-primary' : 'border-secondary';
        return `
            <div class="note-item ${borderClass}" data-id="${n.id_nota}">
                <p class="note-date">${fechaStr}</p>
                <p class="note-content">${n.contenido}</p>
                <div class="note-actions"><button class="btn-eliminar-nota" data-id="${n.id_nota}">Eliminar</button></div>
            </div>
        `;
    }).join('');
}

function aplicarFiltros() {
    const searchInput = document.getElementById('globalSearch');
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const status = statusFilter ? statusFilter.value : 'all';

    let filtrados = planes;
    if (status !== 'all') filtrados = filtrados.filter(p => p.estado === status);
    if (query) filtrados = filtrados.filter(p => p.nombre_plan?.toLowerCase().includes(query) || p.paciente_nombre?.toLowerCase().includes(query));

    const order = sortFilter ? sortFilter.value : 'recent';
    filtrados.sort((a, b) => {
        const dateA = new Date(a.fecha_creacion);
        const dateB = new Date(b.fecha_creacion);
        return order === 'recent' ? dateB - dateA : dateA - dateB;
    });

    currentPage = 1;
    renderizarTabla(filtrados);
}

function configurarEventos(paciente) {
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.addEventListener('change', aplicarFiltros);
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) sortFilter.addEventListener('change', aplicarFiltros);
    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            if (statusFilter) statusFilter.value = 'all';
            if (sortFilter) sortFilter.value = 'recent';
            const search = document.getElementById('globalSearch');
            if (search) search.value = '';
            aplicarFiltros();
        });
    }

    const searchInput = document.getElementById('globalSearch');
    if (searchInput) searchInput.addEventListener('input', aplicarFiltros);

    const prevPage = document.getElementById('prevPage');
    if (prevPage) {
        prevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; aplicarFiltros(); } });
    }
    const nextPage = document.getElementById('nextPage');
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            const total = planes.length;
            const totalPages = Math.ceil(total / itemsPerPage);
            if (currentPage < totalPages) { currentPage++; aplicarFiltros(); }
        });
    }

    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const display = e.target.closest('.status-display');
            if (display) {
                const container = display.closest('.status-container');
                const select = container?.querySelector('.status-select');
                if (select) select.classList.toggle('show');
                return;
            }
            const option = e.target.closest('.option');
            if (option) {
                const container = option.closest('.status-container');
                const display = container?.querySelector('.status-display');
                const row = container?.closest('.table-row');
                if (row && display) {
                    const id = parseInt(row.dataset.id);
                    const nuevoEstado = option.dataset.value;
                    try {
                        await updatePlan(id, { estado: nuevoEstado });
                        const p = planes.find(pr => pr.id_plan === id);
                        if (p) p.estado = nuevoEstado;
                        aplicarFiltros();
                    } catch (error) { console.error(error); alert('Error al actualizar estado.'); }
                }
            }

            const btnEliminar = e.target.closest('.btn-eliminar-plan');
            if (btnEliminar) {
                const id = parseInt(btnEliminar.dataset.id);
                const nombre = btnEliminar.dataset.nombre || 'este plan';
                if (confirm(`¿Eliminar el plan "${nombre}"? Esta acción no se puede deshacer.`)) {
                    try {
                        await deletePlan(id);
                        planes = planes.filter(p => p.id_plan !== id);
                        aplicarFiltros();
                        alert('✅ Plan eliminado correctamente.');
                    } catch (error) {
                        console.error(error);
                        alert('Error al eliminar el plan.');
                    }
                }
            }
        });
    }

    document.addEventListener('click', () => document.querySelectorAll('.status-select.show').forEach(el => el.classList.remove('show')));

    const addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) addNoteBtn.addEventListener('click', agregarNota);
    const newNoteInput = document.getElementById('newNoteInput');
    if (newNoteInput) {
        newNoteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') agregarNota(); });
    }

    const notesList = document.getElementById('notesList');
    if (notesList) {
        notesList.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-eliminar-nota');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                if (confirm('¿Eliminar esta nota?')) {
                    notas = notas.filter(n => n.id_nota !== id);
                    renderizarNotas(notas);
                }
            }
        });
    }

    const btnCrear = document.getElementById('btnCrearPrescripcion');
    if (btnCrear) {
        btnCrear.addEventListener('click', () => {
            window.location.hash = `editor-plan/nuevo/${pacienteId}`;
        });
    }
    const fabMobile = document.getElementById('fabMobile');
    if (fabMobile) {
        fabMobile.addEventListener('click', () => {
            window.location.hash = `editor-plan/nuevo/${pacienteId}`;
        });
    }

    const resumenEvolucion = document.getElementById('resumenEvolucion');
    if (resumenEvolucion) {
        resumenEvolucion.addEventListener('blur', async () => {
            const contenido = document.getElementById('resumenContenido')?.textContent.trim();
            if (contenido) {
                try { await updatePatient(pacienteId, { resumen: contenido }); } catch (error) { console.error(error); }
            }
        });
    }
}

function calcularHace(fecha) {
    const ahora = new Date();
    const diff = ahora - fecha;
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
    return `Hace ${Math.floor(dias / 365)} años`;
}

async function agregarNota() {
    const input = document.getElementById('newNoteInput');
    const texto = input?.value.trim();
    if (!texto) return;
    const nuevaNota = { id_paciente: pacienteId, contenido: texto, fecha: new Date().toISOString(), tipo: 'importante' };
    try {
        const newId = await addNota(nuevaNota);
        notas.push({ ...nuevaNota, id_nota: newId });
        renderizarNotas(notas);
        if (input) {
            input.value = '';
            input.focus();
        }
    } catch (error) { console.error(error); alert('Error al agregar nota.'); }
}

module.exports = {
    initPrescripciones
};