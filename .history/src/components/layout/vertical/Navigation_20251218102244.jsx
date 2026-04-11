'use client'

import { useState, useEffect, useMemo } from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import useSWR, { useSWRConfig } from 'swr'
import { useTheme } from '@mui/material/styles'

// Import komponen MUI
import { Menu, MenuItem, ListItemIcon, ListItemText, IconButton, Divider } from '@mui/material'

import CreateBoardDialog from '@/components/CreateBoardDialog'

const fetcher = url => fetch(url).then(res => res.json())

// --- SIMPLE MODAL COMPONENT ---
const SimpleModal = ({ isOpen, onClose, title, children }) => {
  const theme = useTheme()

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div
        className='rounded-lg shadow-xl w-96 p-6 animate-in fade-in zoom-in duration-200'
        style={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }}
      >
        <h3 className='text-lg font-bold mb-4'>{title}</h3>
        {children}
        <div className='flex justify-end gap-2 mt-4'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm rounded transition-colors'
            style={{
              color: theme.palette.text.secondary,
              backgroundColor: theme.palette.action.hover
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// --- COMPONENT: BOARD NAV ITEM ---
const NavItem = ({ href, icon, text, active = false, isBoard = false, isCollapsed, onDelete, onRename }) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const handleMenuClick = event => {
    event.preventDefault()
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = e => {
    if (e) e.stopPropagation()
    setAnchorEl(null)
  }

  const handleRenameClick = e => {
    e.stopPropagation()
    handleMenuClose()
    if (onRename) onRename()
  }

  const handleDeleteClick = e => {
    e.stopPropagation()
    handleMenuClose()
    if (onDelete) onDelete()
  }

  const itemStyle = {
    color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
    backgroundColor: active ? theme.palette.primary.main : 'transparent',
    '&:hover': { backgroundColor: active ? theme.palette.primary.dark : theme.palette.action.hover }
  }

  return (
    <li className='group relative'>
      <Link href={href} title={isCollapsed ? text : ''} className='block w-full'>
        <div
          className={`flex items-center p-2 text-sm rounded-md transition-all duration-300 relative ${isCollapsed ? 'justify-center px-0' : isBoard ? 'pl-8' : 'px-2'}`}
          style={itemStyle}
        >
          <div className={`${isCollapsed ? 'text-xl' : 'text-lg'} transition-all flex-shrink-0`}>{icon}</div>
          <div
            className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}
          >
            <span className='truncate whitespace-nowrap block pr-6'>{text}</span>
          </div>
          {!active && (
            <div className='absolute inset-0 rounded-md bg-current opacity-0 hover:opacity-[0.08] transition-opacity pointer-events-none' />
          )}
        </div>
      </Link>

      {isBoard && !isCollapsed && (
        <>
          <div
            className={`absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-200 z-10 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <IconButton
              size='small'
              onClick={handleMenuClick}
              sx={{
                color: active ? 'inherit' : theme.palette.text.secondary,
                '&:hover': { backgroundColor: active ? 'rgba(255,255,255,0.2)' : theme.palette.action.hover }
              }}
            >
              <i className='tabler-dots-vertical text-xs' />
            </IconButton>
          </div>
          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 3,
              sx: {
                minWidth: 150,
                mt: 1,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary
              }
            }}
          >
            <MenuItem onClick={handleRenameClick}>
              <ListItemIcon>
                <i className='tabler-pencil text-sm' />
              </ListItemIcon>
              <ListItemText primary='Rename' primaryTypographyProps={{ variant: 'body2' }} />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <i className='tabler-trash text-sm text-red-500' />
              </ListItemIcon>
              <ListItemText primary='Delete' primaryTypographyProps={{ variant: 'body2' }} />
            </MenuItem>
          </Menu>
        </>
      )}
    </li>
  )
}

// --- COMPONENT: WORKSPACE NAV ITEM (BARU) ---
const WorkspaceNavItem = ({ workspace, isCollapsed, isOpen, onToggle, onAddBoard, onRename, onDelete }) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const handleMenuClick = e => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleMenuClose = e => {
    if (e) e.stopPropagation()
    setAnchorEl(null)
  }

  const handleRename = e => {
    handleMenuClose(e)
    onRename()
  }

  const handleDelete = e => {
    handleMenuClose(e)
    onDelete()
  }

  return (
    <div
      className='group flex items-center justify-between pr-1 rounded transition-colors relative'
      style={{ cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.palette.action.hover)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <button
        onClick={onToggle}
        className={`flex items-center flex-1 py-1 ${isCollapsed ? 'justify-center' : 'text-left px-1'}`}
        title={isCollapsed ? workspace.workspaceName : ''}
      >
        {!isCollapsed && (
          <i
            className={`tabler-chevron-right text-xs transition-transform duration-200 mr-1 ${isOpen ? 'rotate-90' : ''}`}
            style={{ color: theme.palette.text.disabled }}
          />
        )}
        <i
          className={`tabler-folder ${isCollapsed ? 'text-xl' : 'text-base'}`}
          style={{ color: theme.palette.primary.main }}
        />
        <span
          className={`ml-2 text-sm font-medium truncate w-28 ${isCollapsed ? 'hidden' : 'block'}`}
          style={{ color: theme.palette.text.primary }}
        >
          {workspace.workspaceName}
        </span>
      </button>

      {!isCollapsed && (
        <div className='flex items-center'>
          {/* Tombol Add Board (Selalu muncul) */}
          <button
            onClick={onAddBoard}
            className={`p-1 transition-colors flex-shrink-0 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} // Sembunyikan jika menu buka agar tidak tumpang tindih
            style={{ color: theme.palette.text.secondary }}
            title='Add Project / Board'
          >
            <i className='tabler-plus text-xs' />
          </button>

          {/* Tombol Kebab Menu (Muncul saat Hover) */}
          <div
            className={`transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <IconButton
              size='small'
              onClick={handleMenuClick}
              sx={{ color: theme.palette.text.secondary, padding: '2px' }}
            >
              <i className='tabler-dots-vertical text-xs' />
            </IconButton>
          </div>

          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 3,
              sx: {
                minWidth: 150,
                mt: 1,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary
              }
            }}
          >
            <MenuItem onClick={handleRename}>
              <ListItemIcon>
                <i className='tabler-pencil text-sm' />
              </ListItemIcon>
              <ListItemText primary='Rename Workspace' primaryTypographyProps={{ variant: 'body2' }} />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <i className='tabler-trash text-sm text-red-500' />
              </ListItemIcon>
              <ListItemText primary='Delete Workspace' primaryTypographyProps={{ variant: 'body2' }} />
            </MenuItem>
          </Menu>
        </div>
      )}
    </div>
  )
}

// --- MAIN SIDEBAR COMPONENT ---
export default function Sidebar() {
  const { mutate } = useSWRConfig()
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isWorkspacesSectionOpen, setIsWorkspacesSectionOpen] = useState(true)
  const [openWorkspaces, setOpenWorkspaces] = useState({})

  // --- STATES ---
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false) // Create WS
  const [newTitle, setNewTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isCreateBoardDialogOpen, setIsCreateBoardDialogOpen] = useState(false)
  const [targetWorkspaceId, setTargetWorkspaceId] = useState(null)

  // Rename States (Shared for Board & Workspace logic handled dynamically)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState({ type: null, id: null, name: '' }) // type: 'BOARD' | 'WORKSPACE'
  const [renameValue, setRenameValue] = useState('')

  // Fetch Data
  const { data: workspaces } = useSWR('/api/workspaces', fetcher)
  const { data: boards, error } = useSWR('/api/boards', fetcher)

  const boardsByWorkspace = useMemo(() => {
    if (!boards || !workspaces) return {}
    const grouped = {}

    workspaces.forEach(ws => {
      grouped[ws.workspaceId] = boards.filter(
        board => board.workspaceId === ws.workspaceId || board.workspace?.workspaceId === ws.workspaceId
      )
    })

    return grouped
  }, [boards, workspaces])

  useEffect(() => {
    if (boards && pathname.includes('/board/')) {
      const boardId = pathname.split('/board/')[1]
      const currentBoard = boards.find(b => b.boardId.toString() === boardId)

      if (currentBoard) {
        const workspaceId = currentBoard.workspaceId || currentBoard.workspace?.workspaceId

        if (workspaceId) setOpenWorkspaces(prev => ({ ...prev, [workspaceId]: true }))
      }
    }
  }, [boards, pathname])

  const toggleWorkspace = workspaceId => {
    if (isCollapsed) setIsCollapsed(false)
    setOpenWorkspaces(prev => ({ ...prev, [workspaceId]: !prev[workspaceId] }))
  }

  // --- ACTIONS ---

  const openCreateWorkspaceModal = () => {
    setNewTitle('')
    setIsWorkspaceModalOpen(true)
  }

  const openCreateBoardModal = (e, workspaceId) => {
    e?.stopPropagation()
    setTargetWorkspaceId(workspaceId)
    setIsCreateBoardDialogOpen(true)
  }

  // --- RENAME HANDLERS ---
  const openRenameDialog = (type, id, currentName) => {
    setRenameTarget({ type, id, name: currentName })
    setRenameValue(currentName)
    setIsRenameModalOpen(true)
  }

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || !renameTarget.id) return
    setIsSubmitting(true)

    try {
      const endpoint =
        renameTarget.type === 'BOARD' ? `/api/boards/${renameTarget.id}` : `/api/workspaces/${renameTarget.id}`

      const bodyKey = renameTarget.type === 'BOARD' ? 'boardName' : 'workspaceName'
      const mutateKey = renameTarget.type === 'BOARD' ? '/api/boards' : '/api/workspaces'

      const res = await fetch(endpoint, {
        method: 'PATCH', // Asumsi method PATCH, bisa juga PUT tergantung API route
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: renameValue })
      })

      if (!res.ok) throw new Error('Update failed')

      mutate(mutateKey)
      setIsRenameModalOpen(false)
    } catch (error) {
      console.error('Rename failed:', error)
      alert(`Gagal mengubah nama ${renameTarget.type === 'BOARD' ? 'board' : 'workspace'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- DELETE HANDLERS ---
  const handleDeleteBoard = async (boardId, boardName) => {
    if (!confirm(`Are you sure you want to delete board "${boardName}"?`)) return

    try {
      const res = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' })

      if (!res.ok) throw new Error('Delete failed')
      if (pathname === `/board/${boardId}`) router.push('/dashboards/crm')
      mutate('/api/boards')
    } catch (error) {
      console.error(error)
      alert('Gagal menghapus board.')
    }
  }

  const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
    if (!confirm(`Are you sure you want to delete workspace "${workspaceName}"? All boards inside it will be deleted.`))
      return

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: 'DELETE' })

      if (!res.ok) throw new Error('Delete failed')

      // Jika user sedang membuka board yang ada di dalam workspace ini, redirect
      const boardsInWorkspace = boardsByWorkspace[workspaceId] || []
      const currentBoardId = pathname.split('/board/')[1]

      if (currentBoardId && boardsInWorkspace.some(b => b.boardId.toString() === currentBoardId)) {
        router.push('/dashboards/crm')
      }

      mutate('/api/workspaces')
      mutate('/api/boards') // Refresh boards juga karena ada yang terhapus
    } catch (error) {
      console.error(error)
      alert('Gagal menghapus workspace.')
    }
  }

  // --- CREATE WORKSPACE ---
  const handleCreateWorkspace = async () => {
    if (!newTitle.trim()) return
    setIsSubmitting(true)

    try {
      await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName: newTitle })
      })
      mutate('/api/workspaces')
      setIsWorkspaceModalOpen(false)
    } catch (error) {
      console.error(error)
      alert('Gagal membuat workspace')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBoardCreated = newBoard => {
    mutate('/api/boards')
    if (targetWorkspaceId) setOpenWorkspaces(prev => ({ ...prev, [targetWorkspaceId]: true }))
    router.push(`/board/${newBoard.boardId}`)
  }

  return (
    <>
      <aside
        className={`h-screen flex flex-col border-r transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}
        style={{
          backgroundColor: theme.palette.background.paper,
          borderColor: theme.palette.divider,
          color: theme.palette.text.primary
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='absolute -right-3 top-6 border rounded-full p-1 shadow-md z-50 focus:outline-none flex items-center justify-center'
          style={{
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            color: theme.palette.text.secondary
          }}
        >
          <i
            className={`tabler-chevron-left text-xs transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Top Nav */}
        <nav className={`py-4 ${isCollapsed ? 'px-2' : 'px-2'}`}>
          <ul className='space-y-2'>
            <NavItem
              href='/dashboards/crm'
              icon={<i className='tabler-home' />}
              text='Home'
              active={pathname.includes('/dashboards/crm')}
              isCollapsed={isCollapsed}
            />
            <NavItem href='#' icon={<i className='tabler-calendar-check' />} text='My work' isCollapsed={isCollapsed} />
          </ul>
        </nav>
        <hr className='mx-2' style={{ borderColor: theme.palette.divider }} />

        {/* Workspaces Section */}
        <div className='py-4 overflow-y-auto custom-scrollbar flex-1 px-2'>
          <div className={`flex items-center mb-2 group ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <button
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false)
                setIsWorkspacesSectionOpen(!isWorkspacesSectionOpen)
              }}
              className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'flex-1'}`}
              style={{ color: theme.palette.text.primary }}
              title='Workspaces'
            >
              {isCollapsed ? (
                <i className='tabler-briefcase text-xl' />
              ) : (
                <>
                  <i
                    className={`tabler-chevron-down transition-transform duration-200 ${isWorkspacesSectionOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                  <span className='ml-2 font-semibold'>Workspaces</span>
                </>
              )}
            </button>
            {!isCollapsed && (
              <button
                onClick={openCreateWorkspaceModal}
                className='p-1 rounded transition-colors flex-shrink-0'
                style={{ color: theme.palette.text.secondary }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.palette.action.hover)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                title='Add New Workspace'
              >
                <i className='tabler-plus' />
              </button>
            )}
          </div>

          {isWorkspacesSectionOpen && (
            <div className='flex flex-col space-y-2 mt-2'>
              {!workspaces && !error && !isCollapsed && (
                <div className='px-2 text-xs' style={{ color: theme.palette.text.disabled }}>
                  Loading...
                </div>
              )}

              {Array.isArray(workspaces) &&
                workspaces.map(workspace => {
                  const workspaceBoards = boardsByWorkspace[workspace.workspaceId] || []
                  const isWorkspaceOpen = openWorkspaces[workspace.workspaceId] ?? true

                  return (
                    <div key={workspace.workspaceId} className='space-y-1'>
                      {/* Menggunakan Komponen WorkspaceNavItem Baru */}
                      <WorkspaceNavItem
                        workspace={workspace}
                        isCollapsed={isCollapsed}
                        isOpen={isWorkspaceOpen}
                        onToggle={() => toggleWorkspace(workspace.workspaceId)}
                        onAddBoard={e => openCreateBoardModal(e, workspace.workspaceId)}
                        onRename={() => openRenameDialog('WORKSPACE', workspace.workspaceId, workspace.workspaceName)}
                        onDelete={() => handleDeleteWorkspace(workspace.workspaceId, workspace.workspaceName)}
                      />

                      {isWorkspaceOpen && (
                        <ul className='space-y-1'>
                          {!isCollapsed &&
                            workspaceBoards.map(board => (
                              <NavItem
                                key={board.boardId}
                                href={`/board/${board.boardId}`}
                                icon={<i className='tabler-table' />}
                                text={board.boardName}
                                active={pathname === `/board/${board.boardId}`}
                                isBoard={true}
                                isCollapsed={isCollapsed}
                                onDelete={() => handleDeleteBoard(board.boardId, board.boardName)}
                                onRename={() => openRenameDialog('BOARD', board.boardId, board.boardName)}
                              />
                            ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </aside>

      {/* Modal Add Workspace */}
      <SimpleModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        title='Create New Workspace'
      >
        <div className='flex flex-col gap-4'>
          <input
            autoFocus
            type='text'
            placeholder='Workspace Name'
            className='w-full p-2 border rounded focus:outline-none focus:ring-2'
            style={{
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              outlineColor: theme.palette.primary.main
            }}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
          />
          <button
            onClick={handleCreateWorkspace}
            disabled={isSubmitting}
            className='py-2 rounded disabled:opacity-50'
            style={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
          >
            {isSubmitting ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </SimpleModal>

      {/* Modal Rename (Generic for Board & Workspace) */}
      <SimpleModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title={`Rename ${renameTarget.type === 'BOARD' ? 'Board' : 'Workspace'}`}
      >
        <div className='flex flex-col gap-4'>
          <input
            autoFocus
            type='text'
            className='w-full p-2 border rounded focus:outline-none focus:ring-2'
            style={{
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              outlineColor: theme.palette.primary.main
            }}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
          />
          <button
            onClick={handleRenameSubmit}
            disabled={isSubmitting}
            className='py-2 rounded disabled:opacity-50'
            style={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </SimpleModal>

      <CreateBoardDialog
        open={isCreateBoardDialogOpen}
        onClose={() => setIsCreateBoardDialogOpen(false)}
        workspaceId={targetWorkspaceId}
        onBoardCreated={handleBoardCreated}
      />
    </>
  )
}
