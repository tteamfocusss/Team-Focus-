class PomodoroTimer {
    constructor() {
        this.workDuration = 25 * 60;
        this.breakDuration = 5 * 60;
        this.longBreakDuration = 15 * 60;
        this.timeLeft = this.workDuration;
        this.isRunning = false;
        this.isWorkSession = true;
        this.sessionCount = 0;
        this.completedToday = 0;
        this.totalWorkSeconds = 0;
        this.totalBreakSeconds = 0;
        this.tasks = [];
        this.timerInterval = null;

        this.loadFromStorage();
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
        this.renderTasks();
        this.updateStats();
    }

    initializeElements() {
        // Timer
        this.timeDisplay = document.getElementById('time');
        this.sessionLabel = document.getElementById('sessionLabel');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Settings
        this.workInput = document.getElementById('workDuration');
        this.breakInput = document.getElementById('breakDuration');
        this.longBreakInput = document.getElementById('longBreakDuration');
        
        // Tasks
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.tasksList = document.getElementById('tasksList');
        
        // Stats
        this.completedDisplay = document.getElementById('completedToday');
        this.workTimeDisplay = document.getElementById('totalWorkTime');
        this.breakTimeDisplay = document.getElementById('totalBreakTime');
        this.streakDisplay = document.getElementById('streak');
        
        // Circle Progress
        this.circleProgress = document.getElementById('circleProgress');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.skipBtn.addEventListener('click', () => this.skip());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.workInput.addEventListener('change', () => this.updateSettings());
        this.breakInput.addEventListener('change', () => this.updateSettings());
        this.longBreakInput.addEventListener('change', () => this.updateSettings());
        
        document.getElementById('workMinus').addEventListener('click', () => {
            this.workInput.value = Math.max(1, parseInt(this.workInput.value) - 1);
            this.updateSettings();
        });
        document.getElementById('workPlus').addEventListener('click', () => {
            this.workInput.value = Math.min(60, parseInt(this.workInput.value) + 1);
            this.updateSettings();
        });
        document.getElementById('breakMinus').addEventListener('click', () => {
            this.breakInput.value = Math.max(1, parseInt(this.breakInput.value) - 1);
            this.updateSettings();
        });
        document.getElementById('breakPlus').addEventListener('click', () => {
            this.breakInput.value = Math.min(30, parseInt(this.breakInput.value) + 1);
            this.updateSettings();
        });
        document.getElementById('longBreakMinus').addEventListener('click', () => {
            this.longBreakInput.value = Math.max(1, parseInt(this.longBreakInput.value) - 1);
            this.updateSettings();
        });
        document.getElementById('longBreakPlus').addEventListener('click', () => {
            this.longBreakInput.value = Math.min(60, parseInt(this.longBreakInput.value) + 1);
            this.updateSettings();
        });
        
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        this.workInput.disabled = true;
        this.breakInput.disabled = true;
        this.longBreakInput.disabled = true;

        this.timerInterval = setInterval(() => {
            this.timeLeft--;

            if (this.timeLeft < 0) {
                this.completeSession();
            } else {
                this.updateDisplay();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
    }

    skip() {
        this.pause();
        this.completeSession();
    }

    reset() {
        this.pause();
        this.isWorkSession = true;
        this.timeLeft = this.workDuration;
        this.workInput.disabled = false;
        this.breakInput.disabled = false;
        this.longBreakInput.disabled = false;
        this.updateDisplay();
    }

    completeSession() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        this.workInput.disabled = false;
        this.breakInput.disabled = false;
        this.longBreakInput.disabled = false;

        if (this.isWorkSession) {
            this.completedToday++;
            this.totalWorkSeconds += this.workDuration;
            this.sessionCount++;
            
            this.isWorkSession = false;
            
            // Üçüncü çalışma seansından sonra uzun mola
            if (this.sessionCount % 4 === 0) {
                this.timeLeft = this.longBreakDuration;
            } else {
                this.timeLeft = this.breakDuration;
            }
            
            alert('🎉 Çalışma seansı tamamlandı! Molayı hak ettiniz.');
        } else {
            this.totalBreakSeconds += this.isWorkSession ? 0 : this.breakDuration;
            this.isWorkSession = true;
            this.timeLeft = this.workDuration;
            alert('⏰ Mola bitti! Tekrar çalışmaya başlayabilirsiniz.');
        }

        this.saveToStorage();
        this.updateDisplay();
        this.updateStats();
        this.playNotification();
    }

    playNotification() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Ses çalamadı');
        }
    }

    updateSettings() {
        this.workDuration = parseInt(this.workInput.value) * 60;
        this.breakDuration = parseInt(this.breakInput.value) * 60;
        this.longBreakDuration = parseInt(this.longBreakInput.value) * 60;

        if (!this.isRunning) {
            this.reset();
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        this.timeDisplay.textContent = formattedTime;
        
        if (this.isWorkSession) {
            this.sessionLabel.textContent = '💪 Çalışma Zamanı';
        } else {
            if (this.sessionCount % 4 === 0) {
                this.sessionLabel.textContent = '😴 Uzun Mola Zamanı';
            } else {
                this.sessionLabel.textContent = '☕ Mola Zamanı';
            }
        }

        document.title = `${formattedTime} - Pomodoro Zamanlayıcı`;

        // Ilerleme çemberi güncelle
        const totalDuration = this.isWorkSession ? this.workDuration : 
                            (this.sessionCount % 4 === 0 ? this.longBreakDuration : this.breakDuration);
        const progress = ((totalDuration - this.timeLeft) / totalDuration) * 100;
        const circumference = 2 * Math.PI * 95;
        const offset = circumference - (progress / 100) * circumference;
        this.circleProgress.style.strokeDashoffset = offset;

        // Arka plan rengini değiştir
        if (this.isWorkSession) {
            document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            document.body.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        }
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        if (taskText === '') return;

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            pomodoros: 0
        };

        this.tasks.push(task);
        this.taskInput.value = '';
        this.saveToStorage();
        this.renderTasks();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToStorage();
        this.renderTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            this.renderTasks();
        }
    }

    renderTasks() {
        this.tasksList.innerHTML = '';
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="timer.toggleTask(${task.id})">
                <span class="task-text">${task.text}</span>
                <span class="task-pomodoros">🍅 ${task.pomodoros}</span>
                <button class="task-delete" onclick="timer.deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            this.tasksList.appendChild(li);
        });
    }

    updateStats() {
        this.completedDisplay.textContent = this.completedToday;
        
        const workHours = Math.floor(this.totalWorkSeconds / 3600);
        const workMins = Math.floor((this.totalWorkSeconds % 3600) / 60);
        this.workTimeDisplay.textContent = workHours > 0 ? `${workHours}h ${workMins}m` : `${workMins}m`;
        
        const breakHours = Math.floor(this.totalBreakSeconds / 3600);
        const breakMins = Math.floor((this.totalBreakSeconds % 3600) / 60);
        this.breakTimeDisplay.textContent = breakHours > 0 ? `${breakHours}h ${breakMins}m` : `${breakMins}m`;
        
        this.streakDisplay.textContent = Math.floor(this.completedToday / 4);
    }

    saveToStorage() {
        const data = {
            completedToday: this.completedToday,
            totalWorkSeconds: this.totalWorkSeconds,
            totalBreakSeconds: this.totalBreakSeconds,
            tasks: this.tasks,
            date: new Date().toDateString()
        };
        localStorage.setItem('pomodoroData', JSON.stringify(data));
    }

    loadFromStorage() {
        const data = localStorage.getItem('pomodoroData');
        if (data) {
            const parsed = JSON.parse(data);
            const today = new Date().toDateString();
            
            if (parsed.date === today) {
                this.completedToday = parsed.completedToday;
                this.totalWorkSeconds = parsed.totalWorkSeconds;
                this.totalBreakSeconds = parsed.totalBreakSeconds;
                this.tasks = parsed.tasks;
            } else {
                // Yeni gün, verileri sıfırla ama görevleri koru
                this.completedToday = 0;
                this.totalWorkSeconds = 0;
                this.totalBreakSeconds = 0;
                this.saveToStorage();
            }
        }
    }
}

// Global timer instance
let timer;
document.addEventListener('DOMContentLoaded', () => {
    timer = new PomodoroTimer();
});