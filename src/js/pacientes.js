const { getPatients, deletePatient, updatePatientStatus } = require('./dataService.js');

let patients = [];
let currentFilter = '';

async function initPacientes() {
    const tbody = document.getElementById('patientsBody');
    const searchInput = document.getElementById('searchPatient');
    const noResults = document.getElementById('noResultsMessage');
    const visibleCount = document.getElementById('visibleCount');

    if (!tbody) return;

    await loadPatients();

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            filterAndRender(query);
        });
    }

    const btnNuevo = document.getElementById('btnNuevoPaciente');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            window.location.hash = 'expediente/nuevo';
        });
    }

    setupConfirmModal();
}

async function loadPatients() {
    patients = await getPatients();
    renderPatients(patients);
}

function renderPatients(data) {
    const tbody = document.getElementById('patientsBody');
    const noResults = document.getElementById('noResultsMessage');
    const visibleCount = document.getElementById('visibleCount');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (data.length === 0) {
        if (noResults) noResults.style.display = 'block';
        if (visibleCount) visibleCount.textContent = '0';
        return;
    }

    if (noResults) noResults.style.display = 'none';
    if (visibleCount) visibleCount.textContent = data.length;

    data.forEach(p => {
        const initials = p.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const estadoClass = p.estado === 'Activo' ? 'status-confirmed' : 'status-pending';
        const ultimaConsulta = p.ultima_consulta || '—';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="patient-cell">
                    <div class="patient-avatar" style="background:var(--color-primary-light);color:var(--color-primary-text);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;width:40px;height:40px;border-radius:50%;flex-shrink:0;">${initials}</div>
                    <div>
                        <p class="patient-name">${p.nombre}</p>
                        <p class="patient-email">${p.email || '—'}</p>
                    </div>
                </div>
            </td>
            <td><span class="font-mono">${p.expediente || '#NF-0000'}</span></td>
            <td>
                <div class="date-cell">
                    <span class="date-main">${ultimaConsulta}</span>
                </div>
            </td>
            <td>
                <span class="status-pill ${estadoClass}" data-id="${p.id_paciente}" data-estado="${p.estado}">${p.estado}</span>
            </td>
            <td class="text-right">
                <div class="action-group">
                    <a href="#" data-view="expediente" data-id="${p.id_paciente}" class="btn-table-action">Ver</a>
                    <a href="#" data-view="seguimiento" data-id="${p.id_paciente}" class="btn-table-action-follow">Seguimiento</a>
                    <a href="#" data-view="prescripciones" data-id="${p.id_paciente}" class="btn-table-action" style="background:#e8e3d8;color:#4a4335;">Planes</a>
                    <button class="btn-icon-subtle danger" data-id="${p.id_paciente}" data-nombre="${p.nombre}" title="Eliminar paciente">
                        <span class="material-symbols-outlined" style="font-size:20px;">delete</span>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll('.status-pill').forEach(badge => {
        badge.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const estadoActual = this.dataset.estado;
            const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
            cambiarEstadoPaciente(id, nuevoEstado);
        });
    });

    document.querySelectorAll('.btn-icon-subtle.danger').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const nombre = this.dataset.nombre || 'este paciente';
            abrirConfirmacion(id, nombre);
        });
    });
}

function filterAndRender(query) {
    let filtered = patients;
    if (query) {
        filtered = patients.filter(p =>
            p.nombre.toLowerCase().includes(query) ||
            (p.estado && p.estado.toLowerCase().includes(query))
        );
    }
    renderPatients(filtered);
}

async function cambiarEstadoPaciente(id, nuevoEstado) {
    try {
        await updatePatientStatus(id, nuevoEstado);
        const patient = patients.find(p => p.id_paciente === id);
        if (patient) {
            patient.estado = nuevoEstado;
        }
        const searchInput = document.getElementById('searchPatient');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        filterAndRender(query);
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar el estado del paciente.');
    }
}

let pacienteAEliminar = null;

function setupConfirmModal() {
    const modal = document.getElementById('modalConfirmacionPaciente');
    const mainWrapper = document.getElementById('mainWrapper');
    const btnCancelar = document.getElementById('btnCancelarPaciente');
    const btnConfirmar = document.getElementById('btnConfirmarPaciente');
    const modalText = document.getElementById('modalConfirmPacienteText');

    if (!modal || !btnCancelar || !btnConfirmar) {
        console.warn('Modal de confirmación de paciente no encontrado');
        return;
    }

    function cerrarConfirmacion() {
        modal.classList.remove('active');
        if (mainWrapper) mainWrapper.classList.remove('modal-blur');
        document.body.style.overflow = '';
        pacienteAEliminar = null;
    }

    btnCancelar.addEventListener('click', cerrarConfirmacion);
    btnConfirmar.addEventListener('click', async () => {
        if (pacienteAEliminar) {
            try {
                await deletePatient(pacienteAEliminar.id);
                patients = patients.filter(p => p.id_paciente !== pacienteAEliminar.id);
                const searchInput = document.getElementById('searchPatient');
                const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
                filterAndRender(query);
                cerrarConfirmacion();
            } catch (error) {
                console.error('Error al eliminar paciente:', error);
                alert('Error al eliminar el paciente.');
            }
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarConfirmacion();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) cerrarConfirmacion();
    });
}

function abrirConfirmacion(id, nombre) {
    const modal = document.getElementById('modalConfirmacionPaciente');
    const mainWrapper = document.getElementById('mainWrapper');
    const modalText = document.getElementById('modalConfirmPacienteText');

    if (!modal) return;

    pacienteAEliminar = { id, nombre };
    if (modalText) modalText.textContent = `¿Eliminar al paciente "${nombre}"? Esta acción no se puede deshacer y eliminará todas sus citas, seguimientos y planes.`;
    modal.classList.add('active');
    if (mainWrapper) mainWrapper.classList.add('modal-blur');
    document.body.style.overflow = 'hidden';
}

module.exports = {
    initPacientes
};