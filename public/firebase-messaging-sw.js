// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 1. PASTE YOUR CONFIG OBJECT HERE
firebase.initializeApp({
  apiKey: "AIzaSyCY9sY8bxi5D2tWmWXCdDgC5Kl3532cgAM",
  authDomain: "natural-nimbus-478312-h9.firebaseapp.com",
  projectId: "natural-nimbus-478312-h9",
  storageBucket: "natural-nimbus-478312-h9.firebasestorage.app",
  messagingSenderId: "453246928060",
  appId: "1:453246928060:web:e72c4930b83bcc00563cb9",
  measurementId: "G-7NYPJV5VH2"
});

const messaging = firebase.messaging();

// Intercepts background push messages and flashes them to your desktop
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    requireInteraction: true // Keeps the notification visible until you click it
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
