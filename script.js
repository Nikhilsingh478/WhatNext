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
const addCardButton = document.getElementById('add-card-button');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const cancelTaskBtn = document.getElementById('cancelTask');
const cardsContainer = document.getElementById('cards-container');
const deleteZone = document.getElementById('delete-zone');
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
addCardButton.addEventListener('click', () => {
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
    cardsContainer.innerHTML = '';
    tasks.forEach(task => {
        renderTask(task);
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
        const existingCards = cardsContainer.querySelectorAll('.task-card');
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
        </div>
    `;

    cardsContainer.appendChild(taskElement);

    // Set initial position
    gsap.set(taskElement, {
        x: task.position.x,
        y: task.position.y
    });

    // Initialize draggable
    Draggable.create(taskElement, {
        type: "x,y",
        bounds: cardsContainer,
        inertia: true,
        edgeResistance: 0.65,
        onPress: function() {
            this.startY = this.y;
            this.target.classList.add('dragging');
            gsap.set(this.target, { zIndex: 100 });
        },
        onDrag: function() {
            const cardRect = this.target.getBoundingClientRect();
            const deleteZoneRect = deleteZone.getBoundingClientRect();
            
            // Check if card is over delete zone
            const isOverDeleteZone = cardRect.top < deleteZoneRect.bottom;

            if (isOverDeleteZone && !deleteZone.classList.contains('active')) {
                deleteZone.classList.add('active');
                gsap.to(this.target, {
                    scale: 0.95,
                    duration: 0.2
                });
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            } else if (!isOverDeleteZone && deleteZone.classList.contains('active')) {
                deleteZone.classList.remove('active');
                gsap.to(this.target, {
                    scale: 1,
                    duration: 0.2
                });
            }

            // Update task position
            task.position.x = this.x;
            task.position.y = this.y;
        },
        onDragEnd: function() {
            const cardRect = this.target.getBoundingClientRect();
            const deleteZoneRect = deleteZone.getBoundingClientRect();
            const isOverDeleteZone = cardRect.top < deleteZoneRect.bottom;

            if (isOverDeleteZone) {
                animateCardDeletion(this.target, () => {
                    tasks = tasks.filter(t => t.id !== task.id);
                    saveTasks();
                });
            } else {
                gsap.to(this.target, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }

            deleteZone.classList.remove('active');
            this.target.classList.remove('dragging');
            gsap.set(this.target, { zIndex: 1 });
            saveTasks();
        }
    });

    return taskElement;
}

function deleteWithAnimation(card) {
    const numCircles = 20;
    const circles = [];

    // Get the computed background color of the card
    const cardColor = window.getComputedStyle(card).backgroundColor;

    // Create small circles for explosion effect
    for (let i = 0; i < numCircles; i++) {
        const circle = document.createElement("div");
        circle.style.width = "10px";
        circle.style.height = "10px";
        circle.style.borderRadius = "50%";
        circle.style.backgroundColor = cardColor;
        circle.style.position = "absolute";
        circle.style.opacity = "0";
        circle.style.zIndex = "1000";
        document.body.appendChild(circle);
        circles.push(circle);
    }

    // Position circles at card center
    const rect = card.getBoundingClientRect();
    circles.forEach(circle => {
        circle.style.left = `${rect.left + rect.width / 2}px`;
        circle.style.top = `${rect.top + rect.height / 2}px`;
    });

    // GSAP Animation Timeline
    const tl = gsap.timeline();

    tl.to(card, {
        scale: 0.1,
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut"
    }).set(card, { display: "none" });

    tl.to(circles, {
        opacity: 1,
        duration: 0.1
    }, "-=0.2");

    tl.to(circles, {
        x: () => Math.random() * 200 - 100,
        y: () => Math.random() * 200 - 100,
        scale: 0.5,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
            circles.forEach(circle => circle.remove());
            card.remove();
        }
    });

    return tl; // Return the timeline for chaining if needed
}

function animateCardDeletion(card, onComplete) {
    const tl = deleteWithAnimation(card);
    if (onComplete) {
        tl.eventCallback("onComplete", onComplete);
    }
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
        deleteWithAnimation(taskElement);
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
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
    gsap.to(addCardButton, {
        scale: 1.1,
        duration: 0.3,
        paused: true,
        ease: 'power2.out'
    });

    addCardButton.addEventListener('mouseenter', () => {
        gsap.to(addCardButton, { scale: 1.1, duration: 0.3 });
    });

    addCardButton.addEventListener('mouseleave', () => {
        gsap.to(addCardButton, { scale: 1, duration: 0.3 });
    });
}