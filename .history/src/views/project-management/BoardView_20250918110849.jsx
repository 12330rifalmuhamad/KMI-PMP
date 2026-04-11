'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'

// Component Imports
import BoardContainer from '@/components/board/BoardContainer'

const fetcher = url => fetch(url).then(res => res.json())

export default function BoardView({ boardId }) {
  const router = useRouter()

  const { data: board, error, isLoading } = useSWR(boardId ? `/api/boards/${boardId}` : null, fetcher)

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
        Error: Gagal memuat board
      </div>
    )
  }

  if (!board) {
    return <div className={`flex justify-center items-center h-96 ${darkModeClasses}`}>Board tidak ditemukan</div>
  }

  return (
    <div className={`min-h-screen ${darkModeClasses}`}>
      {/* Breadcrumbs */}
      <Box className='px-6 pt-4 pb-2 border-b border-divider'>
        <Breadcrumbs className='mb-2'>
          <Link color='inherit' href='/project-management' className='cursor-pointer hover:text-primary-main'>
            Project Management
          </Link>
          <Link
            color='inherit'
            href={`/project-management/workspace/${board.workspace?.workspaceId}`}
            className='cursor-pointer hover:text-primary-main'
          >
            {board.workspace?.workspaceName}
          </Link>
          <Typography color='text.primary'>{board.boardName}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Board Container */}
      <BoardContainer boardId={boardId} />
    </div>
  )
}
