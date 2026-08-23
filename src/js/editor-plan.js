const { getPlanById, addPlan, updatePlan, getPatientById } = require('./dataService.js');

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
let planActual = null;
let diaActual = 0;
let planId = null;
let pacienteIdGlobal = null;

const PLAN_VACIO = { nombre_plan: 'Nuevo Plan', meta_calorias: 1600, estado: 'Activo', comidas_por_dia: {}, horas_nombres: {}, observaciones: '' };
let listenersAttached = false;

async function initEditorPlan(param) {
    listenersAttached = false;

    let idPlan = null, idPaciente = null;
    if (param) {
        if (typeof param === 'string' && param.startsWith('nuevo/')) {
            idPaciente = parseInt(param.split('/')[1]);
        } else idPlan = parseInt(param);
    }

    if (idPaciente) {
        const paciente = await getPatientById(idPaciente);
        if (paciente) {
            planActual = JSON.parse(JSON.stringify(PLAN_VACIO));
            planActual.paciente = paciente.nombre;
            planActual.id_paciente = paciente.id_paciente;
            pacienteIdGlobal = paciente.id_paciente;
            planId = null;
            const breadcrumb = document.getElementById('breadcrumbPaciente');
            if (breadcrumb) {
                breadcrumb.textContent = paciente.nombre;
                breadcrumb.dataset.id = paciente.id_paciente;
            }
            const nombreDieta = document.getElementById('nombreDieta');
            if (nombreDieta) nombreDieta.value = `Nuevo plan para ${paciente.nombre}`;
            const descripcion = document.getElementById('descripcionPlan');
            if (descripcion) descripcion.textContent = 'Crea un plan personalizado.';
            if (!planActual.comidas_por_dia || typeof planActual.comidas_por_dia !== 'object') {
                planActual.comidas_por_dia = {};
            }
            for (let i = 0; i < 7; i++) {
                if (!planActual.comidas_por_dia[i]) planActual.comidas_por_dia[i] = [];
            }
            planActual.horas_nombres = {};
            planActual.observaciones = '';
            renderizarDia(0);
            attachEvents();
            mostrarPanelOpciones();
            return;
        }
    }

    if (idPlan) {
        const plan = await getPlanById(idPlan);
        if (plan) {
            planActual = JSON.parse(JSON.stringify(plan));
            if (!planActual.comidas_por_dia || typeof planActual.comidas_por_dia !== 'object') {
                planActual.comidas_por_dia = {};
            }
            for (let i = 0; i < 7; i++) {
                if (!planActual.comidas_por_dia[i]) planActual.comidas_por_dia[i] = [];
            }
            if (!planActual.horas_nombres || typeof planActual.horas_nombres !== 'object') {
                planActual.horas_nombres = {};
            }
            planActual.observaciones = planActual.observaciones || '';

            pacienteIdGlobal = planActual.id_paciente || null;
            planId = idPlan;

            const nombreDieta = document.getElementById('nombreDieta');
            if (nombreDieta) nombreDieta.value = planActual.nombre_plan || 'Plan';
            const descripcion = document.getElementById('descripcionPlan');
            if (descripcion) descripcion.textContent = planActual.descripcion || 'Ajusta las comidas.';
            actualizarEstadoUI(planActual.estado || 'Activo');

            const breadcrumb = document.getElementById('breadcrumbPaciente');
            if (breadcrumb) {
                breadcrumb.textContent = planActual.paciente_nombre || 'Paciente';
                breadcrumb.dataset.id = planActual.id_paciente || '';
            }

            renderizarDia(0);
            attachEvents();
            mostrarPanelOpciones();
            return;
        }
    }

    alert('Por favor, selecciona un paciente primero.');
    window.location.hash = 'planes';
}

function mostrarPanelOpciones() {
    let panel = document.getElementById('panelOpcionesPlan');
    if (!panel) {
        const container = document.querySelector('.plan-editor-container') || document.getElementById('appContent');
        panel = document.createElement('div');
        panel.id = 'panelOpcionesPlan';
        panel.style.cssText = 'margin: 16px 0; padding: 16px; background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--border-color);';
        panel.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                <button id="btnEditarNombresHoras" class="btn btn-secondary" style="padding: 6px 16px;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">edit_note</span> Editar nombres de horas
                </button>
                <div style="flex: 1; min-width: 200px;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Observaciones / Recomendaciones</label>
                    <textarea id="textareaObservaciones" rows="2" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--border-color); font-family: inherit; font-size: 14px;"></textarea>
                </div>
            </div>
        `;
        const mealsContainer = document.getElementById('mealsContainer');
        if (mealsContainer && mealsContainer.parentNode) {
            mealsContainer.parentNode.insertBefore(panel, mealsContainer);
        } else {
            container.appendChild(panel);
        }
    }

    const textarea = document.getElementById('textareaObservaciones');
    if (textarea) {
        textarea.value = planActual.observaciones || '';
        textarea.addEventListener('input', function() {
            planActual.observaciones = this.value;
        });
    }

    const btn = document.getElementById('btnEditarNombresHoras');
    if (btn) {
        btn.removeEventListener('click', abrirModalNombresHoras);
        btn.addEventListener('click', abrirModalNombresHoras);
    }
}

function abrirModalNombresHoras() {
    const horasSet = new Set();
    for (let dia = 0; dia < 7; dia++) {
        const comidas = planActual.comidas_por_dia[dia] || [];
        comidas.forEach(c => {
            if (c.hora) horasSet.add(c.hora);
        });
    }
    const horasUnicas = Array.from(horasSet).sort();

    if (horasUnicas.length === 0) {
        alert('No hay comidas registradas. Añade algunas para poder personalizar los nombres de las horas.');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'modalNombresHoras';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
        z-index: 10000; display: flex; align-items: center; justify-content: center;
        padding: 20px;
    `;
    let contenido = `
        <div style="background: white; border-radius: 16px; padding: 28px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Nombres personalizados para horas</h3>
            <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">Asigna un nombre descriptivo a cada hora (ej. "Desayuno", "Comida", "Cena").</p>
    `;
    horasUnicas.forEach(hora => {
        const nombreActual = planActual.horas_nombres[hora] || '';
        contenido += `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                <span style="font-weight: 600; min-width: 60px;">${hora}</span>
                <input type="text" class="input-hora-nombre" data-hora="${hora}" value="${nombreActual}" 
                       placeholder="Nombre para esta hora" style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px;">
            </div>
        `;
    });
    contenido += `
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                <button id="btnCancelarNombres" style="padding: 8px 20px; border-radius: 10px; border: none; background: var(--bg-surface-low); font-weight: 600; cursor: pointer;">Cancelar</button>
                <button id="btnGuardarNombres" style="padding: 8px 24px; border-radius: 10px; border: none; background: var(--color-primary); color: white; font-weight: 600; cursor: pointer;">Guardar</button>
            </div>
        </div>
    `;
    modal.innerHTML = contenido;
    document.body.appendChild(modal);

    const btnGuardar = document.getElementById('btnGuardarNombres');
    const btnCancelar = document.getElementById('btnCancelarNombres');

    btnGuardar.addEventListener('click', function() {
        const inputs = modal.querySelectorAll('.input-hora-nombre');
        inputs.forEach(input => {
            const hora = input.dataset.hora;
            const valor = input.value.trim();
            if (valor) {
                planActual.horas_nombres[hora] = valor;
            } else {
                delete planActual.horas_nombres[hora];
            }
        });
        modal.remove();
        alert('Nombres actualizados. No olvides guardar el plan para conservarlos.');
    });

    btnCancelar.addEventListener('click', function() {
        modal.remove();
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });

    const keyHandler = function(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', keyHandler);
        }
    };
    document.addEventListener('keydown', keyHandler);
}

function getComidasDia(dia) {
    if (!planActual.comidas_por_dia[dia]) planActual.comidas_por_dia[dia] = [];
    return planActual.comidas_por_dia[dia];
}

function renderizarDia(dia) {
    const container = document.getElementById('mealsContainer');
    if (!container) return;
    const comidas = getComidasDia(dia);
    const label = document.getElementById('diaActualLabel');
    if (label) label.textContent = DIAS_SEMANA[dia];

    if (comidas.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:var(--text-muted);background:var(--bg-surface);border-radius:var(--radius-lg);border:2px dashed var(--border-color);">
                <span class="material-symbols-outlined" style="font-size:48px;display:block;margin-bottom:12px;">restaurant</span>
                <p style="font-weight:600;font-size:18px;">No hay comidas para este día</p>
                <p style="font-size:14px;">Haz clic en "Añadir otra comida" para comenzar</p>
            </div>
        `;
        actualizarResumen(dia);
        return;
    }

    let html = '';
    comidas.forEach(comida => {
        const icono = comida.icono || 'restaurant';
        const color = comida.color || 'primary';
        const tags = comida.etiquetas?.map(t => `<span class="tag-pill">${t}</span>`).join('') || '';
        html += `
            <div class="meal-card" data-id="${comida.id}">
                <div class="meal-header">
                    <div class="meal-title-group">
                        <span class="meal-icon-box accent" style="background-color:${color === 'primary' ? 'var(--color-secondary-bg)' : '#e8e3d8'};">
                            <span class="material-symbols-outlined">${icono}</span>
                        </span>
                        <h3 class="meal-title">${comida.nombre}</h3>
                    </div>
                    <div class="meal-controls">
                        <button class="icon-btn btn-editar-comida" data-id="${comida.id}" title="Editar"><span class="material-symbols-outlined">edit_note</span></button>
                        <label class="time-label">Hora:</label>
                        <input type="time" class="time-input" value="${comida.hora || '08:00'}" disabled>
                        <button class="icon-btn delete-btn text-error btn-eliminar-comida" data-id="${comida.id}" title="Eliminar"><span class="material-symbols-outlined">delete_outline</span></button>
                    </div>
                </div>
                <textarea class="meal-textarea h-32" disabled>${comida.descripcion || ''}</textarea>
                <div class="macro-tags">
                    ${comida.proteinas ? `<span class="tag-pill">Proteína: ${comida.proteinas}g</span>` : ''}
                    ${comida.carbohidratos ? `<span class="tag-pill">Carbs: ${comida.carbohidratos}g</span>` : ''}
                    ${comida.grasas ? `<span class="tag-pill">Grasas: ${comida.grasas}g</span>` : ''}
                    ${tags}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    actualizarResumen(dia);
}

function actualizarResumen(dia) {
    const comidas = getComidasDia(dia);
    let prot = 0, carbs = 0, grasas = 0, cal = 0;
    comidas.forEach(c => {
        prot += c.proteinas || 0;
        carbs += c.carbohidratos || 0;
        grasas += c.grasas || 0;
        cal += (c.proteinas || 0) * 4 + (c.carbohidratos || 0) * 4 + (c.grasas || 0) * 9;
    });
    const meta = planActual.meta_calorias || 1600;
    const pct = Math.min(100, (cal / meta) * 100);
    const elProt = document.getElementById('totalProteinas');
    if (elProt) elProt.textContent = prot + 'g';
    const elCarbs = document.getElementById('totalCarbohidratos');
    if (elCarbs) elCarbs.textContent = carbs + 'g';
    const elGrasas = document.getElementById('totalGrasas');
    if (elGrasas) elGrasas.textContent = grasas + 'g';
    const elCal = document.getElementById('caloriasDisplay');
    if (elCal) elCal.textContent = Math.round(cal).toLocaleString() + ' / ' + meta.toLocaleString() + ' kcal';
    const elFill = document.getElementById('caloriasProgress');
    if (elFill) elFill.style.width = pct + '%';
}

function attachEvents() {
    if (listenersAttached) return;
    listenersAttached = true;

    const dayBtns = document.querySelectorAll('.day-btn');
    dayBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const dia = parseInt(this.dataset.dia);
            diaActual = dia;
            dayBtns.forEach((b, i) => b.classList.toggle('active', i === dia));
            renderizarDia(dia);
        });
    });

    const addBtn = document.getElementById('btnAddMeal');
    if (addBtn) addBtn.addEventListener('click', () => abrirModalEditar(null));

    const guardarBtn = document.getElementById('btnGuardarPlan');
    if (guardarBtn) guardarBtn.addEventListener('click', guardarPlan);

    const pdfBtn = document.getElementById('btnGenerarPDF');
    if (pdfBtn) pdfBtn.addEventListener('click', generarPDF);

    const mealsContainer = document.getElementById('mealsContainer');
    if (mealsContainer) {
        mealsContainer.addEventListener('click', (e) => {
            const editar = e.target.closest('.btn-editar-comida');
            if (editar) {
                const id = editar.dataset.id;
                const comidas = getComidasDia(diaActual);
                const comida = comidas.find(c => c.id === id);
                if (comida) abrirModalEditar(comida);
                return;
            }
            const eliminar = e.target.closest('.btn-eliminar-comida');
            if (eliminar) {
                const id = eliminar.dataset.id;
                const comidas = getComidasDia(diaActual);
                const comida = comidas.find(c => c.id === id);
                if (comida) {
                    const confirmText = document.getElementById('modalConfirmEliminarText');
                    if (confirmText) confirmText.textContent = `¿Eliminar "${comida.nombre}"?`;
                    const confirmModal = document.getElementById('modalConfirmacionEliminarComida');
                    if (confirmModal) confirmModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    window.comidaAEliminar = { id, dia: diaActual };
                }
            }
        });
    }

    const editarCalorias = document.getElementById('btnEditarCalorias');
    if (editarCalorias) {
        editarCalorias.addEventListener('click', () => {
            const caloriasInput = document.getElementById('caloriasInput');
            if (caloriasInput) caloriasInput.value = planActual.meta_calorias || 1600;
            const modal = document.getElementById('modalEditarCalorias');
            if (modal) modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    function cerrarModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    const modalCaloriasClose = document.getElementById('modalCaloriasClose');
    if (modalCaloriasClose) modalCaloriasClose.addEventListener('click', () => cerrarModal('modalEditarCalorias'));
    const btnCancelarCalorias = document.getElementById('btnCancelarCalorias');
    if (btnCancelarCalorias) btnCancelarCalorias.addEventListener('click', () => cerrarModal('modalEditarCalorias'));

    const modalEditarClose = document.getElementById('modalEditarClose');
    if (modalEditarClose) modalEditarClose.addEventListener('click', () => cerrarModal('modalEditarComida'));
    const btnCancelarEditar = document.getElementById('btnCancelarEditar');
    if (btnCancelarEditar) btnCancelarEditar.addEventListener('click', () => cerrarModal('modalEditarComida'));

    const modalEditarCalorias = document.getElementById('modalEditarCalorias');
    if (modalEditarCalorias) {
        modalEditarCalorias.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) cerrarModal('modalEditarCalorias');
        });
    }
    const modalEditarComida = document.getElementById('modalEditarComida');
    if (modalEditarComida) {
        modalEditarComida.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) cerrarModal('modalEditarComida');
        });
    }

    const formEditarComida = document.getElementById('formEditarComida');
    if (formEditarComida) {
        formEditarComida.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarComida();
        });
    }

    const formEditarCalorias = document.getElementById('formEditarCalorias');
    if (formEditarCalorias) {
        formEditarCalorias.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = parseInt(document.getElementById('caloriasInput')?.value);
            if (val > 0) planActual.meta_calorias = val;
            actualizarResumen(diaActual);
            cerrarModal('modalEditarCalorias');
        });
    }

    const btnCancelarEliminar = document.getElementById('btnCancelarEliminarComida');
    if (btnCancelarEliminar) {
        btnCancelarEliminar.addEventListener('click', () => {
            cerrarModal('modalConfirmacionEliminarComida');
            window.comidaAEliminar = null;
        });
    }
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminarComida');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', () => {
            if (window.comidaAEliminar) {
                const { id, dia } = window.comidaAEliminar;
                const comidas = getComidasDia(dia);
                const idx = comidas.findIndex(c => c.id === id);
                if (idx !== -1) comidas.splice(idx, 1);
                renderizarDia(diaActual);
                cerrarModal('modalConfirmacionEliminarComida');
                window.comidaAEliminar = null;
            }
        });
    }
    const modalConfirmEliminar = document.getElementById('modalConfirmacionEliminarComida');
    if (modalConfirmEliminar) {
        modalConfirmEliminar.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                cerrarModal('modalConfirmacionEliminarComida');
                window.comidaAEliminar = null;
            }
        });
    }

    const btnAddTag = document.getElementById('btnAddTag');
    if (btnAddTag) {
        btnAddTag.addEventListener('click', () => {
            const input = document.getElementById('newTagInput');
            if (!input) return;
            const text = input.value.trim();
            if (text) {
                const container = document.getElementById('tagContainer');
                if (!container) return;
                const pill = document.createElement('span');
                pill.className = 'tag-pill-modal';
                pill.innerHTML = text + ' <button type="button" class="remove-tag"><span class="material-symbols-outlined">close</span></button>';
                container.insertBefore(pill, input);
                input.value = '';
                pill.querySelector('.remove-tag')?.addEventListener('click', () => pill.remove());
            }
        });
    }
    const newTagInput = document.getElementById('newTagInput');
    if (newTagInput) {
        newTagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btnAddTag')?.click(); }
        });
    }

    const estadoDisplay = document.getElementById('estadoDisplay');
    if (estadoDisplay) {
        estadoDisplay.addEventListener('click', function(e) {
            e.stopPropagation();
            const select = document.getElementById('statusSelectPlan');
            if (select) select.classList.toggle('show');
        });
    }
    document.querySelectorAll('#statusSelectPlan .option').forEach(opt => {
        opt.addEventListener('click', function(e) {
            e.stopPropagation();
            planActual.estado = this.dataset.value;
            actualizarEstadoUI(this.dataset.value);
            const select = document.getElementById('statusSelectPlan');
            if (select) select.classList.remove('show');
        });
    });
    document.addEventListener('click', () => {
        const select = document.getElementById('statusSelectPlan');
        if (select) select.classList.remove('show');
    });

    const nombreDieta = document.getElementById('nombreDieta');
    if (nombreDieta) {
        nombreDieta.addEventListener('input', function() {
            planActual.nombre_plan = this.value || 'Plan';
        });
    }

    document.querySelectorAll('#iconSelector .icon-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#iconSelector .icon-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    document.querySelectorAll('#colorSelector .color-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#colorSelector .color-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function actualizarEstadoUI(estado) {
    const display = document.getElementById('estadoDisplay');
    if (!display) return;
    display.textContent = estado;
    display.dataset.status = estado;
    display.className = 'status-display';
    if (estado === 'Activo') display.classList.add('status-chip-active');
    else if (estado === 'Completado') display.classList.add('status-chip-completed');
    else if (estado === 'Cancelado') display.classList.add('status-chip-cancelled');
}

function abrirModalEditar(comida) {
    const modal = document.getElementById('modalEditarComida');
    if (!modal) return;
    if (comida) {
        document.getElementById('editComidaId').value = comida.id;
        document.getElementById('mealName').value = comida.nombre || '';
        document.getElementById('mealTime').value = comida.hora || '08:00';
        document.getElementById('mealDesc').value = comida.descripcion || '';
        document.getElementById('editProteinas').value = comida.proteinas || 0;
        document.getElementById('editCarbohidratos').value = comida.carbohidratos || 0;
        document.getElementById('editGrasas').value = comida.grasas || 0;
        document.querySelectorAll('#iconSelector .icon-option').forEach(b => b.classList.toggle('active', b.dataset.icon === comida.icono));
        document.querySelectorAll('#colorSelector .color-option').forEach(b => b.classList.toggle('active', b.dataset.color === comida.color));
        const container = document.getElementById('tagContainer');
        if (container) {
            container.querySelectorAll('.tag-pill-modal').forEach(el => el.remove());
            if (comida.etiquetas) {
                comida.etiquetas.forEach(tag => {
                    const pill = document.createElement('span');
                    pill.className = 'tag-pill-modal';
                    pill.innerHTML = tag + ' <button type="button" class="remove-tag"><span class="material-symbols-outlined">close</span></button>';
                    container.insertBefore(pill, document.getElementById('newTagInput'));
                    pill.querySelector('.remove-tag')?.addEventListener('click', () => pill.remove());
                });
            }
        }
        const titulo = document.getElementById('modalComidaTitulo');
        if (titulo) titulo.textContent = `Editar: ${comida.nombre}`;
    } else {
        document.getElementById('editComidaId').value = '';
        document.getElementById('mealName').value = '';
        document.getElementById('mealTime').value = '08:00';
        document.getElementById('mealDesc').value = '';
        document.getElementById('editProteinas').value = 0;
        document.getElementById('editCarbohidratos').value = 0;
        document.getElementById('editGrasas').value = 0;
        document.querySelectorAll('#iconSelector .icon-option').forEach((b, i) => b.classList.toggle('active', i === 0));
        document.querySelectorAll('#colorSelector .color-option').forEach((b, i) => b.classList.toggle('active', i === 0));
        const container = document.getElementById('tagContainer');
        if (container) container.querySelectorAll('.tag-pill-modal').forEach(el => el.remove());
        const titulo = document.getElementById('modalComidaTitulo');
        if (titulo) titulo.textContent = 'Nueva Comida';
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function guardarComida() {
    const id = document.getElementById('editComidaId').value;
    const nombre = document.getElementById('mealName').value.trim();
    const hora = document.getElementById('mealTime').value;
    const descripcion = document.getElementById('mealDesc').value.trim();
    const prot = parseInt(document.getElementById('editProteinas').value) || 0;
    const carbs = parseInt(document.getElementById('editCarbohidratos').value) || 0;
    const grasas = parseInt(document.getElementById('editGrasas').value) || 0;
    const icono = document.querySelector('#iconSelector .icon-option.active')?.dataset.icon || 'restaurant';
    const color = document.querySelector('#colorSelector .color-option.active')?.dataset.color || 'primary';
    const etiquetas = [];
    document.querySelectorAll('#tagContainer .tag-pill-modal').forEach(el => {
        const t = el.textContent.replace('close', '').trim();
        if (t) etiquetas.push(t);
    });
    const datos = {
        nombre,
        hora,
        descripcion,
        proteinas: prot,
        carbohidratos: carbs,
        grasas,
        icono,
        color,
        etiquetas
    };
    const comidas = getComidasDia(diaActual);
    if (id) {
        const idx = comidas.findIndex(c => c.id === id);
        if (idx !== -1) comidas[idx] = { ...comidas[idx], ...datos };
    } else {
        datos.id = 'c' + Date.now();
        comidas.push(datos);
    }
    renderizarDia(diaActual);
    const modal = document.getElementById('modalEditarComida');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

async function guardarPlan() {
    let pacienteId = null;
    if (planActual && planActual.id_paciente) {
        pacienteId = planActual.id_paciente;
    } else if (pacienteIdGlobal) {
        pacienteId = pacienteIdGlobal;
    } else {
        const breadcrumb = document.getElementById('breadcrumbPaciente');
        if (breadcrumb && breadcrumb.dataset.id) {
            pacienteId = parseInt(breadcrumb.dataset.id);
        }
    }

    if (!pacienteId) {
        alert('⚠️ No se pudo identificar al paciente. Asegúrate de haber seleccionado uno correctamente.');
        return;
    }

    if (!planActual.comidas_por_dia || typeof planActual.comidas_por_dia !== 'object') {
        planActual.comidas_por_dia = {};
    }
    for (let i = 0; i < 7; i++) {
        if (!planActual.comidas_por_dia[i]) planActual.comidas_por_dia[i] = [];
    }
    const comidasJSON = JSON.stringify(planActual.comidas_por_dia);
    const horasNombresJSON = JSON.stringify(planActual.horas_nombres || {});
    const observaciones = planActual.observaciones || '';

    const data = {
        nombre_plan: document.getElementById('nombreDieta')?.value || 'Plan',
        meta_calorias: planActual.meta_calorias || 1600,
        estado: planActual.estado || 'Activo',
        comidas_por_dia: comidasJSON,
        horas_nombres: horasNombresJSON,
        observaciones: observaciones,
        id_paciente: pacienteId
    };

    try {
        if (planId) {
            await updatePlan(planId, data);
            alert('Plan actualizado correctamente.');
            window.location.hash = `editor-plan/${planId}`;
        } else {
            const nuevoId = await addPlan(data);
            planId = nuevoId;
            alert('Plan creado correctamente.');
            window.location.hash = `editor-plan/${nuevoId}`;
        }
    } catch (e) {
        console.error('Error al guardar el plan:', e);
        alert('Error al guardar el plan. Verifica los datos e intenta de nuevo.');
    }
}




function generarPDF() {
    if (typeof window.jspdf === 'undefined') {
        alert('Librería jsPDF no cargada. Asegúrate de tener jsPDF en tu proyecto.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    const nombrePlan = document.getElementById('nombreDieta')?.value || 'Plan Semanal';
    const comidasPorDia = planActual.comidas_por_dia || {};
    const horasNombres = planActual.horas_nombres || {};
    const observaciones = planActual.observaciones || '';
    const diasAbreviados = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    
    const horasMap = new Map();
    for (let dia = 0; dia < 7; dia++) {
        const comidasDia = comidasPorDia[dia] || [];
        comidasDia.forEach(comida => {
            const hora = comida.hora || '08:00';
            if (!horasMap.has(hora)) {
                horasMap.set(hora, {
                    hora: hora,
                    nombre: horasNombres[hora] || '', 
                    dias: {}
                });
            }
            const item = horasMap.get(hora);
            if (horasNombres[hora]) {
                item.nombre = horasNombres[hora];
            }
            item.dias[dia] = comida;
        });
    }

    
    for (const [hora, item] of horasMap) {
        let hasComida = false;
        for (let d = 0; d < 7; d++) {
            if (item.dias[d]) { hasComida = true; break; }
        }
        if (!hasComida) horasMap.delete(hora);
    }

    const horasOrdenadas = Array.from(horasMap.values()).sort((a, b) => a.hora.localeCompare(b.hora));

    if (horasOrdenadas.length === 0) {
        alert('No hay comidas para generar el PDF.');
        return;
    }

    
    const fontSizeTitulo = 20;
    const fontSizeSubtitulo = 12;
    const fontSizeHeader = 11;
    const fontSizeHora = 14;
    const fontSizeNombreHora = 12;
    const fontSizeComida = 10;
    const fontSizeDesc = 9;
    const fontSizeMacros = 8;
    const fontSizeEtiquetas = 7;
    const fontSizeObservaciones = 10;

    
    function truncarTexto(texto, anchoMax, doc, fontSize, fontStyle) {
        if (!texto) return '';
        doc.setFont('helvetica', fontStyle || 'normal');
        doc.setFontSize(fontSize);
        let ancho = doc.getTextWidth(texto);
        if (ancho <= anchoMax) return texto;
        let truncado = texto;
        while (ancho > anchoMax && truncado.length > 1) {
            truncado = truncado.slice(0, -1);
            ancho = doc.getTextWidth(truncado + '…');
        }
        return truncado + '…';
    }

    
    function calcularAlturaFila(item, colWidth) {
        let maxAltura = 0;
        for (let dia = 0; dia < 7; dia++) {
            const comida = item.dias[dia];
            if (comida) {
                let altura = 6; 
                altura += 6; 
                
                const desc = comida.descripcion || '';
                const maxWidth = colWidth - 4;
                const lines = doc.splitTextToSize(desc, maxWidth);
                const numLines = Math.min(lines.length, 3);
                altura += numLines * 5;
                
                const prot = comida.proteinas || 0;
                const carbs = comida.carbohidratos || 0;
                const grasas = comida.grasas || 0;
                if (prot || carbs || grasas) altura += 5;
                
                const etiquetas = comida.etiquetas || [];
                if (etiquetas.length > 0) altura += 4;
                altura += 2;
                if (altura > maxAltura) maxAltura = altura;
            }
        }
        return Math.max(maxAltura, 20);
    }

    
    const colWidthHora = 22; 
    const colWidthDia = (pageWidth - margin * 2 - colWidthHora) / 7;

    
    let alturaTabla = 0;
    const alturasFilas = horasOrdenadas.map(item => calcularAlturaFila(item, colWidthDia));
    alturasFilas.forEach(h => alturaTabla += h + 0.5);

    
    const alturaDisponible = pageHeight - margin * 2 - 30;

    
    let factorEscala = 1.0;
    while (alturaTabla > alturaDisponible - 20 && factorEscala > 0.6) {
        factorEscala -= 0.05;
        let nuevaAltura = 0;
        alturasFilas.forEach(h => nuevaAltura += h * factorEscala + 0.5);
        if (nuevaAltura <= alturaDisponible - 20) {
            alturaTabla = nuevaAltura;
            break;
        }
        alturaTabla = nuevaAltura;
    }
    if (alturaTabla > alturaDisponible - 20) {
        factorEscala = Math.max(0.6, (alturaDisponible - 20) / alturaTabla);
        alturaTabla = alturaDisponible - 20;
    }

    
    const fTitulo = Math.round(fontSizeTitulo * factorEscala);
    const fSubtitulo = Math.round(fontSizeSubtitulo * factorEscala);
    const fHeader = Math.round(fontSizeHeader * factorEscala);
    const fHora = Math.round(fontSizeHora * factorEscala);
    const fNombreHora = Math.round(fontSizeNombreHora * factorEscala);
    const fComida = Math.round(fontSizeComida * factorEscala);
    const fDesc = Math.round(fontSizeDesc * factorEscala);
    const fMacros = Math.round(fontSizeMacros * factorEscala);
    const fEtiquetas = Math.round(fontSizeEtiquetas * factorEscala);
    const fObservaciones = Math.round(fontSizeObservaciones * factorEscala);

    const headerHeight = Math.round(16 * factorEscala);
    const lineHeight = Math.round(5 * factorEscala);

    
    let y = margin + 2;

    
    doc.setFontSize(fTitulo);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 99, 59);
    doc.text(nombrePlan, pageWidth / 2, y, { align: 'center' });
    y += 6;

    
    const totalComidas = Object.values(comidasPorDia).reduce((acc, dia) => acc + dia.length, 0);
    const totalDias = Object.keys(comidasPorDia).filter(d => comidasPorDia[d].length > 0).length;
    doc.setFontSize(fSubtitulo);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(98, 103, 93);
    doc.text(`Plan nutricional semanal · ${totalDias} días · ${totalComidas} comidas`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    
    const colX = margin;
    doc.setFillColor(74, 99, 59);
    doc.rect(colX, y, pageWidth - margin * 2, headerHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fHeader);
    doc.setTextColor(255, 255, 255);
    doc.text('HORA', colX + 3, y + Math.round(headerHeight * 0.6));
    doc.text('COMIDA', colX + 3, y + Math.round(headerHeight * 0.85));
    for (let i = 0; i < 7; i++) {
        const x = colX + colWidthHora + colWidthDia * i;
        doc.text(diasAbreviados[i], x + colWidthDia / 2, y + Math.round(headerHeight * 0.7), { align: 'center' });
    }
    y += headerHeight;

    
    for (let f = 0; f < horasOrdenadas.length; f++) {
        const item = horasOrdenadas[f];
        const altura = Math.round(alturasFilas[f] * factorEscala);
        const esPar = f % 2 === 0;
        const rowY = y;

        
        doc.setFillColor(esPar ? 248 : 255, 249, 246);
        doc.rect(margin, rowY, pageWidth - margin * 2, altura, 'F');

        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fHora);
        doc.setTextColor(74, 99, 59);
        const horaStr = item.hora.slice(0, 5);
        doc.text(horaStr, colX + 2, rowY + Math.round(altura * 0.3) + 2);

        
        if (item.nombre && item.nombre.trim() !== '') {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(fNombreHora);
            doc.setTextColor(40, 40, 40);
            const nombreTrunc = truncarTexto(item.nombre, colWidthHora - 4, doc, fNombreHora, 'normal');
            doc.text(nombreTrunc, colX + 2, rowY + Math.round(altura * 0.7) + 2);
        }

        
        for (let dia = 0; dia < 7; dia++) {
            const x = colX + colWidthHora + colWidthDia * dia;
            const comida = item.dias[dia];

            
            doc.rect(x, rowY, colWidthDia, altura);

            if (comida) {
                let yOffset = rowY + 4;

                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(fComida);
                doc.setTextColor(28, 32, 26);
                const nombreComida = truncarTexto(comida.nombre || '', colWidthDia - 4, doc, fComida, 'bold');
                doc.text(nombreComida, x + 2, yOffset);
                yOffset += 6;

                
                const desc = comida.descripcion || '';
                const maxWidth = colWidthDia - 4;
                const descLines = doc.splitTextToSize(desc, maxWidth);
                const maxDescLines = 3;
                const linesToShow = descLines.slice(0, maxDescLines);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fDesc);
                doc.setTextColor(80, 80, 80);
                linesToShow.forEach((line, idx) => {
                    
                    let lineTrunc = line;
                    if (doc.getTextWidth(line) > maxWidth) {
                        lineTrunc = truncarTexto(line, maxWidth, doc, fDesc, 'normal');
                    }
                    doc.text(lineTrunc, x + 2, yOffset);
                    yOffset += lineHeight;
                });
                yOffset += 2;

                
                const prot = comida.proteinas || 0;
                const carbs = comida.carbohidratos || 0;
                const grasas = comida.grasas || 0;
                if (prot || carbs || grasas) {
                    let macros = '';
                    if (prot) macros += prot + 'g P';
                    if (carbs) macros += (macros ? ' · ' : '') + carbs + 'g C';
                    if (grasas) macros += (macros ? ' · ' : '') + grasas + 'g G';
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(fMacros);
                    doc.setTextColor(74, 99, 59);
                    const macroTrunc = truncarTexto(macros, colWidthDia - 4, doc, fMacros, 'bold');
                    doc.text(macroTrunc, x + 2, yOffset);
                    yOffset += 5;
                }

                
                const etiquetas = comida.etiquetas || [];
                if (etiquetas.length > 0) {
                    const tags = etiquetas.slice(0, 2).join(' · ');
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(fEtiquetas);
                    doc.setTextColor(130, 130, 130);
                    const tagTrunc = truncarTexto(tags, colWidthDia - 4, doc, fEtiquetas, 'normal');
                    doc.text(tagTrunc, x + 2, yOffset);
                }
            } else {
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fComida);
                doc.setTextColor(200, 200, 200);
                doc.text('—', x + colWidthDia / 2, rowY + altura / 2 + 3, { align: 'center' });
            }
        }

        y += altura + 0.5;
    }

    
    if (observaciones) {
        y += 6;
        const obsTituloHeight = 8;
        const obsLineHeight = 5;
        const obsLines = doc.splitTextToSize(observaciones, pageWidth - margin * 2);
        const obsHeight = obsTituloHeight + obsLines.length * obsLineHeight + 4;

        if (y + obsHeight > pageHeight - margin) {
            doc.addPage();
            y = margin + 8;
        }

        doc.setFontSize(fObservaciones);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(74, 99, 59);
        doc.text('Observaciones / Recomendaciones', margin, y);
        y += 6;
        doc.setFontSize(fObservaciones - 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        obsLines.forEach(line => {
            doc.text(line, margin, y);
            y += obsLineHeight;
        });
    }

    
    doc.save(`${nombrePlan}.pdf`);
}

module.exports = {
    initEditorPlan
};
