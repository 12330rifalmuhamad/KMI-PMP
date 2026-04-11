'use client'

import { useState, useEffect, useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useSWR, { useSWRConfig } from 'swr'

// MUI Imports untuk styling yang konsisten dengan Vuexy
import { useTheme } from '@mui/material/styles'

const fetcher = url => fetch(url).then(res => res.json())

// --- SIMPLE MODAL COMPONENT (Updated for Theme) ---
const SimpleModal = ({ isOpen, onClose, title, children }) => {
  const theme = useTheme() // Akses tema saat ini

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

// --- NAV ITEM COMPONENT (Updated for Theme) ---
const NavItem = ({ href, icon, text, active = false, isBoard = false, isCollapsed }) => {
  const theme = useTheme()

  // Style dinamis berdasarkan state active dan tema
  const itemStyle = {
    color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
    backgroundColor: active ? theme.palette.primary.main : 'transparent',
    '&:hover': {
      backgroundColor: active ? theme.palette.primary.dark : theme.palette.action.hover
    }
  }

  return (
    <li>
      <Link href={href} title={isCollapsed ? text : ''}>
        <div
          className={`flex items-center p-2 text-sm rounded-md transition-all duration-300 relative group
          ${isCollapsed ? 'justify-center px-0' : isBoard ? 'pl-8' : 'px-2'}
          `}
          style={itemStyle}
        >
          <div className={`${isCollapsed ? 'text-xl' : 'text-lg'} transition-all flex-shrink-0`}>{icon}</div>

          <div
            className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}
          >
            <span className='truncate whitespace-nowrap'>{text}</span>
          </div>

          {/* Hover effect manual jika tidak aktif */}
          {!active && (
            <div className='absolute inset-0 rounded-md bg-current opacity-0 hover:opacity-[0.08] transition-opacity pointer-events-none' />
          )}
        </div>
      </Link>
    </li>
  )
}

export default function Sidebar() {
  const { mutate } = useSWRConfig()
  const theme = useTheme() // Gunakan hook tema
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isWorkspacesSectionOpen, setIsWorkspacesSectionOpen] = useState(true)
  const [openWorkspaces, setOpenWorkspaces] = useState({})

  // Modal States
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [targetWorkspaceId, setTargetWorkspaceId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pathname = usePathname()

  // Fetch data
  const { data: workspaces } = useSWR('/api/workspaces', fetcher)
  const { data: boards, error } = useSWR('/api/boards', fetcher)

  // Group boards
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

  // Auto-expand logic
  useEffect(() => {
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

  const toggleWorkspace = workspaceId => {
    if (isCollapsed) setIsCollapsed(false)
    setOpenWorkspaces(prev => ({
      ...prev,
      [workspaceId]: !prev[workspaceId]
    }))
  }

  // --- ACTIONS ---

  const openCreateWorkspaceModal = () => {
    setNewTitle('')
    setIsWorkspaceModalOpen(true)
  }

  const openCreateBoardModal = (e, workspaceId) => {
    e.stopPropagation()
    setTargetWorkspaceId(workspaceId)
    setNewTitle('')
    setIsBoardModalOpen(true)
  }

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
      console.error('Failed to create workspace', error)
      alert('Gagal membuat workspace')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateBoard = async () => {
    if (!newTitle.trim() || !targetWorkspaceId) return
    setIsSubmitting(true)

    try {
      await fetch(`/api/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardName: newTitle,
          workspaceId: targetWorkspaceId
        })
      })
      mutate('/api/boards')
      setOpenWorkspaces(prev => ({ ...prev, [targetWorkspaceId]: true }))
      setIsBoardModalOpen(false)
    } catch (error) {
      console.error('Failed to create board', error)
      alert('Gagal membuat project/board')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <aside
        className={`h-flex flex flex-col border-r transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}
        style={{
          backgroundColor: theme.palette.background.paper, // Warna background dinamis
          borderColor: theme.palette.divider, // Warna border dinamis
          color: theme.palette.text.primary // Warna teks dinamis
        }}
      >
        {/* --- TOMBOL TOGGLE --- */}
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

        {/* --- NAVIGASI ATAS --- */}
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

        {/* --- BAGIAN WORKSPACES --- */}
        <div className='py-4 overflow-y-auto custom-scrollbar flex-1 px-2'>
          {/* Header Workspaces */}
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
                style={{
                  color: theme.palette.text.secondary
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.palette.action.hover)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                title='Add New Workspace'
              >
                <i className='tabler-plus' />
              </button>
            )}
          </div>

          {/* List Workspaces */}
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
                      {/* Workspace Title / Icon */}
                      <div
                        className='group flex items-center justify-between pr-1 rounded transition-colors'
                        style={{
                          ':hover': { backgroundColor: theme.palette.action.hover }
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.palette.action.hover)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <button
                          onClick={() => toggleWorkspace(workspace.workspaceId)}
                          className={`flex items-center flex-1 py-1 ${isCollapsed ? 'justify-center' : 'text-left px-1'}`}
                          title={isCollapsed ? workspace.workspaceName : ''}
                        >
                          {!isCollapsed && (
                            <i
                              className={`tabler-chevron-right text-xs transition-transform duration-200 mr-1 ${isWorkspaceOpen ? 'rotate-90' : ''}`}
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
                          <button
                            onClick={e => openCreateBoardModal(e, workspace.workspaceId)}
                            className='p-1 transition-colors flex-shrink-0'
                            style={{ color: theme.palette.text.secondary }}
                            title='Add Project / Board'
                          >
                            <i className='tabler-plus text-xs' />
                          </button>
                        )}
                      </div>

                      {/* Boards List */}
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

      {/* --- MODAL ADD WORKSPACE --- */}
      <SimpleModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        title='Create New Workspace'
      >
        <div className='flex flex-col gap-4'>
          <input
            autoFocus
            type='text'
            placeholder='Workspace Name (e.g., Marketing, Engineering)'
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
            style={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </SimpleModal>

      {/* --- MODAL ADD BOARD --- */}
      <SimpleModal isOpen={isBoardModalOpen} onClose={() => setIsBoardModalOpen(false)} title='Create New Project'>
        <div className='flex flex-col gap-4'>
          <input
            autoFocus
            type='text'
            placeholder='Project Name (e.g., Q4 Roadmap)'
            className='w-full p-2 border rounded focus:outline-none focus:ring-2'
            style={{
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              outlineColor: theme.palette.primary.main
            }}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateBoard()}
          />
          <button
            onClick={handleCreateBoard}
            disabled={isSubmitting}
            className='py-2 rounded disabled:opacity-50'
            style={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </SimpleModal>
    </>
  )
}
