// =============================================
// TEAM FOCUS — Gerçek Zamanlı Sohbet Modülü
// =============================================

class ChatManager {
    constructor() {
        this.currentRoom = 'genel';
        this.unsubscribe = null;
        this.rooms = [
            { id: 'genel', name: 'Genel Oda', emoji: '🌐' },
            { id: 'calisma', name: 'Çalışma Odası', emoji: '📚' },
            { id: 'mola', name: 'Mola Odası', emoji: '☕' },
            { id: 'motivasyon', name: 'Motivasyon', emoji: '🔥' }
        ];
    }

    // Sohbet başlat
    init() {
        this.renderRoomSelector();
        this.attachChatListeners();
        this.joinRoom(this.currentRoom);
        this.updateOnlineStatus(true);

        // Sayfa kapanınca çevrimdışı yap
        window.addEventListener('beforeunload', () => {
            this.updateOnlineStatus(false);
        });
    }

    // Oda seçici render
    renderRoomSelector() {
        const selector = document.getElementById('roomSelector');
        if (!selector) return;

        selector.innerHTML = this.rooms.map(room => `
            <option value="${room.id}" ${room.id === this.currentRoom ? 'selected' : ''}>
                ${room.emoji} ${room.name}
            </option>
        `).join('');
    }

    // Chat event listener'ları
    attachChatListeners() {
        const sendBtn = document.getElementById('sendMessageBtn');
        const messageInput = document.getElementById('messageInput');
        const roomSelector = document.getElementById('roomSelector');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (roomSelector) {
            roomSelector.addEventListener('change', (e) => {
                this.joinRoom(e.target.value);
            });
        }
    }

    // Odaya katıl
    joinRoom(roomId) {
        // Önceki dinleyiciyi kapat
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.currentRoom = roomId;
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="chat-loading"><div class="spinner-small"></div> Mesajlar yükleniyor...</div>';
        }

        // Gerçek zamanlı mesaj dinle
        this.unsubscribe = db.collection('chatRooms').doc(roomId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .limitToLast(50)
            .onSnapshot((snapshot) => {
                if (messagesContainer) {
                    // İlk yükleme
                    if (messagesContainer.querySelector('.chat-loading')) {
                        messagesContainer.innerHTML = '';
                    }

                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            this.renderMessage(change.doc.data(), change.doc.id);
                        }
                    });

                    // Otomatik scroll
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, (error) => {
                console.error('Mesaj dinleme hatası:', error);
            });
    }

    // Mesaj gönder
    async sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input) return;

        const text = input.value.trim();
        if (!text || !authManager.currentUser) return;

        const user = authManager.currentUser;

        try {
            await db.collection('chatRooms').doc(this.currentRoom)
                .collection('messages').add({
                    text: text,
                    userId: user.uid,
                    userName: user.displayName || 'Anonim',
                    userPhoto: user.photoURL || null,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    roomId: this.currentRoom
                });

            input.value = '';
            input.focus();
        } catch (error) {
            console.error('Mesaj gönderilemedi:', error);
            authManager.showToast('❌ Mesaj gönderilemedi', 'error');
        }
    }

    // Mesaj render
    renderMessage(data, id) {
        const container = document.getElementById('chatMessages');
        if (!container || container.querySelector(`[data-id="${id}"]`)) return;

        const isOwn = authManager.currentUser && data.userId === authManager.currentUser.uid;
        const time = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isOwn ? 'own' : ''}`;
        messageEl.setAttribute('data-id', id);
        messageEl.innerHTML = `
            <div class="message-avatar">
                ${data.userPhoto 
                    ? `<img src="${data.userPhoto}" alt="${data.userName}">` 
                    : `<span>${(data.userName || 'A')[0].toUpperCase()}</span>`
                }
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${data.userName}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${this.escapeHtml(data.text)}</div>
            </div>
        `;

        container.appendChild(messageEl);
    }

    // Çevrimiçi durumu güncelle
    async updateOnlineStatus(isOnline) {
        if (!authManager.currentUser) return;

        try {
            await db.collection('onlineUsers').doc(authManager.currentUser.uid).set({
                uid: authManager.currentUser.uid,
                displayName: authManager.currentUser.displayName || 'Anonim',
                photoURL: authManager.currentUser.photoURL || null,
                isOnline: isOnline,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Online durumu güncellenemedi:', error);
        }
    }

    // XSS koruması
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Temizlik
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.updateOnlineStatus(false);
    }
}
