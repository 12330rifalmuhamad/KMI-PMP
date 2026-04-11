'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'

import { useSWRConfig } from 'swr'

import { useModalStore } from '@/store/useModalStore'
import CreateModal from '@/components/CreateModal'
import CreateBoardModal from '@/components/dialogs/CreateBoardModal'
import CreateWorkspaceModal from '@/components/dialogs/CreateWorkspaceModal'
import ItemUpdatesModal from '@/components/ItemUpdatesModal'
import BoardMembersModal from '@/components/board/BoardMembersModal'

const fetcher = url => fetch(url).then(res => res.json())

const ModalProvider = () => {
  const { modalType, modalProps, closeModal } = useModalStore()
  const router = useRouter()
  const { mutate } = useSWRConfig()
  
  // Fetch user's workspaces to get a valid workspaceId
  const { data: workspaces } = useSWR('/api/workspaces', fetcher)
  
  // Get first workspace ID if available, or use from modalProps
  const workspaceId = modalProps?.workspaceId || (workspaces && workspaces.length > 0 ? workspaces[0].workspaceId : null)

  // Log untuk memastikan komponen ini dirender dan mengetahui state saat ini
  console.log(`[MODAL PROVIDER] Sedang aktif. Tipe modal saat ini: ${modalType}`)

  const handleCreate = async (name, type) => {
    if (!workspaceId) {
      console.error('No workspace available. Please create a workspace first.')
      alert('No workspace available. Please create a workspace first.')
      return
    }

    const response = await fetch(`/api/workspaces/${workspaceId}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardName: name })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('Failed to create board', response.status, errorData.message)
      alert(`Failed to create board: ${errorData.message || 'Access denied. Please ensure you have access to this workspace.'}`)
      return
    }

    const newBoard = await response.json().catch(() => null)

    if (!newBoard) return

    // Refresh boards di sidebar setelah create board
    mutate('/api/boards')
    mutate(`/api/workspaces/${workspaceId}/boards`)
    router.push(`/board/${newBoard.boardId}`)
  }

  const handleBoardCreated = (board) => {
    // Refresh boards after creation
    mutate('/api/boards')
    if (board.workspaceId) {
      mutate(`/api/workspaces/${board.workspaceId}/boards`)
    }
    router.push(`/board/${board.boardId}`)
  }

  if (!modalType) {
    return null
  }

  switch (modalType) {
    case 'CREATE_WORKSPACE':
      return (
        <CreateWorkspaceModal
          onSuccess={() => {
            mutate('/api/workspaces')
            closeModal()
          }}
        />
      )
    case 'CREATE_BOARD':
    case 'CREATE_PROJECT':
      // Both CREATE_BOARD and CREATE_PROJECT use the same modal
      // which allows user to select workspace
      return (
        <CreateBoardModal
          onSuccess={handleBoardCreated}
        />
      )

    case 'ITEM_UPDATES':
      return <ItemUpdatesModal open={true} onClose={closeModal} task={modalProps?.task} boardId={modalProps?.boardId} />

    case 'BOARD_MEMBERS':
      return <BoardMembersModal open={true} onClose={closeModal} boardId={modalProps?.boardId} />

    // ... case lainnya
    default:
      return null
  }
}

export default ModalProvider
