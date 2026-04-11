import { useState, useEffect } from 'react'

import { useSWRConfig } from 'swr'
import { Modal, Card, CardContent, Typography, Button, Checkbox, FormControlLabel, FormGroup, TextField, Box } from '@mui/material'

const ProgressColumnSettingsModal = ({ open, onClose, board, column }) => {
  const { mutate } = useSWRConfig()
  const [isLoading, setIsLoading] = useState(false)

  const statusColumns = board.columns.filter(c => c.columnType === 'STATUS' && c.columnId !== column.columnId)

  // Store selection as map: { [statusColumnId]: weight }
  const [selectionMap, setSelectionMap] = useState({})

  // Initialize state when modal opens
  useEffect(() => {
    if (open) {
      const initialMap = {}
      if (column.watchedStatusColumns && Array.isArray(column.watchedStatusColumns)) {
        column.watchedStatusColumns.forEach(link => {
          initialMap[link.statusColumnId] = link.weight || 0
        })
      }
      setSelectionMap(initialMap)
    }
  }, [open, column])

  const handleToggle = (columnId) => {
    setSelectionMap(prev => {
      const newMap = { ...prev }
      if (newMap.hasOwnProperty(columnId)) {
        delete newMap[columnId]
      } else {
        newMap[columnId] = 0 // Default weight 0
      }

      return newMap
    })
  }

  const handleWeightChange = (columnId, val) => {
    // Ensure value is 0-100
    let weight = parseInt(val)
    if (isNaN(weight)) weight = 0
    if (weight < 0) weight = 0
    if (weight > 100) weight = 100

    setSelectionMap(prev => ({
      ...prev,
      [columnId]: weight
    }))
  }

  const handleDistributeEqually = () => {
    const selectedIds = Object.keys(selectionMap)
    const selectedCount = selectedIds.length

    if (selectedCount === 0) return

    const equalWeight = Math.floor(100 / selectedCount)
    const remainder = 100 - equalWeight * selectedCount

    setSelectionMap(prev => {
      const newMap = { ...prev }
      let first = true

      selectedIds.forEach(colId => {
        newMap[colId] = equalWeight + (first ? remainder : 0)
        first = false
      })

      return newMap
    })
  }

  const handleSave = async () => {
    setIsLoading(true)

    // Transform map to array for API: [{ statusColumnId, weight }, ...]
    const statusColumnsPayload = Object.entries(selectionMap).map(([id, weight]) => ({
      statusColumnId: parseInt(id),
      weight: weight
    }))

    try {
      const response = await fetch(`/api/columns/${column.columnId}/progress-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusColumns: statusColumnsPayload })
      })

      if (!response.ok) {
         const errorText = await response.text();
         console.error('Server response:', response.status, errorText);
         throw new Error('Gagal menyimpan pengaturan')
      }
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
          <Typography variant='body2'>Choose which status columns will be shown in the progress bar and their weight (%)</Typography>
          <FormGroup className='flex flex-col gap-3'>
            {statusColumns.map(col => {
              const isChecked = selectionMap.hasOwnProperty(col.columnId)

              return (
                <div key={col.columnId} className='flex items-center justify-between'>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleToggle(col.columnId)}
                      />
                    }
                    label={col.columnName}
                  />
                  {isChecked && (
                     <TextField
                        type='number'
                        size='small'
                        label='Weight %'
                        variant='outlined'
                        className='w-24'
                        inputProps={{ min: 0, max: 100 }}
                        value={selectionMap[col.columnId]}
                        onChange={(e) => handleWeightChange(col.columnId, e.target.value)}
                     />
                  )}
                </div>
              )
            })}
            {statusColumns.length === 0 && (
              <Typography variant='body2' color='text.secondary' className='italic'>
                Tidak ada kolom Status lain di papan ini.
              </Typography>
            )}
          </FormGroup>
          <div className='flex justify-between items-center mt-2'>
            <Button variant='outlined' size='small' onClick={handleDistributeEqually} className='!normal-case'>
              Distribute weight equally
            </Button>
            <Box className='flex gap-2'>
              <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
              <Button variant='contained' onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}

export default ProgressColumnSettingsModal
