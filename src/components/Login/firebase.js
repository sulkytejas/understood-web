// src/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  // setPersistence,
  // browserLocalPersistence,
} from 'firebase/auth';

// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.REACT_APP_FIREBASE_APP_ID,
//   measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
// };

const firebaseConfig = {
  apiKey: 'AIzaSyAjsXNAKhIIR3c4ZHIvQpDXIIJLNkeJOis',
  authDomain: 'understood-f356b.firebaseapp.com',
  projectId: 'understood-f356b',
  storageBucket: 'understood-f356b.firebasestorage.app',
  messagingSenderId: '114523086382',
  appId: '1:114523086382:web:df11f80296013cd74509bf',
  measurementId: 'G-DGRTQ32K18',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Disable app verification for testing (for development only)
// auth.settings.appVerificationDisabledForTesting = true;

// Set persistence for Firebase Authentication
// setPersistence(auth, browserLocalPersistence)
//   .then(() => {
//     console.log('Persistence set to local (long-term).');
//     // Now the user session will persist even after a browser restart
//   })
//   .catch((error) => {
//     console.error('Error setting persistence:', error);
//   });

export { auth };
