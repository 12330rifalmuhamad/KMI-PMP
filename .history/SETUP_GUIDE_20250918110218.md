# Setup Guide - Project Management Platform

## Prerequisites

1. **Node.js** (v18 atau lebih baru)
2. **PostgreSQL** (v12 atau lebih baru)
3. **pnpm** atau **npm**

## Setup Database

### 1. Install PostgreSQL

- Download dan install PostgreSQL dari [postgresql.org](https://www.postgresql.org/download/)
- Buat database baru dengan nama `vuexy_pmp`

### 2. Setup Environment Variables

Buat file `.env` di root project dengan isi:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vuexy_pmp?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DOCS_URL="https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation"
```

**Ganti:**

- `username` dengan username PostgreSQL Anda
- `password` dengan password PostgreSQL Anda
- `your-secret-key-here` dengan secret key yang aman

## Setup Project

### 1. Install Dependencies

```bash
pnpm install
# atau
npm install
```

### 2. Setup Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push
```

### 3. Seed Database (Optional)

```bash
# Jalankan seed untuk data contoh
pnpm run seed
# atau
npm run seed
```

### 4. Start Development Server

```bash
pnpm dev
# atau
npm run dev
```

### 5. Buka Browser

Akses `http://localhost:3000` di browser Anda.

## Menggunakan Project Management Platform

### 1. Akses Project Management

- Login ke aplikasi
- Klik menu "Project Management" di sidebar
- Atau akses langsung ke `/project-management`

### 2. Membuat Workspace

1. Klik tombol "New Workspace"
2. Isi nama workspace
3. Klik "Buat Workspace"

### 3. Membuat Board

1. Dari dashboard atau workspace view
2. Klik tombol "New Board"
3. Pilih workspace
4. Isi nama board
5. Klik "Buat Board"

### 4. Mengelola Task

1. Buka board yang diinginkan
2. Gunakan view yang sesuai (Table, Kanban, dll)
3. Tambahkan task baru
4. Kelola nilai task untuk setiap kolom

## Troubleshooting

### Database Connection Error

- Pastikan PostgreSQL sudah running
- Periksa DATABASE_URL di file .env
- Pastikan database `vuexy_pmp` sudah dibuat

### Prisma Error

```bash
# Reset database
npx prisma db push --force-reset

# Generate ulang client
npx prisma generate
```

### Port Already in Use

```bash
# Ganti port
pnpm dev -- -p 3001
```

## File Structure

```
src/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── boards/            # Board API
│   │   └── workspaces/        # Workspace API
│   └── [lang]/
│       └── project-management/ # Project management pages
├── components/
│   ├── board/                 # Board components
│   └── dialogs/               # Modal components
├── views/
│   └── project-management/    # View components
├── store/
│   └── useModalStore.jsx      # Modal state management
└── prisma/
    ├── schema.prisma          # Database schema
    └── seed.js                # Database seed
```

## API Documentation

### Workspace Endpoints

- `GET /api/workspaces` - Get all workspaces
- `POST /api/workspaces` - Create new workspace
- `GET /api/workspaces/[id]` - Get workspace by ID
- `PUT /api/workspaces/[id]` - Update workspace
- `DELETE /api/workspaces/[id]` - Delete workspace

### Board Endpoints

- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create new board
- `GET /api/boards/[id]` - Get board by ID
- `PUT /api/boards/[id]` - Update board
- `DELETE /api/boards/[id]` - Delete board

## Development Tips

1. **Hot Reload**: Perubahan kode akan otomatis reload
2. **Database Changes**: Gunakan `npx prisma db push` untuk update schema
3. **Logs**: Periksa console untuk error messages
4. **Network**: Periksa Network tab di DevTools untuk API calls

## Production Deployment

1. **Build**: `pnpm build`
2. **Start**: `pnpm start`
3. **Environment**: Set production environment variables
4. **Database**: Setup production PostgreSQL database
5. **SSL**: Setup SSL certificate untuk HTTPS

## Support

Jika mengalami masalah:

1. Periksa console untuk error messages
2. Periksa Network tab untuk failed requests
3. Pastikan semua dependencies terinstall
4. Pastikan database connection berfungsi
