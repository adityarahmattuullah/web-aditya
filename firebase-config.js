const firebaseConfig = {
  apiKey: "AIzaSyC6nhT37D9gFIEckt_1HkkBKFGdPKYh-0Q",
  authDomain: "web-nilai-mahasiswa.firebaseapp.com",
  projectId: "web-nilai-mahasiswa",
  storageBucket: "web-nilai-mahasiswa.firebasestorage.app",
  messagingSenderId: "777335577434",
  appId: "1:777335577434:web:e612cc4a4ccf7c9ab87163"
};

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);

// Inisialisasi Database & Auth
const db = firebase.firestore();
const auth = firebase.auth(); // ✅ INI BARU DITAMBAHKAN