// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNkoA0nVxaEL3LzJD5-14T1-I7BuF5JRA",
    authDomain: "eduinsight-4a3a1.firebaseapp.com",
    projectId: "eduinsight-4a3a1",
    storageBucket: "eduinsight-4a3a1.firebasestorage.app",
    messagingSenderId: "45679890870",
    appId: "1:45679890870:web:e01cb75197c245f9283117",
    measurementId: "G-7G88GLEK0P"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };