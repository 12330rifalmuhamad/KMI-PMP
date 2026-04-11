'use client'
import { useState } from 'react'

import { useSWRConfig } from 'swr'
import { Modal, Card, CardContent, Typography, Button, Checkbox, FormControlLabel, FormGroup } from '@mui/material'

const ProgressColumnSettingsModal = ({ open, onClose, board, column }) => {
  const { mutate } = useSWRConfig()
  const [isLoading, setIsLoading] = useState(false)

  const statusColumns = board.columns.filter(c => c.columnType === 'STATUS' && c.columnId !== column.columnId)

  const [selectedIds, setSelectedIds] = useState(() => {
    const initialIds = (column.watchedStatusColumns || []).map(link => link.statusColumnId)

    return new Set(initialIds)
  })

  const handleToggle = columnId => {
    const newSelection = new Set(selectedIds)

    if (newSelection.has(columnId)) {
      newSelection.delete(columnId)
    } else {
      newSelection.add(columnId)
    }

    setSelectedIds(newSelection)
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/columns/${column.columnId}/progress-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusColumnIds: Array.from(selectedIds) })
      })

      if (!response.ok) throw new Error('Gagal menyimpan pengaturan')
      mutate(`/api/boards/${board.boardId}`)
      onClose()
    } catch (error) {
      console.error(error)
      alert('Gagal menyimpan pengaturan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-backgroundPaper p-4'>
        <CardContent className='flex flex-col gap-4'>
          <Typography variant='h6'>Progress column settings</Typography>
          <Typography variant='body2'>Choose which status columns will be shown in the progress bar</Typography>
          <FormGroup>
            {statusColumns.map(col => (
              <FormControlLabel
                key={col.columnId}
                control={
                  <Checkbox checked={selectedIds.has(col.columnId)} onChange={() => handleToggle(col.columnId)} />
                }
                label={col.columnName}
              />
            ))}
            {statusColumns.length === 0 && (
              <Typography variant='body2' color='text.secondary' className='italic'>
                Tidak ada kolom Status lain di papan ini.
              </Typography>
            )}
          </FormGroup>
          <Button variant='contained' onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </Modal>
  )
}

export default ProgressColumnSettingsModal
