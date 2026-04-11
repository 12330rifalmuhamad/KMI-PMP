'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useSWRConfig } from 'swr'
import { Modal, Card, CardContent, Typography, TextField, Button } from '@mui/material'

export default function CreateBoardModal({ workspaceId, show, onClose }) {
  const [boardName, setBoardName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!boardName.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardName: boardName })
      })

      const newBoard = await response.json()

      // Mutate daftar board di sidebar & homepage
      mutate(`/api/workspaces/${workspaceId}/boards`)
      onClose() // Menutup modal
      router.push(`/board/${newBoard.boardId}`) // Langsung navigasi ke board baru
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
      setBoardName('')
    }
  }

  if (!show) return null

  return (
    <Modal open={show} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-backgroundPaper p-4'>
        <CardContent component='form' onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <Typography variant='h6'>Create New Board</Typography>
          <TextField
            label='Enter board name...'
            value={boardName}
            onChange={e => setBoardName(e.target.value)}
            autoFocus
          />
          <div className='flex justify-end space-x-3 mt-4'>
            <Button type='button' variant='outlined' color='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' variant='contained' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Board'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}
