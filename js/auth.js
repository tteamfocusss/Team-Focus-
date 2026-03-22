// =============================================
// TEAM FOCUS — Kimlik Doğrulama Modülü
// =============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isDeleting = false; // Hesap siliniyor bayrağı
        this.onAuthStateChanged();
    }

    // Auth durum dinleyici
    onAuthStateChanged() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                // Kullanıcı bilgilerini Firestore'a kaydet/güncelle
                await this.saveUserProfile(user);

                // Eğer giriş sayfasındaysak, panele yönlendir
                if (window.location.pathname.includes('giris.html') || 
                    window.location.pathname.endsWith('/') && !window.location.pathname.includes('panel.html')) {
                    // Landing page veya login'deyse panel'e git
                    if (window.location.pathname.includes('giris.html')) {
                        window.location.href = 'panel.html';
                    }
                }

                // Panel sayfasındaysa UI'ı güncelle
                if (window.location.pathname.includes('panel.html')) {
                    this.updatePanelUI(user);
                }
            } else {
                this.currentUser = null;
                // Hesap siliniyorken otomatik yönlendirme yapma, beklet
                if (this.isDeleting) return;

                // Panel sayfasındaysa giriş sayfasına yönlendir
                if (window.location.pathname.includes('panel.html')) {
                    window.location.href = 'giris.html';
                }
            }
        });
    }

    // E-posta ve şifre ile kayıt
    async register(email, password, displayName) {
        try {
            this.showLoading(true);
            const result = await auth.createUserWithEmailAndPassword(email, password);
            
            // Kullanıcı adını güncelle
            await result.user.updateProfile({ displayName: displayName });
            
            this.showToast('✅ Hesap başarıyla oluşturuldu!', 'success');
            return result.user;
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // E-posta ve şifre ile giriş
    async login(email, password) {
        try {
            this.showLoading(true);
            const result = await auth.signInWithEmailAndPassword(email, password);
            this.showToast('✅ Giriş başarılı!', 'success');
            return result.user;
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // Google ile giriş
    async loginWithGoogle() {
        try {
            this.showLoading(true);
            const result = await auth.signInWithPopup(googleProvider);
            this.showToast('✅ Google ile giriş başarılı!', 'success');
            return result.user;
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // Çıkış
    async logout() {
        try {
            await auth.signOut();
            this.showToast('👋 Çıkış yapıldı', 'info');
            window.location.href = 'index.html';
        } catch (error) {
            this.showToast('❌ Çıkış yapılamadı', 'error');
        }
    }

    // Hesabı Sil
    async deleteAccount() {
        try {
            this.showLoading(true);
            this.isDeleting = true; // Yönlendirmeyi geçici olarak durdur
            
            const user = auth.currentUser;
            if (user) {
                const uid = user.uid;
                
                try {
                    // Kullanıcıya ait bazı verileri temizle
                    await db.collection('users').doc(uid).delete();
                } catch (e) {
                    console.warn("Veritabanından silinirken hata (ilgili kurallar engellemiş olabilir):", e);
                }

                await user.delete();
                
                this.showToast('🗑️ Hesabınız ve tüm verileriniz kalıcı olarak silindi. Ana sayfaya yönlendiriliyorsunuz.', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }
        } catch (error) {
            this.isDeleting = false; // Hata olursa bayrağı kaldır
            console.error('Hesap silme hatası:', error);
            if (error.code === 'auth/requires-recent-login') {
                this.showToast('⚠️ Güvenlik: Hesabınızı silmek için profilinizden çıkış yapıp tekrar giriş yapmalısınız.', 'warning');
            } else {
                this.showToast('❌ Hesap silinirken bir hata oluştu.', 'error');
            }
        } finally {
            this.showLoading(false);
        }
    }

    // Şifre sıfırlama
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            this.showToast('📧 Şifre sıfırlama e-postası gönderildi!', 'success');
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    // Kullanıcı profilini Firestore'a kaydet
    async saveUserProfile(user) {
        try {
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();
            
            if (!doc.exists) {
                // Yeni kullanıcı — profil oluştur
                await userRef.set({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'Kullanıcı',
                    photoURL: user.photoURL || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    totalPomodoros: 0,
                    totalWorkMinutes: 0,
                    streak: 0
                });
            } else {
                // Mevcut kullanıcı — son giriş güncelle
                await userRef.update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    displayName: user.displayName || doc.data().displayName,
                    photoURL: user.photoURL || doc.data().photoURL
                });
            }
        } catch (error) {
            console.error('Profil kaydedilemedi:', error);
        }
    }

    // Panel UI güncelle
    updatePanelUI(user) {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const userEmail = document.getElementById('userEmail');

        if (userName) userName.textContent = user.displayName || 'Kullanıcı';
        if (userEmail) userEmail.textContent = user.email;
        if (userAvatar) {
            if (user.photoURL) {
                userAvatar.src = user.photoURL;
            } else {
                userAvatar.textContent = (user.displayName || 'K')[0].toUpperCase();
            }
        }
    }

    // Hata işleme
    handleAuthError(error) {
        const messages = {
            'auth/email-already-in-use': '⚠️ Bu e-posta zaten kullanılıyor',
            'auth/invalid-email': '⚠️ Geçersiz e-posta adresi',
            'auth/weak-password': '⚠️ Şifre en az 6 karakter olmalı',
            'auth/user-not-found': '⚠️ Kullanıcı bulunamadı',
            'auth/wrong-password': '⚠️ Yanlış şifre',
            'auth/too-many-requests': '⚠️ Çok fazla deneme, lütfen bekleyin',
            'auth/popup-closed-by-user': '⚠️ Giriş penceresi kapatıldı',
            'auth/network-request-failed': '⚠️ İnternet bağlantısını kontrol edin'
        };
        
        const message = messages[error.code] || `❌ Hata: ${error.message}`;
        this.showToast(message, 'error');
    }

    // Toast bildirim
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;
        container.appendChild(toast);

        // Animasyon
        requestAnimationFrame(() => toast.classList.add('show'));
        
        // Otomatik kaldır
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Loading göster/gizle
    showLoading(show) {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
}

// Global instance
const authManager = new AuthManager();
