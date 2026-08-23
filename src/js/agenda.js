const { getStats, getUpcomingAppointments, getAppointmentsForDay, getAdministradores, getAllAppointments } = require('./dataService.js');

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const DAYS_SHORT = ['L','M','M','J','V','S','D'];

let yearGrid, monthGrid, yearLabel, monthLabel, yearPrev, yearNext, monthPrev, monthNext;
let btnViewYear, btnViewMonth, pageTitle, todayLabel;
let citasHoyStat, citasPendientesStat, proximasCitasList;
let administradores = [];
let currentAdminId = null;

async function initAgenda() {
    yearGrid = document.getElementById('yearGrid');
    monthGrid = document.getElementById('monthGrid');
    yearLabel = document.getElementById('yearLabel');
    monthLabel = document.getElementById('currentMonthLabel');
    yearPrev = document.getElementById('yearPrev');
    yearNext = document.getElementById('yearNext');
    monthPrev = document.getElementById('monthPrev');
    monthNext = document.getElementById('monthNext');
    btnViewYear = document.getElementById('btnViewYear');
    btnViewMonth = document.getElementById('btnViewMonth');
    pageTitle = document.getElementById('pageTitle');
    todayLabel = document.getElementById('todayLabel');
    citasHoyStat = document.getElementById('citasHoyStat');
    citasPendientesStat = document.getElementById('citasPendientesStat');
    proximasCitasList = document.getElementById('proximasCitasList');

    await cargarAdministradores();

    if (yearPrev) yearPrev.addEventListener('click', () => changeYear(-1));
    if (yearNext) yearNext.addEventListener('click', () => changeYear(1));
    if (monthPrev) monthPrev.addEventListener('click', () => changeMonth(-1));
    if (monthNext) monthNext.addEventListener('click', () => changeMonth(1));

    if (btnViewYear) btnViewYear.addEventListener('click', () => switchView('year'));
    if (btnViewMonth) btnViewMonth.addEventListener('click', () => switchView('month'));

    const filtroNutriologo = document.getElementById('filtroNutriologo');
    if (filtroNutriologo) {
        filtroNutriologo.addEventListener('change', function() {
            currentAdminId = this.value === 'todos' ? null : parseInt(this.value);
            loadStatsAndAppointments();
            renderYearView();
            renderMonthView();
        });
    }

    if (yearGrid) {
        yearGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.month-mini-card');
            if (card) {
                const mes = parseInt(card.dataset.mes);
                const año = parseInt(card.dataset.year);
                if (!isNaN(mes) && !isNaN(año)) {
                    selectMonth(mes, año);
                }
            }
        });
    }

    const hoy = new Date();
    if (todayLabel) todayLabel.textContent = `HOY: ${hoy.getDate()} DE ${MONTHS[hoy.getMonth()].toUpperCase()}`;

    await loadStatsAndAppointments();
    renderYearView();
    renderMonthView();
    switchView('year');
}

async function cargarAdministradores() {
    try {
        administradores = await getAdministradores();
        const filtroSelect = document.getElementById('filtroNutriologo');
        if (!filtroSelect) return;

        const valorActual = filtroSelect.value;
        
        while (filtroSelect.options.length > 1) {
            filtroSelect.remove(1);
        }

        if (administradores.length === 0) {
            const option = document.createElement('option');
            option.value = 'sin_administradores';
            option.textContent = '⚠️ No hay administradores registrados';
            option.disabled = true;
            filtroSelect.appendChild(option);
        } else {
            administradores.forEach(admin => {
                const option = document.createElement('option');
                option.value = admin.id_admin;
                option.textContent = admin.nombre_admin + (admin.rol ? ` · ${admin.rol}` : '');
                filtroSelect.appendChild(option);
            });
        }

        if (valorActual) {
            filtroSelect.value = valorActual;
        }
    } catch (error) {
        console.error('Error al cargar administradores:', error);
    }
}

function obtenerIdAdminFiltro() {
    const filtroSelect = document.getElementById('filtroNutriologo');
    if (!filtroSelect) return null;
    const valor = filtroSelect.value;
    return valor === 'todos' || valor === 'sin_administradores' ? null : parseInt(valor);
}

async function loadStatsAndAppointments() {
    const adminId = obtenerIdAdminFiltro();
    const stats = await getStats(adminId);
    if (citasHoyStat) citasHoyStat.textContent = stats.citasHoy || 0;
    
    const allAppointments = await getUpcomingAppointments(100, adminId);
    const pendientes = allAppointments.filter(c => c.estado !== 'CONFIRMADO' && c.estado !== 'ATENDIDA').length;
    if (citasPendientesStat) citasPendientesStat.textContent = pendientes;

    const proximas = allAppointments.slice(0, 5);
    if (proximasCitasList) {
        if (proximas.length === 0) {
            proximasCitasList.innerHTML = `<p class="empty-message">No hay citas próximas.</p>`;
        } else {
            proximasCitasList.innerHTML = proximas.map(c => {
                const fecha = new Date(c.fecha_cita);
                const dia = String(fecha.getDate()).padStart(2, '0');
                const mes = MONTHS_SHORT[fecha.getMonth()];
                const hora = c.hora_cita.slice(0,5);
                const motivo = c.contexto_cita || 'Consulta';
                return `
                    <a href="#" data-view="detalle-cita" data-id="${c.id_citas}" class="item-lista flex-between">
                        <div class="item-left">
                            <div class="caja-fecha">
                                <span class="fecha-dia">${dia}</span>
                                <span class="fecha-mes">${mes}</span>
                            </div>
                            <div class="item-info">
                                <p class="item-titulo">${c.paciente_nombre}</p>
                                <p class="item-sub">${hora} • ${motivo}</p>
                            </div>
                        </div>
                        <span class="badge ${c.estado === 'CONFIRMADO' ? 'badge-confirmado' : c.estado === 'CANCELADO' ? 'badge-cancelado' : 'badge-pendiente'}">${c.estado}</span>
                    </a>
                `;
            }).join('');
        }
    }
}

function renderYearView() {
    if (!yearLabel || !yearGrid) return;
    yearLabel.textContent = currentYear;
    const today = new Date();
    const currentMonthReal = today.getMonth();
    const currentYearReal = today.getFullYear();
    const adminId = obtenerIdAdminFiltro();
    
    let html = '';
    for (let m = 0; m < 12; m++) {
        const firstDay = new Date(currentYear, m, 1).getDay();
        let startOffset = (firstDay === 0) ? 6 : firstDay - 1;
        const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
        let daysHtml = '';
        for (let d = 0; d < 7; d++) {
            const isSun = (d === 6);
            daysHtml += `<span class="day-head${isSun ? ' sun' : ''}">${DAYS_SHORT[d]}</span>`;
        }
        for (let i = 0; i < startOffset; i++) daysHtml += `<span></span>`;
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = (currentYear === currentYearReal && m === currentMonthReal && day === today.getDate());
            daysHtml += `<span${isToday ? ' class="day-today"' : ''}>${day}</span>`;
        }
        const totalCells = startOffset + daysInMonth;
        const remaining = 42 - totalCells;
        for (let i = 0; i < remaining; i++) daysHtml += `<span></span>`;

        const isCurrentMonth = (currentYear === currentYearReal && m === currentMonthReal);
        const currentClass = isCurrentMonth ? ' current-month' : '';

        html += `
            <div class="month-mini-card${currentClass}" data-mes="${m}" data-year="${currentYear}">
                <h4 class="month-title">${MONTHS[m]}</h4>
                <div class="calendar-mini-grid">
                    ${daysHtml}
                </div>
            </div>
        `;
    }
    yearGrid.innerHTML = html;
}

async function renderMonthView() {
    if (!monthLabel || !monthGrid) return;
    monthLabel.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = (firstDay === 0) ? 6 : firstDay - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const adminId = obtenerIdAdminFiltro();

    let html = '';
    const totalCells = 42;
    for (let i = 0; i < totalCells; i++) {
        let dayNumber = i - startOffset + 1;
        let isDisabled = (dayNumber < 1 || dayNumber > daysInMonth);
        let isToday = false;
        if (!isDisabled) {
            if (currentYear === todayYear && currentMonth === todayMonth && dayNumber === todayDate) isToday = true;
        }
        const disabledClass = isDisabled ? ' disabled' : '';
        const todayClass = isToday ? ' today-cell' : '';
        const numDay = isDisabled ? '' : `<span class="num-day">${dayNumber}</span>`;

        let eventHtml = '';
        if (!isDisabled) {
            const citasDelDia = await getAppointmentsForDay(currentYear, currentMonth, dayNumber, adminId);
            if (citasDelDia.length > 0) {
                eventHtml = `<div class="event-list">`;
                citasDelDia.forEach(c => {
                    const hora = c.hora_cita.slice(0,5);
                    const paciente = c.paciente_nombre;
                    const estadoClass = c.estado.toLowerCase();
                    eventHtml += `
                        <a href="#" data-view="detalle-cita" data-id="${c.id_citas}" class="event-tag ${estadoClass}">
                            ${hora} - ${paciente}
                        </a>
                    `;
                });
                eventHtml += `</div>`;
            }
        }

        html += `
            <div class="day-cell${disabledClass}${todayClass}">
                ${numDay}
                ${eventHtml}
            </div>
        `;
    }
    monthGrid.innerHTML = html;
}

function changeYear(delta) {
    currentYear += delta;
    renderYearView();
    const monthView = document.getElementById('monthView');
    if (monthView && !monthView.classList.contains('hidden')) renderMonthView();
    loadStatsAndAppointments();
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) { currentMonth = 0; currentYear += 1; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear -= 1; }
    renderMonthView();
    const yearView = document.getElementById('yearView');
    if (yearView && !yearView.classList.contains('hidden')) renderYearView();
    loadStatsAndAppointments();
}

function selectMonth(monthIndex, year) {
    currentMonth = monthIndex;
    currentYear = year;
    switchView('month');
    renderMonthView();
    loadStatsAndAppointments();
}

function switchView(view) {
    const yearView = document.getElementById('yearView');
    const monthView = document.getElementById('monthView');
    const btnYear = document.getElementById('btnViewYear');
    const btnMonth = document.getElementById('btnViewMonth');
    const pageTitle = document.getElementById('pageTitle');

    if (view === 'year') {
        if (yearView) yearView.classList.remove('hidden');
        if (monthView) monthView.classList.add('hidden');
        if (btnYear) btnYear.classList.add('active');
        if (btnMonth) btnMonth.classList.remove('active');
        if (pageTitle) pageTitle.textContent = "Agenda Anual";
        renderYearView();
    } else {
        if (yearView) yearView.classList.add('hidden');
        if (monthView) monthView.classList.remove('hidden');
        if (btnMonth) btnMonth.classList.add('active');
        if (btnYear) btnYear.classList.remove('active');
        if (pageTitle) pageTitle.textContent = "Agenda Mensual";
        renderMonthView();
    }
}

window.selectMonth = selectMonth;

module.exports = {
    initAgenda
};