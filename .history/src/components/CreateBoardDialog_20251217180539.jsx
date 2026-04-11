'use client'

import { useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import useSWR from 'swr'

const fetcher = url => fetch(url).then(res => res.json())

export default function CreateBoardDialog({ open, onClose, workspaceId, onBoardCreated }) {
  const [boardTitle, setBoardTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch daftar template
  const { data: templates, isLoading } = useSWR(open ? '/api/templates' : null, fetcher)

  const handleSubmit = async () => {
    if (!boardTitle.trim()) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // --- PERBAIKAN DI SINI ---
          boardName: boardTitle, // Ganti 'title' menjadi 'boardName' sesuai Backend
          // -------------------------
          workspaceId: workspaceId,
          templateId: selectedTemplate || null
        })
      })

      if (!res.ok) {
        const errorData = await res.json()

        throw new Error(errorData.message || 'Failed')
      }

      const newBoard = await res.json()

      if (onBoardCreated) onBoardCreated(newBoard)

      handleClose()
    } catch (error) {
      console.error(error)
      alert(`Gagal membuat board: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setBoardTitle('')
    setSelectedTemplate('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogTitle>Create New Board</DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-4 mt-2'>
          <TextField
            autoFocus
            label='Board Name'
            fullWidth
            size='small'
            value={boardTitle}
            onChange={e => setBoardTitle(e.target.value)}
          />

          <FormControl fullWidth size='small'>
            <InputLabel>Select Template (Optional)</InputLabel>
            <Select
              value={selectedTemplate}
              label='Select Template (Optional)'
              onChange={e => setSelectedTemplate(e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value=''>
                <em>None (Start from scratch)</em>
              </MenuItem>
              {templates?.map(tpl => (
                <MenuItem key={tpl.templateId} value={tpl.templateId}>
                  {tpl.templateName}
                </MenuItem>
              ))}
            </Select>
            {isLoading && <p className='text-xs text-gray-400 mt-1'>Loading templates...</p>}
          </FormControl>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='inherit'>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={!boardTitle || isSubmitting}>
          {isSubmitting ? <CircularProgress size={20} /> : 'Create Board'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
