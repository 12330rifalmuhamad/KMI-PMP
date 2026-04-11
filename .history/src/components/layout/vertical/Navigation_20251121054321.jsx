'use client'

// React Imports
import { useState } from 'react'
import React from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Third-party Imports
import useSWR, { useSWRConfig } from 'swr'

// MUI Imports
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

// Impor store kita untuk mengelola modal
import { useModalStore } from '@/store/useModalStore'

// Komponen kecil untuk setiap item navigasi
const NavItem = ({ href, icon, text, active = false, isBoard = false, onActionsClick }) => (
  <li>
    <Link href={href} className='flex items-center'>
      <div
        className={`group flex items-center p-2 text-sm rounded-md transition-colors duration-150 w-full ${isBoard ? 'pl-8' : ''} ${active ? 'text-white' : 'text-textSecondary hover:text-textPrimary'}`}
      >
        <i className={icon} />
        <span className='ml-3 truncate flex-1'>{text}</span>
        {isBoard && (
          <button
            className={`ml-2 text-textDisabled hover:text-textPrimary opacity-0 group-hover:opacity-100 transition-opacity`}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()

              if (onActionsClick) onActionsClick(e)
            }}
            aria-label='Board actions'
          >
            <i className='tabler-dots-vertical' />
          </button>
        )}
      </div>
    </Link>
  </li>
)

// Fungsi fetcher universal untuk SWR
const fetcher = url => fetch(url).then(res => res.json())

const Navigation = () => {
  // Hooks
  const [isWorkspacesSectionOpen, setIsWorkspacesSectionOpen] = useState(true)
  const [openWorkspaces, setOpenWorkspaces] = useState({}) // Track which workspaces are expanded
  const pathname = usePathname()
  const [anchorEl, setAnchorEl] = useState(null)
  const [boardAnchorEl, setBoardAnchorEl] = useState(null)
  const [workspaceAnchorEl, setWorkspaceAnchorEl] = useState(null)
  const [selectedBoard, setSelectedBoard] = useState(null)
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)

  // State Management
  const { openModal } = useModalStore()
  const { mutate } = useSWRConfig()

  // Ambil workspace dinamis
  const { data: workspaces } = useSWR('/api/workspaces', fetcher)

  // Data Fetching: Ambil semua boards dimana user adalah member (dari semua workspace)
  const { data: boards, error } = useSWR('/api/boards', fetcher)

  // Group boards by workspace
  const boardsByWorkspace = React.useMemo(() => {
    if (!boards || !workspaces) return {}
    const grouped = {}

    workspaces.forEach(ws => {
      grouped[ws.workspaceId] = boards.filter(
        board => board.workspaceId === ws.workspaceId || board.workspace?.workspaceId === ws.workspaceId
      )
    })

    return grouped
  }, [boards, workspaces])

  // Auto-expand workspace if current board is in it
  React.useEffect(() => {
    if (boards && pathname.includes('/board/')) {
      const boardId = pathname.split('/board/')[1]
      const currentBoard = boards.find(b => b.boardId.toString() === boardId)

      if (currentBoard) {
        const workspaceId = currentBoard.workspaceId || currentBoard.workspace?.workspaceId

        if (workspaceId) {
          setOpenWorkspaces(prev => ({ ...prev, [workspaceId]: true }))
        }
      }
    }
  }, [boards, pathname])

  // Variabel & Handlers
  const isMenuOpen = Boolean(anchorEl)
  const isBoardMenuOpen = Boolean(boardAnchorEl)

  const handlePlusButtonClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleAddNew = type => {
    console.log(`[NAVIGATION] Mencoba membuka modal dengan tipe: ${type}`)

    openModal(type)
    handleMenuClose()
  }

  const toggleWorkspace = workspaceId => {
    setOpenWorkspaces(prev => ({
      ...prev,
      [workspaceId]: !prev[workspaceId]
    }))
  }

  const openBoardMenu = (event, board) => {
    event.preventDefault()
    event.stopPropagation()
    setBoardAnchorEl(event.currentTarget)
    setSelectedBoard(board)
  }

  const closeBoardMenu = () => {
    setBoardAnchorEl(null)
    setSelectedBoard(null)
  }

  const openWorkspaceMenu = (event, workspace) => {
    event.preventDefault()
    event.stopPropagation()
    setWorkspaceAnchorEl(event.currentTarget)
    setSelectedWorkspace(workspace)
  }

  const closeWorkspaceMenu = () => {
    setWorkspaceAnchorEl(null)
    setSelectedWorkspace(null)
  }

  const handleOpenBoard = () => {
    if (selectedBoard) window.location.href = `/board/${selectedBoard.boardId}`
    closeBoardMenu()
  }

  const handleRenameBoard = async () => {
    if (!selectedBoard) return
    const newName = prompt('Rename board', selectedBoard.boardName)

    if (!newName || newName.trim() === '' || newName === selectedBoard.boardName) return

    try {
      const res = await fetch(`/api/boards/${selectedBoard.boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardName: newName.trim() })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        throw new Error(data.message || 'Gagal mengganti nama board')
      }

      mutate('/api/boards')
      closeBoardMenu()
    } catch (err) {
      alert(err.message || 'Gagal mengganti nama board')
    }
  }

  const handleFavoriteBoard = () => {
    try {
      const key = 'favoriteBoards'
      const current = JSON.parse(localStorage.getItem(key) || '[]')
      const idNum = Number(selectedBoard?.boardId)
      const exists = current.includes(idNum)
      const next = exists ? current.filter(id => id !== idNum) : [...current, idNum]

      localStorage.setItem(key, JSON.stringify(next))
    } catch {}

    closeBoardMenu()
  }

  const handleDuplicateBoard = async () => {
    if (!selectedBoard) return

    try {
      const workspaceId =
        selectedBoard.workspaceId || selectedBoard.workspace?.workspaceId || workspaces?.[0]?.workspaceId || 1

      const res = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardName: `${selectedBoard.boardName} (Copy)` })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        throw new Error(data.message || 'Gagal menduplikasi board')
      }

      mutate('/api/boards')
      closeBoardMenu()
    } catch (err) {
      alert(err.message || 'Gagal menduplikasi board')
    }
  }

  const handleDeleteBoard = async () => {
    if (!selectedBoard) return
    const ok = confirm(`Hapus board "${selectedBoard.boardName}"?`)

    if (!ok) return

    try {
      const res = await fetch(`/api/boards/${selectedBoard.boardId}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        throw new Error(data.message || 'Gagal menghapus board')
      }

      mutate('/api/boards')
      closeBoardMenu()
    } catch (err) {
      alert(err.message || 'Gagal menghapus board')
    }
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Navigasi Atas */}
      <div className='px-4 py-4'>
        <ul className='space-y-2'>
          <NavItem
            href='/dashboards/crm'
            icon='tabler-home text-lg'
            text='Home'
            active={pathname.includes('/dashboards/crm')}
          />
          <NavItem href='#' icon='tabler-calendar-check text-lg' text='My work' />
        </ul>
      </div>

      <hr className='border-divider mx-4' />

      {/* Bagian Workspaces */}
      <div className='px-4 py-4'>
        <div className='flex justify-between items-center mb-2'>
          <button
            onClick={() => setIsWorkspacesSectionOpen(!isWorkspacesSectionOpen)}
            className='flex items-center w-full text-textPrimary'
          >
            <i
              className={`tabler-chevron-down transition-transform duration-200 ${isWorkspacesSectionOpen ? 'rotate-0' : '-rotate-90'}`}
            />
            <span className='ml-2 font-semibold'>Workspaces</span>
          </button>
          <button
            onClick={handlePlusButtonClick}
            className='text-textDisabled hover:text-textPrimary'
            title='Add new workspace or board'
          >
            <i className='tabler-plus' />
          </button>
        </div>

        {isWorkspacesSectionOpen && (
          <div className='flex flex-col space-y-2 mt-2'>
            {!workspaces && !error && <div className='text-textSecondary px-2 text-xs'>Loading workspaces...</div>}
            {error && <div className='text-red-500 px-2 text-xs'>Failed to load workspaces...</div>}

            {Array.isArray(workspaces) && workspaces.length === 0 && (
              <div className='text-textSecondary px-2 text-xs py-2'>No workspaces yet. Create one to get started!</div>
            )}

            {Array.isArray(workspaces) &&
              workspaces.map(workspace => {
                const workspaceBoards = boardsByWorkspace[workspace.workspaceId] || []
                const isWorkspaceOpen = openWorkspaces[workspace.workspaceId] ?? true

                return (
                  <div key={workspace.workspaceId} className='space-y-1'>
                    {/* Workspace Header */}
                    <div className='group flex items-center justify-between p-2 rounded-md'>
                      <button
                        onClick={() => toggleWorkspace(workspace.workspaceId)}
                        className='flex items-center flex-1 text-left'
                      >
                        <i
                          className={`tabler-chevron-right text-textDisabled transition-transform duration-200 ${
                            isWorkspaceOpen ? 'rotate-90' : ''
                          }`}
                        />
                        <i className='tabler-folder text-base text-primary-main ml-1' />
                        <span className='ml-2 text-sm font-medium text-textPrimary truncate'>
                          {workspace.workspaceName}
                        </span>
                        <span className='ml-2 text-xs text-textDisabled'>({workspaceBoards.length})</span>
                      </button>
                      <button
                        className='opacity-0 group-hover:opacity-100 text-textDisabled hover:text-textPrimary transition-opacity'
                        onClick={e => openWorkspaceMenu(e, workspace)}
                      >
                        <i className='tabler-dots-vertical text-sm' />
                      </button>
                    </div>

                    {/* Boards under workspace */}
                    {isWorkspaceOpen && (
                      <ul className='ml-6 space-y-1'>
                        {workspaceBoards.length === 0 && (
                          <li className='text-textDisabled px-2 text-xs py-1'>No boards in this workspace</li>
                        )}
                        {workspaceBoards.map(board => (
                          <NavItem
                            key={board.boardId}
                            href={`/board/${board.boardId}`}
                            icon='tabler-table text-base'
                            text={board.boardName}
                            active={pathname === `/board/${board.boardId}`}
                            isBoard={true}
                            onActionsClick={e => openBoardMenu(e, board)}
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

      {/* Bagian Footer "Guest" */}
      <div className='mt-auto p-4 text-center border-t border-divider'>
        <div className='bg-white rounded-full w-12 h-12 mx-auto flex items-center justify-center mb-3'>
          <svg width='28' height='28' viewBox='0 0 125 125' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M62.5 125C97.0178 125 125 97.0178 125 62.5C125 27.9822 97.0178 0 62.5 0C27.9822 0 0 27.9822 0 62.5C0 97.0178 27.9822 125 62.5 125Z'
              fill='#5034FF'
            />
            <path
              d='M96.3533 58.7407C92.2067 58.7407 88.7533 62.1941 88.7533 66.3407V80.0941C88.7533 84.2407 85.3 87.6941 81.1533 87.6941C77.0067 87.6941 73.5533 84.2407 73.5533 80.0941V44.9059C73.5533 40.7593 70.1 37.3059 65.9533 37.3059C61.8067 37.3059 58.3533 40.7593 58.3533 44.9059V80.0941C58.3533 84.2407 54.9 87.6941 50.7533 87.6941C46.6067 87.6941 43.1533 84.2407 43.1533 80.0941V66.3407C43.1533 62.1941 39.7 58.7407 35.5533 58.7407C31.4067 58.7407 27.9533 62.1941 27.9533 66.3407V80.0941C27.9533 91.3807 36.8733 100.3 47.9533 100.3C59.0333 100.3 67.9533 91.3807 67.9533 80.0941V44.9059C67.9533 33.6193 76.8733 24.7059 87.9533 24.7059C99.0333 24.7059 107.953 33.6193 107.953 44.9059V66.3407C107.953 70.4874 100.353 73.9407 100.353 73.9407C96.2067 73.9407 92.7533 70.4874 92.7533 66.3407C92.7533 62.1941 92.7533 58.7407 96.3533 58.7407Z'
              fill='white'
            />
          </svg>
        </div>
        <p className='font-semibold text-sm text-textPrimary'>Youre a Guest here</p>
        <p className='text-xs text-textSecondary mt-1'>Get monday.coms full power</p>
        <Link href='/register'>
          <span className='text-primary-main hover:underline text-sm font-semibold mt-2 block'>
            Create your account
          </span>
        </Link>
      </div>

      {/* Komponen Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <div className='px-4 py-2'>
          <Typography variant='body2' className='font-semibold'>
            Add new
          </Typography>
        </div>
        <MenuItem onClick={() => handleAddNew('CREATE_WORKSPACE')}>
          <ListItemIcon>
            <i className='tabler-folder-plus text-lg' />
          </ListItemIcon>
          <ListItemText>Workspace</ListItemText>
        </MenuItem>
        <Divider className='!my-2' />
        <MenuItem onClick={() => handleAddNew('CREATE_BOARD')}>
          <ListItemIcon>
            <i className='tabler-table text-lg' />
          </ListItemIcon>
          <ListItemText>Board</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAddNew('CREATE_DOC')}>
          <ListItemIcon>
            <i className='tabler-file-text text-lg' />
          </ListItemIcon>
          <ListItemText>Doc</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => alert('Fungsi belum dibuat')}>
          <ListItemIcon>
            <i className='tabler-layout-dashboard text-lg' />
          </ListItemIcon>
          <ListItemText>Dashboard</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => alert('Fungsi belum dibuat')}>
          <ListItemIcon>
            <i className='tabler-list-check text-lg' />
          </ListItemIcon>
          <ListItemText>Form</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => alert('Fungsi belum dibuat')}>
          <ListItemIcon>
            <i className='tabler-automation text-lg' />
          </ListItemIcon>
          <ListItemText>Workflow</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => alert('Fungsi belum dibuat')}>
          <ListItemIcon>
            <i className='tabler-folder text-lg' />
          </ListItemIcon>
          <ListItemText>Folder</ListItemText>
        </MenuItem>

        <Divider className='!my-2' />

        <MenuItem onClick={() => alert('Fungsi belum dibuat')}>
          <ListItemIcon>
            <i className='tabler-apps text-lg' />
          </ListItemIcon>
          <ListItemText>Installed apps</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => alert('Fungsi belum dibuat')}>
          <ListItemIcon>
            <i className='tabler-upload text-lg' />
          </ListItemIcon>
          <ListItemText>Import data</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => alert('Fungsi belum dibuat')}>
          <ListItemIcon>
            <i className='tabler-template text-lg' />
          </ListItemIcon>
          <ListItemText>Template center</ListItemText>
        </MenuItem>
      </Menu>

      {/* Per-workspace actions menu */}
      <Menu
        anchorEl={workspaceAnchorEl}
        open={Boolean(workspaceAnchorEl)}
        onClose={closeWorkspaceMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (selectedWorkspace) {
              window.location.href = `/project-management/workspace/${selectedWorkspace.workspaceId}`
            }

            closeWorkspaceMenu()
          }}
        >
          <ListItemIcon>
            <i className='tabler-external-link text-lg' />
          </ListItemIcon>
          <ListItemText>Open workspace</ListItemText>
        </MenuItem>
        <Divider className='!my-2' />
        <MenuItem
          onClick={() => {
            if (selectedWorkspace) {
              openModal('CREATE_BOARD', { workspaceId: selectedWorkspace.workspaceId })
            }

            closeWorkspaceMenu()
          }}
        >
          <ListItemIcon>
            <i className='tabler-layout-board text-lg' />
          </ListItemIcon>
          <ListItemText>Add board</ListItemText>
        </MenuItem>
      </Menu>

      {/* Per-board actions menu */}
      <Menu
        anchorEl={boardAnchorEl}
        open={isBoardMenuOpen}
        onClose={closeBoardMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleOpenBoard}>
          <ListItemIcon>
            <i className='tabler-external-link text-lg' />
          </ListItemIcon>
          <ListItemText>Open in new tab</ListItemText>
        </MenuItem>
        <Divider className='!my-2' />
        <MenuItem onClick={handleRenameBoard}>
          <ListItemIcon>
            <i className='tabler-pencil text-lg' />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFavoriteBoard}>
          <ListItemIcon>
            <i className='tabler-star text-lg' />
          </ListItemIcon>
          <ListItemText>Add to favorites</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateBoard}>
          <ListItemIcon>
            <i className='tabler-copy text-lg' />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <Divider className='!my-2' />
        <MenuItem onClick={handleDeleteBoard} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <i className='tabler-trash text-lg' />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  )
}

export default Navigation
