'use client'

import { useState, useEffect, useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useSWR, { useSWRConfig } from 'swr'

const fetcher = url => fetch(url).then(res => res.json())

// --- SIMPLE MODAL COMPONENT ---
const SimpleModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='bg-white text-gray-900 rounded-lg shadow-xl w-96 p-6 animate-in fade-in zoom-in duration-200'>
        <h3 className='text-lg font-bold mb-4'>{title}</h3>
        {children}
        <div className='flex justify-end gap-2 mt-4'>
          <button onClick={onClose} className='px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded'>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// --- NAV ITEM COMPONENT ---
const NavItem = ({ href, icon, text, active = false, isBoard = false, isCollapsed }) => (
  <li>
    <Link href={href} title={isCollapsed ? text : ''}>
      <div
        className={`flex items-center p-2 text-sm rounded-md transition-all duration-300 relative group
        ${active ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
        ${isCollapsed ? 'justify-center px-0' : isBoard ? 'pl-8' : 'px-2'}
        `}
      >
        <div className={`${isCollapsed ? 'text-xl' : 'text-lg'} transition-all flex-shrink-0`}>{icon}</div>

        <div
          className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}
        >
          <span className='truncate whitespace-nowrap'>{text}</span>
        </div>
      </div>
    </Link>
  </li>
)

export default function Sidebar() {
  const { mutate } = useSWRConfig()
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
    e.stopPropagation() // Mencegah toggle accordion saat klik tombol tambah
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
      // PERBAIKAN: Menggunakan endpoint nested resources yang sesuai dengan struktur file API
      // Sebelumnya: /api/boards (Salah) -> Sekarang: /api/workspaces/[id]/boards (Benar)
      await fetch(`/api/workspaces/${targetWorkspaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardName: newTitle

          // workspaceId sudah ada di URL params, tidak perlu di body lagi jika backend membacanya dari params
        })
      })

      // Refresh boards data
      mutate('/api/boards') // Refresh global list (jika dipakai)

      // Expand workspace related to new board
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
        className={`h-screen bg-gray-800 text-white flex flex-col border-r border-gray-700 transition-all duration-300 ease-in-out relative
        ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* --- TOMBOL TOGGLE --- */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='absolute -right-3 top-6 bg-gray-700 border border-gray-600 rounded-full p-1 text-gray-300 hover:text-white shadow-md z-50 focus:outline-none'
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
            />import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Patch BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// Helper: Cek akses workspace dan status aktif
async function checkWorkspaceAccess(workspaceId, userId) {
  if (!workspaceId || !userId) return null

  const member = await prisma.trWorkspaceMember.findFirst({
    where: {
      workspaceId: parseInt(workspaceId),
      userId: parseInt(userId),
      bitActive: 1, // Pastikan member aktif
      workspace: {
        bitActive: 1 // Pastikan workspace juga aktif
      }
    },
    include: {
      workspace: true // Sertakan data workspace untuk pengecekan
    }
  })
  return member
}

// GET: Ambil detail workspace
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    // Cek akses member
    const member = await checkWorkspaceAccess(workspaceId, userId)
    if (!member) {
      return NextResponse.json({ message: 'Workspace not found or access denied' }, { status: 404 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        workspaceId: parseInt(workspaceId),
        bitActive: 1 // Hanya ambil workspace aktif
      },
      include: {
        workspaceMember: {
          where: { bitActive: 1 }, // Hanya ambil member aktif
          include: {
            mUser: {
              select: { userId: true, userName: true, email: true }
            }
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

// PUT: Update workspace (Rename)
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    const member = await checkWorkspaceAccess(workspaceId, userId)

    // Hanya Owner atau Admin yang boleh rename (sesuaikan dengan role Anda)
    if (!member || (member.role !== 'Owner' && member.role !== 'Admin')) {
      return NextResponse.json({ message: 'Access denied. Only Owner/Admin can update workspace.' }, { status: 403 })
    }

    const body = await request.json()
    const { workspaceName } = body

    if (!workspaceName) {
      return NextResponse.json({ message: 'Workspace name is required' }, { status: 400 })
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { workspaceId: parseInt(workspaceId) },
      data: {
        workspaceName: workspaceName,
        txtUpdatedBy: session.user.name,
        dtmUpdated: new Date()
      }
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

// DELETE: Soft Delete Workspace
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    const member = await checkWorkspaceAccess(workspaceId, userId)

    // Strict Check: Hanya Owner yang boleh menghapus workspace
    if (!member || member.role !== 'Owner') {
      return NextResponse.json({ message: 'Access denied. Only owners can delete workspaces.' }, { status: 403 })
    }

    // Lakukan Soft Delete (set bitActive = 0)
    // Ini lebih aman daripada delete permanen untuk integritas data historis
    await prisma.workspace.update({
      where: { workspaceId: parseInt(workspaceId) },
      data: {
        bitActive: 0,
        txtUpdatedBy: session.user.name,
        dtmUpdated: new Date()
      }
    })

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
            <NavItem href='#' icon={<i className='tabler-calendar-check' />} text='My work' isCollapsed={isCollapsed} />
          </ul>
        </nav>

        <hr className='border-gray-700 mx-2' />

        {/* --- BAGIAN WORKSPACES --- */}
        <div className='py-4 overflow-y-auto custom-scrollbar flex-1 px-2'>
          {/* Header Workspaces */}
          <div className={`flex items-center mb-2 group ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <button
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false)
                setIsWorkspacesSectionOpen(!isWorkspacesSectionOpen)
              }}
              className={`flex items-center text-gray-300 hover:text-white ${isCollapsed ? 'justify-center w-full' : 'flex-1'}`}
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

            {/* Tombol Add Workspace */}
            {!isCollapsed && (
              <button
                onClick={openCreateWorkspaceModal}
                className='text-gray-300 hover:text-white hover:bg-gray-700 p-1 rounded transition-colors flex-shrink-0'
                title='Add New Workspace'
              >
                <i className='tabler-plus' />
              </button>
            )}
          </div>

          {/* List Workspaces */}
          {isWorkspacesSectionOpen && (
            <div className='flex flex-col space-y-2 mt-2'>
              {!workspaces && !error && !isCollapsed && <div className='text-gray-400 px-2 text-xs'>Loading...</div>}

              {Array.isArray(workspaces) &&
                workspaces.map(workspace => {
                  const workspaceBoards = boardsByWorkspace[workspace.workspaceId] || []
                  const isWorkspaceOpen = openWorkspaces[workspace.workspaceId] ?? true

                  return (
                    <div key={workspace.workspaceId} className='space-y-1'>
                      {/* Workspace Title / Icon */}
                      <div className='group flex items-center justify-between pr-1 hover:bg-gray-700/50 rounded'>
                        <button
                          onClick={() => toggleWorkspace(workspace.workspaceId)}
                          className={`flex items-center flex-1 py-1
                          ${isCollapsed ? 'justify-center' : 'text-left px-1'}`}
                          title={isCollapsed ? workspace.workspaceName : ''}
                        >
                          {!isCollapsed && (
                            <i
                              className={`tabler-chevron-right text-gray-400 text-xs transition-transform duration-200 mr-1 ${isWorkspaceOpen ? 'rotate-90' : ''}`}
                            />
                          )}
                          <i className={`tabler-folder text-blue-400 ${isCollapsed ? 'text-xl' : 'text-base'}`} />
                          <span
                            className={`ml-2 text-sm font-medium text-gray-300 truncate w-28 ${isCollapsed ? 'hidden' : 'block'}`}
                          >
                            {workspace.workspaceName}
                          </span>
                        </button>

                        {/* Tombol Add Board */}
                        {!isCollapsed && (
                          <button
                            onClick={e => openCreateBoardModal(e, workspace.workspaceId)}
                            className='text-gray-500 hover:text-white p-1 transition-colors flex-shrink-0'
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
            className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
          />
          <button
            onClick={handleCreateWorkspace}
            disabled={isSubmitting}
            className='bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50'
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
            className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateBoard()}
          />
          <button
            onClick={handleCreateBoard}
            disabled={isSubmitting}
            className='bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50'
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </SimpleModal>
    </>
  )
}
/* No additional code is needed at the placeholder. The component is already complete and functional. */
