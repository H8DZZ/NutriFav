const { getPatientById, getSeguimientos, addSeguimiento, getSeguimientoById, addFoto } = require('./dataService.js');

let pacienteId = null;
let sesionId = null;
let paciente = null;
let sesion = null;
let seguimientosAnteriores = [];

async function initRegistroSeguimiento(id, tipo = 'paciente') {
    if (tipo === 'sesion' && id) {
        sesionId = parseInt(id);
        try {
            sesion = await getSeguimientoById(sesionId);
            if (!sesion) {
                document.getElementById('appContent').innerHTML = '<p style="padding:40px;">Sesión no encontrada.</p>';
                return;
            }
            pacienteId = sesion.id_paciente;
            paciente = await getPatientById(pacienteId);
            if (!paciente) {
                document.getElementById('appContent').innerHTML = '<p style="padding:40px;">Paciente no encontrado.</p>';
                return;
            }
            seguimientosAnteriores = await getSeguimientos(pacienteId);
            renderizarDatos(paciente, sesion);
            configurarEventos(paciente, sesion);
            return;
        } catch (error) {
            console.error('Error al cargar sesión:', error);
            document.getElementById('appContent').innerHTML = '<p style="padding:40px;color:red;">Error al cargar la sesión.</p>';
            return;
        }
    }

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

        seguimientosAnteriores = await getSeguimientos(pacienteId);
        renderizarDatos(paciente, null);
        configurarEventos(paciente, null);

    } catch (error) {
        console.error('Error al cargar registro:', error);
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;color:red;">Error al cargar el registro.</p>';
    }
}

function renderizarDatos(paciente, sesion) {
    const inputPaciente = document.getElementById('inputPaciente');
    if (inputPaciente) inputPaciente.value = paciente.nombre || '';
    const inputEdad = document.getElementById('inputEdad');
    if (inputEdad) inputEdad.value = paciente.edad || '';

    const hoy = new Date();
    const fechaInput = document.getElementById('fechaRegistro');
    const fechaActual = document.getElementById('fechaActual');

    if (sesion) {
        if (fechaInput) fechaInput.value = sesion.fecha_sesion || hoy.toISOString().split('T')[0];
        if (fechaActual) fechaActual.textContent = new Date(sesion.fecha_sesion).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const campos = {
            'inputPeso': 'peso_kg',
            'inputTalla': 'altura_cm',
            'inputPesoHabitual': 'peso_habitual',
            'inputGrasa': 'grasa_corporal',
            'inputMusculo': 'masa_muscular',
            'inputMasaOsea': 'masa_osea',
            'inputGrasaVisceral': 'grasa_visceral',
            'inputCuello': 'circunferencia_cuello',
            'inputPecho': 'circunferencia_pecho',
            'inputBicepsRelajado': 'circunferencia_biceps_relajado',
            'inputBicepsContraido': 'circunferencia_biceps_contraido',
            'inputCintura': 'circunferencia_cintura',
            'inputCadera': 'circunferencia_cadera',
            'inputGluteo': 'circunferencia_gluteo',
            'inputMuslo': 'circunferencia_muslo',
            'inputCuadricepRelajado': 'circunferencia_cuadricep_relajado',
            'inputCuadricepContraido': 'circunferencia_cuadricep_contraido',
            'inputPantorrilla': 'circunferencia_pantorrilla',
            'inputPliegueBicipital': 'pliegue_bicipital',
            'inputPliegueTricipital': 'pliegue_tricipital',
            'inputPliegueSubescapular': 'pliegue_subescapular',
            'inputPliegueSupraileaco': 'pliegue_supraileaco',
            'inputPliegueAbdominal': 'pliegue_abdominal',
            'inputPliegueMuslo': 'pliegue_muslo',
            'inputPlieguePantorrilla': 'pliegue_pantorrilla',
            'inputPresionSistolica': 'presion_sistolica',
            'inputPresionDiastolica': 'presion_diastolica',
            'inputFrecuenciaCardiaca': 'frecuencia_cardiaca',
            'inputObservaciones': 'observaciones_sesion'
        };
        Object.keys(campos).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = sesion[campos[id]] || '';
        });
        calcularIMC();
        document.querySelectorAll('.campo-input').forEach(el => el.disabled = true);
        const btnGuardar = document.getElementById('btnGuardarRegistro');
        if (btnGuardar) btnGuardar.style.display = 'none';
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) {
            btnCancelar.textContent = 'Volver';
            btnCancelar.dataset.view = 'seguimiento';
            btnCancelar.dataset.id = pacienteId;
        }
        const title = document.querySelector('.page-title');
        if (title) title.textContent = 'Detalle de Seguimiento';
        const subtitle = document.querySelector('.page-subtitle');
        if (subtitle) subtitle.textContent = `Sesión del ${new Date(sesion.fecha_sesion).toLocaleDateString('es-ES')} - ${paciente.nombre}`;
    } else {
        if (fechaInput) fechaInput.value = hoy.toISOString().split('T')[0];
        if (fechaActual) fechaActual.textContent = hoy.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        document.querySelectorAll('.campo-input').forEach(el => el.disabled = false);
        const btnGuardar = document.getElementById('btnGuardarRegistro');
        if (btnGuardar) btnGuardar.style.display = 'flex';
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) {
            btnCancelar.textContent = 'Cancelar';
            btnCancelar.dataset.view = 'seguimiento';
            btnCancelar.dataset.id = pacienteId;
        }
        const title = document.querySelector('.page-title');
        if (title) title.textContent = 'Registro de Seguimiento';
        const subtitle = document.querySelector('.page-subtitle');
        if (subtitle) subtitle.textContent = 'Sesión de control - ' + hoy.toLocaleDateString('es-ES');
    }

    const linkFotos = document.getElementById('linkFotos');
    if (linkFotos) linkFotos.dataset.id = pacienteId;

    actualizarProgreso();
}

function actualizarProgreso() {
    const sorted = [...seguimientosAnteriores].sort((a, b) => new Date(a.fecha_sesion) - new Date(b.fecha_sesion));
    if (sorted.length === 0) {
        document.getElementById('pesoInicialDisplay').textContent = '—';
        document.getElementById('pesoActualDisplay').textContent = '—';
        document.getElementById('diferenciaPesoDisplay').textContent = '—';
        document.getElementById('progresoMetaFill').style.width = '0%';
        document.getElementById('progresoMetaCaption').textContent = '0% completado';
        return;
    }

    const primerPeso = sorted[0].peso_kg || 0;
    const ultimoPeso = sorted[sorted.length - 1].peso_kg || 0;
    const diferencia = ultimoPeso - primerPeso;

    const pesoInicialDisplay = document.getElementById('pesoInicialDisplay');
    if (pesoInicialDisplay) pesoInicialDisplay.textContent = primerPeso.toFixed(1) + ' kg';
    const pesoActualDisplay = document.getElementById('pesoActualDisplay');
    if (pesoActualDisplay) pesoActualDisplay.textContent = ultimoPeso.toFixed(1) + ' kg';
    const diferenciaPesoDisplay = document.getElementById('diferenciaPesoDisplay');
    if (diferenciaPesoDisplay) diferenciaPesoDisplay.textContent = (diferencia > 0 ? '+' : '') + diferencia.toFixed(1) + ' kg';

    const metaPeso = paciente?.meta_peso || (primerPeso * 0.9);
    const progreso = Math.min(100, ((primerPeso - ultimoPeso) / (primerPeso - metaPeso)) * 100);
    const progresoFill = document.getElementById('progresoMetaFill');
    if (progresoFill) progresoFill.style.width = Math.min(100, progreso) + '%';
    const progresoCaption = document.getElementById('progresoMetaCaption');
    if (progresoCaption) progresoCaption.textContent = Math.round(progreso) + '% completado';
}

function calcularIMC() {
    const peso = parseFloat(document.getElementById('inputPeso')?.value);
    const tallaCm = parseFloat(document.getElementById('inputTalla')?.value);
    const bmiDisplay = document.getElementById('bmi-value');
    const bmiClasificacion = document.getElementById('bmi-clasificacion');
    if (!bmiDisplay || !bmiClasificacion) return;
    if (peso > 0 && tallaCm > 0) {
        const tallaM = tallaCm / 100;
        const bmi = peso / (tallaM * tallaM);
        bmiDisplay.textContent = bmi.toFixed(1);
        let clasificacion = '';
        if (bmi < 18.5) clasificacion = 'Bajo peso';
        else if (bmi < 25) clasificacion = 'Normal';
        else if (bmi < 30) clasificacion = 'Sobrepeso';
        else if (bmi < 35) clasificacion = 'Obesidad grado I';
        else if (bmi < 40) clasificacion = 'Obesidad grado II';
        else clasificacion = 'Obesidad grado III';
        bmiClasificacion.textContent = clasificacion;
    } else {
        bmiDisplay.textContent = '—';
        bmiClasificacion.textContent = '—';
    }
}

function configurarEventos(paciente, sesion) {
    const pesoInput = document.getElementById('inputPeso');
    const tallaInput = document.getElementById('inputTalla');
    if (pesoInput) pesoInput.addEventListener('input', calcularIMC);
    if (tallaInput) tallaInput.addEventListener('input', calcularIMC);

    const uploadFrente = document.getElementById('uploadFrente');
    if (uploadFrente) {
        uploadFrente.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async function(ev) {
                    const base64 = ev.target.result;
                    try {
                        await addFoto({
                            id_paciente: pacienteId,
                            url: base64,
                            fecha: new Date().toISOString(),
                            angulo: 'Frente',
                            descripcion: 'Foto de frente',
                            es_principal: 0
                        });
                        alert('Foto de frente guardada.');
                    } catch (err) {
                        console.error(err);
                        alert('Error al guardar la foto.');
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        });
    }

    const uploadPerfil = document.getElementById('uploadPerfil');
    if (uploadPerfil) {
        uploadPerfil.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async function(ev) {
                    const base64 = ev.target.result;
                    try {
                        await addFoto({
                            id_paciente: pacienteId,
                            url: base64,
                            fecha: new Date().toISOString(),
                            angulo: 'Perfil',
                            descripcion: 'Foto de perfil',
                            es_principal: 0
                        });
                        alert('Foto de perfil guardada.');
                    } catch (err) {
                        console.error(err);
                        alert('Error al guardar la foto.');
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        });
    }

    if (sesion) {
        return;
    }

    const btnGuardar = document.getElementById('btnGuardarRegistro');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const data = recolectarDatos();
            if (!data.peso_kg || data.peso_kg <= 0) {
                alert('El peso es obligatorio.');
                return;
            }
            try {
                await addSeguimiento(data);
                alert('Registro guardado con éxito.');
                window.location.hash = 'seguimiento/' + pacienteId;
            } catch (error) {
                console.error('Error al guardar:', error);
                alert('Error al guardar el registro.');
            }
        });
    }
}

function recolectarDatos() {
    return {
        id_paciente: pacienteId,
        fecha_sesion: document.getElementById('fechaRegistro')?.value || '',
        peso_kg: parseFloat(document.getElementById('inputPeso')?.value) || 0,
        altura_cm: parseFloat(document.getElementById('inputTalla')?.value) || 0,
        peso_habitual: parseFloat(document.getElementById('inputPesoHabitual')?.value) || 0,
        grasa_corporal: parseFloat(document.getElementById('inputGrasa')?.value) || 0,
        masa_muscular: parseFloat(document.getElementById('inputMusculo')?.value) || 0,
        masa_osea: parseFloat(document.getElementById('inputMasaOsea')?.value) || 0,
        grasa_visceral: parseFloat(document.getElementById('inputGrasaVisceral')?.value) || 0,
        circunferencia_cuello: parseFloat(document.getElementById('inputCuello')?.value) || 0,
        circunferencia_pecho: parseFloat(document.getElementById('inputPecho')?.value) || 0,
        circunferencia_biceps_relajado: parseFloat(document.getElementById('inputBicepsRelajado')?.value) || 0,
        circunferencia_biceps_contraido: parseFloat(document.getElementById('inputBicepsContraido')?.value) || 0,
        circunferencia_cintura: parseFloat(document.getElementById('inputCintura')?.value) || 0,
        circunferencia_cadera: parseFloat(document.getElementById('inputCadera')?.value) || 0,
        circunferencia_gluteo: parseFloat(document.getElementById('inputGluteo')?.value) || 0,
        circunferencia_muslo: parseFloat(document.getElementById('inputMuslo')?.value) || 0,
        circunferencia_cuadricep_relajado: parseFloat(document.getElementById('inputCuadricepRelajado')?.value) || 0,
        circunferencia_cuadricep_contraido: parseFloat(document.getElementById('inputCuadricepContraido')?.value) || 0,
        circunferencia_pantorrilla: parseFloat(document.getElementById('inputPantorrilla')?.value) || 0,
        pliegue_bicipital: parseFloat(document.getElementById('inputPliegueBicipital')?.value) || 0,
        pliegue_tricipital: parseFloat(document.getElementById('inputPliegueTricipital')?.value) || 0,
        pliegue_subescapular: parseFloat(document.getElementById('inputPliegueSubescapular')?.value) || 0,
        pliegue_supraileaco: parseFloat(document.getElementById('inputPliegueSupraileaco')?.value) || 0,
        pliegue_abdominal: parseFloat(document.getElementById('inputPliegueAbdominal')?.value) || 0,
        pliegue_muslo: parseFloat(document.getElementById('inputPliegueMuslo')?.value) || 0,
        pliegue_pantorrilla: parseFloat(document.getElementById('inputPlieguePantorrilla')?.value) || 0,
        presion_sistolica: parseFloat(document.getElementById('inputPresionSistolica')?.value) || 0,
        presion_diastolica: parseFloat(document.getElementById('inputPresionDiastolica')?.value) || 0,
        frecuencia_cardiaca: parseFloat(document.getElementById('inputFrecuenciaCardiaca')?.value) || 0,
        observaciones_sesion: document.getElementById('inputObservaciones')?.value || '',
        estado_paciente: 'Pendiente'
    };
}

module.exports = {
    initRegistroSeguimiento
};