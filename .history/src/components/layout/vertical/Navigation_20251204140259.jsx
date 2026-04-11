'use client'

import { useState, useEffect, useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useSWR from 'swr'

const fetcher = url => fetch(url).then(res => res.json())

// Komponen NavItem yang beradaptasi dengan state collapsed
const NavItem = ({ href, icon, text, active = false, isBoard = false, isCollapsed }) => (
  <li>
    <Link href={href} title={isCollapsed ? text : ''}>
      <div
        className={`flex items-center p-2 text-sm rounded-md transition-all duration-300
        ${active ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
        ${isCollapsed ? 'justify-center px-0' : isBoard ? 'pl-8' : 'px-2'}
        `}
      >
        {/* Ukuran icon sedikit membesar saat collapsed agar lebih jelas */}
        <div className={`${isCollapsed ? 'text-xl' : 'text-lg'} transition-all`}>{icon}</div>

        {/* Teks hanya muncul jika TIDAK collapsed */}
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isWorkspacesSectionOpen, setIsWorkspacesSectionOpen] = useState(true)
  const [openWorkspaces, setOpenWorkspaces] = useState({})
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
    // Jika sedang collapsed dan user klik workspace, buka sidebar agar tree terlihat jelas
    if (isCollapsed) setIsCollapsed(false)

    setOpenWorkspaces(prev => ({
      ...prev,
      [workspaceId]: !prev[workspaceId]
    }))
  }

  return (
    <aside
      className={`h-flex bg-gray-800 text-white flex flex-col border-r border-gray-700 transition-all duration-300 ease-in-out relative
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
          />
          <NavItem href='#' icon={<i className='tabler-calendar-check' />} text='My work' isCollapsed={isCollapsed} />
        </ul>
      </nav>

      <hr className='border-gray-700 mx-2' />

      {/* --- BAGIAN WORKSPACES --- */}
      <div className='py-4 overflow-y-auto custom-scrollbar flex-1 px-2'>
        {/* Header Workspaces */}
        <div className={`flex items-center mb-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <button
            onClick={() => {
              if (isCollapsed) setIsCollapsed(false)
              setIsWorkspacesSectionOpen(!isWorkspacesSectionOpen)
            }}
            className={`flex items-center text-gray-300 hover:text-white ${isCollapsed ? 'justify-center w-full' : 'w-full'}`}
            title='Workspaces'
          >
            {isCollapsed ? (
              <i className='tabler-briefcase text-xl' />
            ) : (
              <>
                <i
                  className={`tabler-chevron-down transition-transform duration-200 ${
                    isWorkspacesSectionOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
                <span className='ml-2 font-semibold'>Workspaces</span>
              </>
            )}
          </button>
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
                    <div className='group flex items-center justify-between'>
                      <button
                        onClick={() => toggleWorkspace(workspace.workspaceId)}
                        className={`flex items-center flex-1 py-1 hover:bg-gray-700/50 rounded
                        ${isCollapsed ? 'justify-center' : 'text-left px-1'}`}
                        title={isCollapsed ? workspace.workspaceName : ''}
                      >
                        {/* Panah Accordion (Hilang saat collapsed) */}
                        {!isCollapsed && (
                          <i
                            className={`tabler-chevron-right text-gray-400 text-xs transition-transform duration-200 mr-1 ${
                              isWorkspaceOpen ? 'rotate-90' : ''
                            }`}
                          />
                        )}

                        {/* Ikon Folder */}
                        <i className={`tabler-folder text-blue-400 ${isCollapsed ? 'text-xl' : 'text-base'}`} />

                        {/* Nama Workspace (Hilang saat collapsed) */}
                        <span
                          className={`ml-2 text-sm font-medium text-gray-300 truncate w-32 ${isCollapsed ? 'hidden' : 'block'}`}
                        >
                          {workspace.workspaceName}
                        </span>
                      </button>
                    </div>

                    {/* Boards List (Hanya tampil jika expanded dan Sidebar TIDAK collapsed agar rapi) */}
                    {isWorkspaceOpen && (
                      <ul className='space-y-1'>
                        {/* LOGIC: Jika sidebar collapsed, kita sembunyikan list board anaknya
                           supaya tidak menumpuk ikon berantakan. User harus expand sidebar
                           untuk melihat isi detail workspace.
                        */}
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
  )
}
