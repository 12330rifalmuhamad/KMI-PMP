'use client'

import { useState, useEffect, useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useSWR from 'swr'

const fetcher = url => fetch(url).then(res => res.json())

// NavItem kembali ke bentuk sederhana karena konten akan di-hide total
const NavItem = ({ href, icon, text, active = false, isBoard = false }) => (
  <li>
    <Link href={href} title={text}>
      <div
        className={`flex items-center p-2 text-sm rounded-md transition-colors duration-150
        ${isBoard ? 'pl-8' : ''}
        ${active ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
      >
        <span className='text-lg'>{icon}</span>
        <span className='ml-3 truncate whitespace-nowrap'>{text}</span>
      </div>
    </Link>
  </li>
)

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isWorkspacesSectionOpen, setIsWorkspacesSectionOpen] = useState(true)
  const [openWorkspaces, setOpenWorkspaces] = useState({})
  const pathname = usePathname()

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

        if (workspaceId) {
          setOpenWorkspaces(prev => ({ ...prev, [workspaceId]: true }))
        }
      }
    }
  }, [boards, pathname])

  const toggleWorkspace = workspaceId => {
    setOpenWorkspaces(prev => ({
      ...prev,
      [workspaceId]: !prev[workspaceId]
    }))
  }

  return (
    <aside
      className={`h-screen bg-gray-800 text-white flex flex-col relative transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-0 border-none' : 'w-64 border-r border-gray-700'}`}
    >
      {/* TOMBOL TOGGLE
        - Saat Buka: right-[-12px] (menempel di border)
        - Saat Tutup: right-[-40px] (mengambang di luar sidebar yang lebarnya 0)
      */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute top-6 z-50 flex items-center justify-center w-8 h-8 rounded-full shadow-md border focus:outline-none transition-all duration-300
        ${
          isCollapsed
            ? '-right-12 bg-gray-800 border-gray-600 text-white hover:bg-gray-700' // Gaya saat tertutup (floating icon)
            : '-right-4 bg-gray-700 border-gray-600 text-gray-300 hover:text-white' // Gaya saat terbuka (border button)
        }`}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        <i
          className={`tabler-chevron-left text-xs transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </button>

      {/* WRAPPER KONTEN
        Menggunakan w-64 fix di dalam agar layout tidak berantakan saat transisi width parent.
        Opacity & Visibility mengatur efek menghilang.
      */}
      <div
        className={`flex flex-col h-full w-64 overflow-hidden transition-all duration-200
        ${isCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
      >
        {/* Navigasi Atas */}
        <nav className='px-2 py-4'>
          <ul className='space-y-2'>
            <NavItem
              href='/dashboards/crm'
              icon={<i className='tabler-home' />}
              text='Home'
              active={pathname.includes('/dashboards/crm')}
            />
            <NavItem href='#' icon={<i className='tabler-calendar-check' />} text='My work' />
          </ul>
        </nav>

        <hr className='border-gray-700 mx-2' />

        {/* Bagian Workspaces */}
        <div className='px-2 py-4 overflow-y-auto custom-scrollbar flex-1'>
          <div className='flex justify-between items-center mb-2'>
            <button
              onClick={() => setIsWorkspacesSectionOpen(!isWorkspacesSectionOpen)}
              className='flex items-center w-full text-gray-300 hover:text-white'
            >
              <i
                className={`tabler-chevron-down transition-transform duration-200 ${
                  isWorkspacesSectionOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
              <span className='ml-2 font-semibold'>Workspaces</span>
            </button>
          </div>

          {isWorkspacesSectionOpen && (
            <div className='flex flex-col space-y-2 mt-2'>
              {!workspaces && !error && <div className='text-gray-400 px-2 text-xs'>Loading...</div>}

              {Array.isArray(workspaces) &&
                workspaces.map(workspace => {
                  const workspaceBoards = boardsByWorkspace[workspace.workspaceId] || []
                  const isWorkspaceOpen = openWorkspaces[workspace.workspaceId] ?? true

                  return (
                    <div key={workspace.workspaceId} className='space-y-1'>
                      <div className='group flex items-center justify-between'>
                        <button
                          onClick={() => toggleWorkspace(workspace.workspaceId)}
                          className='flex items-center flex-1 text-left py-1 hover:bg-gray-700/50 rounded px-1'
                        >
                          <i
                            className={`tabler-chevron-right text-gray-400 text-xs transition-transform duration-200 ${
                              isWorkspaceOpen ? 'rotate-90' : ''
                            }`}
                          />
                          <i className='tabler-folder text-base text-blue-400 ml-1' />
                          <span className='ml-2 text-sm font-medium text-gray-300 truncate w-32'>
                            {workspace.workspaceName}
                          </span>
                        </button>
                      </div>

                      {isWorkspaceOpen && (
                        <ul className='ml-6 space-y-1'>
                          {workspaceBoards.map(board => (
                            <NavItem
                              key={board.boardId}
                              href={`/board/${board.boardId}`}
                              icon={<i className='tabler-table' />}
                              text={board.boardName}
                              active={pathname === `/board/${board.boardId}`}
                              isBoard={true}
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
      </div>
    </aside>
  )
}
