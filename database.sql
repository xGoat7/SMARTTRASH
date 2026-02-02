-- ===================================
-- DATABASE SMARTTRASH - BANK SAMPAH DIGITAL
-- ===================================

-- Tabel Nasabah
CREATE TABLE nasabah (
  id_nasabah SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  no_telepon VARCHAR(15),
  alamat TEXT,
  tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Jenis Sampah
CREATE TABLE jenis_sampah (
  id_jenis SERIAL PRIMARY KEY,
  nama_jenis VARCHAR(50) NOT NULL UNIQUE,
  deskripsi VARCHAR(255)
);

-- Tabel Harga Sampah
CREATE TABLE harga_sampah (
  id_harga SERIAL PRIMARY KEY,
  id_jenis INT NOT NULL,
  nama_produk VARCHAR(100) NOT NULL,
  harga_per_kg DECIMAL(10, 2) NOT NULL,
  tanggal_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_jenis) REFERENCES jenis_sampah(id_jenis)
);

-- Tabel Setoran Sampah
CREATE TABLE setoran (
  id_setoran SERIAL PRIMARY KEY,
  id_nasabah INT NOT NULL,
  id_jenis INT NOT NULL,
  berat_kg DECIMAL(8, 2) NOT NULL,
  total_nilai DECIMAL(12, 2),
  tanggal_setoran TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_nasabah) REFERENCES nasabah(id_nasabah),
  FOREIGN KEY (id_jenis) REFERENCES jenis_sampah(id_jenis)
);

-- Tabel Tabungan
CREATE TABLE tabungan (
  id_tabungan SERIAL PRIMARY KEY,
  id_nasabah INT NOT NULL UNIQUE,
  saldo_rupiah DECIMAL(12, 2) DEFAULT 0,
  total_kg_setoran DECIMAL(10, 2) DEFAULT 0,
  tanggal_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_nasabah) REFERENCES nasabah(id_nasabah)
);

-- Tabel Jadwal Pickup
CREATE TABLE jadwal_pickup (
  id_pickup SERIAL PRIMARY KEY,
  id_nasabah INT NOT NULL,
  tanggal_pickup DATE NOT NULL,
  waktu_mulai TIME,
  waktu_selesai TIME,
  status VARCHAR(20) DEFAULT 'menunggu',
  catatan TEXT,
  tanggal_buat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_nasabah) REFERENCES nasabah(id_nasabah)
);

-- ===================================
-- DATA SAMPEL
-- ===================================

-- Insert Jenis Sampah
INSERT INTO jenis_sampah (nama_jenis, deskripsi) VALUES
('Plastik', 'Sampah plastik berbagai jenis'),
('Kertas', 'Sampah kertas dan kardus'),
('Logam', 'Sampah logam dan aluminium'),
('Kaca', 'Sampah kaca dan botol kaca');

-- Insert Harga Sampah
INSERT INTO harga_sampah (id_jenis, nama_produk, harga_per_kg) VALUES
(1, 'Botol Plastik PET', 5000),
(2, 'Kardus', 2500),
(3, 'Kaleng Aluminium', 18000),
(4, 'Botol Kaca Jernih', 1000);

-- Insert Nasabah (Sample)
INSERT INTO nasabah (nama, email, no_telepon, alamat) VALUES
('Budi Santoso', 'budi@example.com', '081234567890', 'Jl. Merdeka No. 10, Jakarta'),
('Siti Nurhaliza', 'siti@example.com', '082345678901', 'Jl. Ahmad Yani No. 25, Bandung'),
('Ahmad Dahlan', 'ahmad@example.com', '083456789012', 'Jl. Sudirman No. 15, Surabaya');

-- Insert Tabungan (Inisial untuk setiap nasabah)
INSERT INTO tabungan (id_nasabah, saldo_rupiah, total_kg_setoran) VALUES
(1, 0, 0),
(2, 0, 0),
(3, 0, 0);