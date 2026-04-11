'use client'

import { useState, useEffect, useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useSWR from 'swr'

const fetcher = url => fetch(url).then(res => res.json())

// Komponen kecil untuk setiap item navigasi agar kode lebih bersih
const NavItem = ({ href, icon, text, active = false, isBoard = false }) => (
  <li>
    <Link href={href}>
      <div
        className={`flex items-center p-2 text-sm rounded-md transition-colors duration-150 ${isBoard ? 'pl-8' : ''} ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
      >
        {icon}
        <span className='ml-3 truncate'>{text}</span>
      </div>
    </Link>
  </li>
)

export default function Sidebar() {
  const [isWorkspacesSectionOpen, setIsWorkspacesSectionOpen] = useState(true)
  const [openWorkspaces, setOpenWorkspaces] = useState({}) // Track which workspaces are expanded
  const pathname = usePathname()

  // Fetch workspaces and boards
  const { data: workspaces } = useSWR('/api/workspaces', fetcher)
  const { data: boards, error } = useSWR('/api/boards', fetcher)

  // Group boards by workspace
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

  // Auto-expand workspace if current board is in it
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
    // <aside className='w-64 h-screen bg-gray-800 text-white flex flex-col p-2 border-r border-gray-700'>
      {/* Navigasi Atas */}
      <nav className='px-2 py-4'>
        <ul className='space-y-2'>
          <NavItem
            href='/dashboards/crm' // Sesuaikan dengan path halaman utama Anda
            icon={<i className='tabler-home text-lg' />}
            text='Home'
            active={pathname.includes('/dashboards/crm')}
          />
          <NavItem href='#' icon={<i className='tabler-calendar-check text-lg' />} text='My work' />
        </ul>
      </nav>

      <hr className='border-gray-700 mx-2' />

      {/* Bagian Workspaces */}
      <div className='px-2 py-4'>
        <div className='flex justify-between items-center mb-2'>
          <button
            onClick={() => setIsWorkspacesSectionOpen(!isWorkspacesSectionOpen)}
            className='flex items-center w-full text-gray-300 hover:text-white'
          >
            <i
              className={`tabler-chevron-down transition-transform duration-200 ${isWorkspacesSectionOpen ? 'rotate-0' : '-rotate-90'}`}
            />
            <span className='ml-2 font-semibold'>Workspaces</span>
          </button>
        </div>

        {isWorkspacesSectionOpen && (
          <div className='flex flex-col space-y-2 mt-2'>
            {!workspaces && !error && <div className='text-gray-400 px-2 text-xs'>Loading workspaces...</div>}
            {error && <div className='text-red-500 px-2 text-xs'>Failed to load workspaces...</div>}

            {Array.isArray(workspaces) && workspaces.length === 0 && (
              <div className='text-gray-400 px-2 text-xs py-2'>No workspaces yet. Create one to get started!</div>
            )}

            {Array.isArray(workspaces) &&
              workspaces.map(workspace => {
                const workspaceBoards = boardsByWorkspace[workspace.workspaceId] || []
                const isWorkspaceOpen = openWorkspaces[workspace.workspaceId] ?? true

                return (
                  <div key={workspace.workspaceId} className='space-y-1'>
                    {/* Workspace Header */}
                    <div className='group flex items-center justify-between p-2 rounded-md hover:bg-gray-700 transition-colors'>
                      <button
                        onClick={() => toggleWorkspace(workspace.workspaceId)}
                        className='flex items-center flex-1 text-left'
                      >
                        <i
                          className={`tabler-chevron-right text-gray-400 transition-transform duration-200 ${
                            isWorkspaceOpen ? 'rotate-90' : ''
                          }`}
                        />
                        <i className='tabler-folder text-base text-blue-400 ml-1' />
                        <span className='ml-2 text-sm font-medium text-gray-300 truncate'>
                          {workspace.workspaceName}
                        </span>
                        <span className='ml-2 text-xs text-gray-500'>({workspaceBoards.length})</span>
                      </button>
                    </div>

                    {/* Boards under workspace */}
                    {isWorkspaceOpen && (
                      <ul className='ml-6 space-y-1'>
                        {workspaceBoards.length === 0 && (
                          <li className='text-gray-500 px-2 text-xs py-1'>No boards in this workspace</li>
                        )}
                        {workspaceBoards.map(board => (
                          <NavItem
                            key={board.boardId}
                            href={`/board/${board.boardId}`}
                            icon={<i className='tabler-table text-base' />}
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

      {/* Bagian Footer "Guest" */}
      <div className='mt-auto p-4 text-center'>
        <div className='bg-white rounded-full w-12 h-12 mx-auto flex items-center justify-center mb-3'>
          {/* Ganti dengan logo Monday jika ada */}
          <svg width='28' height='28' viewBox='0 0 125 125' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M62.5 125C97.0178 125 125 97.0178 125 62.5C125 27.9822 97.0178 0 62.5 0C27.9822 0 0 27.9822 0 62.5C0 97.0178 27.9822 125 62.5 125Z'
              fill='#5034FF'
            />
            <path
              d='M96.3533 58.7407C92.2067 58.7407 88.7533 62.1941 88.7533 66.3407V80.0941C88.7533 84.2407 85.3 87.6941 81.1533 87.6941C77.0067 87.6941 73.5533 84.2407 73.5533 80.0941V44.9059C73.5533 40.7593 70.1 37.3059 65.9533 37.3059C61.8067 37.3059 58.3533 40.7593 58.3533 44.9059V80.0941C58.3533 84.2407 54.9 87.6941 50.7533 87.6941C46.6067 87.6941 43.1533 84.2407 43.1533 80.0941V66.3407C43.1533 62.1941 39.7 58.7407 35.5533 58.7407C31.4067 58.7407 27.9533 62.1941 27.9533 66.3407V80.0941C27.9533 91.3807 36.8733 100.3 47.9533 100.3C59.0333 100.3 67.9533 91.3807 67.9533 80.0941V44.9059C67.9533 33.6193 76.8733 24.7059 87.9533 24.7059C99.0333 24.7059 107.953 33.6193 107.953 44.9059V66.3407C107.953 70.4874 104.5 73.9407 100.353 73.9407C96.2067 73.9407 92.7533 70.4874 92.7533 66.3407C92.7533 62.1941 92.7533 58.7407 96.3533 58.7407Z'
              fill='white'
            />
          </svg>
        </div>
        <p className='font-semibold text-sm'>Youre a Guest here</p>
        <p className='text-xs text-gray-400 mt-1'>Get monday.com s full power</p>
        <Link href='/register'>
          <span className='text-blue-400 hover:underline text-sm font-semibold mt-2 block'>Create your account</span>
        </Link>
      </div>
    </aside>
  )
}
