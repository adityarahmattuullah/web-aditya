// ==========================================
// VARIABEL GLOBAL
// ==========================================
let idEdit = null;
let dataMahasiswaCache = {}; 
let myBarChart, myPieChart; 

// ==========================================
// 1. NAVIGASI HALAMAN (SPA)
// ==========================================
function showPage(pageId, btnElement) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('page-' + pageId).classList.add('active');

    if (btnElement) {
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    // TUTUP SIDEBAR OTOMATIS DI HP SETELAH KLIK MENU
    if (window.innerWidth < 992) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }
}

// ==========================================
// 2. LOGIKA TOGGLE SIDEBAR (HP)
// ==========================================
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

if(menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });
}

if(overlay) {
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}

// ==========================================
// 3. VALIDASI ANGKA (0-100)
// ==========================================
function validasiAngka(input) {
    if (input.value > 100) {
        input.value = 100;
        Swal.fire({ icon: 'warning', title: 'Maksimal 100!', timer: 1500, showConfirmButton: false });
    }
    if (input.value < 0) {
        input.value = 0;
    }
}

// ==========================================
// 4. LOGIKA GRAFIK
// ==========================================
function initCharts() {
    const ctxBar = document.getElementById('barChart');
    if(ctxBar) {
        myBarChart = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Mahasiswa', 'Dosen', 'Mata Kuliah', 'Data Nilai'],
                datasets: [{
                    label: 'Jumlah Data',
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#0073b7', '#f39c12', '#dd4b39', '#00a65a'],
                    borderRadius: 5
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    const ctxPie = document.getElementById('pieChart');
    if(ctxPie) {
        myPieChart = new Chart(ctxPie.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Mahasiswa', 'Dosen', 'Mata Kuliah', 'Nilai'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#36a2eb', '#ff9f40', '#ff6384', '#4bc0c0'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, cutout: '70%' }
        });
    }
}

function updateChartData(index, value) {
    if (myBarChart) { myBarChart.data.datasets[0].data[index] = value; myBarChart.update(); }
    if (myPieChart) { myPieChart.data.datasets[0].data[index] = value; myPieChart.update(); }
}

// ==========================================
// 5. LOGIKA UTAMA (FIREBASE)
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                document.getElementById('namaUser').innerText = data.nama;
                if(document.getElementById('dispNama')) document.getElementById('dispNama').innerText = data.nama;
                if(document.getElementById('dispEmail')) document.getElementById('dispEmail').innerText = user.email;
                if(document.getElementById('profNama')) document.getElementById('profNama').value = data.nama;
                if(document.getElementById('profEmail')) document.getElementById('profEmail').value = user.email;
                if(document.getElementById('profUid')) document.getElementById('profUid').value = user.uid;
            } else {
                document.getElementById('namaUser').innerText = user.email;
            }
        });

        initCharts();

        db.collection("mahasiswa").onSnapshot(snap => { document.getElementById("countMhs").innerText = snap.size; updateChartData(0, snap.size); });
        db.collection("dosen").onSnapshot(snap => { document.getElementById("countDosen").innerText = snap.size; updateChartData(1, snap.size); });
        db.collection("mata_kuliah").onSnapshot(snap => { document.getElementById("countMatkul").innerText = snap.size; updateChartData(2, snap.size); });
        db.collection("nilai_mahasiswa").onSnapshot(snap => { document.getElementById("countNilai").innerText = snap.size; updateChartData(3, snap.size); });

        // --- UPDATE PROFIL ---
        const formProfil = document.getElementById("formProfil");
        if(formProfil) {
            formProfil.addEventListener("submit", (e) => {
                e.preventDefault();
                const namaBaru = document.getElementById("profNama").value;
                db.collection('users').doc(user.uid).update({ nama: namaBaru }).then(() => {
                    document.getElementById('namaUser').innerText = namaBaru;
                    document.getElementById('dispNama').innerText = namaBaru;
                    Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Profil diperbarui.', timer: 1500, showConfirmButton: false });
                });
            });
        }

        // --- CRUD MAHASISWA ---
        const formMhs = document.getElementById("formMhs");
        if(formMhs) {
            formMhs.addEventListener("submit", (e) => {
                e.preventDefault();
                const data = {
                    nama: document.getElementById("namaMhs").value,
                    nim: document.getElementById("nimMhs").value,
                    jurusan: document.getElementById("jurusanMhs").value,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                if(!idEdit) db.collection("mahasiswa").add(data).then(() => { Swal.fire('Berhasil', 'Tersimpan', 'success'); resetForm('mahasiswa'); });
                else db.collection("mahasiswa").doc(idEdit).update(data).then(() => { Swal.fire('Berhasil', 'Diupdate', 'success'); resetForm('mahasiswa'); });
            });
            db.collection("mahasiswa").orderBy("timestamp", "desc").onSnapshot(snap => {
                let html = ""; let no=1;
                snap.forEach(doc => {
                    let d = doc.data();
                    html += `<tr><td>${no++}</td><td>${d.nama}</td><td>${d.nim}</td><td>${d.jurusan}</td>
                    <td class="text-center"><button class="btn btn-sm btn-warning" onclick="editMhs('${doc.id}', '${d.nama}', '${d.nim}', '${d.jurusan}')"><i class="fas fa-edit text-white"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="hapus('${doc.id}', 'mahasiswa')"><i class="fas fa-trash"></i></button></td></tr>`;
                });
                document.getElementById("tabelMhs").innerHTML = html;
            });
        }

        // --- CRUD DOSEN ---
        const formDosen = document.getElementById("formDosen");
        if(formDosen) {
            formDosen.addEventListener("submit", (e) => {
                e.preventDefault();
                const data = {
                    nama: document.getElementById("namaDosen").value,
                    nidn: document.getElementById("nidn").value,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                if(!idEdit) db.collection("dosen").add(data).then(() => { Swal.fire('Berhasil', 'Tersimpan', 'success'); resetForm('dosen'); });
                else db.collection("dosen").doc(idEdit).update(data).then(() => { Swal.fire('Berhasil', 'Diupdate', 'success'); resetForm('dosen'); });
            });
            db.collection("dosen").orderBy("timestamp", "desc").onSnapshot(snap => {
                let html = ""; let no=1;
                snap.forEach(doc => {
                    let d = doc.data();
                    html += `<tr><td>${no++}</td><td>${d.nama}</td><td>${d.nidn}</td>
                    <td class="text-center"><button class="btn btn-sm btn-warning" onclick="editDosen('${doc.id}', '${d.nama}', '${d.nidn}')"><i class="fas fa-edit text-white"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="hapus('${doc.id}', 'dosen')"><i class="fas fa-trash"></i></button></td></tr>`;
                });
                document.getElementById("tabelDosen").innerHTML = html;
            });
        }

        // --- CRUD MATKUL ---
        const formMatkul = document.getElementById("formMatkul");
        if(formMatkul) {
            formMatkul.addEventListener("submit", (e) => {
                e.preventDefault();
                const data = {
                    nama_mk: document.getElementById("namaMk").value,
                    kode_mk: document.getElementById("kodeMk").value,
                    sks: document.getElementById("sks").value,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                if(!idEdit) db.collection("mata_kuliah").add(data).then(() => { Swal.fire('Berhasil', 'Tersimpan', 'success'); resetForm('matkul'); });
                else db.collection("mata_kuliah").doc(idEdit).update(data).then(() => { Swal.fire('Berhasil', 'Diupdate', 'success'); resetForm('matkul'); });
            });
            db.collection("mata_kuliah").orderBy("timestamp", "desc").onSnapshot(snap => {
                let html = ""; let no=1;
                snap.forEach(doc => {
                    let d = doc.data();
                    html += `<tr><td>${no++}</td><td>${d.kode_mk}</td><td>${d.nama_mk}</td><td>${d.sks}</td>
                    <td class="text-center"><button class="btn btn-sm btn-warning" onclick="editMatkul('${doc.id}', '${d.nama_mk}', '${d.kode_mk}', '${d.sks}')"><i class="fas fa-edit text-white"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="hapus('${doc.id}', 'mata_kuliah')"><i class="fas fa-trash"></i></button></td></tr>`;
                });
                document.getElementById("tabelMatkul").innerHTML = html;
            });
        }

        // --- INPUT NILAI ---
        const formNilai = document.getElementById("formNilai");
        if(formNilai) {
            formNilai.addEventListener("submit", (e) => {
                e.preventDefault();
                const nilai = parseFloat(document.getElementById("inpNilai").value);
                db.collection("nilai_mahasiswa").add({
                    nama: document.getElementById("inpNama").value,
                    nim: document.getElementById("inpNim").value,
                    matkul: document.getElementById("inpMatkul").value,
                    dosen: document.getElementById("inpDosen").value,
                    nilai: nilai,
                    status: nilai >= 60 ? "Lulus" : "Tidak Lulus",
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => { Swal.fire('Berhasil', 'Nilai Tersimpan', 'success'); formNilai.reset(); });
            });
        }

        // --- EDIT NILAI ---
        const formEditNilai = document.getElementById("formEditNilai");
        if(formEditNilai) {
            formEditNilai.addEventListener("submit", (e) => {
                e.preventDefault();
                const nilai = parseFloat(document.getElementById("editNilai").value);
                db.collection("nilai_mahasiswa").doc(idEdit).update({
                    nama: document.getElementById("editNama").value,
                    nim: document.getElementById("editNim").value,
                    matkul: document.getElementById("editMatkul").value,
                    dosen: document.getElementById("editDosen").value,
                    nilai: nilai,
                    status: nilai >= 60 ? "Lulus" : "Tidak Lulus",
                }).then(() => { 
                    Swal.fire('Berhasil', 'Data Diperbarui', 'success').then(() => { showPage('view'); });
                });
            });
        }

        // --- VIEW NILAI ---
        db.collection("nilai_mahasiswa").orderBy("timestamp", "desc").onSnapshot(snap => {
            let html = ""; let no=1;
            snap.forEach(doc => {
                let d = doc.data();
                let statusBadge = d.status === "Lulus" 
                    ? `<span class="badge-status status-lulus"><i class="fas fa-check me-1"></i>Lulus</span>` 
                    : `<span class="badge-status status-gagal"><i class="fas fa-times me-1"></i>Gagal</span>`;
                let namaDosen = d.dosen ? d.dosen : "-";
                html += `<tr>
                    <td>${no++}</td><td class="fw-bold text-dark">${d.nama}</td><td class="text-muted">${d.nim}</td><td>${d.matkul}</td><td>${namaDosen}</td>
                    <td class="text-center fw-bold">${d.nilai}</td><td class="text-center">${statusBadge}</td>
                    <td class="text-center"><button class="btn btn-sm btn-warning" onclick="editNilai('${doc.id}', '${d.nama}', '${d.nim}', '${d.matkul}', '${d.dosen}', '${d.nilai}')"><i class="fas fa-edit text-white"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="hapus('${doc.id}', 'nilai_mahasiswa')"><i class="fas fa-trash"></i></button></td>
                </tr>`;
            });
            document.getElementById("tabelNilai").innerHTML = html;
        });

        // --- DROPDOWN SYNC ---
        db.collection("mata_kuliah").orderBy("nama_mk", "asc").onSnapshot(snap => {
            let html = '<option value="">-- Pilih Mata Kuliah --</option>';
            snap.forEach(doc => { let d=doc.data(); html += `<option value="${d.nama_mk}">${d.nama_mk} (${d.kode_mk})</option>`; });
            if(document.getElementById("inpMatkul")) document.getElementById("inpMatkul").innerHTML = html;
            if(document.getElementById("editMatkul")) document.getElementById("editMatkul").innerHTML = html;
        });

        db.collection("dosen").orderBy("nama", "asc").onSnapshot(snap => {
            let html = '<option value="">-- Pilih Dosen --</option>';
            snap.forEach(doc => { let d=doc.data(); html += `<option value="${d.nama}">${d.nama}</option>`; });
            if(document.getElementById("inpDosen")) document.getElementById("inpDosen").innerHTML = html;
            if(document.getElementById("editDosen")) document.getElementById("editDosen").innerHTML = html;
        });

        const selectMhsInput = document.getElementById("pilihMhs");
        const selectMhsEdit = document.getElementById("editPilihMhs");
        db.collection("mahasiswa").orderBy("nama", "asc").onSnapshot(snap => {
            let html = '<option value="">-- Pilih Mahasiswa --</option>';
            snap.forEach(doc => {
                let d = doc.data();
                dataMahasiswaCache[doc.id] = d; 
                html += `<option value="${doc.id}" data-nama="${d.nama}">${d.nama} - ${d.nim}</option>`;
            });
            if(selectMhsInput) selectMhsInput.innerHTML = html;
            if(selectMhsEdit) selectMhsEdit.innerHTML = html;
        });

        if(selectMhsInput) {
            selectMhsInput.addEventListener("change", function() {
                const id = this.value; 
                if (id && dataMahasiswaCache[id]) {
                    document.getElementById("inpNama").value = dataMahasiswaCache[id].nama;
                    document.getElementById("inpNim").value = dataMahasiswaCache[id].nim;
                } else {
                    document.getElementById("inpNama").value = ""; document.getElementById("inpNim").value = "";
                }
            });
        }

        if(selectMhsEdit) {
            selectMhsEdit.addEventListener("change", function() {
                const id = this.value; 
                if (id && dataMahasiswaCache[id]) {
                    document.getElementById("editNama").value = dataMahasiswaCache[id].nama;
                    document.getElementById("editNim").value = dataMahasiswaCache[id].nim;
                } 
            });
        }

    } else { window.location.href = "login.html"; }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================
window.editMhs = function(id, nama, nim, jurusan) {
    idEdit = id;
    document.getElementById("namaMhs").value = nama; document.getElementById("nimMhs").value = nim; document.getElementById("jurusanMhs").value = jurusan;
    document.getElementById("btnMhs").innerText = "Update"; document.getElementById("btnMhs").classList.add("btn-warning");
    showPage('mahasiswa'); 
}
window.editDosen = function(id, nama, nidn) {
    idEdit = id;
    document.getElementById("namaDosen").value = nama; document.getElementById("nidn").value = nidn;
    document.getElementById("btnDosen").innerText = "Update"; document.getElementById("btnDosen").classList.add("btn-warning");
    showPage('dosen');
}
window.editMatkul = function(id, nama, kode, sks) {
    idEdit = id;
    document.getElementById("namaMk").value = nama; document.getElementById("kodeMk").value = kode; document.getElementById("sks").value = sks;
    document.getElementById("btnMatkul").innerText = "Update"; document.getElementById("btnMatkul").classList.add("btn-warning");
    showPage('matkul');
}
window.editNilai = function(id, nama, nim, matkul, dosen, nilai) {
    idEdit = id; 
    document.getElementById("editNama").value = nama; document.getElementById("editNim").value = nim;
    document.getElementById("editMatkul").value = matkul; document.getElementById("editDosen").value = dosen;
    document.getElementById("editNilai").value = nilai;
    document.getElementById("editPilihMhs").value = ""; 
    showPage('edit-nilai');
}
window.resetForm = function(type) {
    idEdit = null; 
    if(type === 'mahasiswa') { document.getElementById("formMhs").reset(); document.getElementById("btnMhs").innerText = "Simpan"; document.getElementById("btnMhs").classList.remove("btn-warning"); }
    if(type === 'dosen') { document.getElementById("formDosen").reset(); document.getElementById("btnDosen").innerText = "Simpan"; document.getElementById("btnDosen").classList.remove("btn-warning"); }
    if(type === 'matkul') { document.getElementById("formMatkul").reset(); document.getElementById("btnMatkul").innerText = "Simpan"; document.getElementById("btnMatkul").classList.remove("btn-warning"); }
}
window.hapus = function(id, collection) {
    Swal.fire({ title: 'Hapus data ini?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus' })
    .then((result) => { if(result.isConfirmed) db.collection(collection).doc(id).delete().then(() => Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success')); });
};
function logout() {
    Swal.fire({ title: 'Keluar?', text: "Anda harus login ulang nanti.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Logout!' })
    .then((result) => { if (result.isConfirmed) auth.signOut().then(() => window.location.href = "login.html"); });
}
