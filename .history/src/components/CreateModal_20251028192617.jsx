'use client'

import { useState } from 'react'

import { Modal, Card, CardContent, Typography, TextField, Button } from '@mui/material'

export default function CreateModal({ show, onClose, title, label, onSubmit }) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)

    try {
      await onSubmit(name)
    } catch (error) {
      console.error(`Failed to create ${title}:`, error)
    } finally {
      setIsLoading(false)
      setName('')
      onClose()
    }
  }

  if (!show) return null

  return (
    <Modal open={show} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-backgroundPaper p-4'>
        <CardContent component='form' onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <Typography variant='h6'>{title}</Typography>
          <TextField label={label} value={name} onChange={e => setName(e.target.value)} autoFocus />
          <div className='flex justify-end space-x-3 mt-4'>
            <Button type='button' variant='outlined' color='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' variant='contained' disabled={isLoading}>
              {isLoading ? 'Creating...' : `Create`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}
