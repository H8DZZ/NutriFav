const { addAppointment, getPatients, getAdministradores } = require('./dataService.js');

let modal = null;
let mainWrapper = null;
let selectedPatientId = null;
let administradores = [];

function openModal() {
    modal = document.getElementById('modalNuevaCita');
    mainWrapper = document.getElementById('mainWrapper');
    if (!modal) return;
    modal.classList.add('active');
    if (mainWrapper) mainWrapper.classList.add('modal-blur');
    document.body.style.overflow = 'hidden';
    setDefaultDate();
    loadAutocompletePatients();
    loadAdministradores();
    selectedPatientId = null;
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    if (mainWrapper) mainWrapper.classList.remove('modal-blur');
    document.body.style.overflow = '';
    const form = document.getElementById('formNuevaCita');
    if (form) form.reset();
    const durationInput = document.getElementById('durationInput');
    if (durationInput) durationInput.value = 45;
    const pacienteInput = document.getElementById('pacienteInput');
    if (pacienteInput) pacienteInput.value = '';
    const dropdown = document.getElementById('autocompleteDropdown');
    if (dropdown) dropdown.classList.remove('open');
    selectedPatientId = null;
}

function setDefaultDate() {
    const fechaInput = document.getElementById('fechaInput');
    if (fechaInput) {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        fechaInput.value = `${yyyy}-${mm}-${dd}`;
    }
}

async function loadAutocompletePatients() {
    const dropdown = document.getElementById('autocompleteDropdown');
    if (!dropdown) return;
    const pacientes = await getPatients();
    dropdown.innerHTML = pacientes.map(p => `
        <div class="autocomplete-item" data-id="${p.id_paciente}" data-name="${p.nombre}">
            <span class="avatar-letter">${p.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}</span>
            <span>${p.nombre}</span>
        </div>
    `).join('');
}

async function loadAdministradores() {
    try {
        administradores = await getAdministradores();
        const adminSelect = document.getElementById('adminSelect');
        if (!adminSelect) return;
        
        if (administradores.length === 0) {
            adminSelect.innerHTML = `
                <option value="1">Administrador (por defecto)</option>
            `;
            return;
        }
        
        adminSelect.innerHTML = administradores.map(admin => `
            <option value="${admin.id_admin}">${admin.nombre_admin} ${admin.rol ? '· ' + admin.rol : ''}</option>
        `).join('');
    } catch (error) {
        console.error('Error al cargar administradores:', error);
        const adminSelect = document.getElementById('adminSelect');
        if (adminSelect) {
            adminSelect.innerHTML = `
                <option value="1">Administrador</option>
            `;
        }
    }
}

function initAppointmentModal() {
    if (window._appointmentModalInitialized) return;
    window._appointmentModalInitialized = true;

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('#btnNuevaCita');
        if (btn) {
            e.preventDefault();
            openModal();
        }
    });

    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    const btnCancelar = document.getElementById('btnCancelarModal');
    if (btnCancelar) btnCancelar.addEventListener('click', closeModal);

    const modalBackdrop = document.getElementById('modalNuevaCita');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeModal();
    });

    const durationMinus = document.getElementById('durationMinus');
    const durationPlus = document.getElementById('durationPlus');
    const durationInput = document.getElementById('durationInput');

    if (durationMinus) {
        durationMinus.addEventListener('click', () => {
            let val = parseInt(durationInput.value) || 0;
            val = Math.max(15, val - 15);
            durationInput.value = val;
        });
    }

    if (durationPlus) {
        durationPlus.addEventListener('click', () => {
            let val = parseInt(durationInput.value) || 0;
            val = Math.min(120, val + 15);
            durationInput.value = val;
        });
    }

    const pacienteInput = document.getElementById('pacienteInput');
    const dropdown = document.getElementById('autocompleteDropdown');

    if (pacienteInput) {
        pacienteInput.addEventListener('focus', () => {
            if (dropdown) dropdown.classList.add('open');
        });

        pacienteInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (dropdown) dropdown.classList.remove('open');
                if (pacienteInput.value.trim() === '') {
                    selectedPatientId = null;
                }
            }, 200);
        });

        pacienteInput.addEventListener('input', () => {
            const query = pacienteInput.value.toLowerCase();
            if (!dropdown) return;
            dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                const name = item.dataset.name || '';
                item.style.display = name.toLowerCase().includes(query) ? 'flex' : 'none';
            });
            if (dropdown.querySelector('.autocomplete-item[style*="display: flex"]')) {
                dropdown.classList.add('open');
            } else {
                dropdown.classList.remove('open');
            }
            selectedPatientId = null;
        });
    }

    if (dropdown) {
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (item && pacienteInput) {
                pacienteInput.value = item.dataset.name || '';
                selectedPatientId = parseInt(item.dataset.id) || null;
                dropdown.classList.remove('open');
            }
        });
    }

    const form = document.getElementById('formNuevaCita');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!selectedPatientId) {
                alert('⚠️ Por favor, selecciona un paciente de la lista (escribe y elige uno).');
                return;
            }

            const fechaInput = document.getElementById('fechaInput');
            const horaInput = document.getElementById('horaInput');
            const durationInput = document.getElementById('durationInput');
            const motivoTextarea = document.getElementById('motivoTextarea');
            const adminSelect = document.getElementById('adminSelect');

            const fecha = fechaInput ? fechaInput.value : '';
            const hora = horaInput ? horaInput.value : '';
            const duracion = durationInput ? parseInt(durationInput.value) : 45;
            const motivo = motivoTextarea ? motivoTextarea.value.trim() : '';
            const idAdmin = adminSelect ? parseInt(adminSelect.value) : 1;

            if (!fecha || !hora) {
                alert('⚠️ Debes seleccionar fecha y hora.');
                return;
            }

            const cita = {
                id_paciente: selectedPatientId,
                fecha_cita: fecha,
                hora_cita: hora,
                estado: 'PENDIENTE',
                contexto_cita: motivo,
                nota: `Duración: ${duracion} min`,
                documento: null,
                id_admin: idAdmin
            };

            try {
                await addAppointment(cita);
                alert('✅ ¡Cita programada con éxito!');
                closeModal();
                const currentView = window.currentView || 'dashboard';
                if (currentView === 'dashboard') {
                    const { initDashboard } = require('./dashboard.js');
                    initDashboard();
                } else if (currentView === 'agenda') {
                    const { initAgenda } = require('./agenda.js');
                    initAgenda();
                } else if (currentView === 'citas') {
                    const { initCitas } = require('./citas.js');
                    initCitas();
                }
            } catch (error) {
                console.error('Error al guardar cita:', error);
                alert('❌ Error al guardar la cita. Revisa que todos los campos estén correctos.');
            }
        });
    }
}

module.exports = {
    initAppointmentModal,
    openModal,
    closeModal
};