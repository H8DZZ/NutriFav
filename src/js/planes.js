const { getPlans, getPatients } = require('./dataService.js');

let planes = [];
let filtroActual = 'all';

async function initPlanes() {
    planes = await getPlans();
    renderizarPlanes(planes);
    configurarTabs();
    configurarBusqueda();
    configurarBotonNuevoPlan();
}

function configurarBotonNuevoPlan() {
    const btn = document.getElementById('btnCrearPlanDesdePlanes');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalSeleccionarPaciente();
        });
    } else {
        console.warn('Botón "Crear Nuevo Plan" no encontrado en el DOM.');
    }
}

function abrirModalSeleccionarPaciente() {
    const modal = document.getElementById('modalSeleccionarPaciente');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    cargarPacientesParaPlan();
}

function cerrarModalSeleccionarPaciente() {
    const modal = document.getElementById('modalSeleccionarPaciente');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

async function cargarPacientesParaPlan() {
    const container = document.getElementById('listaPacientesPlan');
    if (!container) return;
    const pacientes = await getPatients();
    if (pacientes.length === 0) {
        container.innerHTML = '<p class="empty-message">No hay pacientes registrados.</p>';
        return;
    }
    container.innerHTML = pacientes.map(p => `
        <div class="paciente-plan-item" data-id="${p.id_paciente}" data-nombre="${p.nombre}">
            <span class="avatar-letter">${p.nombre.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</span>
            <span>${p.nombre}</span>
            <span class="material-symbols-outlined" style="margin-left: auto; color: var(--color-primary);">chevron_right</span>
        </div>
    `).join('');

    container.querySelectorAll('.paciente-plan-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            window.location.hash = `editor-plan/nuevo/${id}`;
            cerrarModalSeleccionarPaciente();
        });
    });

    const search = document.getElementById('searchPacientePlan');
    if (search) {
        search.addEventListener('input', () => {
            const query = search.value.toLowerCase();
            container.querySelectorAll('.paciente-plan-item').forEach(el => {
                const nombre = el.dataset.nombre.toLowerCase();
                el.style.display = nombre.includes(query) ? 'flex' : 'none';
            });
        });
        const modal = document.getElementById('modalSeleccionarPaciente');
        if (modal) {
            const observer = new MutationObserver(() => {
                if (!modal.classList.contains('active')) {
                    search.value = '';
                    container.querySelectorAll('.paciente-plan-item').forEach(el => {
                        el.style.display = 'flex';
                    });
                }
            });
            observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
        }
    }
}

document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('#modalSeleccionarPacienteClose');
    if (closeBtn) cerrarModalSeleccionarPaciente();
    const cancelBtn = e.target.closest('#btnCancelarSeleccionarPaciente');
    if (cancelBtn) cerrarModalSeleccionarPaciente();
    const modal = document.getElementById('modalSeleccionarPaciente');
    if (e.target === modal) cerrarModalSeleccionarPaciente();
});

function renderizarPlanes(lista) {
    const grid = document.getElementById('planesGrid');
    if (!grid) return;
    if (lista.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">
                <span class="material-symbols-outlined" style="font-size:48px;display:block;margin-bottom:16px;">restaurant_menu</span>
                <p style="font-size:18px;font-weight:600;">No hay planes creados</p>
                <p style="font-size:14px;">Haz clic en "Crear Nuevo Plan"</p>
            </div>
        `;
        return;
    }
    grid.innerHTML = lista.map(plan => {
        const initials = plan.paciente_nombre.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
        const bg = `bg-${['mr','jc','al','rp'][plan.id_plan % 4]}`;
        const est = plan.estado === 'Activo' ? 'status-active' : 'status-review';
        let proteinas = 0, calorias = 0, lipidos = 0, carbohidratos = 0;
        if (plan.comidas_por_dia) {
            try {
                const comidas = JSON.parse(plan.comidas_por_dia);
                Object.values(comidas).forEach(diaComidas => {
                    diaComidas.forEach(comida => {
                        proteinas += comida.proteinas || 0;
                        calorias += (comida.proteinas || 0) * 4 + (comida.carbohidratos || 0) * 4 + (comida.grasas || 0) * 9;
                        lipidos += comida.grasas || 0;
                        carbohidratos += comida.carbohidratos || 0;
                    });
                });
            } catch(e) {}
        }
        return `
            <div class="plan-card" data-id="${plan.id_plan}" data-estado="${plan.estado}">
                <div class="card-header">
                    <div class="patient-info">
                        <div class="avatar-badge ${bg}">${initials}</div>
                        <div>
                            <h4 class="patient-name">${plan.paciente_nombre}</h4>
                            <p class="patient-details">Plan: ${plan.nombre_plan}</p>
                        </div>
                    </div>
                    <span class="status-badge ${est}">${plan.estado || 'Activo'}</span>
                </div>
                <div class="card-body">
                    <div class="plan-type">
                        <span class="material-symbols-outlined plan-icon">restaurant</span>
                        <span class="plan-title">${plan.nombre_plan}</span>
                    </div>
                    <div class="metrics-grid">
                        <div class="metric-box"><p class="metric-label">Proteínas</p><p class="metric-value">${proteinas.toFixed(1)}g <span class="metric-unit">/ día</span></p></div>
                        <div class="metric-box"><p class="metric-label">Calorías</p><p class="metric-value">${Math.round(calorias)} <span class="metric-unit">kcal</span></p></div>
                        <div class="metric-box"><p class="metric-label">Lípidos</p><p class="metric-value">${lipidos.toFixed(1)} <span class="metric-unit">gr</span></p></div>
                        <div class="metric-box"><p class="metric-label">Carbohidratos</p><p class="metric-value">${carbohidratos.toFixed(1)} <span class="metric-unit">gr</span></p></div>
                    </div>
                </div>
                <div class="card-actions">
                    <a href="#" data-view="editor-plan" data-id="${plan.id_plan}" class="btn-view">Ver Plan</a>
                </div>
            </div>
        `;
    }).join('');
}

function configurarTabs() {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active-tab'));
            this.classList.add('active-tab');
            filtroActual = this.dataset.filter;
            aplicarFiltros();
        });
    });
}

function configurarBusqueda() {
    const search = document.getElementById('searchPatient');
    if (search) search.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
    const searchInput = document.getElementById('searchPatient');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let filtrados = planes;
    if (filtroActual === 'activo') filtrados = filtrados.filter(p => p.estado === 'Activo');
    else if (filtroActual === 'completado') filtrados = filtrados.filter(p => p.estado === 'Completado');
    if (query) filtrados = filtrados.filter(p => p.paciente_nombre.toLowerCase().includes(query) || p.nombre_plan.toLowerCase().includes(query));
    renderizarPlanes(filtrados);
}

module.exports = { initPlanes };