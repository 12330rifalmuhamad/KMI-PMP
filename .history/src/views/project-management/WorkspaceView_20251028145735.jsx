'use client'

import React, { useState } from 'react'

import { useRouter } from 'next/navigation'

import useSWR, { useSWRConfig } from 'swr'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

// Component Imports
import CreateBoardModal from '@/components/dialogs/CreateBoardModal'

// Impor state management modal
import { useModalStore } from '@/store/useModalStore'

const fetcher = url => fetch(url).then(res => res.json())

export default function WorkspaceView({ workspaceId }) {
  const router = useRouter()
  const { mutate: globalMutate } = useSWRConfig()
  const openModal = useModalStore(state => state.openModal)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)

  const {
    data: workspace,
    error,
    isLoading,
    mutate
  } = useSWR(workspaceId ? `/api/workspaces/${workspaceId}` : null, fetcher)

  const darkModeClasses = 'bg-backgroundPaper text-textPrimary'

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-96 ${darkModeClasses}`}>
        <CircularProgress />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-96 text-red-500 ${darkModeClasses}`}>
        Error: Gagal memuat workspace
      </div>
    )
  }

  if (!workspace) {
    return <div className={`flex justify-center items-center h-96 ${darkModeClasses}`}>Workspace tidak ditemukan</div>
  }

  const openMenu = event => setMenuAnchorEl(event.currentTarget)
  const closeMenu = () => setMenuAnchorEl(null)

  const handleOpenInNewTab = () => {
    window.open(`/project-management/workspace/${workspace.workspaceId}`, '_blank', 'noopener')
    closeMenu()
  }


  const handleRename = async () => {
    const newName = prompt('Rename project', workspace.workspaceName)
    
    if (!newName || newName.trim() === '' || newName === workspace.workspaceName) return

    try {
      const res = await fetch(`/api/workspaces/${workspace.workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName: newName.trim() })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal mengganti nama project')
      }
      
      await globalMutate(`/api/workspaces/${workspace.workspaceId}`)
      await globalMutate('/api/workspaces')
    } catch (err) {
      alert(err.message || 'Gagal mengganti nama project')
    } finally {
      closeMenu()
    }
  }


  const handleAddToFavorites = () => {
    try {
      const key = 'favoriteWorkspaces'
      const current = JSON.parse(localStorage.getItem(key) || '[]')
      const exists = current.includes(Number(workspace.workspaceId))
      const next = exists
        ? current.filter(id => id !== Number(workspace.workspaceId))
        : [...current, Number(workspace.workspaceId)]
      localStorage.setItem(key, JSON.stringify(next))
      alert(exists ? 'Removed from favorites' : 'Added to favorites')
    } catch {}

    closeMenu()
  }


  const handleDuplicate = async () => {
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName: `${workspace.workspaceName} (Copy)` })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal menduplikasi project')
      }
      const newWs = await res.json()

      
      await globalMutate('/api/workspaces')
      router.push(`/project-management/workspace/${newWs.workspaceId}`)
    } catch (err) {
      alert(err.message || 'Gagal menduplikasi project')
    } finally {
      closeMenu()
    }
  }

  const handleDeleteWorkspace = async () => {
    closeMenu()
    const ok = confirm(
      `Hapus project/workspace "${workspace.workspaceName}"? Semua board di dalamnya akan ikut terhapus.`
    )
    if (!ok) return

    try {
      const res = await fetch(`/api/workspaces/${workspace.workspaceId}`, { method: 'DELETE' })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal menghapus project')
      }
      
      // Refresh daftar workspaces dan kembali ke dashboard project-management
      await globalMutate('/api/workspaces')
      router.push('/project-management')
    } catch (err) {
      alert(err.message || 'Gagal menghapus project')
    }
  }

  const handleBoardClick = boardId => {
    router.push(`/project-management/board/${boardId}`)
  }

  return (
    <div className={`min-h-screen ${darkModeClasses}`}>
      {/* Header */}
      <Box className='px-6 pt-6 pb-4 border-b border-divider'>
        {/* Breadcrumbs */}
        <Breadcrumbs className='mb-4'>
          <Link color='inherit' href='/project-management' className='cursor-pointer hover:text-primary-main'>
            Project Management
          </Link>
          <Typography color='text.primary'>{workspace.workspaceName}</Typography>
        </Breadcrumbs>

        <div className='flex justify-between items-center mb-4'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <i className='tabler-folder text-3xl text-primary-main' />
              <Typography variant='h4' className='!font-bold'>
                {workspace.workspaceName}
              </Typography>
            </div>
            <Typography variant='body1' className='text-textSecondary'>
              {workspace.boards?.length || 0} boards dalam workspace ini
            </Typography>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='contained'
              startIcon={<i className='tabler-layout-board' />}
              onClick={() => openModal('CREATE_BOARD')}
              className='!normal-case'
            >
              New Board
            </Button>
            <IconButton color='secondary'>
              <i className='tabler-settings' />
            </IconButton>
            <IconButton color='secondary' onClick={openMenu} aria-controls='workspace-menu' aria-haspopup='true'>
              <i className='tabler-dots-vertical' />
            </IconButton>
            <Menu
              id='workspace-menu'
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={closeMenu}
              keepMounted
            >
              <MenuItem onClick={handleOpenInNewTab}>
                <i className='tabler-external-link mr-2' /> Open in new tab
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleRename}>
                <i className='tabler-pencil mr-2' /> Rename
              </MenuItem>
              <MenuItem disabled>
                <i className='tabler-arrow-right mr-2' /> Move to
              </MenuItem>
              <MenuItem disabled>
                <i className='tabler-arrows-exchange mr-2' /> Change type
              </MenuItem>
              <MenuItem onClick={handleAddToFavorites}>
                <i className='tabler-star mr-2' /> Add to favorites
              </MenuItem>
              <MenuItem onClick={handleDuplicate}>
                <i className='tabler-copy mr-2' /> Duplicate
              </MenuItem>
              <MenuItem disabled>
                <i className='tabler-template mr-2' /> Save as a template
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleDeleteWorkspace} sx={{ color: 'error.main' }}>
                <i className='tabler-trash mr-2' /> Delete
              </MenuItem>
              <MenuItem disabled>
                <i className='tabler-archive mr-2' /> Archive
              </MenuItem>
            </Menu>
          </div>
        </div>
      </Box>

      {/* Content */}
      <Box className='p-6'>
        {!workspace.boards || workspace.boards.length === 0 ? (
          <div className='text-center py-12'>
            <i className='tabler-layout-board-off text-6xl text-textDisabled mb-4' />
            <Typography variant='h6' className='mb-2 text-textSecondary'>
              Belum ada board
            </Typography>
            <Typography variant='body2' className='text-textDisabled mb-4'>
              Buat board pertama Anda untuk memulai mengelola project
            </Typography>
            <Button
              variant='contained'
              startIcon={<i className='tabler-layout-board' />}
              onClick={() => openModal('CREATE_BOARD')}
              className='!normal-case'
            >
              Buat Board Pertama
            </Button>
          </div>
        ) : (
          <Grid container spacing={3}>
            {workspace.boards.map(board => (
              <Grid item xs={12} md={6} lg={4} key={board.boardId}>
                <Card
                  className='hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={() => handleBoardClick(board.boardId)}
                >
                  <CardContent className='pb-2'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-center gap-2'>
                        <i className='tabler-layout-board text-2xl text-primary-main' />
                        <Typography variant='h6' className='!font-semibold'>
                          {board.boardName}
                        </Typography>
                      </div>
                      <IconButton size='small' color='secondary'>
                        <i className='tabler-dots' />
                      </IconButton>
                    </div>

                    {board.description && (
                      <Typography variant='body2' className='text-textSecondary mb-3'>
                        {board.description}
                      </Typography>
                    )}

                    <div className='flex items-center gap-4 mb-3'>
                      <div className='flex items-center gap-1'>
                        <i className='tabler-layout-grid text-sm text-textSecondary' />
                        <Typography variant='body2' className='text-textSecondary'>
                          {board.groups?.length || 0} groups
                        </Typography>
                      </div>
                      <div className='flex items-center gap-1'>
                        <i className='tabler-list text-sm text-textSecondary' />
                        <Typography variant='body2' className='text-textSecondary'>
                          {board.groups?.reduce((total, group) => total + (group.items?.length || 0), 0) || 0} items
                        </Typography>
                      </div>
                    </div>

                    {board.groups && board.groups.length > 0 && (
                      <div className='space-y-1'>
                        {board.groups.slice(0, 2).map(group => (
                          <div key={group.groupId} className='flex items-center gap-2'>
                            <div
                              className='w-3 h-3 rounded-full'
                              style={{ backgroundColor: group.groupColor || '#579BFC' }}
                            />
                            <Typography variant='body2' className='flex-1'>
                              {group.groupName}
                            </Typography>
                            <Chip label={group.items?.length || 0} size='small' color='primary' variant='outlined' />
                          </div>
                        ))}
                        {board.groups.length > 2 && (
                          <Typography variant='caption' className='text-textDisabled'>
                            +{board.groups.length - 2} groups lainnya
                          </Typography>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardActions className='pt-0 pb-3 px-3'>
                    <div className='flex items-center justify-between w-full'>
                      <div className='flex items-center gap-1'>
                        <AvatarGroup max={3} className='!h-6'>
                          {board.boardMember?.slice(0, 3).map(member => (
                            <Avatar key={member.boardMemberId} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {member.mUser?.userName?.charAt(0) || 'U'}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Typography variant='caption' className='text-textSecondary ml-1'>
                          {board.boardMember?.length || 0} members
                        </Typography>
                      </div>
                      <Tooltip title='Open board'>
                        <IconButton size='small' color='primary'>
                          <i className='tabler-arrow-right' />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Modals */}
      <CreateBoardModal onSuccess={() => mutate()} />
    </div>
  )
}
