const { getPatientById, getFotosByPaciente, addFoto, deleteFoto } = require('./dataService.js');

let pacienteId = null;
let fotos = [];
let selectedPhotos = [];
let archivosPendientes = [];
let indiceArchivoActual = 0;
let procesando = false;

async function initFotos(id) {
    if (!id) {
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;">ID de paciente no proporcionado.</p>';
        return;
    }

    pacienteId = parseInt(id);
    selectedPhotos = [];

    try {
        const paciente = await getPatientById(pacienteId);
        if (!paciente) {
            document.getElementById('appContent').innerHTML = '<p style="padding:40px;">Paciente no encontrado.</p>';
            return;
        }

        fotos = await getFotosByPaciente(pacienteId);

        const nombreEl = document.getElementById('pacienteNombre');
        if (nombreEl) nombreEl.textContent = paciente.nombre;

        renderGallery(fotos);
        setupEventListeners(paciente);

    } catch (error) {
        console.error('Error al cargar fotos:', error);
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;color:red;">Error al cargar las fotos.</p>';
    }
}

function renderGallery(fotosList) {
    const container = document.getElementById('galleryContainer');
    if (!container) return;

    const selectedCount = document.getElementById('selectedCount');
    const btnCompare = document.getElementById('btnCompare');

    if (fotosList.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align:center;padding:60px 20px;">
                <span class="material-symbols-outlined" style="font-size:64px;color:var(--text-muted);display:block;margin-bottom:16px;">photo_camera</span>
                <h3 style="font-size:18px;font-weight:700;color:var(--text-primary);">No hay fotos</h3>
                <p style="color:var(--text-muted);margin-top:8px;">Sube fotos de progreso para este paciente.</p>
                <button class="btn btn-primary" id="btnSubirFotosDesdeVacio" style="margin-top:16px;">
                    <span class="material-symbols-outlined">cloud_upload</span>
                    Subir Fotos
                </button>
            </div>
        `;
        const btnSubirVacio = document.getElementById('btnSubirFotosDesdeVacio');
        if (btnSubirVacio) {
            btnSubirVacio.removeEventListener('click', subirFotos);
            btnSubirVacio.addEventListener('click', subirFotos);
        }
        if (selectedCount) selectedCount.textContent = '0';
        if (btnCompare) btnCompare.disabled = true;
        return;
    }

    const sorted = [...fotosList].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = '';
    sorted.forEach((foto, index) => {
        const isSelected = selectedPhotos.some(s => s.id_foto === foto.id_foto);
        const isLatest = index === 0;
        const fecha = new Date(foto.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

        html += `
            <div class="photo-card ${isSelected ? 'selected' : ''}" data-id="${foto.id_foto}">
                <img class="photo-img" src="${foto.url}" alt="${foto.descripcion || 'Foto de progreso'}" loading="lazy" />
                ${isLatest ? '<span class="badge-latest">Más reciente</span>' : ''}
                <div class="photo-overlay">
                    <h4 class="photo-title">${foto.angulo || 'Sin ángulo'}</h4>
                    <p class="photo-desc">${fechaStr}</p>
                    ${foto.descripcion ? `<p class="photo-desc" style="font-size:11px;opacity:0.7;">${foto.descripcion}</p>` : ''}
                </div>
                <button class="select-btn" data-id="${foto.id_foto}">
                    <span class="material-symbols-outlined">${isSelected ? 'check_circle' : 'check_circle'}</span>
                </button>
                <button class="delete-btn-photo" data-id="${foto.id_foto}" title="Eliminar foto">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="gallery-section">
            <div class="section-header">
                <span class="section-date">${sorted.length} fotos</span>
                <span class="section-meta">• ${fotosList.filter(f => f.angulo === 'Frente').length} frente, ${fotosList.filter(f => f.angulo === 'Perfil').length} perfil</span>
            </div>
            <div class="grid-3-col">
                ${html}
            </div>
        </div>
    `;

    if (selectedCount) selectedCount.textContent = selectedPhotos.length;
    if (btnCompare) {
        btnCompare.disabled = selectedPhotos.length < 2;
    }

    document.querySelectorAll('.photo-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.delete-btn-photo') || e.target.closest('.select-btn')) return;
            const id = parseInt(this.dataset.id);
            toggleSelection(id);
        });

        const selectBtn = card.querySelector('.select-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = parseInt(this.dataset.id);
                toggleSelection(id);
            });
        }

        const deleteBtn = card.querySelector('.delete-btn-photo');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = parseInt(this.dataset.id);
                confirmDeleteFoto(id);
            });
        }
    });

    document.querySelectorAll('.photo-img').forEach(img => {
        img.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            const card = this.closest('.photo-card');
            if (card) {
                const id = parseInt(card.dataset.id);
                openZoom(id);
            }
        });
    });
}

function toggleSelection(id) {
    const index = selectedPhotos.findIndex(s => s.id_foto === id);
    if (index === -1) {
        if (selectedPhotos.length >= 2) {
            alert('Solo puedes seleccionar hasta 2 fotos para comparar.');
            return;
        }
        const foto = fotos.find(f => f.id_foto === id);
        if (foto) selectedPhotos.push(foto);
    } else {
        selectedPhotos.splice(index, 1);
    }

    document.querySelectorAll('.photo-card').forEach(card => {
        const cardId = parseInt(card.dataset.id);
        const isSelected = selectedPhotos.some(s => s.id_foto === cardId);
        card.classList.toggle('selected', isSelected);
        const selectBtn = card.querySelector('.select-btn');
        if (selectBtn) {
            selectBtn.innerHTML = `<span class="material-symbols-outlined">${isSelected ? 'check_circle' : 'check_circle'}</span>`;
            selectBtn.style.background = isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.85)';
            selectBtn.style.color = isSelected ? '#ffffff' : 'var(--text-muted)';
        }
    });

    const selectedCount = document.getElementById('selectedCount');
    const btnCompare = document.getElementById('btnCompare');
    if (selectedCount) selectedCount.textContent = selectedPhotos.length;
    if (btnCompare) {
        btnCompare.disabled = selectedPhotos.length < 2;
    }
}

function setupEventListeners(paciente) {
    const btnSubir = document.getElementById('btnSubirFotos');
    if (btnSubir) {
        btnSubir.removeEventListener('click', subirFotos);
        btnSubir.addEventListener('click', subirFotos);
    }

    const btnCompare = document.getElementById('btnCompare');
    if (btnCompare) {
        btnCompare.addEventListener('click', () => {
            if (selectedPhotos.length === 2) {
                openComparison(selectedPhotos[0], selectedPhotos[1]);
            } else {
                alert('Selecciona exactamente 2 fotos para comparar.');
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('photoModal');
            if (modal && modal.classList.contains('flex')) {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }
            const compareModal = document.getElementById('compareModal');
            if (compareModal && compareModal.classList.contains('active')) {
                compareModal.classList.remove('active');
                compareModal.style.display = 'none';
            }
            const datosModal = document.getElementById('modalDatosFoto');
            if (datosModal && document.body.contains(datosModal)) {
                document.body.removeChild(datosModal);
                procesando = false;

                archivosPendientes = [];
                indiceArchivoActual = 0;
            }
        }
    });
}

async function subirFotos() {
    if (procesando) {
        alert('Ya hay un proceso de subida en curso.');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        archivosPendientes = Array.from(files);
        indiceArchivoActual = 0;
        procesando = true;
        
        procesarSiguienteArchivo();
    };
    
    input.click();
}

function procesarSiguienteArchivo() {

    if (!procesando) {
        return;
    }

    if (indiceArchivoActual >= archivosPendientes.length) {
        procesando = false;
        recargarGaleria();
        return;
    }

    const file = archivosPendientes[indiceArchivoActual];
    mostrarModalDatosFoto(file);
}

function mostrarModalDatosFoto(file) {

    const modalExistente = document.getElementById('modalDatosFoto');
    if (modalExistente && document.body.contains(modalExistente)) {
        document.body.removeChild(modalExistente);
    }

    if (!procesando) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'modalDatosFoto';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 450px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <h3 style="font-size: 20px; font-weight: 700; color: #1c201a; margin-bottom: 8px;">Datos de la Foto</h3>
            <p style="font-size: 14px; color: #62675d; margin-bottom: 16px;">
                Foto ${indiceArchivoActual + 1} de ${archivosPendientes.length}: <strong>${file.name}</strong>
            </p>
            
            <div style="margin-bottom: 16px;">
                <label style="font-size: 13px; font-weight: 700; color: #62675d; display: block; margin-bottom: 6px;">Ángulo</label>
                <select id="selectAngulo" style="width: 100%; padding: 10px 14px; border: 1px solid #e0e4da; border-radius: 12px; font-size: 14px; font-family: inherit; outline: none; background: #f1f3ee;">
                    <option value="Frente">Frente</option>
                    <option value="Perfil">Perfil</option>
                    <option value="Lateral">Lateral</option>
                    <option value="Posterior">Posterior</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="font-size: 13px; font-weight: 700; color: #62675d; display: block; margin-bottom: 6px;">Descripción (opcional)</label>
                <input type="text" id="inputDescripcion" placeholder="Ej: Semana 4 - Progreso" style="width: 100%; padding: 10px 14px; border: 1px solid #e0e4da; border-radius: 12px; font-size: 14px; font-family: inherit; outline: none; background: #f1f3ee;">
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="btnCancelarSubida" style="padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #62675d; background: #f1f3ee; border: none; cursor: pointer; transition: background 0.2s;">
                    Cancelar
                </button>
                <button id="btnGuardarFoto" style="padding: 10px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #ffffff; background: #4a633b; border: none; cursor: pointer; transition: background 0.2s;">
                    Guardar Foto
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const descInput = document.getElementById('inputDescripcion');
    if (descInput) setTimeout(() => descInput.focus(), 100);

    const btnGuardar = document.getElementById('btnGuardarFoto');
    if (btnGuardar) {
        btnGuardar.onclick = function() {
            const angulo = document.getElementById('selectAngulo').value;
            const descripcion = document.getElementById('inputDescripcion').value.trim();
            
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            
            guardarFotoActual(file, angulo, descripcion);
        };
    }
    const btnCancelar = document.getElementById('btnCancelarSubida');
    if (btnCancelar) {
        btnCancelar.onclick = function() {
            console.log('❌ Cancelando proceso de subida');
            
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            
            procesando = false;
            archivosPendientes = [];
            indiceArchivoActual = 0;
            
            recargarGaleria();
        };
    }

    modal.onclick = function(e) {
        if (e.target === modal) {
            console.log('❌ Cancelando proceso de subida (click fuera)');
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            procesando = false;
            archivosPendientes = [];
            indiceArchivoActual = 0;
            recargarGaleria();
        }
    };

    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            console.log('❌ Cancelando proceso de subida (Escape)');
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', escapeHandler);
            procesando = false;
            archivosPendientes = [];
            indiceArchivoActual = 0;
            recargarGaleria();
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

async function guardarFotoActual(file, angulo, descripcion) {
    try {
        const base64 = await leerArchivoComoBase64(file);
        await addFoto({
            id_paciente: pacienteId,
            url: base64,
            fecha: new Date().toISOString(),
            angulo: angulo || 'Sin ángulo',
            descripcion: descripcion || '',
            es_principal: 0
        });
        console.log(`✅ Foto "${file.name}" guardada con éxito`);
    } catch (err) {
        console.error('Error al guardar foto:', err);
        alert(`Error al guardar la foto "${file.name}".`);
    }
    
    if (procesando) {
        indiceArchivoActual++;
        procesarSiguienteArchivo();
    }
}

function leerArchivoComoBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

async function recargarGaleria() {
    try {
        fotos = await getFotosByPaciente(pacienteId);
        selectedPhotos = [];
        renderGallery(fotos);
    } catch (error) {
        console.error('Error al recargar galería:', error);
    }
}

function confirmDeleteFoto(id) {
    const foto = fotos.find(f => f.id_foto === id);
    if (!foto) return;

    if (confirm(`¿Eliminar esta foto${foto.angulo ? ' (' + foto.angulo + ')' : ''}? Esta acción no se puede deshacer.`)) {
        eliminarFoto(id);
    }
}

async function eliminarFoto(id) {
    try {
        await deleteFoto(id);
        fotos = fotos.filter(f => f.id_foto !== id);
        selectedPhotos = selectedPhotos.filter(s => s.id_foto !== id);
        renderGallery(fotos);
    } catch (error) {
        console.error('Error al eliminar foto:', error);
        alert('Error al eliminar la foto.');
    }
}

function openZoom(id) {
    const foto = fotos.find(f => f.id_foto === id);
    if (!foto) return;

    const modal = document.getElementById('photoModal');
    const img = document.getElementById('modalImg');
    if (modal && img) {
        img.src = foto.url;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function openComparison(foto1, foto2) {
    const modal = document.getElementById('compareModal');
    const grid = document.getElementById('compareGrid');
    if (!modal || !grid) return;

    const fecha1 = new Date(foto1.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const fecha2 = new Date(foto2.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    const desc1 = foto1.descripcion ? `<span style="font-size:12px;color:#62675d;">${foto1.descripcion}</span>` : '';
    const desc2 = foto2.descripcion ? `<span style="font-size:12px;color:#62675d;">${foto2.descripcion}</span>` : '';

    grid.innerHTML = `
        <div class="compare-item">
            <div class="img-wrapper">
                <img src="${foto1.url}" alt="Comparación 1" />
            </div>
            <div class="meta" style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                <span class="date">${fecha1}</span>
                <span class="angle">${foto1.angulo || 'Sin ángulo'}</span>
                ${desc1}
            </div>
        </div>
        <div class="compare-item">
            <div class="img-wrapper">
                <img src="${foto2.url}" alt="Comparación 2" />
            </div>
            <div class="meta" style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                <span class="date">${fecha2}</span>
                <span class="angle">${foto2.angulo || 'Sin ángulo'}</span>
                ${desc2}
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.classList.add('active');

    const closeBtn = document.getElementById('compareCloseBtn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove('active');
            modal.style.display = 'none';
        };
    }
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    };
}
document.addEventListener('DOMContentLoaded', () => {
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            const modal = document.getElementById('photoModal');
            if (modal) {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }
        });
    }
});

module.exports = {
    initFotos
};