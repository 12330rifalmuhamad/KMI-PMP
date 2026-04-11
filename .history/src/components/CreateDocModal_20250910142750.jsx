'use client'

import { useState } from 'react'

import { Modal, Card, CardContent, Typography, TextField, Button } from '@mui/material'

export default function CreateDocModal({ show, onClose }) {
  const [docName, setDocName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)
    console.log(`Mencoba membuat dokumen baru bernama: ${docName}`)

    // TODO: Ganti console.log ini dengan panggilan API ke backend Anda
    // await fetch('/api/docs', { method: 'POST', body: JSON.stringify({ name: docName }) });
    setIsLoading(false)
    onClose()
  }

  if (!show) return null

  return (
    <Modal open={show} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-backgroundPaper p-4'>
        <CardContent component='form' onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <Typography variant='h6'>Create New Doc</Typography>
          <TextField
            label='Enter document name...'
            value={docName}
            onChange={e => setDocName(e.target.value)}
            autoFocus
          />
          <div className='flex justify-end space-x-3 mt-4'>
            <Button type='button' variant='outlined' color='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' variant='contained' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Doc'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}
