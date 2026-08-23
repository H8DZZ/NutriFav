const { seedData } = require('./src/js/dataService.js');
const { initAppointmentModal } = require('./src/js/appointments.js');
const { initTaskModal, setupTaskDelegation } = require('./src/js/tasks.js');
const { ipcRenderer } = require('electron');

seedData();

const initMap = {
    dashboard: require('./src/js/dashboard.js').initDashboard,
    agenda: require('./src/js/agenda.js').initAgenda,
    citas: require('./src/js/citas.js').initCitas,
    'detalle-cita': require('./src/js/detalle-cita.js').initDetalleCita,
    pacientes: require('./src/js/pacientes.js').initPacientes,
    expediente: require('./src/js/expediente.js').initExpediente,
    seguimiento: require('./src/js/seguimiento.js').initSeguimiento,
    'registro-seguimiento': require('./src/js/registro-seguimiento.js').initRegistroSeguimiento,
    fotos: require('./src/js/fotos.js').initFotos,
    planes: require('./src/js/planes.js').initPlanes,
    prescripciones: require('./src/js/prescripciones.js').initPrescripciones,
    'editor-plan': require('./src/js/editor-plan.js').initEditorPlan
};

const content = document.getElementById('appContent');
const navItems = document.querySelectorAll('.nav-item');
let currentView = 'dashboard';
let isTransitioning = false;

async function loadView(viewName, params = {}) {
    if (isTransitioning) return;
    isTransitioning = true;
    try {
        content.style.opacity = '0';
        content.style.transform = 'scale(0.98)';
        const response = await fetch(`views/${viewName}.html`);
        if (!response.ok) throw new Error(`Vista "${viewName}" no encontrada (${response.status})`);
        content.innerHTML = await response.text();
        await new Promise(resolve => requestAnimationFrame(resolve));

        const initFn = initMap[viewName];
        if (initFn) {
            if (params.param) {
                await initFn(params.param);
            } else if (params.id && params.tipo) {
                await initFn(params.id, params.tipo);
            } else if (params.id) {
                await initFn(params.id);
            } else {
                await initFn();
            }
        }

        requestAnimationFrame(() => {
            content.style.opacity = '1';
            content.style.transform = 'scale(1)';
        });

        navItems.forEach(item => item.classList.remove('active'));
        const active = document.querySelector(`[data-view="${viewName}"]`);
        if (active) active.classList.add('active');
        currentView = viewName;
        window.currentView = viewName;
    } catch (e) {
        console.error('Error al cargar vista:', e);
        content.innerHTML = `<div style="padding:40px;text-align:center;color:#c0392b;"><span class="material-symbols-outlined" style="font-size:48px;">error</span><p><strong>Error:</strong> ${e.message}</p></div>`;
        content.style.opacity = '1';
        content.style.transform = 'scale(1)';
    } finally {
        isTransitioning = false;
    }
}

function navigateFromHash() {
    let hash = window.location.hash.slice(1) || 'dashboard';
    if (hash === 'nuevo-paciente') {
        hash = 'expediente/nuevo';
        window.history.replaceState(null, '', `#${hash}`);
    }
    const parts = hash.split('/');
    const viewName = parts[0];
    const id = parts[1] || null;
    const tipo = parts[2] || null;
    if (viewName) {
        let param = null;
        if (parts.length > 1) {
            param = parts.slice(1).join('/');
        }
        loadView(viewName, { id, tipo, param });
    }
}

initTaskModal();
setupTaskDelegation();
initAppointmentModal();

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view && view !== currentView) {
            window.history.pushState(null, '', `#${view}`);
            loadView(view);
        }
    });
});

content.addEventListener('click', (e) => {
    const link = e.target.closest('[data-view]');
    if (link) {
        e.preventDefault();
        const view = link.dataset.view;
        const id = link.dataset.id;
        const tipo = link.dataset.tipo || null;
        if (view === 'editor-plan' && link.dataset.nuevo) {
            const param = `nuevo/${id}`;
            window.history.pushState(null, '', `#${view}/${param}`);
            loadView(view, { param });
        } else if (view === 'registro-seguimiento' && tipo === 'sesion') {
            window.history.pushState(null, '', `#${view}/${id}/${tipo}`);
            loadView(view, { id, tipo });
        } else {
            const hash = id ? `#${view}/${id}` : `#${view}`;
            window.history.pushState(null, '', hash);
            loadView(view, { id });
        }
    }
});

window.addEventListener('hashchange', navigateFromHash);
window.addEventListener('popstate', navigateFromHash);
navigateFromHash();

function updateClock() {
    const now = new Date();
    const opts = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('es-ES', opts);
}
updateClock();
setInterval(updateClock, 60000);

document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.invoke('logout');
});