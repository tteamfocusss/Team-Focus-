class PomodoroTimer {
    constructor() {
        this.workDuration = 25 * 60;
        this.breakDuration = 5 * 60;
        this.longBreakDuration = 15 * 60;
        this.timeLeft = this.workDuration;
        this.isRunning = false;
        this.isWorkSession = true;
        this.tasks = [];
        this.timerInterval = null;

        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('time');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.tasksList = document.getElementById('tasksList');
        this.taskInput = document.getElementById('taskInput');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft < 0) this.completeSession();
            else this.updateDisplay();
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
    }

    reset() {
        this.pause();
        this.timeLeft = this.workDuration;
        this.updateDisplay();
    }

    completeSession() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        alert('Süre doldu!');
        this.reset();
    }

    updateDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        this.timeDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (text === '') return;
        const id = Date.now();
        this.tasks.push({ id, text });
        this.taskInput.value = '';
        this.renderTasks();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.renderTasks();
    }

    renderTasks() {
        this.tasksList.innerHTML = this.tasks.map(t => 
            `<li class="task-item"><span>${t.text}</span> <button onclick="window.timer.deleteTask(${t.id})">Sil</button></li>`
        ).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.timer = new PomodoroTimer();

    const modal = document.getElementById("testModal");
    const openBtn = document.getElementById("openTestBtn");
    const closeBtn = document.querySelector(".close-modal");

    openBtn.onclick = () => modal.style.display = "block";
    closeBtn.onclick = () => modal.style.display = "none";
    document.getElementById("startTestInner").onclick = () => {
        document.getElementById("testContainer").innerHTML = `<p>Test içeriği yüklendi.</p>`;
    };
});