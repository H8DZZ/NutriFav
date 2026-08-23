const { getAllAppointments, updateAppointmentStatus } = require('./dataService.js');

let citas = [];
let tbody, summaryContainer, paginationInfo;
let searchInput, fechaDesde, fechaHasta, statusFilter;
let currentAdminId = null;

async function initCitas() {
    tbody = document.getElementById('appointmentsBody');
    summaryContainer = document.getElementById('summaryCards');
    paginationInfo = document.getElementById('paginationInfo');
    searchInput = document.getElementById('patientSearch');
    fechaDesde = document.getElementById('fechaDesde');
    fechaHasta = document.getElementById('fechaHasta');
    statusFilter = document.getElementById('statusFilter');

    const user = window.userData;
    if (user && user.id_admin) {
        currentAdminId = user.id_admin;
    }

    if (!tbody) return;

    await loadData();
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (fechaDesde) fechaDesde.addEventListener('change', applyFilters);
    if (fechaHasta) fechaHasta.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    setupConfirmModal();

    const btnNuevaCita = document.getElementById('btnNuevaCita');
    if (btnNuevaCita) {
        btnNuevaCita.addEventListener('click', () => {
            const modal = document.getElementById('modalNuevaCita');
            if (modal) modal.classList.add('active');
            const wrapper = document.getElementById('mainWrapper');
            if (wrapper) wrapper.classList.add('modal-blur');
            document.body.style.overflow = 'hidden';
        });
    }
}

async function loadData() {
    citas = await getAllAppointments(currentAdminId);
    renderStats();
    renderTable(citas);
    updatePagination(citas.length);
}

function renderStats() {
    const total = citas.length;
    const confirmadas = citas.filter(c => c.estado === 'CONFIRMADO').length;
    const canceladas = citas.filter(c => c.estado === 'CANCELADO').length;
    const pendientes = citas.filter(c => c.estado === 'INASISTENCIA' || c.estado === 'PENDIENTE').length;
    const atendidas = citas.filter(c => c.estado === 'ATENDIDA').length;

    if (!summaryContainer) return;
    summaryContainer.innerHTML = `
        <div class="card summary-card">
            <div class="card-icon-wrapper"><span class="material-symbols-outlined">pending_actions</span></div>
            <div>
                <p class="card-label">PENDIENTES</p>
                <h3 class="card-value">${pendientes}</h3>
                <p class="card-subtext">${atendidas} completadas</p>
            </div>
        </div>
        <div class="card summary-card">
            <div class="card-icon-wrapper"><span class="material-symbols-outlined">event_available</span></div>
            <div>
                <p class="card-label">CONFIRMADAS</p>
                <h3 class="card-value">${confirmadas}</h3>
            </div>
        </div>
        <div class="card summary-card">
            <div class="card-icon-wrapper"><span class="material-symbols-outlined">cancel</span></div>
            <div>
                <p class="card-label">CANCELADAS</p>
                <h3 class="card-value">${canceladas}</h3>
            </div>
        </div>
    `;
}

function renderTable(data) {
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;">No hay citas.</td></tr>`;
        return;
    }
    const estadoMap = {
        'CONFIRMADO': { label: 'Confirmada', class: 'badge-confirmed' },
        'INASISTENCIA': { label: 'Inasistencia', class: 'badge-pending' },
        'ATENDIDA': { label: 'Atendida', class: 'badge-attended' },
        'CANCELADO': { label: 'Cancelada', class: 'badge-canceled' },
        'PENDIENTE': { label: 'Pendiente', class: 'badge-pending' }
    };

    tbody.innerHTML = data.map(c => {
        const fecha = new Date(c.fecha_cita);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][fecha.getMonth()];
        const year = fecha.getFullYear();
        const hora = c.hora_cita.slice(0,5);
        const initials = c.paciente_nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const avatarClass = `avatar-${(c.id_citas % 4) + 1}`;
        const estadoInfo = estadoMap[c.estado] || { label: c.estado || 'Desconocido', class: 'badge-neutral' };
        return `
            <tr data-status="${c.estado}" data-paciente="${c.paciente_nombre}" data-fecha="${c.fecha_cita}">
                <td>
                    <div class="patient-cell">
                        <div class="patient-avatar ${avatarClass}">${initials}</div>
                        <div>
                            <p class="patient-name">${c.paciente_nombre}</p>
                            <p class="patient-reason">${c.contexto_cita || 'Consulta'}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="date-cell">
                        <span class="date-primary">${dia} ${mes}, ${year}</span>
                        <span class="date-secondary">${hora}</span>
                    </div>
                </td>
                <td>
                    <span class="badge badge-status ${estadoInfo.class}">
                        <span class="status-dot"></span>
                        ${estadoInfo.label}
                    </span>
                </td>
                <td class="text-center">
                    <div class="row-actions">
                        <a href="#" data-view="detalle-cita" data-id="${c.id_citas}" 
                           class="action-btn" title="Ver detalles"
                           style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; color:var(--color-primary, #4a633b); text-decoration:none; transition:0.2s; border:none; cursor:pointer; background:transparent;">
                            <span class="material-symbols-outlined" style="font-size:24px;">visibility</span>
                        </a>
                        <button data-id="${c.id_citas}" data-paciente="${c.paciente_nombre}" 
                                class="action-btn btn-cancelar"
                                title="Cancelar cita"
                                style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; color:var(--text-danger, #c0392b); border:none; cursor:pointer; transition:0.2s; background:transparent;">
                            <span class="material-symbols-outlined" style="font-size:24px;">cancel</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function applyFilters() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const desde = fechaDesde ? fechaDesde.value : '';
    const hasta = fechaHasta ? fechaHasta.value : '';
    const status = statusFilter ? statusFilter.value : 'all';

    const filtered = citas.filter(c => {
        const matchNombre = c.paciente_nombre.toLowerCase().includes(search);
        const fechaCita = c.fecha_cita;
        let matchFecha = true;
        if (desde && fechaCita < desde) matchFecha = false;
        if (hasta && fechaCita > hasta) matchFecha = false;
        const matchEstado = (status === 'all') || (c.estado === status);
        return matchNombre && matchFecha && matchEstado;
    });
    renderTable(filtered);
    updatePagination(filtered.length);
}

function updatePagination(count) {
    if (paginationInfo) paginationInfo.textContent = `Mostrando ${count} entradas`;
}

function setupConfirmModal() {
    const modal = document.getElementById('modalConfirmacion');
    const mainWrapper = document.getElementById('mainWrapper');
    const btnCancelar = document.getElementById('btnCancelarConfirmacion');
    const btnConfirmar = document.getElementById('btnConfirmarAccion');
    const modalText = document.getElementById('modalConfirmText');

    if (!modal || !btnCancelar || !btnConfirmar || !modalText) {
        console.warn('Modal global no encontrado');
        return;
    }

    let citaIdToCancel = null;

    function abrirConfirm(nombre, id) {
        citaIdToCancel = id;
        modalText.textContent = `¿Cancelar cita de "${nombre}"? Esta acción no se puede deshacer.`;
        modal.classList.add('active');
        if (mainWrapper) mainWrapper.classList.add('modal-blur');
        document.body.style.overflow = 'hidden';
    }

    function cerrarConfirm() {
        modal.classList.remove('active');
        if (mainWrapper) mainWrapper.classList.remove('modal-blur');
        document.body.style.overflow = '';
        citaIdToCancel = null;
    }

    btnCancelar.addEventListener('click', cerrarConfirm);
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrarConfirm(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) cerrarConfirm();
    });

    btnConfirmar.addEventListener('click', async () => {
        if (citaIdToCancel) {
            try {
                await updateAppointmentStatus(citaIdToCancel, 'CANCELADO');
                await loadData();
                applyFilters();
                cerrarConfirm();
            } catch (error) {
                console.error('Error al cancelar cita:', error);
                alert('Error al cancelar la cita.');
            }
        }
    });

    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-cancelar');
            if (btn) {
                e.preventDefault();
                const nombre = btn.dataset.paciente || 'este paciente';
                const id = parseInt(btn.dataset.id);
                abrirConfirm(nombre, id);
            }
        });
    }
}

module.exports = { initCitas };