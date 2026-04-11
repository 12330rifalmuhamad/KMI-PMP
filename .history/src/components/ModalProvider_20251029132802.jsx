'use client'

import { useRouter } from 'next/navigation'

import { useSWRConfig } from 'swr'

import { useModalStore } from '@/store/useModalStore'
import CreateModal from '@/components/CreateModal'
import ItemUpdatesModal from '@/components/ItemUpdatesModal'

const ModalProvider = () => {
  const { modalType, modalProps, closeModal } = useModalStore()
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const workspaceId = 1

  // Log untuk memastikan komponen ini dirender dan mengetahui state saat ini
  console.log(`[MODAL PROVIDER] Sedang aktif. Tipe modal saat ini: ${modalType}`)

  const handleCreate = async (name, type) => {
    const response = await fetch(`/api/workspaces/${workspaceId}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardName: name })
    })

    if (!response.ok) {
      console.error('Failed to create board', response.status)

      return
    }

    const newBoard = await response.json().catch(() => null)

    if (!newBoard) return

    mutate(`/api/workspaces/${workspaceId}/boards`)
    router.push(`/board/${newBoard.boardId}`)
  }

  if (!modalType) {
    return null
  }

  switch (modalType) {
    case 'CREATE_BOARD':
      return (
        <CreateModal
          show={true}
          onClose={closeModal}
          title='Create New Board'
          label='Board Name...'
          onSubmit={name => handleCreate(name, 'Board')}
        />
      )
    case 'CREATE_PROJECT':
      return (
        <CreateModal
          show={true}
          onClose={closeModal}
          title='Create New Project'
          label='Project Name...'
          onSubmit={name => handleCreate(name, 'Project')}
        />
      )

    case 'ITEM_UPDATES':
      return (
        <ItemUpdatesModal
          open={true}
          onClose={closeModal}
          task={modalProps?.task}
          boardId={modalProps?.boardId}
        />
      )

    // ... case lainnya
    default:
      return null
  }
}

export default ModalProvider
