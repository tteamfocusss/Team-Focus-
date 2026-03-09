class PomodoroTimer {
    constructor() {
        // Süreler (saniye cinsinden)
        this.workDuration = 25 * 60;
        this.breakDuration = 5 * 60;
        this.longBreakDuration = 15 * 60;
        
        // Timer durumları
        this.timeLeft = this.workDuration;
        this.isRunning = false;
        this.isWorkSession = true;
        this.timerInterval = null;
        this.sessionsCompleted = 0;
        
        // Görevler
        this.tasks = [];
        this.taskId = 0;
        
        // İstatistikler
        this.stats = this.loadStats();
        this.todayDate = new Date().toDateString();
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
        this.renderTasks();
        this.updateStats();
        this.renderWeeklyBars();
    }

    // DOM Elemanlarını Başlat
    initializeElements() {
        // Timer
        this.timeDisplay = document.getElementById('time');
        this.sessionLabel = document.getElementById('sessionLabel');
        this.circleProgress = document.getElementById('circleProgress');
        
        // Butonlar
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Görevler
        this.tasksList = document.getElementById('tasksList');
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        
        // Ayarlar
        this.workDurationInput = document.getElementById('workDuration');
        this.breakDurationInput = document.getElementById('breakDuration');
        this.longBreakDurationInput = document.getElementById('longBreakDuration');
        
        // İstatistikler
        this.completedTodayDisplay = document.getElementById('completedToday');
        this.totalWorkTimeDisplay = document.getElementById('totalWorkTime');
        this.totalBreakTimeDisplay = document.getElementById('totalBreakTime');
        this.streakDisplay = document.getElementById('streak');
        
        // Haftalık
        this.weeklyBarsContainer = document.getElementById('weeklyBars');
    }

    // Event Listeners
    attachEventListeners() {
        // Timer butonları
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.skipBtn.addEventListener('click', () => this.skip());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Ayar butonları
        document.getElementById('workPlus').addEventListener('click', () => this.adjustWork(1));
        document.getElementById('workMinus').addEventListener('click', () => this.adjustWork(-1));
        document.getElementById('breakPlus').addEventListener('click', () => this.adjustBreak(1));
        document.getElementById('breakMinus').addEventListener('click', () => this.adjustBreak(-1));
        document.getElementById('longBreakPlus').addEventListener('click', () => this.adjustLongBreak(1));
        document.getElementById('longBreakMinus').addEventListener('click', () => this.adjustLongBreak(-1));
        
        // Görev butonları
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Modal
        const modal = document.getElementById('testModal');
        const openBtn = document.getElementById('openTestBtn');
        const closeBtn = document.querySelector('.close-modal');
        
        openBtn.addEventListener('click', () => modal.style.display = 'block');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
        
        document.getElementById('startTestInner').addEventListener('click', () => {
            this.startFocusTest();
        });
    }

    // TIMER FONKSİYONLARI
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            
            if (this.timeLeft <= 0) {
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
        this.timeLeft = this.isWorkSession ? this.workDuration : 
                        (this.sessionsCompleted % 4 === 0 ? this.longBreakDuration : this.breakDuration);
        this.updateDisplay();
    }

    completeSession() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        
        if (this.isWorkSession) {
            this.sessionsCompleted++;
            alert('🎉 Pomodoro Tamamlandı! Molaya başla.');
            this.updateStats();
        } else {
            alert('☕ Mola Bitti! Çalışmaya hazır mısın?');
        }
        
        this.switchSession();
    }

    switchSession() {
        this.isWorkSession = !this.isWorkSession;
        
        if (this.isWorkSession) {
            this.timeLeft = this.workDuration;
            this.sessionLabel.textContent = 'Çalışma Zamanı';
            this.circleProgress.style.stroke = 'var(--primary-color)';
        } else {
            if (this.sessionsCompleted % 4 === 0) {
                this.timeLeft = this.longBreakDuration;
                this.sessionLabel.textContent = 'Uzun Mola Zamanı';
            } else {
                this.timeLeft = this.breakDuration;
                this.sessionLabel.textContent = 'Mola Zamanı';
            }
            this.circleProgress.style.stroke = 'var(--secondary-color)';
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        this.timeDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        this.updateCircleProgress();
    }

    updateCircleProgress() {
        const totalDuration = this.isWorkSession ? this.workDuration : 
                             (this.sessionsCompleted % 4 === 0 ? this.longBreakDuration : this.breakDuration);
        const progress = ((totalDuration - this.timeLeft) / totalDuration) * 597;
        this.circleProgress.style.strokeDashoffset = 597 - progress;
    }

    // AYARLAR
    adjustWork(change) {
        const newValue = parseInt(this.workDurationInput.value) + change;
        if (newValue >= 1 && newValue <= 60) {
            this.workDurationInput.value = newValue;
            this.workDuration = newValue * 60;
            if (this.isWorkSession && !this.isRunning) {
                this.timeLeft = this.workDuration;
                this.updateDisplay();
            }
        }
    }

    adjustBreak(change) {
        const newValue = parseInt(this.breakDurationInput.value) + change;
        if (newValue >= 1 && newValue <= 30) {
            this.breakDurationInput.value = newValue;
            this.breakDuration = newValue * 60;
            if (!this.isWorkSession && !this.isRunning && this.sessionsCompleted % 4 !== 0) {
                this.timeLeft = this.breakDuration;
                this.updateDisplay();
            }
        }
    }

    adjustLongBreak(change) {
        const newValue = parseInt(this.longBreakDurationInput.value) + change;
        if (newValue >= 1 && newValue <= 60) {
            this.longBreakDurationInput.value = newValue;
            this.longBreakDuration = newValue * 60;
            if (!this.isWorkSession && !this.isRunning && this.sessionsCompleted % 4 === 0) {
                this.timeLeft = this.longBreakDuration;
                this.updateDisplay();
            }
        }
    }

    // GÖREV YÖNETİMİ
    addTask() {
        const text = this.taskInput.value.trim();
        if (text === '') {
            alert('Lütfen bir görev girin!');
            return;
        }
        
        const task = {
            id: this.taskId++,
            text: text,
            completed: false,
            date: new Date().toDateString()
        };
        
        this.tasks.push(task);
        this.taskInput.value = '';
        this.renderTasks();
        this.saveTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.renderTasks();
            this.saveTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.renderTasks();
        this.saveTasks();
    }

    renderTasks() {
        this.tasksList.innerHTML = '';
        
        if (this.tasks.length === 0) {
            this.tasksList.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 20px;">Henüz görev eklenmemiş</li>';
            return;
        }
        
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <span>${task.text}</span>
                <div class="task-buttons">
                    <button class="check-btn" onclick="window.timer.toggleTask(${task.id})" title="Tamamla">
                        ${task.completed ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>'}
                    </button>
                    <button class="delete-btn" onclick="window.timer.deleteTask(${task.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            this.tasksList.appendChild(li);
        });
    }

    saveTasks() {
        localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('pomodoroTasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
            this.taskId = Math.max(0, ...this.tasks.map(t => t.id)) + 1;
        }
    }

    // İSTATİSTİKLER
    updateStats() {
        const today = new Date().toDateString();
        
        if (this.stats.lastDate !== today) {
            this.stats.lastDate = today;
            this.stats.todayPomodoros = 0;
            this.stats.todayWorkTime = 0;
            this.stats.todayBreakTime = 0;
        }
        
        this.stats.todayPomodoros = this.sessionsCompleted;
        this.stats.todayWorkTime += this.workDuration / 60; // dakika
        this.stats.todayBreakTime += this.breakDuration / 60; // dakika
        
        this.saveStats();
        this.displayStats();
    }

    displayStats() {
        this.completedTodayDisplay.textContent = this.stats.todayPomodoros;
        
        const workHours = Math.floor(this.stats.todayWorkTime / 60);
        const workMins = Math.floor(this.stats.todayWorkTime % 60);
        this.totalWorkTimeDisplay.textContent = workHours > 0 ? `${workHours}h ${workMins}m` : `${workMins}m`;
        
        const breakHours = Math.floor(this.stats.todayBreakTime / 60);
        const breakMins = Math.floor(this.stats.todayBreakTime % 60);
        this.totalBreakTimeDisplay.textContent = breakHours > 0 ? `${breakHours}h ${breakMins}m` : `${breakMins}m`;
        
        this.streakDisplay.textContent = this.stats.streak;
    }

    saveStats() {
        localStorage.setItem('pomodoroStats', JSON.stringify(this.stats));
    }

    loadStats() {
        const saved = localStorage.getItem('pomodoroStats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            lastDate: '',
            todayPomodoros: 0,
            todayWorkTime: 0,
            todayBreakTime: 0,
            weeklyData: Array(7).fill(0),
            streak: 0
        };
    }

    // HAFTALIK ÖZET
    renderWeeklyBars() {
        const days = ['Pzrt', 'Salı', 'Çarş', 'Perş', 'Cuma', 'Cumtr', 'Paz'];
        const weeklyData = this.stats.weeklyData || Array(7).fill(0);
        const maxValue = Math.max(...weeklyData, 1);
        
        this.weeklyBarsContainer.innerHTML = '';
        
        weeklyData.forEach((value, index) => {
            const barHeight = (value / maxValue) * 100;
            const bar = document.createElement('div');
            bar.className = 'weekly-bar';
            bar.style.height = `${barHeight}%`;
            bar.innerHTML = `
                <div class="bar-value">${value}</div>
                <div class="bar-day">${days[index]}</div>
            `;
            this.weeklyBarsContainer.appendChild(bar);
        });
    }

    // ODAK TESTİ
    startFocusTest() {
        const testContainer = document.getElementById('testContainer');
        testContainer.innerHTML = `
            <h3>Dikkat Testi</h3>
            <p>Aşağıdaki sayıyı ezberle ve sonra bana söyle:</p>
            <div style="font-size: 3em; color: var(--primary-color); font-weight: bold; margin: 20px 0;">
                ${Math.random().toString().substring(2, 8)}
            </div>
            <input type="text" id="testInput" placeholder="Sayıyı buraya yaz..." style="padding: 10px; font-size: 1.1em; border: 2px solid var(--border-color); border-radius: 5px; width: 100%; margin-bottom: 10px;">
            <button class="btn btn-play" onclick="alert('Test tamamlandı! Harika!')">Testi Bitir</button>
        `;
    }
}

// BAŞLAT
document.addEventListener('DOMContentLoaded', () => {
    window.timer = new PomodoroTimer();
    window.timer.loadTasks();
    window.timer.renderTasks();
});