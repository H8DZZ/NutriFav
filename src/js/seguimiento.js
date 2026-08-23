const { getPatientById, getSeguimientos, getDietasByPaciente, getFotosByPaciente, updatePatient } = require('./dataService.js');

let pacienteId = null;
let paciente = null;
let seguimientos = [];
let dietas = [];
let fotos = [];

async function initSeguimiento(id) {
    if (!id) {
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;">ID de paciente no proporcionado.</p>';
        return;
    }

    pacienteId = parseInt(id);
    try {
        paciente = await getPatientById(pacienteId);
        if (!paciente) {
            document.getElementById('appContent').innerHTML = '<p style="padding:40px;">Paciente no encontrado.</p>';
            return;
        }

        seguimientos = await getSeguimientos(pacienteId);
        dietas = await getDietasByPaciente(pacienteId);
        fotos = await getFotosByPaciente(pacienteId);

        renderizarDatos(paciente, seguimientos, dietas, fotos);
        configurarEventos(paciente);

    } catch (error) {
        console.error('Error al cargar seguimiento:', error);
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;color:red;">Error al cargar el seguimiento.</p>';
    }
}

function renderizarDatos(paciente, sesiones, dietasList, fotosList) {
    const breadcrumb = document.getElementById('breadcrumbPaciente');
    if (breadcrumb) {
        breadcrumb.textContent = paciente.nombre;
        breadcrumb.dataset.id = paciente.id_paciente;
    }

    const subtitle = document.getElementById('subtituloPaciente');
    if (subtitle) {
        subtitle.textContent = `Evolución clínica de ${paciente.nombre} (Expediente: ${paciente.expediente || '#NF-0000'})`;
    }

    const btnNuevo = document.getElementById('btnNuevoSeguimiento');
    if (btnNuevo) {
        btnNuevo.dataset.id = paciente.id_paciente;
    }

    const linkVerDietas = document.getElementById('linkVerDietas');
    if (linkVerDietas) linkVerDietas.dataset.id = paciente.id_paciente;

    renderStats(sesiones, paciente);
    renderTabla(sesiones);
    renderGrafico(sesiones);
    renderDietas(dietasList);
    renderFotos(fotosList, paciente);
}

function renderStats(sesiones, paciente) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    let metaPeso = paciente?.meta_peso || 80;
    if (!metaPeso || metaPeso <= 0) metaPeso = 80;

    let objetivo = paciente?.objetivo_peso || 'bajar';
    if (!paciente?.objetivo_peso) {
        if (sesiones.length > 0) {
            const sorted = [...sesiones].sort((a, b) => new Date(a.fecha_sesion) - new Date(b.fecha_sesion));
            const pesoInicial = sorted[0].peso_kg || 0;
            if (metaPeso < pesoInicial) objetivo = 'bajar';
            else if (metaPeso > pesoInicial) objetivo = 'subir';
        }
    }

    if (sesiones.length === 0) {
        statsGrid.innerHTML = `
            <div class="card stat-card"><p class="stat-label">Sin datos</p><h3 class="stat-value">—</h3></div>
            <div class="card stat-card"><p class="stat-label">Sin datos</p><h3 class="stat-value">—</h3></div>
            <div class="card stat-card"><p class="stat-label">Sin datos</p><h3 class="stat-value">—</h3></div>
            <div class="card stat-card">
                <p class="stat-label">Meta Objetivo (${objetivo === 'bajar' ? '↓ Bajar' : '↑ Subir'})</p>
                <h3 class="stat-value" id="metaPesoDisplay">${metaPeso.toFixed(1)} kg</h3>
                <div class="progress-bar-container"><div class="progress-bar-fill" style="width:0%;"></div></div>
                <p class="progress-label">0% completado</p>
                <button class="btn btn-secondary btn-editar-meta" style="margin-top:8px;padding:4px 12px;font-size:12px;">
                    <span class="material-symbols-outlined" style="font-size:16px;">edit</span> Editar meta
                </button>
            </div>
        `;
        asignarEventoEditarMeta();
        return;
    }

    const sorted = [...sesiones].sort((a, b) => new Date(a.fecha_sesion) - new Date(b.fecha_sesion));
    const primera = sorted[0];
    const ultima = sorted[sorted.length - 1];
    const pesoInicial = primera.peso_kg || 0;
    const pesoActual = ultima.peso_kg || 0;
    const perdida = pesoInicial - pesoActual;
    const grasaInicial = primera.grasa_corporal || 0;
    const grasaActual = ultima.grasa_corporal || 0;
    const diferenciaGrasa = grasaInicial - grasaActual;

    let progreso = 0;
    let textoProgreso = '';
    let barraColor = 'var(--color-primary)';
    let metaAlcanzada = false;

    if (pesoInicial > 0 && metaPeso > 0) {
        if (objetivo === 'bajar') {
            if (metaPeso < pesoInicial) {
                const totalAPerder = pesoInicial - metaPeso;
                const perdido = pesoInicial - pesoActual;
                progreso = (perdido / totalAPerder) * 100;
            } else {
                progreso = (pesoActual <= metaPeso) ? 100 : 0;
            }
        } else if (objetivo === 'subir') {
            if (metaPeso > pesoInicial) {
                const totalAGanar = metaPeso - pesoInicial;
                const ganado = pesoActual - pesoInicial;
                progreso = (ganado / totalAGanar) * 100;
            } else {
                progreso = (pesoActual >= metaPeso) ? 100 : 0;
            }
        }
    }

    let progresoBarra = Math.min(100, Math.max(0, progreso));

    if (progreso >= 100) {
        textoProgreso = '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">check_circle</span> Meta superada';
        barraColor = '#4CAF50';
        metaAlcanzada = true;
    } else if (progreso < 0) {
        textoProgreso = `Retroceso ${Math.round(Math.abs(progreso))}%`;
        barraColor = '#e74c3c';
    } else if (progreso > 0 && progreso < 100) {
        textoProgreso = `${Math.round(progreso)}% completado`;
        if (progreso >= 75) barraColor = '#2ecc71';
        else if (progreso >= 50) barraColor = '#f39c12';
        else barraColor = 'var(--color-primary)';
    } else {
        textoProgreso = 'Sin avance';
    }

    statsGrid.innerHTML = `
        <div class="card stat-card">
            <p class="stat-label">Peso Inicial</p>
            <h3 class="stat-value">${pesoInicial.toFixed(1)} kg</h3>
            <p class="stat-date">${formatearFecha(primera.fecha_sesion)}</p>
        </div>
        <div class="card stat-card">
            <p class="stat-label">Peso Actual</p>
            <h3 class="stat-value">${pesoActual.toFixed(1)} kg</h3>
            <div class="stat-trend ${perdida > 0 ? 'positive' : ''}">
                <span class="material-symbols-outlined icon-sm">${perdida > 0 ? 'trending_down' : 'trending_up'}</span>
                <span>${perdida > 0 ? perdida.toFixed(1) + ' kg perdidos' : Math.abs(perdida).toFixed(1) + ' kg ganados'}</span>
            </div>
        </div>
        <div class="card stat-card">
            <p class="stat-label">Grasa Corporal</p>
            <h3 class="stat-value">${grasaActual.toFixed(1)} %</h3>
            <div class="stat-trend ${diferenciaGrasa > 0 ? 'positive' : ''}">
                <span class="material-symbols-outlined icon-sm">${diferenciaGrasa > 0 ? 'arrow_downward' : 'arrow_upward'}</span>
                <span>${diferenciaGrasa > 0 ? '-' + diferenciaGrasa.toFixed(1) + '%' : '+' + Math.abs(diferenciaGrasa).toFixed(1) + '%'}</span>
            </div>
        </div>
        <div class="card stat-card">
            <p class="stat-label">Meta Objetivo (${objetivo === 'bajar' ? '↓ Bajar' : '↑ Subir'})</p>
            <h3 class="stat-value" id="metaPesoDisplay">${metaPeso.toFixed(1)} kg</h3>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width:${progresoBarra}%; background-color: ${barraColor};"></div>
            </div>
            <p class="progress-label">${textoProgreso}</p>
            <button class="btn btn-secondary btn-editar-meta" style="margin-top:8px;padding:4px 12px;font-size:12px;">
                <span class="material-symbols-outlined" style="font-size:16px;">edit</span> Editar meta
            </button>
        </div>
    `;

    asignarEventoEditarMeta();
}

function asignarEventoEditarMeta() {
    const btnEditar = document.querySelector('.btn-editar-meta');
    if (btnEditar) {
        btnEditar.removeEventListener('click', manejarEditarMeta);
        btnEditar.addEventListener('click', manejarEditarMeta);
    }
}

function manejarEditarMeta() {
    const metaDisplay = document.getElementById('metaPesoDisplay');
    let metaActual = 80;
    if (metaDisplay) {
        const texto = metaDisplay.textContent;
        const match = texto.match(/([\d.]+)/);
        if (match) {
            metaActual = parseFloat(match[1]);
        }
    }
    const objetivoActual = paciente?.objetivo_peso || 'bajar';
    abrirModalEditarMeta(metaActual, objetivoActual);
}

function abrirModalEditarMeta(metaActual, objetivoActual) {
    const modalExistente = document.getElementById('modalEditarMetaPeso');
    if (modalExistente && document.body.contains(modalExistente)) {
        document.body.removeChild(modalExistente);
    }

    const modal = document.createElement('div');
    modal.id = 'modalEditarMetaPeso';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <h3 style="font-size: 20px; font-weight: 700; color: #1c201a; margin-bottom: 8px;">Editar Meta de Peso</h3>
            <p style="font-size: 14px; color: #62675d; margin-bottom: 20px;">Establece el peso objetivo y la dirección deseada.</p>
            
            <div style="margin-bottom: 16px;">
                <label style="font-size: 13px; font-weight: 700; color: #62675d; display: block; margin-bottom: 6px;">Peso objetivo (kg)</label>
                <input type="number" id="inputMetaPeso" step="0.5" value="${metaActual}" style="width: 100%; padding: 12px 14px; border: 1px solid #e0e4da; border-radius: 12px; font-size: 16px; font-weight: 600; font-family: inherit; outline: none; transition: border-color 0.2s; background: #f1f3ee;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="font-size: 13px; font-weight: 700; color: #62675d; display: block; margin-bottom: 6px;">Objetivo</label>
                <div style="display: flex; gap: 12px;">
                    <label style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding: 10px; border-radius: 10px; border: 2px solid ${objetivoActual === 'bajar' ? '#4a633b' : '#e0e4da'}; cursor:pointer; background: ${objetivoActual === 'bajar' ? '#eaf3e5' : 'transparent'}; transition: all 0.2s;">
                        <input type="radio" name="objetivo_peso" value="bajar" ${objetivoActual === 'bajar' ? 'checked' : ''} style="display:none;">
                        <span class="material-symbols-outlined" style="color:${objetivoActual === 'bajar' ? '#4a633b' : '#888'};">trending_down</span>
                        <span style="font-weight:600; color:${objetivoActual === 'bajar' ? '#4a633b' : '#888'};">Bajar</span>
                    </label>
                    <label style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding: 10px; border-radius: 10px; border: 2px solid ${objetivoActual === 'subir' ? '#4a633b' : '#e0e4da'}; cursor:pointer; background: ${objetivoActual === 'subir' ? '#eaf3e5' : 'transparent'}; transition: all 0.2s;">
                        <input type="radio" name="objetivo_peso" value="subir" ${objetivoActual === 'subir' ? 'checked' : ''} style="display:none;">
                        <span class="material-symbols-outlined" style="color:${objetivoActual === 'subir' ? '#4a633b' : '#888'};">trending_up</span>
                        <span style="font-weight:600; color:${objetivoActual === 'subir' ? '#4a633b' : '#888'};">Subir</span>
                    </label>
                </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="btnCancelarMeta" style="padding: 10px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #62675d; background: #f1f3ee; border: none; cursor: pointer; transition: background 0.2s;">Cancelar</button>
                <button id="btnGuardarMeta" style="padding: 10px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #ffffff; background: #4a633b; border: none; cursor: pointer; transition: background 0.2s;">Guardar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const radioLabels = modal.querySelectorAll('label[style*="cursor:pointer"]');
    radioLabels.forEach(label => {
        const radio = label.querySelector('input[type="radio"]');
        if (radio) {
            radio.addEventListener('change', function() {
                radioLabels.forEach(lb => {
                    const r = lb.querySelector('input[type="radio"]');
                    if (r && r.checked) {
                        lb.style.borderColor = '#4a633b';
                        lb.style.background = '#eaf3e5';
                        lb.querySelector('span:last-child').style.color = '#4a633b';
                        lb.querySelector('.material-symbols-outlined').style.color = '#4a633b';
                    } else {
                        lb.style.borderColor = '#e0e4da';
                        lb.style.background = 'transparent';
                        lb.querySelector('span:last-child').style.color = '#888';
                        lb.querySelector('.material-symbols-outlined').style.color = '#888';
                    }
                });
            });
        }
    });

    const input = document.getElementById('inputMetaPeso');
    if (input) {
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);
    }

    const btnGuardar = document.getElementById('btnGuardarMeta');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async function() {
            const nuevoPeso = parseFloat(document.getElementById('inputMetaPeso').value);
            if (!nuevoPeso || nuevoPeso <= 0) {
                alert('Por favor, ingresa un peso válido.');
                return;
            }
            const objetivoSeleccionado = document.querySelector('input[name="objetivo_peso"]:checked')?.value || 'bajar';

            try {
                await updatePatient(pacienteId, { 
                    meta_peso: nuevoPeso,
                    objetivo_peso: objetivoSeleccionado
                });
                
                paciente.meta_peso = nuevoPeso;
                paciente.objetivo_peso = objetivoSeleccionado;
                
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                
                renderStats(seguimientos, paciente);
                alert('✅ Meta de peso actualizada correctamente.');
            } catch (error) {
                console.error('Error al actualizar meta:', error);
                alert('❌ Error al actualizar la meta de peso.');
            }
        });
    }

    const btnCancelar = document.getElementById('btnCancelarMeta');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });

    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function renderTabla(sesiones) {
    const tbody = document.getElementById('sesionesBody');
    if (!tbody) return;
    if (sesiones.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;">No hay sesiones registradas.</td></tr>`;
        const info = document.getElementById('paginationInfo');
        if (info) info.textContent = 'Mostrando 0 sesiones';
        return;
    }

    const sorted = [...sesiones].sort((a, b) => new Date(b.fecha_sesion) - new Date(a.fecha_sesion));
    tbody.innerHTML = sorted.map((s, index) => {
        const fecha = new Date(s.fecha_sesion);
        const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const hace = calcularHace(fecha);
        const estadoClass = s.estado_paciente === 'Completada' ? 'completed' : 'pending';
        const badgeClass = s.estado_paciente === 'Completada' ? 'badge-primary' : 'badge-tertiary';

        return `
            <tr>
                <td><p class="cell-primary-text">${fechaStr}</p><p class="cell-secondary-text">${hace}</p></td>
                <td><span class="badge ${badgeClass}">Seguimiento #${index + 1}</span></td>
                <td><div class="metric-cell"><span class="metric-val-lg">${s.peso_kg ? s.peso_kg.toFixed(1) : '—'}</span></div></td>
                <td><div class="metric-cell"><span class="metric-val">${s.grasa_corporal ? s.grasa_corporal.toFixed(1) : '—'}</span></div></td>
                <td class="metric-val">${s.masa_muscular ? s.masa_muscular.toFixed(1) : '—'}</td>
                <td><span class="status-chip ${estadoClass}"><span class="chip-dot"></span>${s.estado_paciente || 'Pendiente'}</span></td>
                <td class="text-right">
                    <div class="actions-wrapper">
                        <a href="#" data-view="registro-seguimiento" data-id="${s.id_sesion}" data-tipo="sesion" 
                           class="table-action-btn btn-ver" title="Ver detalles">
                            <span class="material-symbols-outlined">visibility</span>
                        </a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const info = document.getElementById('paginationInfo');
    if (info) info.textContent = `Mostrando ${sorted.length} de ${sesiones.length} sesiones`;
}

function renderGrafico(sesiones) {
    const container = document.getElementById('chartContainer');
    const labels = document.getElementById('chartLabels');
    if (!container) return;
    if (sesiones.length === 0) {
        container.innerHTML = '<p style="text-align:center;width:100%;color:var(--text-muted);padding:20px;">No hay datos</p>';
        if (labels) labels.innerHTML = '';
        return;
    }

    const sorted = [...sesiones].sort((a, b) => new Date(a.fecha_sesion) - new Date(b.fecha_sesion));
    const pesos = sorted.map(s => s.peso_kg || 0);
    const maxPeso = Math.max(...pesos, 1);
    const minPeso = Math.min(...pesos, 0);
    const rango = maxPeso - minPeso || 1;

    let barsHtml = '';
    pesos.forEach((peso, i) => {
        const altura = ((peso - minPeso) / rango) * 100;
        const isLast = i === pesos.length - 1;
        barsHtml += `<div class="chart-bar-wrapper ${isLast ? 'active' : ''}" style="height: ${Math.max(10, altura)}%;"><div class="chart-tooltip ${isLast ? 'static' : ''}">${peso.toFixed(1)}</div></div>`;
    });
    container.innerHTML = barsHtml;

    if (labels) {
        const meses = sorted.map(s => new Date(s.fecha_sesion).toLocaleDateString('es-ES', { month: 'short' }));
        labels.innerHTML = meses.map(m => `<span>${m}</span>`).join('');
    }
}

function renderDietas(dietasList) {
    const list = document.getElementById('dietList');
    if (!list) return;
    if (dietasList.length === 0) {
        list.innerHTML = '<p class="empty-message">No hay dietas registradas.</p>';
        return;
    }

    list.innerHTML = dietasList.map(d => {
        const badgeClass = d.estado === 'Activo' ? 'active' : d.estado === 'Completado' ? 'completed' : 'canceled';
        return `
            <div class="diet-item">
                <div class="diet-info">
                    <p class="diet-name">${d.nombre_plan || d.nombre || 'Plan sin nombre'}</p>
                    <div class="diet-meta">
                        <span class="diet-date">${formatearFecha(d.fecha_emision)}</span>
                        <span class="diet-badge ${badgeClass}">${d.estado}</span>
                    </div>
                </div>
                <span class="diet-objective">${d.objetivo_plan || '—'}</span>
            </div>
        `;
    }).join('');
}

function renderFotos(fotosList, paciente) {
    const container = document.getElementById('fotosContainer');
    if (!container) return;

    const linkFotos = document.getElementById('linkFotos');
    if (linkFotos) {
        linkFotos.dataset.id = paciente.id_paciente;
        linkFotos.href = `#fotos/${paciente.id_paciente}`;
    }

    if (fotosList.length === 0) {
        container.innerHTML = `
            <div class="photo-grid" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px 0; min-height:100px;">
                <span class="material-symbols-outlined" style="font-size:48px;color:var(--text-muted);">photo_camera</span>
                <p style="color:var(--text-muted); margin-top:8px; font-size:14px;">No hay fotos registradas</p>
                <a href="#" data-view="fotos" data-id="${paciente.id_paciente}" class="btn btn-secondary" style="margin-top:12px; padding:6px 16px; font-size:12px;">
                    <span class="material-symbols-outlined" style="font-size:16px;">add</span>
                    Subir fotos
                </a>
            </div>
        `;
        return;
    }

    const fotosMostrar = fotosList.slice(0, 4);
    const tieneMas = fotosList.length > 4;

    let html = `<div class="photo-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">`;
    
    fotosMostrar.forEach(foto => {
        const fecha = new Date(foto.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const angulo = foto.angulo || 'Sin ángulo';
        
        html += `
            <div class="photo-upload-box" style="position:relative; aspect-ratio:1/1; border-radius:12px; overflow:hidden; cursor:pointer; background:var(--bg-surface-low); border:1px solid var(--border-color);" 
                 onclick="window.location.href='#fotos/${paciente.id_paciente}'">
                <img src="${foto.url}" alt="${angulo}" style="width:100%; height:100%; object-fit:cover;"/>
                <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(to top, rgba(0,0,0,0.6), transparent); padding:8px 12px; color:white; font-size:11px; font-weight:600; display:flex; justify-content:space-between;">
                    <span>${angulo}</span>
                    <span>${fechaStr}</span>
                </div>
            </div>
        `;
    });

    if (tieneMas) {
        html += `
            <div class="photo-upload-box" style="aspect-ratio:1/1; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--color-primary-light); cursor:pointer; border:2px dashed var(--color-primary);" 
                 onclick="window.location.href='#fotos/${paciente.id_paciente}'">
                <span class="material-symbols-outlined" style="font-size:32px; color:var(--color-primary);">photo_library</span>
                <span style="font-weight:700; color:var(--color-primary); font-size:14px;">+${fotosList.length - 4} más</span>
            </div>
        `;
    }

    html += `</div>`;
    
    html += `
        <div style="text-align:center; margin-top:12px;">
            <a href="#" data-view="fotos" data-id="${paciente.id_paciente}" class="btn btn-secondary" style="padding:6px 20px; font-size:13px;">
                <span class="material-symbols-outlined" style="font-size:18px;">photo_library</span>
                Ver todas las fotos (${fotosList.length})
            </a>
        </div>
    `;

    container.innerHTML = html;
}

function formatearFecha(fecha) {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
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

function setupFilters() {
    const fechaDesde = document.getElementById('fechaDesde');
    const fechaHasta = document.getElementById('fechaHasta');
    const estadoFilter = document.getElementById('estadoFilter');
    const btnClear = document.getElementById('btnClearFilters');

    function aplicarFiltros() {
        let filtrados = seguimientos;
        if (fechaDesde && fechaDesde.value) filtrados = filtrados.filter(s => s.fecha_sesion >= fechaDesde.value);
        if (fechaHasta && fechaHasta.value) filtrados = filtrados.filter(s => s.fecha_sesion <= fechaHasta.value);
        if (estadoFilter && estadoFilter.value !== 'all') filtrados = filtrados.filter(s => s.estado_paciente === estadoFilter.value);
        renderTabla(filtrados);
    }

    if (fechaDesde) fechaDesde.addEventListener('change', aplicarFiltros);
    if (fechaHasta) fechaHasta.addEventListener('change', aplicarFiltros);
    if (estadoFilter) estadoFilter.addEventListener('change', aplicarFiltros);
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (fechaDesde) fechaDesde.value = '';
            if (fechaHasta) fechaHasta.value = '';
            if (estadoFilter) estadoFilter.value = 'all';
            aplicarFiltros();
        });
    }
}

function setupPDF() {
    const btn = document.getElementById('exportPdfBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        const element = document.getElementById('pdfContent');
        if (!element) return;
        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            alert('Librerías PDF no cargadas.');
            return;
        }
        const originalText = this.innerHTML;
        this.innerHTML = '<span class="material-symbols-outlined icon-btn-size">hourglass_top</span> Generando...';
        this.disabled = true;

        html2canvas(element, { scale: 2, backgroundColor: '#ffffff', logging: false })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('portrait', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('Historial_Seguimiento.pdf');
                this.innerHTML = originalText;
                this.disabled = false;
            })
            .catch(error => {
                console.error('Error al generar PDF:', error);
                alert('Error al generar el PDF.');
                this.innerHTML = originalText;
                this.disabled = false;
            });
    });
}

function configurarEventos(paciente) {
    setupFilters();
    setupPDF();
}

module.exports = {
    initSeguimiento
};