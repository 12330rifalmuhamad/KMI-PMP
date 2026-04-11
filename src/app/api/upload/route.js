import { writeFile } from 'fs/promises'
import { join } from 'path'

import { NextResponse } from 'next/server'

export async function POST(request) {
  const data = await request.formData()
  const file = data.get('file')

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file found' }, { status: 400 })
  }

  // Ubah file menjadi buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Buat path unik untuk menyimpan file
  const filename = `${Date.now()}_${file.name}`
  const path = join(process.cwd(), 'public', 'uploads', filename)

  try {
    // Tulis file ke filesystem
    await writeFile(path, buffer)

    // Kembalikan path/URL yang bisa diakses publik
    const publicUrl = `/uploads/${filename}`

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('🔴 GAGAL UPLOAD FILE:', error)

    return NextResponse.json({ success: false, message: 'File upload failed' }, { status: 500 })
  }
}
