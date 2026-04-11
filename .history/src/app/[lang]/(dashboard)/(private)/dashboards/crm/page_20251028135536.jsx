// MUI Imports
import { useState } from 'react' // Import useState for Client Component part

import Link from 'next/link'

import { useRouter, usePathname } from 'next/navigation' // Needed for Client Component part

import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

// Next Imports

// Next-Auth Imports
import { getServerSession } from 'next-auth'

import { useSWRConfig } from 'swr'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Data Fetching & State Management Imports
import { getBoardsForWorkspace } from '@/libs/data'

// ==========================================================
// Client Component: BoardList
// Handles displaying boards and the delete action
// ==========================================================
function BoardList({ boards }) {
  'use client' // Make this part a Client Component

  const { mutate } = useSWRConfig()
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = 1 // Adjust if needed

  // State for the action menu (delete)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [selectedBoard, setSelectedBoard] = useState(null)

  const handleOpenMenu = (event, board) => {
    event.preventDefault() // Mencegah navigasi Link
    event.stopPropagation()
    setMenuAnchorEl(event.currentTarget)
    setSelectedBoard(board)
  }

  const handleCloseMenu = () => {
    setMenuAnchorEl(null)
    setSelectedBoard(null)
  }

  const handleDeleteBoard = async () => {
    if (!selectedBoard) return

    const boardIdToDelete = selectedBoard.boardId
    const boardNameToDelete = selectedBoard.boardName

    handleCloseMenu() // Tutup menu dulu

    if (confirm(`Are you sure you want to delete the board "${boardNameToDelete}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/boards/${boardIdToDelete}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()

          throw new Error(errorData.message || 'Failed to delete board')
        }

        mutate(`/api/workspaces/${workspaceId}/boards`) // Refresh daftar board
        alert('Board deleted successfully!')

        const currentBoardPath = `/board/${boardIdToDelete}`

        // Check if the current pathname (without language) starts with the board path
        const pathWithoutLang = pathname.substring(pathname.indexOf('/', 1)) // Remove /en or similar

        if (pathWithoutLang.startsWith(currentBoardPath)) {
          router.push('/dashboards/crm') // Redirect if needed (adjust path)
        }
      } catch (error) {
        console.error('Deletion failed:', error)
        alert(`Error deleting board: ${error.message}`)
      }
    }
  }

  return (
    <>
      <Grid container spacing={4}>
        {Array.isArray(boards) && boards.length > 0 ? (
          boards.slice(0, 3).map(board => (
            <Grid item xs={12} sm={6} md={4} key={board.boardId}>
              <Link href={`/board/${board.boardId}`} passHref>
                <Box
                  component='a'
                  className='relative group border border-gray-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer block'
                >
                  {/* Tombol menu aksi (...) */}
                  <IconButton
                    size='small'
                    onClick={e => handleOpenMenu(e, board)}
                    className='absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity !bg-gray-600/50 hover:!bg-gray-500/70'
                    aria-controls={menuAnchorEl ? 'board-actions-menu' : undefined}
                    aria-haspopup='true'
                    aria-expanded={menuAnchorEl ? 'true' : undefined}
                  >
                    <i className='tabler-dots text-white' />
                  </IconButton>

                  <Box className='h-24 bg-gray-700 rounded-t-lg flex items-center justify-center'>
                    <i className='tabler-layout-kanban text-4xl text-gray-500' />
                  </Box>
                  <div className='p-3 flex justify-between items-center'>
                    <Typography className='font-medium text-textPrimary'>{board.boardName}</Typography>
                    {/* Tombol Favorit */}
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.preventDefault() /* Logika favorit */
                      }}
                    >
                      <i className='tabler-star text-gray-500 hover:text-yellow-400' />
                    </IconButton>
                  </div>
                </Box>
              </Link>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography className='text-textSecondary text-center py-8'>No recent boards found.</Typography>
          </Grid>
        )}
      </Grid>

      {/* Menu Aksi untuk Board */}
      <Menu id='board-actions-menu' anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleDeleteBoard} sx={{ color: 'error.main' }}>
          <i className='tabler-trash mr-2' /> Delete Board
        </MenuItem>
        {/* Tambahkan aksi lain di sini jika perlu */}
      </Menu>
    </>
  )
}

// ==========================================================
// Server Component: CrmDashboardPage
// Fetches initial data and renders the overall page structure
// ==========================================================

// Fungsi untuk mendapatkan sapaan berdasarkan waktu
const getGreeting = () => {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'

  return 'Good evening'
}

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
          <div className='flex flex-col gap-6'>
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
          <Paper elevation={0} className='!bg-gray-800 !p-6 !rounded-lg'>
            <Typography variant='h6' className='!font-semibold !mb-4'>
              Learn & get inspired
            </Typography>
            <div className='flex flex-col gap-4'>
              <Button
                variant='outlined'
                className='!border-gray-700 !text-textPrimary !justify-start !p-3 !normal-case'
              >
                <div className='bg-blue-500/20 p-2 rounded-md mr-4'>
                  <i className='tabler-rocket text-blue-400' />
                </div>
                <div>
                  <Typography className='font-semibold text-left'>Getting started</Typography>
                  <Typography variant='body2' className='text-textSecondary text-left'>
                    Learn how monday.com works
                  </Typography>
                </div>
              </Button>
              <Button
                variant='outlined'
                className='!border-gray-700 !text-textPrimary !justify-start !p-3 !normal-case'
              >
                <div className='bg-purple-500/20 p-2 rounded-md mr-4'>
                  <i className='tabler-help-circle text-purple-400' />
                </div>
                <div>
                  <Typography className='font-semibold text-left'>Help center</Typography>
                  <Typography variant='body2' className='text-textSecondary text-left'>
                    Learn and get support
                  </Typography>
                </div>
              </Button>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  )
}

export default CrmDashboardPage
