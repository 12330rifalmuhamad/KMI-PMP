// MUI Imports
import Link from 'next/link'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
// Keep IconButton and Menu imports here only if CrmDashboardPage itself uses them.
// If they are only used inside BoardList, remove them from here.
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'


// Next-Auth Imports
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Data Fetching
import { getBoardsForWorkspace } from '@/libs/data'

// Client Component Import
import BoardList from '@/components/dashboard/BoardList' // Adjust path if needed

// Fungsi untuk mendapatkan sapaan berdasarkan waktu
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// This remains a Server Component (async)
const CrmDashboardPage = async () => {
  // Ambil sesi pengguna di server
  const session = await getServerSession(authOptions)

  // Ambil data board di server
  const boards = await getBoardsForWorkspace(1) // Hardcode workspaceId 1
  const greeting = getGreeting()
  const userName = session?.user?.name || 'Guest'

  return (
    <div className='p-8 text-white'>
      {/* --- Bagian Sapaan --- */}
      <div className='mb-8'>
        <Typography variant='h4' component='h1' className='text-textPrimary font-semibold'>
          {`${greeting}, ${userName}!`}
        </Typography>
        <Typography className='text-textSecondary'>Quickly access your recent boards, Inbox and workspaces</Typography>
      </div>

      {/* --- Layout Utama: Konten & Sidebar Kanan --- */}
      <Grid container spacing={6}>
        {/* Kolom Konten Utama (kiri) */}
        <Grid item xs={12} md={8}>
          <div className='flex flex-col gap={6}>
            {/* Kartu Recently Visited */}
            <Paper elevation={0} className='!bg-gray-800 !p-6 !rounded-lg'>
              <Typography variant='h6' className='!font-semibold !mb-4 flex items-center gap-2'>
                <i className='tabler-check text-success' /> Recently visited
              </Typography>

              {/* ===> Render Client Component BoardList di sini <=== */}
              {/* Pass the server-fetched boards data as a prop */}
              <BoardList boards={boards} />

            </Paper>

            {/* Link Update Feed */}
            <Link href='#'>
              <Typography className='font-semibold text-textPrimary hover:text-blue-400 flex items-center gap-2'>
                <i className='tabler-arrow-right' /> Update feed (Inbox){' '}
                <span className='bg-gray-700 text-xs px-2 py-0.5 rounded-full'>0</span>
              </Typography>
            </Link>
          </div>
        </Grid>

        {/* Kolom Sidebar Kanan */}
        <Grid item xs={12} md={4}>
         {/* ... (Kode sidebar kanan tidak berubah) ... */}
         <Paper elevation={0} className='!bg-gray-800 !p-6 !rounded-lg'>
            <Typography variant='h6' className='!font-semibold !mb-4'>
              Learn & get inspired
            </Typography>
            <div className='flex flex-col gap-4'>
              {/* ... Buttons ... */}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  )
}

export default CrmDashboardPage
