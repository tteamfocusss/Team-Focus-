// =============================================
// TEAM FOCUS — Firebase Yapılandırması
// =============================================

const firebaseConfig = {
    apiKey: "AIzaSyAXtuhTC0PCkDxMINDdEC1ughzPtS8BFxM",
    authDomain: "team-focus-7ebe6.firebaseapp.com",
    projectId: "team-focus-7ebe6",
    storageBucket: "team-focus-7ebe6.firebasestorage.app",
    messagingSenderId: "695503901715",
    appId: "1:695503901715:web:8fffead4bea628e4699be6",
    measurementId: "G-HJQXZWHV85"
};

// Firebase Başlatma
firebase.initializeApp(firebaseConfig);

// Servis Referansları
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

console.log('🔥 Firebase başarıyla yüklendi!');
