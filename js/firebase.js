import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// APP CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBElxrl7movpnFOxaUjWqrqBGhWVkaS3jw",
    authDomain: "riser-tournament.firebaseapp.com",
    databaseURL: "https://riser-tournament-default-rtdb.firebaseio.com",
    projectId: "riser-tournament",
    storageBucket: "riser-tournament.firebasestorage.app",
    messagingSenderId: "742332204527",
    appId: "1:742332204527:web:f0f0f939c5a78776fa621a"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
