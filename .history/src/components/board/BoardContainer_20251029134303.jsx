'use client'

import React, { useState } from 'react'

import { useRouter } from 'next/navigation'

import useSWR, { useSWRConfig } from 'swr'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip' // Untuk tooltip pada ikon "+"
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import TableView from './TableView'
import KanbanView from './KanbanView'
import CalendarView from './CalendarView'
import GanttView from './GanttView'

// Impor state management modal
import { useModalStore } from '@/store/useModalStore'

const fetcher = url => fetch(url).then(res => res.json())

export default function BoardContainer({ boardId }) {
  // Mengatur default activeView ke 'table' agar sesuai dengan 'Main table'
  const [activeView, setActiveView] = useState('table')
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)

  const { data: board, error, isLoading } = useSWR(boardId ? `/api/boards/${boardId}` : null, fetcher)
  const { mutate } = useSWRConfig()
  const router = useRouter()

  const openMenu = event => {
    setMenuAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setMenuAnchorEl(null)
  }

  const handleDeleteBoard = async () => {
    if (!board) return
    closeMenu()

    const confirmed = confirm(`Hapus board "${board.boardName}"? Tindakan ini tidak bisa dibatalkan.`)

    if (!confirmed) return

    try {
      const res = await fetch(`/api/boards/${board.boardId}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        throw new Error(data.message || 'Gagal menghapus board')
      }

      // Refresh daftar terkait lalu redirect
      mutate('/api/workspaces')
      router.push('/project-management')
    } catch (err) {
      alert(err.message || 'Gagal menghapus board')
    }
  }

  const openModal = useModalStore(state => state.openModal)

  const darkModeClasses = 'bg-backgroundPaper text-textPrimary'

  // Create a new item similar to '+ Add Item' in TableView
  const handleCreateTopNewItem = async () => {
    if (!board?.groups?.length) return

    const targetGroupId = board.groups[0].groupId

    try {
      await fetch(`/api/groups/${targetGroupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: 'New Item' })
      })

      mutate(`/api/boards/${board.boardId}`)
    } catch (e) {
      // noop
    }
  }

  if (isLoading)
    return (
      <div className={`flex justify-center items-center h-48 text-lg ${darkModeClasses}`}>
        <CircularProgress />
      </div>
    )
  if (error)
    return (
      <div className={`flex justify-center items-center h-48 text-lg text-red-500`}> Error: Gagal memuat papan.</div>
    )
  if (!board)
    return (
      <div className={`flex justify-center items-center h-48 text-lg ${darkModeClasses}`}>Papan tidak ditemukan.</div>
    )

  // Daftar view yang sesuai dengan gambar, termasuk "Table" dan "+"
  const views = [
    { key: 'table', label: 'Main table', icon: null }, // 'Main table' tanpa ikon
    { key: 'gantt', label: 'Gantt', icon: null },
    { key: 'calendar', label: 'Calendar', icon: null },
    { key: 'kanban', label: 'Kanban', icon: null },
    { key: 'raw_table', label: 'Table', icon: null } // 'Table' kedua, mungkin tampilan mentah
  ]

  return (
    <div className={`flex-1 ${darkModeClasses}`}>
      {/* --- Header Papan & Tab Navigasi View --- */}
      <Box className='px-6 pt-4 border-b border-divider'>
        {/* Baris Pertama: Nama Papan dan Aksi Global */}
        <div className='flex justify-between items-center mb-4'>
          {/* Nama Papan dengan Dropdown */}
          <div className='flex items-center gap-2'>
            <Typography variant='h5' className='!font-semibold'>
              {board.boardName}
            </Typography>
            <IconButton size='small' color='secondary' className='-ml-1'>
              <i className='tabler-chevron-down' />
            </IconButton>
          </div>

          {/* Aksi Kanan: Enhance, Integrate, Automate, Invite, dll. */}
          <div className='flex items-center gap-4 text-textSecondary'>
            <Button
              variant='text'
              size='small'
              startIcon={<i className='tabler-sparkles' />}
              className='!normal-case !text-textSecondary hover:!text-primary-main'
            >
              Enhance
            </Button>
            <Button
              variant='text'
              size='small'
              startIcon={<i className='tabler-puzzle' />}
              className='!normal-case !text-textSecondary hover:!text-primary-main'
            >
              Integrate
            </Button>
            <Button
              variant='text'
              size='small'
              startIcon={<i className='tabler-robot' />}
              className='!normal-case !text-textSecondary hover:!text-primary-main'
            >
              Automate
            </Button>
            <Divider orientation='vertical' flexItem className='!mx-2' />
            <Button
              variant='text'
              size='small'
              startIcon={<i className='tabler-user-plus' />}
              className='!normal-case !text-textSecondary hover:!text-primary-main'
              onClick={() => openModal('BOARD_MEMBERS', { boardId: board.boardId })}
            >
              Invite / 2
            </Button>
            <IconButton size='small' color='secondary'>
              <i className='tabler-dots' />
            </IconButton>
            <IconButton size='small' color='secondary'>
              <i className='tabler-arrows-maximize' />
            </IconButton>
            {/* Menu aksi board */}
            <IconButton
              size='small'
              color='secondary'
              onClick={openMenu}
              aria-controls='board-menu'
              aria-haspopup='true'
            >
              <i className='tabler-dots-vertical' />
            </IconButton>
            <Menu id='board-menu' anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu} keepMounted>
              <MenuItem onClick={handleDeleteBoard} sx={{ color: 'error.main' }}>
                <i className='tabler-trash mr-2' /> Hapus Board
              </MenuItem>
            </Menu>
          </div>
        </div>

        {/* Baris Kedua: Tab View Navigasi */}
        <div className='flex justify-between items-center mb-4'>
          <nav className='flex -mb-px'>
            {' '}
            {/* -mb-px untuk menggeser sedikit ke atas */}
            {views.map(view => (
              <Button
                key={view.key}
                className={`!normal-case !rounded-none !py-2 !px-4 !min-w-0 ${
                  activeView === view.key
                    ? '!text-primary-main !border-b-2 !border-primary-main'
                    : '!text-textSecondary hover:!text-primary-main !border-b-2 !border-transparent'
                }`}
                onClick={() => setActiveView(view.key)}
                variant='text' // Gunakan variant text untuk tab
                disableRipple // Hapus efek ripple
              >
                {view.label}
              </Button>
            ))}
            {/* Tombol "+" untuk menambah view baru */}
            <Tooltip title='Add View'>
              <IconButton
                size='small'
                className='!text-textSecondary hover:!text-primary-main !ml-2'
                onClick={() => openModal('ADD_VIEW')}
              >
                <i className='tabler-plus text-lg' />
              </IconButton>
            </Tooltip>
          </nav>
        </div>

        {/* Baris Ketiga: Aksi Cepat (New item, Add widget, Search, Person, Filter) */}
        <div className='flex items-center gap-3 py-3'>
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='tabler-plus' />}
            onClick={handleCreateTopNewItem}
            className='!normal-case'
          >
            New item
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            startIcon={<i className='tabler-layout-grid-add' />}
            onClick={() => openModal('ADD_WIDGET')} // Misalnya, modal untuk widget
            className='!normal-case'
          >
            Add widget
          </Button>
          {/* Search */}
          <div className='relative flex-1 max-w-[200px] ml-4'>
            <i className='tabler-search text-textDisabled absolute left-2 top-1/2 -translate-y-1/2 text-sm' />
            <input
              type='text'
              placeholder='Search'
              className='w-full pl-8 pr-2 py-1.5 text-sm rounded-md bg-backgroundPaper text-textPrimary border border-divider focus:outline-none focus:ring-1 focus:ring-primary-main'
            />
          </div>
          <Button
            variant='text'
            size='small'
            startIcon={<i className='tabler-user' />}
            className='!normal-case !text-textSecondary hover:!text-primary-main'
          >
            Person
          </Button>
          <Button
            variant='text'
            size='small'
            startIcon={<i className='tabler-filter' />}
            className='!normal-case !text-textSecondary hover:!text-primary-main'
          >
            Filter
          </Button>

          {/* Tombol panah ke atas */}
          <div className='flex-grow flex justify-end'>
            <IconButton size='small' color='secondary'>
              <i className='tabler-chevron-up' />
            </IconButton>
          </div>
        </div>
      </Box>

      {/* --- Konten View Aktif --- */}
      <div className='p-4 md:p-6'>
        {activeView === 'table' && <TableView board={board} />}
        {activeView === 'gantt' && <GanttView board={board} />}
        {activeView === 'calendar' && <CalendarView board={board} />}
        {activeView === 'kanban' && <KanbanView board={board} />}
        {activeView === 'raw_table' && <TableView board={board} />} {/* Menggunakan TableView untuk 'Table' kedua */}
      </div>
    </div>
  )
}
