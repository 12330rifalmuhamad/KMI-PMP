'use client'

import { useState } from 'react'

import {
  Popover,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Box,
  Typography,
  Button,
  Divider,
  InputAdornment
} from '@mui/material'

export const ValueEditorPopover = ({ anchorEl, onClose, column, board, onValueSelect }) => {
  const open = Boolean(anchorEl)

  // State untuk mengontrol tampilan (pilih vs edit label)
  const [isEditingLabels, setIsEditingLabels] = useState(false)

  // Definisikan opsi-opsi. Di masa depan, ini bisa diambil dari API.
  const [statusOptions, setStatusOptions] = useState([
    { id: 1, label: 'Sedang Dikerjakan', color: 'bg-yellow-500', text: 'text-white' },
    { id: 2, label: 'Buntu', color: 'bg-red-500', text: 'text-white' },
    { id: 3, label: 'Selesai', color: 'bg-green-500', text: 'text-white' },
    { id: 4, label: 'Belum Mulai', color: 'bg-gray-500', text: 'text-white' }
  ])

  const [priorityOptions, setPriorityOptions] = useState([
    { id: 1, label: 'Tinggi', color: 'bg-purple-500/10', text: 'text-purple-400' },
    { id: 2, label: 'Sedang', color: 'bg-sky-500/10', text: 'text-sky-400' },
    { id: 3, label: 'Rendah', color: 'bg-green-500/10', text: 'text-green-400' }
  ])

  // --- Handler untuk Edit Label (Placeholder) ---
  const handleLabelChange = (id, newText, type) => {
    // Logika untuk mengubah label di state
    if (type === 'status') {
      setStatusOptions(prev => prev.map(opt => (opt.id === id ? { ...opt, label: newText } : opt)))
    } else {
      setPriorityOptions(prev => prev.map(opt => (opt.id === id ? { ...opt, label: newText } : opt)))
    }
  }

  const handleSaveLabels = () => {
    alert("Fungsi 'Save Labels' belum terhubung ke backend.")
    setIsEditingLabels(false)
  }

  // --- Render Tampilan Editor ---
  const renderEditor = () => {
    switch (column.columnType) {
      // PERBAIKAN 1: Menambahkan case untuk TEXT dan LINK
      case 'TEXT':
      case 'LINK':
        return (
          <div className='p-2'>
            <TextField
              fullWidth
              size='small'
              autoFocus
              defaultValue={column.currentValue || ''}
              placeholder={column.columnType === 'LINK' ? 'https://example.com' : 'Enter text...'}
              onBlur={e => {
                onValueSelect(e.target.value)
                onClose()
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onValueSelect(e.currentTarget.value)
                  onClose()
                }
              }}
            />
          </div>
        )

      // PERBAIKAN 2: Meng-upgrade editor STATUS
      case 'STATUS':
        const isPriority = ['prioritas', 'priority'].includes(String(column.columnName || '').toLowerCase())
        const options = isPriority ? priorityOptions : statusOptions

        if (isEditingLabels) {
          // --- Tampilan Edit Label ---
          return (
            <Box className='p-3 flex flex-col gap-2' sx={{ width: 300 }}>
              <Typography variant='body2' className='font-semibold'>
                Edit Labels
              </Typography>
              {options.map(option => (
                <TextField
                  key={option.id}
                  fullWidth
                  size='small'
                  value={option.label}
                  onChange={e => handleLabelChange(option.id, e.target.value, isPriority ? 'priority' : 'status')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <div className={`w-5 h-5 rounded ${option.color} flex-shrink-0`}></div>
                      </InputAdornment>
                    )
                  }}
                />
              ))}
              <Button fullWidth variant='outlined' size='small' startIcon={<i className='tabler-plus' />}>
                New label
              </Button>
              <Divider className='!my-2' />
              <div className='flex justify-between'>
                <Button variant='text' size='small' onClick={() => setIsEditingLabels(false)}>
                  Back
                </Button>
                <Button variant='contained' size='small' onClick={handleSaveLabels}>
                  Apply
                </Button>
              </div>
            </Box>
          )
        }

        // --- Tampilan Pilih Status/Prioritas ---
        return (
          <Box className='p-2 flex flex-col gap-2' sx={{ width: 220 }}>
            {options.map(option => (
              <Button
                key={option.id}
                variant={isPriority ? 'outlined' : 'contained'}
                className={`!font-semibold !justify-start !shadow-none ${option.color} ${option.text}`}
                style={isPriority ? { borderColor: option.color.split(' ')[1] } : {}}
                onClick={() => {
                  onValueSelect(option.label)
                  onClose()
                }}
              >
                {option.label}
              </Button>
            ))}
            <Divider className='!my-2' />
            <Button
              variant='text'
              size='small'
              startIcon={<i className='tabler-pencil' />}
              onClick={() => setIsEditingLabels(true)}
              className='!normal-case !text-textSecondary'
            >
              Edit Labels
            </Button>
          </Box>
        )

      case 'PERSON':
        return (
          <List>
            {(board?.boardMember || []).map(member => (
              <ListItemButton
                key={member.userId}
                onClick={() => {
                  onValueSelect(member.userId.toString())
                  onClose()
                }}
              >
                <ListItemText primary={member.mUser?.userName || member.mUser?.email || 'Unknown user'} />
              </ListItemButton>
            ))}
          </List>
        )

      // PERBAIKAN 3: Menambahkan auto-close pada DATE
      case 'DATE':
        return (
          <div className='p-2'>
            <TextField
              type='date'
              defaultValue={column.currentValue}
              onChange={e => {
                onValueSelect(e.target.value)
                onClose()
              }}
              InputLabelProps={{ shrink: true }}
              autoFocus
            />
          </div>
        )
      default:
        return <div className='p-2'>Tipe kolom ini tidak bisa diedit.</div>
    }
  }

  // Set ulang state edit saat popover ditutup
  const handleClose = () => {
    setIsEditingLabels(false)
    onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // PERBAIKAN 4: Posisi lebih baik
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      {renderEditor()}
    </Popover>
  )
}
