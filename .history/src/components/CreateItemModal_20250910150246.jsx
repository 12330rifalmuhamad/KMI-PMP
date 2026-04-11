'use client'

import { useState } from 'react'

import { useSWRConfig } from 'swr'
import { Modal, Card, CardContent, Typography, TextField, Button } from '@mui/material'

export default function CreateItemModal({ boardId, groupId, show, onClose }) {
  const [itemTitle, setItemTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { mutate } = useSWRConfig()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!itemTitle.trim()) return

    setIsLoading(true)

    try {
      // Panggil API untuk membuat task baru
      await fetch(`/api/groups/${groupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: itemTitle })
      })

      mutate(`/api/boards/${boardId}`) // Refresh data board
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
      setItemTitle('')
    }
  }

  if (!show) return null

  return (
    <Modal open={show} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-backgroundPaper p-4'>
        <CardContent component='form' onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <Typography variant='h6'>Create New Item</Typography>
          <TextField
            label='Enter item name...'
            value={itemTitle}
            onChange={e => setItemTitle(e.target.value)}
            autoFocus
          />
          <div className='flex justify-end space-x-3 mt-4'>
            <Button type='button' variant='outlined' color='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' variant='contained' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}
