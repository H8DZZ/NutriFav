const { getPatientById, addPatient, updatePatient } = require('./dataService.js');

let pacienteId = null;

async function initExpediente(id) {
    if (!id) {
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;">ID de paciente no proporcionado.</p>';
        return;
    }

    if (id === 'nuevo') {
        pacienteId = null;
        const nombreEl = document.getElementById('pacienteNombre');
        if (nombreEl) nombreEl.textContent = 'Nuevo Paciente';
        const expEl = document.getElementById('pacienteExpediente');
        if (expEl) expEl.textContent = '#NF-NUEVO';
        const ultEl = document.getElementById('pacienteUltimaConsulta');
        if (ultEl) ultEl.textContent = '—';
        document.querySelectorAll('#clinicalHistoryForm input, #clinicalHistoryForm textarea, #clinicalHistoryForm select').forEach(el => {
            if (el.type !== 'radio' && el.type !== 'checkbox') el.value = '';
        });
        document.querySelectorAll('#clinicalHistoryForm input[type="radio"]').forEach(el => el.checked = false);
        document.querySelectorAll('#clinicalHistoryForm input[type="checkbox"]').forEach(el => el.checked = false);
        setupEmbarazoVisibility(null);
        setupEventListeners(null);
        return;
    }

    pacienteId = parseInt(id);
    try {
        const paciente = await getPatientById(pacienteId);
        if (!paciente) {
            document.getElementById('appContent').innerHTML = '<p style="padding:40px;">Paciente no encontrado.</p>';
            return;
        }
        cargarDatos(paciente);
        setupEmbarazoVisibility(paciente);
        setupEventListeners(paciente);
    } catch (error) {
        console.error('Error al cargar expediente:', error);
        document.getElementById('appContent').innerHTML = '<p style="padding:40px;color:red;">Error al cargar el expediente.</p>';
    }
}

function cargarDatos(paciente) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    const setInputValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    
    const setRadioChecked = (selector, value) => {
        document.querySelectorAll(selector).forEach(el => {
            if (el) el.checked = (el.value === value);
        });
    };

    setText('pacienteNombre', paciente.nombre || '—');
    setText('pacienteExpediente', paciente.expediente || '#NF-0000');
    setText('pacienteUltimaConsulta', paciente.ultima_consulta ? `Última consulta: ${paciente.ultima_consulta}` : '—');

    setInputValue('inputNombre', paciente.nombre || '');
    setInputValue('inputEdad', paciente.edad || '');
    setRadioChecked('input[name="sexo"]', paciente.sexo || '');
    setInputValue('inputCelular', paciente.celular || '');
    setInputValue('inputEmail', paciente.email || '');
    setInputValue('inputDireccion', paciente.direccion || '');

    setInputValue('inputAlcoholismo', paciente.alcoholismo || '');
    setInputValue('inputTabaquismo', paciente.tabaquismo || '');
    setInputValue('inputDrogas', paciente.drogas || '');
    setInputValue('inputOtrosNoPat', paciente.otros_no_patologicos || '');

    const enfermedadesMap = {
        'Diabetes': paciente.diabetes || 0,
        'Hipertensión': paciente.hipertension || 0,
        'Enfermedad Renal': paciente.enfermedad_renal || 0,
        'Gastritis': paciente.gastritis || 0,
        'Colitis': paciente.colitis || 0
    };
    document.querySelectorAll('#enfermedadesGroup input[type="checkbox"]').forEach(cb => {
        if (enfermedadesMap[cb.value] !== undefined) {
            cb.checked = enfermedadesMap[cb.value] === 1;
        } else if (cb.value === 'Otros') {
            cb.checked = paciente.otros_patologicos && paciente.otros_patologicos.trim() !== '';
        }
    });

    setInputValue('inputHeredofamiliares', paciente.antecedentes_heredofamiliares || '');
    setInputValue('inputCirugias', paciente.cirugias || '');
    setInputValue('inputAlergias', paciente.alergias_intolerancias || '');

    setInputValue('inputFUM', paciente.gineco_fum || '');
    setInputValue('inputFPM', paciente.gineco_fpm || '');
    setInputValue('inputMenarca', paciente.gineco_menarca || '');
    setInputValue('inputAnticonceptivo', paciente.gineco_anticonceptivo || '');
    const chkEmbarazo = document.getElementById('checkboxEmbarazo');
    if (chkEmbarazo) chkEmbarazo.checked = paciente.embarazo_sdg && paciente.embarazo_sdg.trim() !== '';
    setInputValue('inputSDG', paciente.embarazo_sdg || '');
    setInputValue('inputTrimestre', paciente.embarazo_trimestre || '');
    setInputValue('inputGestas', paciente.embarazo_gestas || '');
    setInputValue('inputPartos', paciente.embarazo_partos || '');
    setInputValue('inputCesareas', paciente.embarazo_cesareas || '');
    setInputValue('inputAbortos', paciente.embarazo_abortos || '');
    setInputValue('inputObsEmbarazo', paciente.embarazo_observaciones || '');
    const chkClimaterio = document.getElementById('checkboxClimaterio');
    if (chkClimaterio) chkClimaterio.checked = paciente.climaterio_menopausia ? true : false;
    setInputValue('inputTerapiaHormonal', paciente.terapia_hormonal || '');

    setInputValue('inputActividadTipo', paciente.actividad_tipo || '');
    setInputValue('inputActividadFrecuencia', paciente.actividad_frecuencia || '');
    setInputValue('inputActividadDuracion', paciente.actividad_duracion || '');
    setInputValue('inputActividadEvolucion', paciente.actividad_tiempo_evolucion || '');

    const chkLabs = document.getElementById('checkLabs');
    if (chkLabs) chkLabs.checked = paciente.laboratorios_recientes ? true : false;
    setInputValue('inputLaboratorios', paciente.laboratorios_recientes || '');

    setInputValue('inputPreparaAlimentos', paciente.quien_prepara_alimentos || '');
    setRadioChecked('input[name="apetito"]', paciente.nivel_apetito || '');
    setInputValue('inputMayorApetito', paciente.hora_mayor_apetito || '');
    setInputValue('inputAlergiasAlimenticias', paciente.alergias_intolerancias || '');
    setInputValue('inputAlimentosPreferidos', paciente.alimentos_preferidos || '');
    setInputValue('inputAlimentosNoGustan', paciente.alimentos_no_agraden || '');
    setInputValue('inputAlimentosMalestar', paciente.alimentos_malestar || '');
    setInputValue('inputSuplementos', paciente.complemento_suplemento || '');

    setInputValue('inputObjetivo', paciente.objetivo || '');

    const dietasPrevias = paciente.recordatorio_dietas_ant ? 'Si' : 'No';
    document.querySelectorAll('input[name="dietas_previas"]').forEach(el => {
        if (el) el.checked = (el.value === dietasPrevias);
    });
    setInputValue('inputDietasPrevias', paciente.recordatorio_dietas_tiempo || '');
    setInputValue('inputHoraDespertar', paciente.hora_despertar || '');
    setInputValue('inputHoraDormir', paciente.hora_dormir || '');
    setInputValue('inputNumComidas', paciente.cuantas_comidas || '');
    setInputValue('inputDietaHabitual', paciente.descripcion_dieta_habitual || '');
}

function setupEmbarazoVisibility(paciente) {
    const checkbox = document.getElementById('checkboxEmbarazo');
    const fields = document.querySelector('.embarazo-fields');
    if (!checkbox || !fields) return;

    function toggleEmbarazo(show) {
        fields.style.display = show ? 'block' : 'none';
        const inputs = fields.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.disabled = !show;
        });
    }

    const tieneDatos = paciente && (
        (paciente.embarazo_sdg && paciente.embarazo_sdg.trim() !== '') ||
        paciente.embarazo_gestas > 0 ||
        paciente.embarazo_partos > 0 ||
        paciente.embarazo_cesareas > 0 ||
        paciente.embarazo_abortos > 0 ||
        (paciente.embarazo_trimestre && paciente.embarazo_trimestre.trim() !== '')
    );
    if (tieneDatos) {
        checkbox.checked = true;
        toggleEmbarazo(true);
    } else {
        toggleEmbarazo(false);
    }

    checkbox.addEventListener('change', function() {
        toggleEmbarazo(this.checked);
    });
}

function setupEventListeners(paciente) {
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', () => {
            document.body.classList.add('imprimir-expediente');
            window.print();
            setTimeout(() => {
                document.body.classList.remove('imprimir-expediente');
            }, 500);
        });
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const data = recolectarDatos();
            if (!data.nombre || data.nombre.trim() === '') {
                alert('El nombre es obligatorio.');
                return;
            }
            try {
                let resultId;
                if (pacienteId) {
                    await updatePatient(pacienteId, data);
                    resultId = pacienteId;
                } else {
                    const newId = await addPatient(data);
                    resultId = newId;
                    pacienteId = newId;
                }
                const originalHTML = saveBtn.innerHTML;
                saveBtn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Guardando...';
                saveBtn.disabled = true;

                setTimeout(() => {
                    saveBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Guardado con éxito';
                    saveBtn.style.backgroundColor = 'var(--color-primary-hover)';

                    setTimeout(() => {
                        saveBtn.innerHTML = originalHTML;
                        saveBtn.style.backgroundColor = '';
                        saveBtn.disabled = false;
                        if (!pacienteId) {
                            window.location.hash = `expediente/${resultId}`;
                        } else {
                            initExpediente(pacienteId);
                        }
                    }, 2000);
                }, 1200);
            } catch (error) {
                console.error('Error al guardar:', error);
                alert('Error al guardar el expediente.');
            }
        });
    }
}

function recolectarDatos() {
    const enfermedades = [];
    document.querySelectorAll('#enfermedadesGroup input[type="checkbox"]:checked').forEach(cb => {
        enfermedades.push(cb.value);
    });

    const sexo = document.querySelector('input[name="sexo"]:checked')?.value || '';
    const apetito = document.querySelector('input[name="apetito"]:checked')?.value || '';
    const dietasPrevias = document.querySelector('input[name="dietas_previas"]:checked')?.value === 'Si' ? 1 : 0;

    const diabetes = enfermedades.includes('Diabetes') ? 1 : 0;
    const hipertension = enfermedades.includes('Hipertensión') ? 1 : 0;
    const enfermedad_renal = enfermedades.includes('Enfermedad Renal') ? 1 : 0;
    const gastritis = enfermedades.includes('Gastritis') ? 1 : 0;
    const colitis = enfermedades.includes('Colitis') ? 1 : 0;
    const otros_patologicos = enfermedades.includes('Otros') ? 'Otros' : '';

    const hoy = new Date().toISOString().split('T')[0];

    return {
        nombre: document.getElementById('inputNombre')?.value || '',
        edad: parseInt(document.getElementById('inputEdad')?.value) || 0,
        sexo: sexo,
        celular: document.getElementById('inputCelular')?.value || '',
        email: document.getElementById('inputEmail')?.value || '',
        direccion: document.getElementById('inputDireccion')?.value || '',
        estado: 'Activo',
        expediente: null,
        meta_peso: null,
        peso_actual: null,
        imc: null,
        grasa_corporal: null,
        resumen: '',
        ultima_consulta: hoy,
        alcoholismo: document.getElementById('inputAlcoholismo')?.value || '',
        tabaquismo: document.getElementById('inputTabaquismo')?.value || '',
        drogas: document.getElementById('inputDrogas')?.value || '',
        otros_no_patologicos: document.getElementById('inputOtrosNoPat')?.value || '',
        diabetes: diabetes,
        hipertension: hipertension,
        enfermedad_renal: enfermedad_renal,
        gastritis: gastritis,
        colitis: colitis,
        otros_patologicos: otros_patologicos,
        antecedentes_heredofamiliares: document.getElementById('inputHeredofamiliares')?.value || '',
        cirugias: document.getElementById('inputCirugias')?.value || '',
        alergias_intolerancias: document.getElementById('inputAlergias')?.value || '',
        gineco_fum: document.getElementById('inputFUM')?.value || '',
        gineco_fpm: document.getElementById('inputFPM')?.value || '',
        gineco_menarca: document.getElementById('inputMenarca')?.value || '',
        gineco_anticonceptivo: document.getElementById('inputAnticonceptivo')?.value || '',
        embarazo_sdg: document.getElementById('inputSDG')?.value || '',
        embarazo_trimestre: document.getElementById('inputTrimestre')?.value || '',
        embarazo_gestas: parseInt(document.getElementById('inputGestas')?.value) || 0,
        embarazo_partos: parseInt(document.getElementById('inputPartos')?.value) || 0,
        embarazo_cesareas: parseInt(document.getElementById('inputCesareas')?.value) || 0,
        embarazo_abortos: parseInt(document.getElementById('inputAbortos')?.value) || 0,
        embarazo_observaciones: document.getElementById('inputObsEmbarazo')?.value || '',
        climaterio_menopausia: document.getElementById('checkboxClimaterio')?.checked ? 1 : 0,
        terapia_hormonal: document.getElementById('inputTerapiaHormonal')?.value || '',
        actividad_tipo: document.getElementById('inputActividadTipo')?.value || '',
        actividad_frecuencia: document.getElementById('inputActividadFrecuencia')?.value || '',
        actividad_duracion: document.getElementById('inputActividadDuracion')?.value || '',
        actividad_tiempo_evolucion: document.getElementById('inputActividadEvolucion')?.value || '',
        laboratorios_recientes: document.getElementById('inputLaboratorios')?.value || '',
        quien_prepara_alimentos: document.getElementById('inputPreparaAlimentos')?.value || '',
        nivel_apetito: apetito,
        hora_mayor_apetito: document.getElementById('inputMayorApetito')?.value || '',
        alimentos_preferidos: document.getElementById('inputAlimentosPreferidos')?.value || '',
        alimentos_no_agraden: document.getElementById('inputAlimentosNoGustan')?.value || '',
        alimentos_malestar: document.getElementById('inputAlimentosMalestar')?.value || '',
        complemento_suplemento: document.getElementById('inputSuplementos')?.value || '',
        objetivo: document.getElementById('inputObjetivo')?.value || '',
        recordatorio_dietas_ant: dietasPrevias,
        recordatorio_dietas_tiempo: document.getElementById('inputDietasPrevias')?.value || '',
        hora_despertar: document.getElementById('inputHoraDespertar')?.value || '',
        hora_dormir: document.getElementById('inputHoraDormir')?.value || '',
        cuantas_comidas: parseInt(document.getElementById('inputNumComidas')?.value) || 0,
        descripcion_dieta_habitual: document.getElementById('inputDietaHabitual')?.value || ''
    };
}

module.exports = { initExpediente };