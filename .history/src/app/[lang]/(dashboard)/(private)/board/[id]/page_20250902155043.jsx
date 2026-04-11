// src/app/[lang]/(dashboard)/(private)/board/[id]/page.jsx

import BoardContainer from '@/components/board/BoardContainer'

const BoardPage = ({ params }) => {
  const boardId = params.id

  return <BoardContainer boardId={boardId} />
}

export default BoardPage
