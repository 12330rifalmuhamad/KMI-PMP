'use client'

import BoardView from '@/views/project-management/BoardView'

export default function BoardPage({ params }) {
  const { boardId } = params
  
  return <BoardView boardId={boardId} />
}
