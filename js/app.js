// =============================================
// TEAM FOCUS — Ana Uygulama (Dashboard)
// =============================================

class TeamFocusApp {
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
        this.darkMode = true;
        this.chatManager = null;

        this.init();
    }

    async init() {
        // Auth hazır olana kadar bekle
        await this.waitForAuth();
        
        this.initializeElements();
        this.attachEventListeners();
        await this.loadUserData();
        this.updateDisplay();
        this.renderTasks();
        this.updateStats();
        this.initTheme();
        
        // Sohbet başlat
        this.chatManager = new ChatManager();
        this.chatManager.init();

        // Çalışma verilerini dinle
        this.listenToLeaderboard();
    }

    waitForAuth() {
        return new Promise((resolve) => {
            const checkAuth = setInterval(() => {
                if (authManager.currentUser) {
                    clearInterval(checkAuth);
                    resolve();
                }
            }, 100);
            // 10 saniye timeout
            setTimeout(() => {
                clearInterval(checkAuth);
                resolve();
            }, 10000);
        });
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
        // Timer kontrolleri
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.start());
        if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.pause());
        if (this.skipBtn) this.skipBtn.addEventListener('click', () => this.skip());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.reset());
        
        // Ayar kontrolleri
        const workMinus = document.getElementById('workMinus');
        const workPlus = document.getElementById('workPlus');
        const breakMinus = document.getElementById('breakMinus');
        const breakPlus = document.getElementById('breakPlus');
        const longBreakMinus = document.getElementById('longBreakMinus');
        const longBreakPlus = document.getElementById('longBreakPlus');

        if (workMinus) workMinus.addEventListener('click', () => {
            this.workInput.value = Math.max(1, parseInt(this.workInput.value) - 1);
            this.updateSettings();
        });
        if (workPlus) workPlus.addEventListener('click', () => {
            this.workInput.value = Math.min(60, parseInt(this.workInput.value) + 1);
            this.updateSettings();
        });
        if (breakMinus) breakMinus.addEventListener('click', () => {
            this.breakInput.value = Math.max(1, parseInt(this.breakInput.value) - 1);
            this.updateSettings();
        });
        if (breakPlus) breakPlus.addEventListener('click', () => {
            this.breakInput.value = Math.min(30, parseInt(this.breakInput.value) + 1);
            this.updateSettings();
        });
        if (longBreakMinus) longBreakMinus.addEventListener('click', () => {
            this.longBreakInput.value = Math.max(1, parseInt(this.longBreakInput.value) - 1);
            this.updateSettings();
        });
        if (longBreakPlus) longBreakPlus.addEventListener('click', () => {
            this.longBreakInput.value = Math.min(60, parseInt(this.longBreakInput.value) + 1);
            this.updateSettings();
        });
        
        // Görev ekleme
        if (this.addTaskBtn) this.addTaskBtn.addEventListener('click', () => this.addTask());
        if (this.taskInput) {
            this.taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addTask();
            });
        }

        // Tema değiştirme
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Çıkış butonu
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => authManager.logout());
        }

        // Hesabı sil butonu
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                const confirmed = confirm("Hesabınızı ve tüm verilerinizi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!");
                if (confirmed) {
                    authManager.deleteAccount();
                }
            });
        }

        // Profil menüsü
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });
            document.addEventListener('click', () => {
                profileDropdown.classList.remove('show');
            });
        }
    }

    // ============ TIMER ============

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        if (this.startBtn) this.startBtn.style.display = 'none';
        if (this.pauseBtn) this.pauseBtn.style.display = 'flex';

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
        if (this.startBtn) this.startBtn.style.display = 'flex';
        if (this.pauseBtn) this.pauseBtn.style.display = 'none';
    }

    skip() {
        this.pause();
        this.completeSession();
    }

    reset() {
        this.pause();
        this.isWorkSession = true;
        this.timeLeft = this.workDuration;
        this.updateDisplay();
    }

    async completeSession() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        if (this.startBtn) this.startBtn.style.display = 'flex';
        if (this.pauseBtn) this.pauseBtn.style.display = 'none';

        if (this.isWorkSession) {
            this.completedToday++;
            this.totalWorkSeconds += this.workDuration;
            this.sessionCount++;
            this.isWorkSession = false;

            if (this.sessionCount % 4 === 0) {
                this.timeLeft = this.longBreakDuration;
            } else {
                this.timeLeft = this.breakDuration;
            }

            this.showNotification('🎉 Çalışma seansı tamamlandı!', 'Mola zamanı geldi. Harika iş çıkardınız!');
            authManager.showToast('🎉 Çalışma seansı tamamlandı! Mola verin.', 'success');
        } else {
            this.totalBreakSeconds += this.breakDuration;
            this.isWorkSession = true;
            this.timeLeft = this.workDuration;
            authManager.showToast('⏰ Mola bitti! Tekrar odaklanma zamanı.', 'info');
        }

        await this.saveUserData();
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

    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '🍅' });
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
        
        if (this.timeDisplay) this.timeDisplay.textContent = formattedTime;
        
        if (this.sessionLabel) {
            if (this.isWorkSession) {
                this.sessionLabel.textContent = '💪 Odaklanma Zamanı';
                this.sessionLabel.className = 'session-label session-work';
            } else {
                if (this.sessionCount % 4 === 0) {
                    this.sessionLabel.textContent = '😴 Uzun Mola';
                    this.sessionLabel.className = 'session-label session-long-break';
                } else {
                    this.sessionLabel.textContent = '☕ Mola Zamanı';
                    this.sessionLabel.className = 'session-label session-break';
                }
            }
        }

        document.title = `${formattedTime} — Team Focus`;

        // İlerleme çemberi
        if (this.circleProgress) {
            const totalDuration = this.isWorkSession ? this.workDuration : 
                                (this.sessionCount % 4 === 0 ? this.longBreakDuration : this.breakDuration);
            const progress = ((totalDuration - this.timeLeft) / totalDuration) * 100;
            const circumference = 2 * Math.PI * 90;
            const offset = circumference - (progress / 100) * circumference;
            this.circleProgress.style.strokeDashoffset = offset;
        }
    }

    // ============ GÖREVLER ============

    async addTask() {
        const taskText = this.taskInput.value.trim();
        if (taskText === '' || !authManager.currentUser) return;

        const task = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            pomodoros: 0,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.taskInput.value = '';
        await this.saveUserData();
        this.renderTasks();
    }

    async deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        await this.saveUserData();
        this.renderTasks();
    }

    async toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            await this.saveUserData();
            this.renderTasks();
        }
    }

    renderTasks() {
        if (!this.tasksList) return;
        
        this.tasksList.innerHTML = '';
        
        if (this.tasks.length === 0) {
            this.tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Henüz görev eklenmemiş</p>
                    <span>Yukarıdan yeni görev ekleyebilirsiniz</span>
                </div>
            `;
            return;
        }

        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <label class="task-checkbox-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <span class="task-pomodoros">🍅 ${task.pomodoros}</span>
                <button class="task-delete" title="Görevi sil">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;

            // Event listeners
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTask(task.id));

            const deleteBtn = li.querySelector('.task-delete');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

            this.tasksList.appendChild(li);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============ İSTATİSTİKLER ============

    updateStats() {
        if (this.completedDisplay) this.completedDisplay.textContent = this.completedToday;
        
        if (this.workTimeDisplay) {
            const workMins = Math.floor(this.totalWorkSeconds / 60);
            const workHours = Math.floor(workMins / 60);
            const remainMins = workMins % 60;
            this.workTimeDisplay.textContent = workHours > 0 ? `${workHours}s ${remainMins}dk` : `${remainMins}dk`;
        }
        
        if (this.breakTimeDisplay) {
            const breakMins = Math.floor(this.totalBreakSeconds / 60);
            const breakHours = Math.floor(breakMins / 60);
            const remainMins = breakMins % 60;
            this.breakTimeDisplay.textContent = breakHours > 0 ? `${breakHours}s ${remainMins}dk` : `${remainMins}dk`;
        }
        
        if (this.streakDisplay) {
            this.streakDisplay.textContent = Math.floor(this.completedToday / 4);
        }

        // Haftalık grafik güncelle
        this.updateWeeklyChart();
    }

    updateWeeklyChart() {
        // Gerçek veri ile grafik güncellemesi yapılacak
        // Şimdilik haftalık barları güncelle
        const bars = document.querySelectorAll('.bar-fill');
        if (bars.length === 0) return;

        // Simülasyon: bugünün çubuğunu güncelle
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        
        if (bars[dayIndex]) {
            const maxPomodoros = 12;
            const percentage = Math.min(100, (this.completedToday / maxPomodoros) * 100);
            bars[dayIndex].style.height = `${Math.max(5, percentage)}%`;
        }
    }

    // ============ VERİ YÖNETİMİ (Firebase) ============

    async saveUserData() {
        if (!authManager.currentUser) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            
            await db.collection('users').doc(authManager.currentUser.uid)
                .collection('dailyStats').doc(today).set({
                    completedToday: this.completedToday,
                    totalWorkSeconds: this.totalWorkSeconds,
                    totalBreakSeconds: this.totalBreakSeconds,
                    tasks: this.tasks,
                    date: today,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Toplam istatistikleri güncelle
            await db.collection('users').doc(authManager.currentUser.uid).update({
                totalPomodoros: firebase.firestore.FieldValue.increment(0),
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('Veri kaydedilemedi:', error);
        }
    }

    async loadUserData() {
        if (!authManager.currentUser) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const doc = await db.collection('users').doc(authManager.currentUser.uid)
                .collection('dailyStats').doc(today).get();
            
            if (doc.exists) {
                const data = doc.data();
                this.completedToday = data.completedToday || 0;
                this.totalWorkSeconds = data.totalWorkSeconds || 0;
                this.totalBreakSeconds = data.totalBreakSeconds || 0;
                this.tasks = data.tasks || [];
            }

            // Haftalık verileri yükle
            await this.loadWeeklyData();

        } catch (error) {
            console.error('Veri yüklenemedi:', error);
            // Fallback: localStorage
            this.loadFromLocalStorage();
        }
    }

    async loadWeeklyData() {
        if (!authManager.currentUser) return;

        try {
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
            const weekStart = startOfWeek.toISOString().split('T')[0];

            const snapshot = await db.collection('users').doc(authManager.currentUser.uid)
                .collection('dailyStats')
                .where('date', '>=', weekStart)
                .orderBy('date')
                .get();

            const weeklyData = new Array(7).fill(0);
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const dayDate = new Date(data.date);
                const dayIndex = dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1;
                weeklyData[dayIndex] = data.completedToday || 0;
            });

            // Bar grafiklerini güncelle
            const bars = document.querySelectorAll('.bar-fill');
            const maxVal = Math.max(...weeklyData, 1);
            bars.forEach((bar, i) => {
                const percentage = (weeklyData[i] / maxVal) * 100;
                bar.style.height = `${Math.max(5, percentage)}%`;
                bar.setAttribute('data-value', weeklyData[i]);
            });

        } catch (error) {
            console.error('Haftalık veri yüklenemedi:', error);
        }
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('teamFocusData');
        if (data) {
            const parsed = JSON.parse(data);
            const today = new Date().toDateString();
            
            if (parsed.date === today) {
                this.completedToday = parsed.completedToday || 0;
                this.totalWorkSeconds = parsed.totalWorkSeconds || 0;
                this.totalBreakSeconds = parsed.totalBreakSeconds || 0;
                this.tasks = parsed.tasks || [];
            }
        }
    }

    // ============ LİDERLİK TABLOSU ============

    listenToLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) return;

        const today = new Date().toISOString().split('T')[0];

        // Önce tüm kullanıcılar koleksiyonunu dinle
        db.collection('users')
            .orderBy('totalPomodoros', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                leaderboardList.innerHTML = '';
                let rank = 1;
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const isCurrentUser = authManager.currentUser && doc.id === authManager.currentUser.uid;
                    
                    const item = document.createElement('div');
                    item.className = `leaderboard-item ${isCurrentUser ? 'current-user' : ''}`;
                    item.innerHTML = `
                        <span class="lb-rank">${rank <= 3 ? ['🥇', '🥈', '🥉'][rank-1] : `#${rank}`}</span>
                        <div class="lb-avatar">
                            ${data.photoURL 
                                ? `<img src="${data.photoURL}" alt="${data.displayName}">` 
                                : `<span>${(data.displayName || 'A')[0].toUpperCase()}</span>`}
                        </div>
                        <div class="lb-info">
                            <span class="lb-name">${data.displayName || 'Anonim'}</span>
                            <span class="lb-stats">🍅 ${data.totalPomodoros || 0} pomodoro</span>
                        </div>
                    `;
                    leaderboardList.appendChild(item);
                    rank++;
                });

                if (snapshot.empty) {
                    leaderboardList.innerHTML = '<div class="empty-state"><p>Henüz veri yok</p></div>';
                }
            });
    }

    // ============ TEMA ============

    initTheme() {
        const savedTheme = localStorage.getItem('teamFocusTheme') || 'dark';
        this.darkMode = savedTheme === 'dark';
        this.applyTheme();
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('teamFocusTheme', this.darkMode ? 'dark' : 'light');
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = this.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Uygulama başlat
let app;
document.addEventListener('DOMContentLoaded', () => {
    // Bildirim izni iste
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    app = new TeamFocusApp();
});
