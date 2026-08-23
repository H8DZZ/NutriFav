const { getAppointmentById, updateAppointmentStatus, getPatientById, addNota, getNotas, updateAppointment } = require('./dataService.js');

let citaActual = null;
let pacienteActual = null;
let notasCita = [];

async function initDetalleCita(id) {
    if (!id) {
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;">ID de cita no proporcionado.</p>';
        return;
    }

    try {
        citaActual = await getAppointmentById(parseInt(id));
        if (!citaActual) {
            document.getElementById('appContent').innerHTML = '<p style="padding:40px;">Cita no encontrada.</p>';
            return;
        }

        if (citaActual.id_paciente) {
            pacienteActual = await getPatientById(citaActual.id_paciente);
            notasCita = await getNotas(citaActual.id_paciente);
        }

        renderCita(citaActual, pacienteActual);
        setupEventListeners(citaActual);

    } catch (error) {
        console.error('Error al cargar la cita:', error);
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;color:red;">Error al cargar la cita.</p>';
    }
}

function renderCita(cita, paciente) {
    const subtitle = document.getElementById('citaSubtitle');
    if (subtitle) subtitle.textContent = `Cita #${cita.id_citas} • ${cita.paciente_nombre}`;

    const avatar = document.getElementById('patientAvatar');
    if (avatar) {
        const initials = cita.paciente_nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatar.textContent = initials || '?';
    }

    const name = document.getElementById('patientName');
    if (name) name.textContent = cita.paciente_nombre;

    const since = document.getElementById('patientSince');
    if (since) since.textContent = paciente ? `Paciente desde ${paciente.fecha_creacion ? new Date(paciente.fecha_creacion).toLocaleDateString('es-ES') : '—'}` : '—';

    const details = document.getElementById('patientDetails');
    if (details) {
        if (paciente) {
            details.innerHTML = `
                <div class="detail-row"><span class="material-symbols-outlined text-icon">cake</span><span>${paciente.edad || '—'} años</span></div>
                <div class="detail-row"><span class="material-symbols-outlined text-icon">mail</span><span>${paciente.email || '—'}</span></div>
                <div class="detail-row"><span class="material-symbols-outlined text-icon">call</span><span>${paciente.celular || '—'}</span></div>
            `;
        } else {
            details.innerHTML = `<div class="detail-row">Datos del paciente no disponibles</div>`;
        }
    }

    const btnExpediente = document.getElementById('btnExpediente');
    if (btnExpediente) btnExpediente.dataset.id = cita.id_paciente || '';

    const btnSeguimiento = document.getElementById('btnSeguimiento');
    if (btnSeguimiento) btnSeguimiento.dataset.id = cita.id_paciente || '';

    const fecha = new Date(cita.fecha_cita);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][fecha.getMonth()];
    const year = fecha.getFullYear();
    const hora = cita.hora_cita.slice(0,5);
    const fechaHoraDisplay = document.getElementById('fechaHoraDisplay');
    if (fechaHoraDisplay) {
        fechaHoraDisplay.textContent = `${dia} ${mes}, ${year} | ${hora}`;
    }

    const badge = document.getElementById('badgeEstado');
    if (badge) {
        badge.textContent = cita.estado || 'PENDIENTE';
        const estadoClases = {
            'CONFIRMADO': 'badge-confirmado',
            'ATENDIDA': 'badge-pendiente',
            'CANCELADO': 'badge-cancelado',
            'INASISTENCIA': 'badge-pendiente',
            'PENDIENTE': 'badge-pendiente'
        };
        badge.className = `badge ${estadoClases[cita.estado] || 'badge-pendiente'}`;
    }

    const statusGrid = document.getElementById('statusGrid');
    if (statusGrid) {
        const estados = ['CONFIRMADO', 'ATENDIDA', 'CANCELADO', 'INASISTENCIA'];
        const estadoIconos = {
            'CONFIRMADO': 'check_circle',
            'ATENDIDA': 'task_alt',
            'CANCELADO': 'cancel',
            'INASISTENCIA': 'person_off'
        };
        statusGrid.innerHTML = estados.map(e => `
            <button class="btn-status ${cita.estado === e ? 'active' : ''}" data-estado="${e}">
                <span class="material-symbols-outlined">${estadoIconos[e]}</span>
                ${e}
            </button>
        `).join('');
    }

    const motivoDisplay = document.getElementById('motivoDisplay');
    if (motivoDisplay) motivoDisplay.textContent = cita.contexto_cita || 'Sin motivo especificado';

    const resultados = document.getElementById('ultimosResultados');
    if (resultados) {
        if (cita.ultimosResultados) {
            resultados.innerHTML = `
                <span class="metric-val">${cita.ultimosResultados.valor || '—'}</span>
                <span class="metric-sub">${cita.ultimosResultados.descripcion || ''}</span>
            `;
        } else {
            resultados.innerHTML = `<span class="metric-val">—</span><span class="metric-sub">Sin datos</span>`;
        }
    }

    const historyList = document.getElementById('historyList');
    if (historyList) {
        if (notasCita && notasCita.length > 0) {
            historyList.innerHTML = notasCita.slice(0, 5).map(n => {
                const fechaNota = new Date(n.fecha);
                const diaNota = String(fechaNota.getDate()).padStart(2, '0');
                const mesNota = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][fechaNota.getMonth()];
                return `
                    <div class="history-item">
                        <div class="history-date-box">
                            <span class="day">${diaNota}</span>
                            <span class="month">${mesNota}</span>
                        </div>
                        <div class="history-info">
                            <p class="history-title">${n.contenido || 'Nota'}</p>
                            <span class="badge badge-pendiente">${n.tipo || 'normal'}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            historyList.innerHTML = `<p class="empty-message">No hay notas registradas.</p>`;
        }
    }
}

function fillEditModal(cita) {
    const fechaHoraInput = document.getElementById('fechaHoraInput');
    if (fechaHoraInput && cita.fecha_cita) {
        const fechaStr = cita.fecha_cita;
        const horaStr = cita.hora_cita ? cita.hora_cita.slice(0, 5) : '00:00';
        
        const fechaCompleta = `${fechaStr}T${horaStr}`;
        fechaHoraInput.value = fechaCompleta;
    }

    const estadoRadios = document.querySelectorAll('input[name="estado"]');
    estadoRadios.forEach(radio => {
        radio.checked = radio.value === cita.estado;
    });

    const motivoInput = document.getElementById('motivoInput');
    if (motivoInput) {
        motivoInput.value = cita.contexto_cita || '';
    }

    const archivoInput = document.getElementById('archivoInput');
    if (archivoInput) {
        archivoInput.value = '';
    }
}

function setupEventListeners(cita) {
    const statusGrid = document.getElementById('statusGrid');
    if (statusGrid) {
        statusGrid.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-status');
            if (!btn) return;
            const nuevoEstado = btn.dataset.estado;
            if (nuevoEstado === cita.estado) return;

            try {
                await updateAppointmentStatus(cita.id_citas, nuevoEstado);
                cita.estado = nuevoEstado;
                const badge = document.getElementById('badgeEstado');
                if (badge) {
                    badge.textContent = nuevoEstado;
                    const estadoClases = {
                        'CONFIRMADO': 'badge-confirmado',
                        'ATENDIDA': 'badge-pendiente',
                        'CANCELADO': 'badge-cancelado',
                        'INASISTENCIA': 'badge-pendiente',
                        'PENDIENTE': 'badge-pendiente'
                    };
                    badge.className = `badge ${estadoClases[nuevoEstado] || 'badge-pendiente'}`;
                }
                statusGrid.querySelectorAll('.btn-status').forEach(b => {
                    b.classList.toggle('active', b.dataset.estado === nuevoEstado);
                });
                fillEditModal(cita);
            } catch (error) {
                console.error('Error al actualizar estado:', error);
                alert('Error al actualizar el estado.');
            }
        });
    }

    const modal = document.getElementById('modalEditarCita');
    const mainWrapper = document.getElementById('mainWrapper');
    const btnAbrir = document.getElementById('btnEditarCita');
    const btnCerrar = document.getElementById('modalEditarCitaClose');
    const btnCancelar = document.getElementById('btnCancelarEditarCita');
    const formEditar = document.getElementById('formEditarCita');

    function abrirModal() {
        fillEditModal(cita);
        if (modal) {
            modal.classList.add('active');
        }
        if (mainWrapper) {
            mainWrapper.classList.add('modal-blur');
        }
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal() {
        if (modal) {
            modal.classList.remove('active');
        }
        if (mainWrapper) {
            mainWrapper.classList.remove('modal-blur');
        }
        document.body.style.overflow = '';
    }

    if (btnAbrir) {
        btnAbrir.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModal();
        });
    }

    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModal);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            cerrarModal();
        }
    });

    if (formEditar) {
        formEditar.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fechaHora = document.getElementById('fechaHoraInput').value;
            const nuevoEstado = document.querySelector('input[name="estado"]:checked')?.value;
            const nuevoMotivo = document.getElementById('motivoInput')?.value.trim();
            const archivo = document.getElementById('archivoInput')?.files[0];

            try {
                if (fechaHora) {
                    const [fecha, hora] = fechaHora.split('T');
                    await updateAppointment(cita.id_citas, { 
                        fecha_cita: fecha,
                        hora_cita: hora
                    });
                    cita.fecha_cita = fecha;
                    cita.hora_cita = hora;
                }

                if (nuevoEstado && nuevoEstado !== cita.estado) {
                    await updateAppointmentStatus(cita.id_citas, nuevoEstado);
                    cita.estado = nuevoEstado;
                }

                if (nuevoMotivo !== undefined) {
                    await updateAppointment(cita.id_citas, { 
                        contexto_cita: nuevoMotivo || ''
                    });
                    cita.contexto_cita = nuevoMotivo || '';
                }

                if (archivo) {
                    const reader = new FileReader();
                    reader.onload = async function(e) {
                        const base64 = e.target.result;
                        await updateAppointment(cita.id_citas, { 
                            documento: base64 
                        });
                        alert(`✅ Documento "${archivo.name}" adjuntado correctamente.`);
                    };
                    reader.readAsDataURL(archivo);
                }

                renderCita(cita, pacienteActual);
                cerrarModal();
                alert('✅ Cita actualizada correctamente.');
                
                const archivoInput = document.getElementById('archivoInput');
                if (archivoInput) archivoInput.value = '';

            } catch (error) {
                console.error('Error al actualizar:', error);
                alert('❌ Error al guardar los cambios.');
            }
        });
    }

    const btnGuardarNota = document.getElementById('btnGuardarNota');
    const notasTextarea = document.getElementById('notasTextarea');

    if (btnGuardarNota && notasTextarea) {
        btnGuardarNota.addEventListener('click', async function() {
            const nota = notasTextarea.value.trim();
            if (!nota) {
                alert('Escribe una nota antes de guardar.');
                return;
            }

            try {
                const nuevaNota = {
                    id_paciente: cita.id_paciente,
                    contenido: nota,
                    fecha: new Date().toISOString(),
                    tipo: 'cita'
                };
                await addNota(nuevaNota);
                
                notasCita = await getNotas(cita.id_paciente);
                const historyList = document.getElementById('historyList');
                if (historyList) {
                    if (notasCita.length > 0) {
                        historyList.innerHTML = notasCita.slice(0, 5).map(n => {
                            const fechaNota = new Date(n.fecha);
                            const diaNota = String(fechaNota.getDate()).padStart(2, '0');
                            const mesNota = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][fechaNota.getMonth()];
                            return `
                                <div class="history-item">
                                    <div class="history-date-box">
                                        <span class="day">${diaNota}</span>
                                        <span class="month">${mesNota}</span>
                                    </div>
                                    <div class="history-info">
                                        <p class="history-title">${n.contenido || 'Nota'}</p>
                                        <span class="badge badge-pendiente">${n.tipo || 'normal'}</span>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    } else {
                        historyList.innerHTML = `<p class="empty-message">No hay notas registradas.</p>`;
                    }
                }

                notasTextarea.value = '';
                alert('✅ Nota guardada correctamente.');
            } catch (error) {
                console.error('Error al guardar nota:', error);
                alert('❌ Error al guardar la nota.');
            }
        });
    }

    const btnAdjuntar = document.getElementById('btnAdjuntar');
    const inputAdjunto = document.getElementById('inputAdjunto');

    if (btnAdjuntar && inputAdjunto) {
        btnAdjuntar.addEventListener('click', () => inputAdjunto.click());
        
        inputAdjunto.addEventListener('change', async function() {
            if (this.files.length > 0) {
                const archivo = this.files[0];
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const base64 = e.target.result;
                    try {
                        await updateAppointment(cita.id_citas, { 
                            documento: base64,
                            contexto_cita: cita.contexto_cita || null,
                            nota: cita.nota || null
                        });
                        alert(`✅ Documento "${archivo.name}" adjuntado correctamente.`);
                    } catch (error) {
                        console.error('Error al guardar documento:', error);
                        alert('❌ Error al guardar el documento.');
                    }
                };
                reader.readAsDataURL(archivo);
                this.value = '';
            }
        });
    }
}

module.exports = {
    initDetalleCita
};