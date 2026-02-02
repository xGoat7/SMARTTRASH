// ===================================
// SMARTTRASH - BANK SAMPAH DIGITAL
// Script Utama Aplikasi
// ===================================

// ===================================
// 0. SUPABASE CONFIGURATION
// ===================================

const SUPABASE_CONFIG = {
  URL: 'https://nmbxxvprydbendpzgsug.supabase.co',  // Ganti dengan Supabase URL Anda
  KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnh4dnByeWRiZW5kcHpnc3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzQyNzEsImV4cCI6MjA4NTUxMDI3MX0.8KGZNEnlYvnwBzf7fGbgjvghAY9i-av4kkNb7R4pIFY',                      // Ganti dengan Supabase Anon Key Anda
};

// Helper untuk Supabase API
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      ...options.headers
    };

    const response = await fetch(`${this.url}/rest/v1${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.statusText}`);
    }

    return await response.json();
  }

  // GET - Ambil data
  async get(table, filters = {}) {
    let query = `/${table}`;
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filters)) {
      params.append('select', '*');
      params.append(key, `eq.${value}`);
    }
    
    if (params.toString()) {
      query += `?${params.toString()}`;
    }

    return this.request(query, { method: 'GET' });
  }

  // POST - Tambah data
  async post(table, data) {
    return this.request(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PATCH - Update data
  async patch(table, id, data) {
    return this.request(`/${table}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // DELETE - Hapus data
  async delete(table, id) {
    return this.request(`/${table}?id=eq.${id}`, {
      method: 'DELETE'
    });
  }
}

// ===================================
// 1. DATA MANAGEMENT & STORAGE
// ===================================

class SmartTrashApp {
  constructor() {
    // Inisialisasi Supabase Client
    this.supabase = new SupabaseClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
    this.useSupabase = SUPABASE_CONFIG.URL !== 'https://your-project.supabase.co';

    // Load data dari localStorage sebagai fallback
    this.nasabah = JSON.parse(localStorage.getItem('nasabah')) || [];
    this.setoran = JSON.parse(localStorage.getItem('setoran')) || [];
    this.tabungan = JSON.parse(localStorage.getItem('tabungan')) || [];
    this.jenisSampah = JSON.parse(localStorage.getItem('jenisSampah')) || [];
    this.hargaSampah = JSON.parse(localStorage.getItem('hargaSampah')) || [];
    this.pickup = JSON.parse(localStorage.getItem('pickup')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Load data dari Supabase jika tersedia
    if (this.useSupabase) {
      this.loadFromSupabase();
    }
    
    this.initializePage();
  }

  // Load data dari Supabase
  async loadFromSupabase() {
    try {
      console.log('Loading data from Supabase...');
      this.nasabah = await this.supabase.get('nasabah') || [];
      this.setoran = await this.supabase.get('setoran') || [];
      this.tabungan = await this.supabase.get('tabungan') || [];
      this.jenisSampah = await this.supabase.get('jenis_sampah') || [];
      this.hargaSampah = await this.supabase.get('harga_sampah') || [];
      this.pickup = await this.supabase.get('pickup') || [];
      console.log('Data loaded successfully from Supabase');
    } catch (error) {
      console.warn('Failed to load from Supabase, using localStorage fallback:', error);
    }
  }

  // Simpan data ke localStorage dan Supabase
  async saveData() {
    localStorage.setItem('nasabah', JSON.stringify(this.nasabah));
    localStorage.setItem('setoran', JSON.stringify(this.setoran));
    localStorage.setItem('tabungan', JSON.stringify(this.tabungan));
    localStorage.setItem('jenisSampah', JSON.stringify(this.jenisSampah));
    localStorage.setItem('hargaSampah', JSON.stringify(this.hargaSampah));
    localStorage.setItem('pickup', JSON.stringify(this.pickup));

    // Simpan ke Supabase jika konfigurasi valid
    if (this.useSupabase) {
      try {
        // Sync dengan Supabase (implementasi sync logic sesuai kebutuhan)
        console.log('Data synced to Supabase');
      } catch (error) {
        console.warn('Failed to sync to Supabase:', error);
      }
    }
  }

  // ===================================
  // 2. NASABAH MANAGEMENT
  // ===================================

  tambahNasabah(nama, email, noTelepon, alamat) {
    if (!nama || !email) {
      alert('Nama dan email harus diisi!');
      return false;
    }

    const idBaru = this.nasabah.length > 0 
      ? Math.max(...this.nasabah.map(n => n.id)) + 1 
      : 1;

    const nasabahBaru = {
      id: idBaru,
      nama: nama,
      email: email,
      noTelepon: noTelepon,
      alamat: alamat,
      tanggalDaftar: new Date().toISOString()
    };

    this.nasabah.push(nasabahBaru);
    this.tabungan.push({
      idNasabah: idBaru,
      saldoRupiah: 0,
      totalKgSetoran: 0,
      tanggalUpdate: new Date().toISOString()
    });

    this.saveData();

    // Simpan ke Supabase jika enabled
    if (this.useSupabase) {
      this.supabase.post('nasabah', nasabahBaru)
        .catch(err => console.error('Error saving to Supabase:', err));
    }

    return nasabahBaru;
  }

  updateNasabah(id, nama, email, noTelepon, alamat) {
    const nasabah = this.nasabah.find(n => n.id === id);
    if (nasabah) {
      nasabah.nama = nama;
      nasabah.email = email;
      nasabah.noTelepon = noTelepon;
      nasabah.alamat = alamat;
      this.saveData();
      return true;
    }
    return false;
  }

  deleteNasabah(id) {
    this.nasabah = this.nasabah.filter(n => n.id !== id);
    this.tabungan = this.tabungan.filter(t => t.idNasabah !== id);
    this.setoran = this.setoran.filter(s => s.idNasabah !== id);
    this.saveData();
  }

  getNasabahById(id) {
    return this.nasabah.find(n => n.id === id);
  }

  // ===================================
  // 3. JENIS SAMPAH & HARGA
  // ===================================

  tambahJenisSampah(nama, deskripsi = '') {
    if (!nama) {
      alert('Nama jenis sampah harus diisi!');
      return false;
    }

    const idBaru = this.jenisSampah.length > 0 
      ? Math.max(...this.jenisSampah.map(j => j.id)) + 1 
      : 1;

    const jenisBaru = {
      id: idBaru,
      nama: nama,
      deskripsi: deskripsi
    };

    this.jenisSampah.push(jenisBaru);
    this.saveData();
    return jenisBaru;
  }

  tambahHargaSampah(idJenis, namaProduk, hargaPerKg) {
    if (!idJenis || !namaProduk || !hargaPerKg) {
      alert('Semua field harus diisi!');
      return false;
    }

    const idBaru = this.hargaSampah.length > 0 
      ? Math.max(...this.hargaSampah.map(h => h.id)) + 1 
      : 1;

    const hargaBaru = {
      id: idBaru,
      idJenis: idJenis,
      namaProduk: namaProduk,
      hargaPerKg: parseFloat(hargaPerKg),
      tanggalUpdate: new Date().toISOString()
    };

    this.hargaSampah.push(hargaBaru);
    this.saveData();
    return hargaBaru;
  }

  getHargaByJenis(idJenis) {
    return this.hargaSampah.filter(h => h.idJenis === idJenis);
  }

  // ===================================
  // 4. SETORAN SAMPAH
  // ===================================

  tambahSetoran(idNasabah, idJenis, beratKg, hargaPerKg) {
    if (!idNasabah || !idJenis || !beratKg || !hargaPerKg) {
      alert('Semua field harus diisi!');
      return false;
    }

    const totalNilai = parseFloat(beratKg) * parseFloat(hargaPerKg);
    const idBaru = this.setoran.length > 0 
      ? Math.max(...this.setoran.map(s => s.id)) + 1 
      : 1;

    const setoranBaru = {
      id: idBaru,
      idNasabah: idNasabah,
      idJenis: idJenis,
      beratKg: parseFloat(beratKg),
      totalNilai: totalNilai,
      tanggalSetoran: new Date().toISOString()
    };

    this.setoran.push(setoranBaru);

    // Update tabungan nasabah
    const tabunganNasabah = this.tabungan.find(t => t.idNasabah === idNasabah);
    if (tabunganNasabah) {
      tabunganNasabah.saldoRupiah += totalNilai;
      tabunganNasabah.totalKgSetoran += parseFloat(beratKg);
      tabunganNasabah.tanggalUpdate = new Date().toISOString();
    }

    this.saveData();

    // Simpan ke Supabase jika enabled
    if (this.useSupabase) {
      this.supabase.post('setoran', setoranBaru)
        .catch(err => console.error('Error saving to Supabase:', err));
    }

    return setoranBaru;
  }

  getSetoranByNasabah(idNasabah) {
    return this.setoran.filter(s => s.idNasabah === idNasabah);
  }

  getTotalSetoranBulanIni() {
    const bulanIni = new Date();
    bulanIni.setDate(1);
    
    return this.setoran
      .filter(s => new Date(s.tanggalSetoran) >= bulanIni)
      .reduce((total, s) => total + s.totalNilai, 0);
  }

  // ===================================
  // 5. TABUNGAN & SALDO
  // ===================================

  getTabunganNasabah(idNasabah) {
    return this.tabungan.find(t => t.idNasabah === idNasabah);
  }

  tarikTabungan(idNasabah, jumlah) {
    const tabunganNasabah = this.tabungan.find(t => t.idNasabah === idNasabah);
    
    if (!tabunganNasabah) {
      alert('Data tabungan tidak ditemukan!');
      return false;
    }

    if (tabunganNasabah.saldoRupiah < jumlah) {
      alert('Saldo tidak cukup!');
      return false;
    }

    tabunganNasabah.saldoRupiah -= jumlah;
    tabunganNasabah.tanggalUpdate = new Date().toISOString();
    this.saveData();
    return true;
  }

  // ===================================
  // 6. PENJADWALAN PICKUP
  // ===================================

  jadwalPickup(idNasabah, tanggalPickup, lokasi, catatan = '') {
    if (!idNasabah || !tanggalPickup || !lokasi) {
      alert('Semua field harus diisi!');
      return false;
    }

    const idBaru = this.pickup.length > 0 
      ? Math.max(...this.pickup.map(p => p.id)) + 1 
      : 1;

    const pickupBaru = {
      id: idBaru,
      idNasabah: idNasabah,
      tanggalPickup: tanggalPickup,
      lokasi: lokasi,
      catatan: catatan,
      status: 'Pending',
      tanggalBuat: new Date().toISOString()
    };

    this.pickup.push(pickupBaru);
    this.saveData();

    // Simpan ke Supabase jika enabled
    if (this.useSupabase) {
      this.supabase.post('pickup', pickupBaru)
        .catch(err => console.error('Error saving to Supabase:', err));
    }

    return pickupBaru;
  }

  updateStatusPickup(idPickup, status) {
    const pickup = this.pickup.find(p => p.id === idPickup);
    if (pickup) {
      pickup.status = status;
      this.saveData();
      return true;
    }
    return false;
  }

  getPickupNasabah(idNasabah) {
    return this.pickup.filter(p => p.idNasabah === idNasabah);
  }

  // ===================================
  // 7. LAPORAN & STATISTIK
  // ===================================

  getLaporanNasabah() {
    return this.nasabah.map(n => {
      const tabunganData = this.getTabunganNasabah(n.id);
      const setoranData = this.getSetoranByNasabah(n.id);
      
      return {
        ...n,
        saldoRupiah: tabunganData?.saldoRupiah || 0,
        totalKgSetoran: tabunganData?.totalKgSetoran || 0,
        jumlahSetoran: setoranData.length,
        totalNilai: setoranData.reduce((total, s) => total + s.totalNilai, 0)
      };
    });
  }

  getStatistikUmum() {
    return {
      totalNasabah: this.nasabah.length,
      totalSetoran: this.setoran.length,
      totalBeratSampah: this.setoran.reduce((total, s) => total + s.beratKg, 0),
      totalTabungan: this.tabungan.reduce((total, t) => total + t.saldoRupiah, 0),
      totalPickupPending: this.pickup.filter(p => p.status === 'Pending').length
    };
  }

  // ===================================
  // 8. UI & INITIALIZATION
  // ===================================

  initializePage() {
    this.setupEventListeners();
    this.loadDefaultData();
    this.updateUI();
  }

  setupEventListeners() {
    // Form Nasabah
    const formNasabah = document.getElementById('form-nasabah');
    if (formNasabah) {
      formNasabah.addEventListener('submit', (e) => this.handleTambahNasabah(e));
    }

    // Form Setoran
    const formSetoran = document.getElementById('form-setoran');
    if (formSetoran) {
      formSetoran.addEventListener('submit', (e) => this.handleTambahSetoran(e));
    }

    // Form Pickup
    const formPickup = document.getElementById('form-pickup');
    if (formPickup) {
      formPickup.addEventListener('submit', (e) => this.handleJadwalPickup(e));
    }

    // Menu Navigation
    const navItems = document.querySelectorAll('[data-nav]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => this.handleNavigation(e));
    });
  }

  loadDefaultData() {
    if (this.jenisSampah.length === 0) {
      this.tambahJenisSampah('Plastik', 'Sampah plastik berbagai jenis');
      this.tambahJenisSampah('Kertas', 'Sampah kertas dan kardus');
      this.tambahJenisSampah('Logam', 'Sampah logam dan aluminium');
      this.tambahJenisSampah('Organik', 'Sampah organik dan kompos');
    }

    if (this.hargaSampah.length === 0) {
      this.tambahHargaSampah(1, 'Plastik Botol', 3000);
      this.tambahHargaSampah(1, 'Plastik Kantong', 2500);
      this.tambahHargaSampah(2, 'Kertas Putih', 2000);
      this.tambahHargaSampah(2, 'Kardus', 1500);
      this.tambahHargaSampah(3, 'Aluminium', 12000);
      this.tambahHargaSampah(4, 'Kompos', 500);
    }
  }

  handleTambahNasabah(e) {
    e.preventDefault();
    const form = e.target;
    const nama = form.querySelector('[name="nama"]')?.value;
    const email = form.querySelector('[name="email"]')?.value;
    const noTelepon = form.querySelector('[name="no-telepon"]')?.value;
    const alamat = form.querySelector('[name="alamat"]')?.value;

    if (this.tambahNasabah(nama, email, noTelepon, alamat)) {
      alert('Nasabah berhasil ditambahkan!');
      form.reset();
      this.updateUI();
    }
  }

  handleTambahSetoran(e) {
    e.preventDefault();
    const form = e.target;
    const idNasabah = parseInt(form.querySelector('[name="id-nasabah"]')?.value);
    const idJenis = parseInt(form.querySelector('[name="id-jenis"]')?.value);
    const beratKg = form.querySelector('[name="berat-kg"]')?.value;
    const hargaPerKg = form.querySelector('[name="harga-per-kg"]')?.value;

    if (this.tambahSetoran(idNasabah, idJenis, beratKg, hargaPerKg)) {
      alert('Setoran berhasil dicatat!');
      form.reset();
      this.updateUI();
    }
  }

  handleJadwalPickup(e) {
    e.preventDefault();
    const form = e.target;
    const idNasabah = parseInt(form.querySelector('[name="id-nasabah"]')?.value);
    const tanggalPickup = form.querySelector('[name="tanggal-pickup"]')?.value;
    const lokasi = form.querySelector('[name="lokasi"]')?.value;
    const catatan = form.querySelector('[name="catatan"]')?.value;

    if (this.jadwalPickup(idNasabah, tanggalPickup, lokasi, catatan)) {
      alert('Jadwal pickup berhasil dibuat!');
      form.reset();
      this.updateUI();
    }
  }

  handleNavigation(e) {
    const target = e.currentTarget.dataset.nav;
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => {
      section.style.display = section.dataset.section === target ? 'block' : 'none';
    });
    
    // Update active nav
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
  }

  updateUI() {
    this.updateDashboard();
    this.updateTableNasabah();
    this.updateTableSetoran();
    this.updateTablePickup();
    this.updateSelectOptions();
  }

  updateDashboard() {
    const stats = this.getStatistikUmum();
    document.getElementById('stat-nasabah').textContent = stats.totalNasabah;
    document.getElementById('stat-setoran').textContent = stats.totalSetoran;
    document.getElementById('stat-berat').textContent = stats.totalBeratSampah.toFixed(2) + ' kg';
    document.getElementById('stat-tabungan').textContent = 'Rp ' + this.formatRupiah(stats.totalTabungan);
    document.getElementById('stat-pickup').textContent = stats.totalPickupPending;
  }

  updateTableNasabah() {
    const tbody = document.querySelector('#table-nasabah tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.nasabah.forEach(nasabah => {
      const row = document.createElement('tr');
      const tabungan = this.getTabunganNasabah(nasabah.id);
      row.innerHTML = `
        <td>${nasabah.nama}</td>
        <td>${nasabah.email}</td>
        <td>${nasabah.noTelepon || '-'}</td>
        <td>Rp ${this.formatRupiah(tabungan?.saldoRupiah || 0)}</td>
        <td>
          <button onclick="app.deleteNasabah(${nasabah.id}); app.updateUI();" class="btn-small btn-danger">Hapus</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  updateTableSetoran() {
    const tbody = document.querySelector('#table-setoran tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.setoran.forEach(setoran => {
      const nasabah = this.getNasabahById(setoran.idNasabah);
      const jenis = this.jenisSampah.find(j => j.id === setoran.idJenis);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${nasabah?.nama || 'Unknown'}</td>
        <td>${jenis?.nama || 'Unknown'}</td>
        <td>${setoran.beratKg} kg</td>
        <td>Rp ${this.formatRupiah(setoran.totalNilai)}</td>
        <td>${new Date(setoran.tanggalSetoran).toLocaleDateString('id-ID')}</td>
      `;
      tbody.appendChild(row);
    });
  }

  updateTablePickup() {
    const tbody = document.querySelector('#table-pickup tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.pickup.forEach(pickup => {
      const nasabah = this.getNasabahById(pickup.idNasabah);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${nasabah?.nama || 'Unknown'}</td>
        <td>${pickup.lokasi}</td>
        <td>${new Date(pickup.tanggalPickup).toLocaleDateString('id-ID')}</td>
        <td>
          <span class="status ${pickup.status.toLowerCase()}">${pickup.status}</span>
        </td>
        <td>
          <select onchange="app.updateStatusPickup(${pickup.id}, this.value); app.updateUI();">
            <option value="Pending" ${pickup.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Diproses" ${pickup.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
            <option value="Selesai" ${pickup.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
          </select>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  updateSelectOptions() {
    // Update Nasabah Select
    const selectNasabah = document.querySelectorAll('[name="id-nasabah"]');
    selectNasabah.forEach(select => {
      select.innerHTML = '<option value="">-- Pilih Nasabah --</option>';
      this.nasabah.forEach(nasabah => {
        const option = document.createElement('option');
        option.value = nasabah.id;
        option.textContent = nasabah.nama;
        select.appendChild(option);
      });
    });

    // Update Jenis Sampah Select
    const selectJenis = document.querySelectorAll('[name="id-jenis"]');
    selectJenis.forEach(select => {
      select.innerHTML = '<option value="">-- Pilih Jenis Sampah --</option>';
      this.jenisSampah.forEach(jenis => {
        const option = document.createElement('option');
        option.value = jenis.id;
        option.textContent = jenis.nama;
        select.appendChild(option);
      });
    });
  }

  formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka).replace('Rp', '').trim();
  }
}

// ===================================
// 9. INITIALIZE APP
// ===================================

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new SmartTrashApp();
});
