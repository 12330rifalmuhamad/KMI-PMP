# Project Management Platform

Platform project management seperti Monday.com yang dibangun dengan Next.js dan Vuexy.

## Fitur Utama

### 1. Workspace Management

- **Buat Workspace**: Buat workspace baru untuk mengorganisir project
- **Kelola Workspace**: Lihat dan kelola semua workspace
- **Member Management**: Kelola anggota workspace

### 2. Board Management

- **Buat Board**: Buat board baru dalam workspace
- **Multiple Views**:
  - Table View (Main table)
  - Kanban View
  - Calendar View
  - Gantt View
- **Column Management**: Kelola kolom board (Name, Status, Person, Date)
- **Group Management**: Kelola grup dalam board

### 3. Task Management

- **Create Tasks**: Buat task baru dalam grup
- **Task Values**: Kelola nilai task untuk setiap kolom
- **Task Updates**: Tambahkan update pada task
- **Activity Log**: Log aktivitas task

## Struktur Database

### Model Utama

- **Workspace**: Container untuk project
- **Board**: Board dalam workspace (seperti project)
- **Group**: Grup dalam board (seperti kategori)
- **Task**: Task dalam grup
- **BoardColumn**: Kolom board (Name, Status, Person, Date)
- **trTaskValue**: Nilai task untuk setiap kolom

### Relasi

- Workspace → Board (1:N)
- Board → Group (1:N)
- Group → Task (1:N)
- Board → BoardColumn (1:N)
- Task → trTaskValue (1:N)

## API Endpoints

### Workspace

- `GET /api/workspaces` - Dapatkan semua workspace
- `POST /api/workspaces` - Buat workspace baru
- `GET /api/workspaces/[workspaceId]` - Dapatkan workspace berdasarkan ID
- `PUT /api/workspaces/[workspaceId]` - Update workspace
- `DELETE /api/workspaces/[workspaceId]` - Hapus workspace

### Board

- `GET /api/boards` - Dapatkan semua board
- `POST /api/boards` - Buat board baru
- `GET /api/boards/[boardId]` - Dapatkan board berdasarkan ID
- `PUT /api/boards/[boardId]` - Update board
- `DELETE /api/boards/[boardId]` - Hapus board

### Task

- `GET /api/task/[taskId]` - Dapatkan task berdasarkan ID
- `POST /api/task` - Buat task baru
- `PUT /api/task/[taskId]` - Update task
- `DELETE /api/task/[taskId]` - Hapus task

## Halaman

### 1. Dashboard Project Management

- **URL**: `/project-management`
- **File**: `src/views/project-management/ProjectDashboard.jsx`
- **Fitur**:
  - Tampilkan semua workspace
  - Buat workspace baru
  - Buat board baru

### 2. Workspace View

- **URL**: `/project-management/workspace/[workspaceId]`
- **File**: `src/views/project-management/WorkspaceView.jsx`
- **Fitur**:
  - Tampilkan semua board dalam workspace
  - Buat board baru
  - Kelola workspace

### 3. Board View

- **URL**: `/project-management/board/[boardId]`
- **File**: `src/views/project-management/BoardView.jsx`
- **Fitur**:
  - Tampilkan board dengan multiple views
  - Kelola task dan grup
  - Multiple view modes (Table, Kanban, Calendar, Gantt)

## Komponen

### 1. BoardContainer

- **File**: `src/components/board/BoardContainer.jsx`
- **Fitur**: Container utama untuk board dengan tab navigation

### 2. Modal Components

- **CreateWorkspaceModal**: Modal untuk membuat workspace baru
- **CreateBoardModal**: Modal untuk membuat board baru

### 3. View Components

- **TableView**: Tampilan table untuk board
- **KanbanView**: Tampilan kanban untuk board
- **CalendarView**: Tampilan calendar untuk board
- **GanttView**: Tampilan gantt untuk board

## Cara Penggunaan

### 1. Membuat Workspace

1. Buka halaman Project Management
2. Klik tombol "New Workspace"
3. Isi nama workspace
4. Klik "Buat Workspace"

### 2. Membuat Board

1. Dari dashboard atau workspace view
2. Klik tombol "New Board"
3. Pilih workspace
4. Isi nama board
5. Klik "Buat Board"

### 3. Mengelola Task

1. Buka board yang diinginkan
2. Gunakan view yang sesuai (Table, Kanban, dll)
3. Tambahkan task baru
4. Kelola nilai task untuk setiap kolom

## Teknologi yang Digunakan

- **Frontend**: Next.js 14, React, Material-UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL dengan Prisma ORM
- **State Management**: Zustand
- **Styling**: Tailwind CSS, Material-UI
- **Icons**: Tabler Icons

## Instalasi dan Setup

1. Install dependencies:

```bash
npm install
# atau
pnpm install
```

2. Setup database:

```bash
npx prisma generate
npx prisma db push
```

3. Jalankan development server:

```bash
npm run dev
# atau
pnpm dev
```

4. Buka browser dan akses `http://localhost:3000`

## Struktur File

```
src/
├── app/
│   ├── api/
│   │   ├── boards/
│   │   └── workspaces/
│   └── [lang]/
│       └── project-management/
├── components/
│   ├── board/
│   └── dialogs/
├── views/
│   └── project-management/
├── store/
│   └── useModalStore.jsx
└── prisma/
    └── schema.prisma
```

## Catatan Penting

1. **Database**: Pastikan PostgreSQL sudah running dan DATABASE_URL sudah dikonfigurasi
2. **Prisma**: Jalankan `npx prisma generate` setelah mengubah schema
3. **Modal Store**: Menggunakan Zustand untuk state management modal
4. **Routing**: Menggunakan Next.js App Router dengan dynamic routes
5. **Styling**: Menggunakan Tailwind CSS dengan Material-UI components

## Pengembangan Selanjutnya

- [ ] User authentication dan authorization
- [ ] Real-time collaboration
- [ ] File attachments
- [ ] Advanced filtering dan search
- [ ] Custom fields
- [ ] Automation rules
- [ ] Integration dengan external tools
- [ ] Mobile responsive improvements
- [ ] Performance optimization
