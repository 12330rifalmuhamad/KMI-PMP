// src/app/[lang]/(dashboard)/(private)/board/[id]/page.jsx

import BoardContainer from '@/components/board/BoardContainer'

const BoardPage = ({ params }) => {
  // 'params.id' adalah ID board yang diambil dari URL, misal: /board/1
  const boardId = params.id

  return (
    // Kita serahkan semua logika ke BoardContainer
    <BoardContainer boardId={boardId} />
  )
}

export default BoardPage
