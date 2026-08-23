const { addTask, deleteTask, getTasks } = require('./dataService.js');

let taskModal = null;
let mainWrapper = null;

function openTaskModal() {
    taskModal = document.getElementById('taskModal');
    mainWrapper = document.getElementById('mainWrapper');
    if (!taskModal) return;
    taskModal.classList.add('active');
    if (mainWrapper) mainWrapper.classList.add('modal-blur');
    document.body.style.overflow = 'hidden';
}

function closeTaskModal() {
    if (!taskModal) return;
    taskModal.classList.remove('active');
    if (mainWrapper) mainWrapper.classList.remove('modal-blur');
    document.body.style.overflow = '';
    const form = document.getElementById('taskForm');
    if (form) form.reset();
    resetCategorySelection();
}

function resetCategorySelection() {
    const categoryOptions = document.querySelectorAll('.category-option');
    categoryOptions.forEach(opt => opt.classList.remove('active'));
    const defaultRadio = document.getElementById('catAdmin');
    if (defaultRadio) {
        defaultRadio.checked = true;
        defaultRadio.closest('.category-option')?.classList.add('active');
    }
}

function initTaskModal() {
    taskModal = document.getElementById('taskModal');
    mainWrapper = document.getElementById('mainWrapper');

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('#btnOpenTaskModal');
        if (btn) {
            e.preventDefault();
            openTaskModal();
        }
    });

    const btnClose = document.getElementById('btnCloseTaskModal');
    const btnCancel = document.getElementById('btnCancelTaskModal');

    if (btnClose) btnClose.addEventListener('click', closeTaskModal);
    if (btnCancel) btnCancel.addEventListener('click', closeTaskModal);

    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) closeTaskModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && taskModal && taskModal.classList.contains('active')) closeTaskModal();
    });

    const form = document.getElementById('taskForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = document.getElementById('taskDesc');
        if (!desc) return;
        const descText = desc.value.trim();
        if (!descText) return;
        const selected = document.querySelector('input[name="taskCategory"]:checked');
        const categoria = selected ? selected.value : 'ADMINISTRATIVA';
    
        await addTask({ detalle_tarea: descText, categoria_tarea: categoria });
    
        closeTaskModal();
        renderTasks();
    });
    }

    const categoryOptions = document.querySelectorAll('.category-option');
    categoryOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
            radio.addEventListener('change', () => {
                categoryOptions.forEach(opt => opt.classList.remove('active'));
                if (radio.checked) option.classList.add('active');
            });
        }
    });
}

function setupTaskDelegation() {
    document.getElementById('appContent').addEventListener('click', async (e) => {
        const closeBtn = e.target.closest('.btn-close');
        if (closeBtn) {
            const taskItem = closeBtn.closest('.task-item');
            if (taskItem) {
                const id = parseInt(taskItem.dataset.id);
                await deleteTask(id);
                renderTasks();
            }
            return;
        }
    });

    document.getElementById('appContent').addEventListener('click', function(e) {
        const checkbox = e.target.closest('.task-checkbox');
        if (!checkbox) return;
        e.preventDefault();
        e.stopPropagation();

        const taskItem = checkbox.closest('.task-item');
        if (taskItem) {
            taskItem.classList.toggle('completed');
        }
        const isChecked = taskItem?.classList.contains('completed');
        checkbox.textContent = isChecked ? 'check_box' : 'check_box_outline_blank';
        checkbox.style.display = 'none';
        requestAnimationFrame(() => {
            checkbox.style.display = '';
        });
    });
}

async function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    const tareas = await getTasks();
    if (tareas.length === 0) {
        taskList.innerHTML = `<li class="task-item empty-message">No hay tareas pendientes.</li>`;
        return;
    }
    const badgeMap = {
        'CLÍNICA': 'badge-clinical',
        'ADMINISTRATIVA': 'badge-admin',
        'SEGUIMIENTO DE PACIENTE': 'badge-followup'
    };
    taskList.innerHTML = tareas.map(t => {
        const id = t.id_tarea;
        const descripcion = t.detalle_tarea || 'Sin descripción';
        const categoria = t.categoria_tarea || 'ADMINISTRATIVA';
        return `
            <li class="task-item" data-id="${id}">
                <span class="material-symbols-outlined task-checkbox">check_box_outline_blank</span>
                <span class="task-text">${descripcion}</span>
                <span class="badge ${badgeMap[categoria] || 'badge-admin'}">${categoria}</span>
                <button class="btn-close" title="Eliminar"><span class="material-symbols-outlined">close</span></button>
            </li>
        `;
    }).join('');
}

module.exports = {
    initTaskModal,
    setupTaskDelegation,
    renderTasks,
    openTaskModal,
    closeTaskModal
};