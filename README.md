# What Next - Task Manager

A modern, interactive task management web application with a beautiful UI and smooth animations.

## Features

- Clean and professional dark theme UI
- Add tasks with title, date/time, and description (all fields optional)
- Smooth animations using GSAP
- Draggable task cards with position memory
- Auto-delete completed tasks after 12 hours
- Responsive design
- Local storage persistence
- Custom color themes for each task
- Beautiful gradients and animations

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start a local server (you can use any local server of your choice, for example):
   ```bash
   npx serve
   ```
   Or simply open the `index.html` file in your browser

## Usage

- Click the + button in the top left to add a new task
- Fill in any combination of title, date/time, and description
- Click and drag tasks to reposition them
- Check the checkbox to mark a task as complete
- Completed tasks will be automatically deleted after 12 hours
- Click the X button on a task to delete it immediately

## Technologies Used

- HTML5
- CSS3 with Tailwind CSS
- JavaScript (ES6+)
- GSAP for animations
- Local Storage for data persistence 