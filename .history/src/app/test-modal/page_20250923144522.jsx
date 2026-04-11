'use client'

// Impor yang kita butuhkan untuk tes
import Button from '@mui/material/Button'

import { useModalStore } from '@/store/useModalStore'
import ModalProvider from '@/components/ModalProvider'

// Ini adalah halaman tes yang mandiri
export default function TestModalPage() {
  // Ambil fungsi openModal langsung di halaman ini
  const { openModal } = useModalStore()

  console.log('[HALAMAN TES] Halaman tes modal dirender.')

  return (
    <div
      style={{
        padding: '50px',
        background: '#16161a',
        color: 'white',
        height: '100vh',
        fontFamily: 'sans-serif'
      }}
    >
      <h1>Halaman Tes Modal</h1>
      <p style={{ margin: '20px 0' }}>Klik tombol di bawah ini untuk mencoba membuka modal secara langsung.</p>

      <Button
        variant='contained'
        onClick={() => {
          console.log('[HALAMAN TES] Tombol diklik, memanggil openModal("CREATE_BOARD")...')
          openModal('CREATE_BOARD')
        }}
      >
        Buka Modal Create Board
      </Button>

      {/* ============================================================== */}
      {/* KITA PASANG MODAL PROVIDER LANGSUNG DI SINI UNTUK TES */}
      {/* ============================================================== */}
      <ModalProvider />
    </div>
  )
}
