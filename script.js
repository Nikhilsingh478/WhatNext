// Color themes for cards
const cardColors = [
    { from: '#FF6B6B', to: '#FF8787' },
    { from: '#4ECDC4', to: '#45B7AF' },
    { from: '#96E6A1', to: '#7BC990' },
    { from: '#A8E6CF', to: '#8CD3B7' },
    { from: '#FFD93D', to: '#F4C430' },
    { from: '#6C5CE7', to: '#5B4BC7' }
];

// DOM Elements
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const cancelTaskBtn = document.getElementById('cancelTask');
const taskContainer = document.getElementById('taskContainer');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let lastToggleTime = 0;
const TOGGLE_DELAY = 300; // 300ms delay between toggles

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    initializeGSAPAnimations();
});

// Event Listeners
addTaskBtn.addEventListener('click', () => {
    gsap.to(taskModal, {
        display: 'flex',
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
    });
});

cancelTaskBtn.addEventListener('click', closeModal);

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const dateTime = document.getElementById('taskDateTime').value;
    const description = document.getElementById('taskDescription').value;

    if (!title && !dateTime && !description) {
        alert('Please fill at least one field');
        return;
    }

    const task = {
        id: Date.now(),
        title,
        dateTime,
        description,
        completed: false,
        color: cardColors[Math.floor(Math.random() * cardColors.length)],
        position: { x: 0, y: 0 }
    };

    tasks.push(task);
    saveTasks();
    renderTask(task);
    closeModal();
    taskForm.reset();
});

function closeModal() {
    gsap.to(taskModal, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            taskModal.style.display = 'none';
        }
    });
}

function renderTasks() {
    taskContainer.innerHTML = '';
    tasks.forEach(task => {
        const taskElement = renderTask(task);
        if (task.position) {
            gsap.set(taskElement, {
                x: task.position.x,
                y: task.position.y
            });
        }
    });
}

function renderTask(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-card fade-in';
    taskElement.dataset.id = task.id;
    taskElement.style.setProperty('--card-color-from', task.color.from);
    taskElement.style.setProperty('--card-color-to', task.color.to);

    // Set initial position if it's a new task
    if (!task.position || (task.position.x === 0 && task.position.y === 0)) {
        const existingCards = taskContainer.querySelectorAll('.task-card');
        const randomX = Math.random() * (window.innerWidth / 3);
        const randomY = Math.random() * (window.innerHeight / 3);
        task.position = { 
            x: randomX + (existingCards.length * 10), 
            y: randomY + (existingCards.length * 10)
        };
    }

    taskElement.innerHTML = `
        <div class="relative">
            <div class="flex items-start gap-4">
                <div class="checkbox ${task.completed ? 'checked' : ''}" 
                    onclick="toggleTask(${task.id})"
                    ontouchend="handleTouchEnd(event, ${task.id})"
                    role="checkbox"
                    aria-checked="${task.completed}"
                    tabindex="0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <div class="flex-1 min-w-[200px]">
                    ${task.title ? `<h3 class="text-xl font-semibold mb-2">${task.title}</h3>` : ''}
                    ${task.dateTime ? `<p class="text-base opacity-75 mb-2">${formatDateTime(task.dateTime)}</p>` : ''}
                    ${task.description ? `<p class="text-base opacity-90">${task.description}</p>` : ''}
                </div>
            </div>
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;

    taskContainer.appendChild(taskElement);

    // Initial animation for new cards
    if (!task.position || (task.position.x === 0 && task.position.y === 0)) {
        gsap.from(taskElement, {
            scale: 0.8,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out(1.7)'
        });
    }

    // Set initial position
    gsap.set(taskElement, {
        x: task.position.x,
        y: task.position.y
    });

    // Initialize draggable
    Draggable.create(taskElement, {
        type: "x,y",
        bounds: taskContainer,
        inertia: true,
        edgeResistance: 0.65,
        onPress: function() {
            gsap.to(this.target, {
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                duration: 0.2,
                ease: "power2.out"
            });
            this.target.classList.add('dragging');
            gsap.set(this.target, { zIndex: 1000 });
        },
        onDrag: function() {
            task.position.x = this.x;
            task.position.y = this.y;
        },
        onRelease: function() {
            gsap.to(this.target, {
                scale: 1,
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                duration: 0.3,
                ease: "elastic.out(1, 0.5)"
            });
            this.target.classList.remove('dragging');
            gsap.set(this.target, { zIndex: 'auto' });
            saveTasks();
        }
    });

    return taskElement;
}

function toggleTask(id) {
    const now = Date.now();
    if (now - lastToggleTime < TOGGLE_DELAY) {
        return; // Ignore rapid clicks
    }
    lastToggleTime = now;

    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        
        const checkbox = document.querySelector(`[data-id="${id}"] .checkbox`);
        checkbox.classList.toggle('checked');
        checkbox.setAttribute('aria-checked', tasks[taskIndex].completed);

        if (tasks[taskIndex].completed) {
            const deleteTimeout = setTimeout(() => {
                const task = tasks.find(t => t.id === id);
                if (task && task.completed) {
                    deleteTask(id);
                }
            }, 12 * 60 * 60 * 1000); // 12 hours

            // Store the timeout ID with the task
            tasks[taskIndex].deleteTimeout = deleteTimeout;
        } else {
            // Clear the timeout if task is unchecked
            if (tasks[taskIndex].deleteTimeout) {
                clearTimeout(tasks[taskIndex].deleteTimeout);
                delete tasks[taskIndex].deleteTimeout;
            }
        }
    }
}

function handleTouchEnd(event, id) {
    event.preventDefault();
    event.stopPropagation(); // Prevent event bubbling
    toggleTask(id);
}

function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        // First scale down and rotate slightly
        gsap.to(taskElement, {
            scale: 0,
            rotation: -10,
            opacity: 0,
            duration: 0.3,
            ease: "back.in(1.7)",
            onComplete: () => {
                taskElement.remove();
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
            }
        });
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function formatDateTime(dateTime) {
    return new Date(dateTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function initializeGSAPAnimations() {
    // Add button hover animation
    gsap.to(addTaskBtn, {
        scale: 1.1,
        duration: 0.3,
        paused: true,
        ease: 'power2.out'
    });

    addTaskBtn.addEventListener('mouseenter', () => {
        gsap.to(addTaskBtn, { scale: 1.1, duration: 0.3 });
    });

    addTaskBtn.addEventListener('mouseleave', () => {
        gsap.to(addTaskBtn, { scale: 1, duration: 0.3 });
    });
} 