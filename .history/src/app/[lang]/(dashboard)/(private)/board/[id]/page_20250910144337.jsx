// Impor helper server di sini (ini aman karena ini adalah Server Component)
import { getMode } from '@core/utils/serverHelpers'

// Impor komponen KLIEN Anda
import BoardContainer from '@/components/board/BoardContainer'

const BoardPage = async ({ params }) => {
  const boardId = params.id

  // Panggil fungsi server-only di sini
  const mode = await getMode()

  return (
    // Teruskan hasilnya sebagai prop ke Client Component
    <BoardContainer boardId={boardId} mode={mode} />
  )
}

export default BoardPage
