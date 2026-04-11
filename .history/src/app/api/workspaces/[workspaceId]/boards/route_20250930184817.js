-- SCRIPT DATA DUMMY YANG SUDAH DIPERBAIKI (TANPA ID MANUAL)

-- 1. BUAT DATA MASTER DASAR (WORKSPACE & PENGGUNA)
INSERT INTO "mWorkspace" ("txtWorkspaceName", "txtInsertedBy") VALUES
('PT. Inovasi Digital', 'system');

INSERT INTO "mUser" ("txtUserName", "txtEmail", "txtPasswordHash", "txtInsertedBy") VALUES
('Andi Wijaya', 'andi@email.com', '$2a$10$Pr9.3s8.3r5kE/l3jK5e7uG.U2s4.6p8.9y0.A1b2.C3d4.E5f6.G', 'system'), -- pass: password123
('Bunga Lestari', 'bunga@email.com', '$2a$10$Pr9.3s8.3r5kE/l3jK5e7uG.U2s4.6p8.9y0.A1b2.C3d4.E5f6.G', 'system'),
('Charlie Darmawan', 'charlie@email.com', '$2a$10$Pr9.3s8.3r5kE/l3jK5e7uG.U2s4.6p8.9y0.A1b2.C3d4.E5f6.G', 'system'),
('Diana Putri', 'diana@email.com', '$2a$10$Pr9.3s8.3r5kE/l3jK5e7uG.U2s4.6p8.9y0.A1b2.C3d4.E5f6.G', 'system');

-- =============================================================================
-- 2. BUAT BOARD A: "PELUNCURAN PRODUK Q4" (ID akan otomatis menjadi 1)
-- =============================================================================
INSERT INTO "mBoard" ("intWorkspace_ID", "txtBoardName", "txtDescription", "txtInsertedBy") VALUES
(1, 'Peluncuran Produk Q4', 'Semua tugas terkait persiapan dan peluncuran produk baru di kuartal 4.', 'Andi Wijaya');

-- Daftarkan member ke board 1
INSERT INTO "trBoardMember" ("intBoard_ID", "intUser_ID", "txtRole") VALUES
(1, 1, 'Owner'), (1, 2, 'Editor'), (1, 3, 'Editor');

-- Buat Kolom untuk board 1
INSERT INTO "mBoardColumn" ("intBoard_ID", "txtColumnName", "txtColumnType", "intSortOrder") VALUES
(1, 'Item', 'TEXT', 1),
(1, 'Pemilik', 'PERSON', 2),
(1, 'Status', 'STATUS', 3),
(1, 'Tanggal Mulai', 'DATE', 4),
(1, 'Tanggal Selesai', 'DATE', 5),
(1, 'Prioritas', 'STATUS', 6);

-- Buat Grup untuk board 1
INSERT INTO "mGroup" ("intBoard_ID", "txtGroupName", "txtGroupColor") VALUES
(1, 'Perencanaan & Riset', '#579BFC'),
(1, 'Desain & UX', '#A25DDC'),
(1, 'Pengembangan', '#F06A6A');

-- Buat Tugas untuk board 1
INSERT INTO "trTask" ("intGroup_ID", "txtTaskTitle") VALUES
(1, 'Analisis pasar dan kompetitor'),
(1, 'Finalisasi fitur MVP'),
(2, 'Membuat wireframe aplikasi'),
(2, 'Desain UI High-Fidelity'),
(3, 'Setup environment & database'),
(3, 'Pengembangan fitur Autentikasi');

-- Isi Nilai untuk tugas-tugas di board 1
-- Asumsi ID Kolom: 1=Item, 2=Pemilik, 3=Status, 4=Tgl Mulai, 5=Tgl Selesai, 6=Prioritas
-- Asumsi ID Tugas: 1=Analisis, 2=Fitur, 3=Wireframe, 4=Desain, 5=Setup, 6=Autentikasi
INSERT INTO "trTaskValue" ("intTask_ID", "intColumn_ID", "txtValue") VALUES
(1, 2, '1'), (1, 3, 'Selesai'), (1, 4, '2025-09-01'), (1, 5, '2025-09-07'), (1, 6, 'Tinggi'),
(2, 2, '1'), (2, 3, 'Sedang Dikerjakan'), (2, 4, '2025-09-08'), (2, 5, '2025-09-12'), (2, 6, 'Tinggi'),
(3, 2, '2'), (3, 3, 'Sedang Dikerjakan'), (3, 4, '2025-09-13'), (3, 5, '2025-09-20'), (3, 6, 'Tinggi'),
(4, 2, '2'), (4, 3, 'Buntu'), (4, 4, '2025-09-21'), (4, 5, '2025-09-30'), (4, 6, 'Tinggi'),
(5, 2, '3'), (5, 3, 'Selesai'), (5, 4, '2025-09-15'), (5, 5, '2025-09-16'), (5, 6, 'Medium'),
(6, 2, '3'), (6, 3, 'Belum Mulai'), (6, 4, '2025-09-17'), (6, 5, '2025-10-05'), (6, 6, 'Tinggi');

-- =============================================================================
-- 3. BUAT BOARD B: "RENCANA MARKETING" (ID akan otomatis menjadi 2)
-- =============================================================================
INSERT INTO "mBoard" ("intWorkspace_ID", "txtBoardName", "txtDescription", "txtInsertedBy") VALUES
(1, 'Rencana Marketing 2025', 'Aktivitas marketing untuk promosi sepanjang tahun 2025.', 'Bunga Lestari');

-- Daftarkan member ke board 2
INSERT INTO "trBoardMember" ("intBoard_ID", "intUser_ID", "txtRole") VALUES
(2, 2, 'Owner'), (2, 4, 'Editor');

-- Buat Kolom untuk board 2
INSERT INTO "mBoardColumn" ("intBoard_ID", "txtColumnName", "txtColumnType", "intSortOrder") VALUES
(2, 'Aktivitas', 'TEXT', 1),
(2, 'PIC', 'PERSON', 2),
(2, 'Status', 'STATUS', 3),
(2, 'Budget', 'TEXT', 4),
(2, 'Deadline', 'DATE', 5);

-- Buat Grup untuk board 2
INSERT INTO "mGroup" ("intBoard_ID", "txtGroupName", "txtGroupColor") VALUES
(2, 'Q1 - Awareness', '#2BC3A9'),
(2, 'Q2 - Engagement', '#F5A623');

-- Buat Tugas untuk board 2
INSERT INTO "trTask" ("intGroup_ID", "txtTaskTitle") VALUES
(4, 'Kampanye media sosial #ProdukBerkah'),
(4, 'Press release peluncuran awal'),
(5, 'Program webinar bulanan');

-- Isi Nilai untuk tugas-tugas di board 2
-- Asumsi ID Kolom: 7=Aktivitas, 8=PIC, 9=Status, 10=Budget, 11=Deadline
-- Asumsi ID Tugas: 7=Kampanye, 8=Press, 9=Webinar
INSERT INTO "trTaskValue" ("intTask_ID", "intColumn_ID", "txtValue") VALUES
(7, 8, '4'), (7, 9, 'Sedang Dikerjakan'), (7, 10, 'Rp 15.000.000'), (7, 11, '2025-03-30'),
(8, 8, '2'), (8, 9, 'Selesai'), (8, 10, 'Rp 5.000.000'), (8, 11, '2025-01-20'),
(9, 8, '4'), (9, 9, 'Belum Mulai'), (9, 10, 'Rp 25.000.000'), (9, 11, '2025-06-15');
