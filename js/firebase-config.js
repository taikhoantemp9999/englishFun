/**
 * FIREBASE CONFIGURATION
 * Cấu hình kết nối Firebase cho English Fun
 */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxDaIIhmWJOB6w6Jg6Ch6a2-b_5HvJTWw",
  authDomain: "english-fun-1937c.firebaseapp.com",
  databaseURL: "https://english-fun-1937c-default-rtdb.firebaseio.com",
  projectId: "english-fun-1937c",
  storageBucket: "english-fun-1937c.firebasestorage.app",
  messagingSenderId: "236020730818",
  appId: "1:236020730818:web:4ebb378dc7a7005d2fa45b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const firebaseDB = firebase.database();
const firebaseAuth = firebase.auth();

// Export to global scope
window.firebaseDB = firebaseDB;
window.firebaseAuth = firebaseAuth;

console.log('🔥 Firebase initialized successfully!');
console.log('📡 Database URL:', firebaseConfig.databaseURL);

// Enable offline persistence
firebaseDB.goOffline();
firebaseDB.goOnline();

