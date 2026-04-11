'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'

import { useSWRConfig } from 'swr'
import {
  Box,
  Typography,
  IconButton,
  Checkbox,
  TextField,
  Button,
  Avatar as MuiAvatar,
  Menu,
  MenuItem,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  Modal,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  ListItemIcon,
  ListSubheader,
  Divider,
  InputAdornment,
  CircularProgress,
  FormGroup,
  FormControlLabel,
  Grid
} from '@mui/material'

import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import ItemDetailPanel from './../ItemDetailPanel'

// Asumsi file-file ini ada di folder yang sama
// import ColorPalettePopover from './ColorPalettePopover'
// import ProgressColumnSettingsModal from './ProgressColumnSettingsModal'
// import ProgressCell from './ProgressCell'

// =================================================================
// KOMPONEN-KOMPONEN KECIL (HELPER COMPONENTS)
// =================================================================

const PersonAvatar = ({ user }) => {
  if (!user) {
    return (
      <MuiAvatar sx={{ width: 28, height: 28, backgroundColor: '#4A4E69', color: '#C9C8CF' }} title='Unassigned'>
        <i className='tabler-user-off' style={{ fontSize: '1rem' }} />
      </MuiAvatar>
    )
  }

  return (
    <MuiAvatar sx={{ width: 28, height: 28, fontSize: '0.875rem' }} title={user.userName}>
      {user.userName.charAt(0).toUpperCase()}
    </MuiAvatar>
  )
}

const StatusCell = ({ value, column }) => {
  const options = useMemo(() => {
    if (column.options?.length > 0) {
      return column.options.map(opt => ({
        label: opt.label,
        color: opt.color,
        text: opt.color.includes('/10') || opt.color.includes('gray') ? 'text-gray-300' : 'text-white'
      }))
    }

    if (column.columnName.toLowerCase() === 'prioritas') {
      return [
        { label: 'Tinggi', color: 'bg-purple-500/10', text: 'text-purple-400' },
        { label: 'Medium', color: 'bg-sky-500/10', text: 'text-sky-400' },
        { label: 'Rendah', color: 'bg-green-500/10', text: 'text-green-400' }
      ]
    }

    return [
      { label: 'Sedang Dikerjakan', color: 'bg-yellow-500', text: 'text-white' },
      { label: 'Buntu', color: 'bg-red-500', text: 'text-white' },
      { label: 'Selesai', color: 'bg-green-500', text: 'text-white' },
      { label: 'Belum Mulai', color: 'bg-gray-500', text: 'text-white' }
    ]
  }, [column])

  const option = options.find(opt => opt.label === value)
  const displayText = value || ''

  if (column.columnName.toLowerCase() === 'prioritas') {
    const colors = option ? `${option.color} ${option.text}` : 'text-gray-400 border border-gray-600'
    const borderClass = option && option.color.includes('/10') ? `border border-${option.color.split('-')[1]}-800` : ''

    return (
      <div
        className={`flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${colors} ${borderClass}`}
      >
        {displayText}
      </div>
    )
  }

  const colors = option ? `${option.color} ${option.text}` : 'bg-gray-600 text-gray-300'

  return (
    <div className={`flex items-center justify-center w-full h-full text-xs font-bold ${colors}`}>{displayText}</div>
  )
}

const DateCell = ({ value }) => {
  if (!value) return <span>—</span>

  return <span>{new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
}

const FilesCell = ({ value }) => {
  const fileCount = value ? value.split(',').length : 0

  return (
    <div className='flex items-center justify-center gap-1 text-textSecondary'>
      <i className='tabler-paperclip' />
      <span>{fileCount > 0 ? fileCount : '-'}</span>
    </div>
  )
}

const LinkCell = ({ value }) => {
  if (!value) return <span className='text-gray-500'>—</span>

  let href = value

  if (!href.startsWith('http://') && !href.startsWith('https://')) {
    href = 'https://' + href
  }

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='text-blue-400 hover:text-blue-300 underline truncate'
      onClick={e => e.stopPropagation()}
    >
      {value}
    </a>
  )
}

const ProgressCell = ({ item, column }) => {
  const progress = useMemo(() => {
    const watchedColumns = column.watchedStatusColumns || []

    if (watchedColumns.length === 0) {
      return { percent: 0, text: 'N/A' }
    }

    const DONE_LABELS = ['Selesai', 'Done']

    let totalWeight = 0
    let completedWeight = 0

    watchedColumns.forEach(link => {
      const weight = link.weight || 0

      totalWeight += weight

      const taskValue = item.values.find(val => val.columnId === link.statusColumnId)

      if (taskValue && DONE_LABELS.includes(taskValue.value)) {
        completedWeight += weight
      }
    })

    if (totalWeight === 0) {
      const doneCount = watchedColumns.filter(link => {
        const taskValue = item.values.find(val => val.columnId === link.statusColumnId)

        return taskValue && DONE_LABELS.includes(taskValue.value)
      }).length

      const percent = watchedColumns.length === 0 ? 0 : Math.round((doneCount / watchedColumns.length) * 100)

      return { percent, text: `${percent}%` }
    }

    const percent = totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100)

    return { percent, text: `${percent}%` }
  }, [item, column])

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: '70%', height: 20, backgroundColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${progress.percent}%`,
            height: '100%',
            backgroundColor: progress.percent === 100 ? 'success.main' : 'primary.main',
            transition: 'width 0.3s ease'
          }}
        />
      </Box>
      <Typography variant='body2' sx={{ width: '30%', textAlign: 'right' }}>
        {progress.text}
      </Typography>
    </Box>
  )
}

const colorPalette = [
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-gray-500',
  'bg-purple-500/10',
  'bg-sky-500/10',
  'bg-green-500/10',
  'bg-gray-400'
]

const ColorPalettePopover = ({ anchorEl, onClose, onColorSelect }) => {
  const open = Boolean(anchorEl)

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Box sx={{ p: 2, width: 200 }}>
        <Grid container spacing={1}>
          {colorPalette.map(color => (
            <Grid item xs={3} key={color}>
              <Box className={`w-10 h-10 rounded cursor-pointer ${color}`} onClick={() => onColorSelect(color)} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Popover>
  )
}

const ValueEditorPopover = ({ anchorEl, onClose, column, board, onValueSelect }) => {
  const { mutate } = useSWRConfig()
  const open = Boolean(anchorEl)
  const [isEditingLabels, setIsEditingLabels] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [colorPickerAnchor, setColorPickerAnchor] = useState(null)
  const [editingLabelId, setEditingLabelId] = useState(null)

  const initialOptions = useMemo(() => {
    if (column.columnName.toLowerCase() === 'prioritas') {
      return [
        { id: 'p1', label: 'Tinggi', color: 'bg-purple-500/10', text: 'text-purple-400' },
        { id: 'p2', label: 'Medium', color: 'bg-sky-500/10', text: 'text-sky-400' },
        { id: 'p3', label: 'Rendah', color: 'bg-green-500/10', text: 'text-green-400' }
      ]
    }

    return column.options?.length
      ? column.options.map(opt => ({ ...opt, id: opt.optionId.toString(), text: 'text-white' }))
      : [
          { id: 's1', label: 'Sedang Dikerjakan', color: 'bg-yellow-500', text: 'text-white' },
          { id: 's2', label: 'Buntu', color: 'bg-red-500', text: 'text-white' },
          { id: 's3', label: 'Selesai', color: 'bg-green-500', text: 'text-white' },
          { id: 's4', label: 'Belum Mulai', color: 'bg-gray-500', text: 'text-white' }
        ]
  }, [column])

  const [labels, setLabels] = useState(initialOptions)

  useEffect(() => {
    setLabels(initialOptions)
  }, [initialOptions])

  const handleLabelChange = (id, newText) => {
    setLabels(prev => prev.map(opt => (opt.id === id ? { ...opt, label: newText } : opt)))
  }

  const handleAddNewLabel = () => {
    const newLabel = { id: crypto.randomUUID(), label: 'New Label', color: 'bg-gray-400', text: 'text-white' }

    setLabels(prev => [...prev, newLabel])
  }

  const handleOpenColorPicker = (event, id) => {
    setColorPickerAnchor(event.currentTarget)
    setEditingLabelId(id)
  }

  const handleColorSelect = newColor => {
    const newTextColor = newColor.includes('/10') || newColor.includes('gray') ? 'text-gray-400' : 'text-white'

    setLabels(prev =>
      prev.map(opt => (opt.id === editingLabelId ? { ...opt, color: newColor, text: newTextColor } : opt))
    )
    setColorPickerAnchor(null)
    setEditingLabelId(null)
  }

  const handleSaveLabels = async () => {
    setIsLoading(true)
    const boardApiUrl = `/api/boards/${board.boardId}`
    const originalBoardData = structuredClone(board)

    const renameMap = {}

    initialOptions.forEach(originalOpt => {
      const newOpt = labels.find(l => l.id === originalOpt.id)

      if (newOpt && newOpt.label !== originalOpt.label) {
        renameMap[originalOpt.label] = newOpt.label
      }
    })

    const optionsToSave = labels.map(({ id, label, color }) => ({
      label,
      color: color.split(' ')[0]
    }))

    const newBoardData = structuredClone(board)
    const columnToUpdate = newBoardData.columns.find(c => c.columnId === column.columnId)

    if (columnToUpdate) {
      columnToUpdate.options = labels.map((label, index) => ({
        optionId: label.id,
        columnId: column.columnId,
        label: label.label,
        color: label.color.split(' ')[0],
        sortOrder: index
      }))
    }

    mutate(boardApiUrl, newBoardData, { revalidate: false })
    setIsEditingLabels(false)

    try {
      const response = await fetch(`/api/columns/${column.columnId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: optionsToSave,
          renameMap: renameMap
        })
      })

      if (!response.ok) {
        console.error('Gagal menyimpan label, mengembalikan UI')
        mutate(boardApiUrl, originalBoardData, { revalidate: false })
        alert('Gagal menyimpan label.')
      } else {
        mutate(boardApiUrl)
      }
    } catch (error) {
      console.error('Gagal menyimpan label:', error)
      alert('Gagal menyimpan label.')
      mutate(boardApiUrl, originalBoardData, { revalidate: false })
    } finally {
      setIsLoading(false)
    }
  }

  const renderEditor = () => {
    switch (column.columnType) {
      case 'TEXT':
      case 'LINK':
      case 'NUMBER':
        return (
          <div className='p-2'>
            <TextField
              fullWidth
              size='small'
              autoFocus
              type={column.columnType === 'NUMBER' ? 'number' : 'text'}
              defaultValue={column.currentValue || ''}
              placeholder={column.columnType === 'LINK' ? 'https://example.com' : ''}
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
      case 'STATUS':
        const isPriority = column.columnName.toLowerCase() === 'prioritas'
        const options = labels

        if (isEditingLabels) {
          // --- UI Edit Label ---
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
                  onChange={e => handleLabelChange(option.id, e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <button
                          type='button'
                          className={`w-5 h-5 rounded cursor-pointer ${option.color} flex-shrink-0`}
                          onClick={e => handleOpenColorPicker(e, option.id)}
                          title='Change color'
                        />
                      </InputAdornment>
                    )
                  }}
                />
              ))}
              <Button
                fullWidth
                variant='outlined'
                size='small'
                startIcon={<i className='tabler-plus' />}
                onClick={handleAddNewLabel}
              >
                New label
              </Button>
              <Divider className='!my-2' />
              <div className='flex justify-between'>
                <Button
                  variant='text'
                  size='small'
                  onClick={() => {
                    setIsEditingLabels(false)
                    setLabels(initialOptions)
                  }}
                >
                  Back
                </Button>
                <Button variant='contained' size='small' onClick={handleSaveLabels} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Apply'}
                </Button>
              </div>
            </Box>
          )
        }

        // --- UI Pilih Status/Prioritas ---
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
                <ListItemText primary={member.mUser.userName} />
              </ListItemButton>
            ))}
          </List>
        )
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
        return <div className='p-2'>Tipe kolom ini tidak bisa diedit via popover.</div>
    }
  }

  const handleClose = () => {
    setIsEditingLabels(false)
    setLabels(initialOptions)
    onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      {renderEditor()}

      <ColorPalettePopover
        anchorEl={colorPickerAnchor}
        onClose={() => setColorPickerAnchor(null)}
        onColorSelect={handleColorSelect}
      />
    </Popover>
  )
}

const CreateColumnModal = ({ open, onClose, onColumnCreated, boardId, initialType = 'TEXT' }) => {
  const [columnName, setColumnName] = useState('')
  const [columnType, setColumnType] = useState(initialType)

  useEffect(() => {
    setColumnType(initialType)
  }, [initialType])

  const handleCreate = async () => {
    if (!columnName.trim()) return
    await onColumnCreated({ txtColumnName: columnName, txtColumnType: columnType })
    setColumnName('')
    setColumnType('TEXT')
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-backgroundPaper p-4'>
        <CardContent className='flex flex-col gap-4'>
          <Typography variant='h6'>Add New Column</Typography>
          <TextField label='Column Name' value={columnName} onChange={e => setColumnName(e.target.value)} autoFocus />
          <FormControl fullWidth>
            <InputLabel>Column Type</InputLabel>
            <Select value={columnType} label='Column Type' onChange={e => setColumnType(e.target.value)}>
              <MenuItem value={'TEXT'}>Text</MenuItem>
              <MenuItem value={'STATUS'}>Status</MenuItem>
              <MenuItem value={'PERSON'}>People</MenuItem>
              <MenuItem value={'DATE'}>Date</MenuItem>
              <MenuItem value={'NUMBER'}>Numbers</MenuItem>
              <MenuItem value={'CHECKBOX'}>Checkbox</MenuItem>
              <MenuItem value={'FILES'}>Files</MenuItem>
              <MenuItem value={'LINK'}>Link</MenuItem>
              <MenuItem value={'PROGRESS'}>Progress</MenuItem>
              <MenuItem value={'DROPDOWN'}>Dropdown</MenuItem>
              <MenuItem value={'TIMELINE'}>Timeline</MenuItem>
              <MenuItem value={'FORMULA'}>Formula</MenuItem>
            </Select>
          </FormControl>
          <div className='flex justify-end gap-2'>
            <Button variant='outlined' color='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleCreate}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}

const FilesPopover = ({ anchorEl, onClose, item, column, onFileUploaded }) => {
  const open = Boolean(anchorEl)
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)

  const cellValue = (item?.values || []).find(v => v.columnId === column?.columnId)?.value

  const files = useMemo(() => {
    if (!cellValue) return []

    return cellValue.split(',').map(url => {
      try {
        const decodedUrl = decodeURIComponent(url)

        const filename = decodedUrl
          .split('/')
          .pop()
          .substring(decodedUrl.indexOf('_') + 1)

        return { url, name: filename }
      } catch (e) {
        return { url, name: 'Invalid file name' }
      }
    })
  }, [cellValue])

  const handleUploadClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = async event => {
    const file = event.target.files[0]

    if (!file) return

    setIsUploading(true)
    const formData = new FormData()

    formData.append('file', file)

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) throw new Error('Upload failed')

      const result = await uploadResponse.json()

      const newValue = cellValue ? `${cellValue},${result.url}` : result.url

      await onFileUploaded(newValue)
    } catch (error) {
      console.error('File upload error:', error)
      alert('Gagal mengunggah file.')
    } finally {
      setIsUploading(false)
      onClose()
    }
  }

  const menuItems = [
    { label: 'From Computer', icon: 'tabler-microphone', action: handleUploadClick },
    { label: 'From Webcam', icon: 'tabler-camera', action: () => alert('Fungsi belum dibuat') },
    { label: 'Doc', icon: 'tabler-file-text', action: () => alert('Fungsi belum dibuat') }
  ]

  const externalLinks = [
    { label: 'From Link', icon: 'tabler-link', action: () => alert('Fungsi belum dibuat') },
    { label: 'From Google Drive', icon: 'tabler-brand-google-drive', action: () => alert('Fungsi belum dibuat') },
    { label: 'From Dropbox', icon: 'tabler-brand-dropbox', action: () => alert('Fungsi belum dibuat') },
    { label: 'From Box', icon: 'tabler-brand-box', action: () => alert('Fungsi belum dibuat') },
    { label: 'From OneDrive & SharePoint', icon: 'tabler-brand-onedrive', action: () => alert('Fungsi belum dibuat') }
  ]

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <input type='file' ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

      <Box sx={{ width: 280, p: 1 }}>
        <List dense>
          {files.length > 0 && (
            <>
              <ListSubheader className='!bg-transparent uppercase font-semibold !text-xs !text-textDisabled'>
                Uploaded Files ({files.length})
              </ListSubheader>
              {files.map(file => (
                <ListItemButton
                  key={file.url}
                  component='a'
                  href={file.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={onClose}
                >
                  <ListItemIcon>
                    <i className='tabler-file-text' />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    primaryTypographyProps={{
                      style: {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }}
                  />
                </ListItemButton>
              ))}
              <Divider sx={{ my: 1 }} />
            </>
          )}
          {isUploading ? (
            <ListItemButton disabled>
              <ListItemIcon>
                <CircularProgress size={20} />
              </ListItemIcon>
              <ListItemText primary='Uploading...' />
            </ListItemButton>
          ) : (
            menuItems.map(item => (
              <ListItemButton key={item.label} onClick={item.action}>
                <ListItemIcon>
                  <i className={item.icon} />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))
          )}
          <Divider sx={{ my: 1 }} />
          {externalLinks.map(item => (
            <ListItemButton key={item.label} onClick={item.action}>
              <ListItemIcon>
                <i className={item.icon} />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Popover>
  )
}

const ProgressColumnSettingsModal = ({ open, onClose, board, column, onSave }) => {
  const [isLoading, setIsLoading] = useState(false)

  const statusColumns = board.columns.filter(c => c.columnType === 'STATUS' && c.columnId !== column.columnId)

  // ==========================================================
  // PERBAIKAN: Gunakan useState DAN useEffect
  // ==========================================================
  const [columnSettings, setColumnSettings] = useState(() => {
    const initialSettings = {}

    ;(column?.watchedStatusColumns || []).forEach(link => {
      initialSettings[link.statusColumnId] = {
        selected: true,
        weight: link.weight || 0
      }
    })

    return initialSettings
  })

  // useEffect ini akan me-reset state setiap kali modal dibuka (prop 'open' berubah)
  useEffect(() => {
    if (open) {
      const initialSettings = {}

      ;(column?.watchedStatusColumns || []).forEach(link => {
        initialSettings[link.statusColumnId] = {
          selected: true,
          weight: link.weight || 0
        }
      })
      setColumnSettings(initialSettings)
    }
  }, [open, column])

  // ==========================================================

  const handleToggle = columnId => {
    setColumnSettings(prev => {
      const newSettings = { ...prev }

      if (!newSettings[columnId]) {
        // Jika belum ada, inisialisasi
        newSettings[columnId] = { selected: true, weight: 0 }
      } else {
        // Toggle selection
        newSettings[columnId].selected = !newSettings[columnId].selected
      }

      return newSettings
    })
  }

  const handleWeightChange = (columnId, weightStr) => {
    const weight = parseInt(weightStr) || 0

    setColumnSettings(prev => ({
      ...prev,
      [columnId]: {
        ...(prev[columnId] || { selected: true }), // Pertahankan 'selected' status
        weight: Math.max(0, Math.min(100, weight)) // Batasi 0-100
      }
    }))
  }

  const handleDistributeEqually = () => {
    const selectedCount = Object.values(columnSettings).filter(s => s.selected).length

    if (selectedCount === 0) return

    const equalWeight = Math.floor(100 / selectedCount)
    const remainder = 100 - equalWeight * selectedCount

    setColumnSettings(prev => {
      const newSettings = { ...prev }
      let first = true

      Object.keys(newSettings).forEach(colId => {
        if (newSettings[colId].selected) {
          newSettings[colId].weight = equalWeight + (first ? remainder : 0)
          first = false
        }
      })

      return newSettings
    })
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const statusColumnsData = Object.entries(columnSettings)
        .filter(([_, settings]) => settings && settings.selected)
        .map(([statusColumnId, settings]) => ({
          statusColumnId: parseInt(statusColumnId),
          weight: Math.max(0, Math.min(100, parseInt(settings?.weight) || 0))
        }))

      if (!Array.isArray(statusColumnsData)) {
        throw new Error('Invalid status columns data')
      }

      await onSave(statusColumnsData)
      onClose()
    } catch (error) {
      console.error('Error saving progress settings:', error)
      alert('Gagal menyimpan pengaturan: ' + (error?.message || 'Unknown error'))
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
            {statusColumns.map(col => {
              const isSelected = columnSettings[col.columnId]?.selected || false
              const weight = columnSettings[col.columnId]?.weight || 0

              return (
                <Box key={col.columnId} className='flex items-center justify-between gap-4 py-2'>
                  <FormControlLabel
                    control={<Checkbox checked={isSelected} onChange={() => handleToggle(col.columnId)} />}
                    label={col.columnName}
                    className='flex-1'
                  />
                  {isSelected && (
                    <TextField
                      type='number'
                      size='small'
                      value={weight}
                      onChange={e => handleWeightChange(col.columnId, e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 1 }}
                      InputProps={{
                        endAdornment: <InputAdornment position='end'>%</InputAdornment>
                      }}
                      sx={{ width: 100 }}
                      disabled={!isSelected}
                    />
                  )}
                </Box>
              )
            })}
            {statusColumns.length === 0 && (
              <Typography variant='body2' color='text.secondary' className='italic'>
                Tidak ada kolom Status lain di papan ini.
              </Typography>
            )}
          </FormGroup>
          <Divider />
          <Button variant='outlined' onClick={handleDistributeEqually} className='!normal-case'>
            Distribute weight equally
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </Modal>
  )
}

// =================================================================
// KOMPONEN UTAMA TABLEVIEW
// =================================================================
export default function TableView({ board }) {
  const { mutate } = useSWRConfig()

  // States untuk Interaktivitas UI
  const [newItemTitle, setNewItemTitle] = useState('')
  const [activeNewItemInput, setActiveNewItemInput] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false)
  const [editingGroupName, setEditingGroupName] = useState(null)
  const [editingTaskName, setEditingTaskName] = useState(null)
  const [editingTextValue, setEditingTextValue] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState({ anchorEl: null, type: null, id: null })
  const [addColumnMenuAnchor, setAddColumnMenuAnchor] = useState(null)
  const isAddColumnMenuOpen = Boolean(addColumnMenuAnchor)
  const [selectedColumnType, setSelectedColumnType] = useState('TEXT')
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null)
  const [activeColumn, setActiveColumn] = useState(null)
  const [groups, setGroups] = useState(board?.groups || [])
  const [filesPopover, setFilesPopover] = useState({ anchorEl: null, item: null, column: null })
  const [calcMenuAnchor, setCalcMenuAnchor] = useState(null)
  const [activeCalcColumn, setActiveCalcColumn] = useState(null)
  const [progressSettingsModal, setProgressSettingsModal] = useState({ open: false, column: null })

  useEffect(() => {
    setGroups(board?.groups || [])
  }, [board])

  const initialColumnsForDnD = useMemo(() => {
    if (!board?.columns) return []

    return [...board.columns]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.columnId - b.columnId)
      .map(c => ({ ...c }))
  }, [board?.columns])

  const [headerRef, headerColumns, setHeaderColumns] = useDragAndDrop(initialColumnsForDnD, {
    plugins: [animations()],
    dragHandle: '.col-handle',
    draggable: el => el.classList?.contains('table-column-draggable')
  })

  useEffect(() => {
    setHeaderColumns(initialColumnsForDnD)
  }, [initialColumnsForDnD, setHeaderColumns])

  const prevColsRef = useRef(headerColumns)

  useEffect(() => {
    const orderChanged =
      JSON.stringify(prevColsRef.current.map(c => c.columnId)) !== JSON.stringify(headerColumns.map(c => c.columnId))

    if (orderChanged) {
      const persist = async () => {
        for (let index = 0; index < headerColumns.length; index++) {
          const col = headerColumns[index]

          try {
            await fetch(`/api/columns/${col.columnId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sortOrder: index + 1 })
            })
          } catch {}
        }

        mutate(`/api/boards/${board.boardId}`)
      }

      persist()
    }

    prevColsRef.current = headerColumns
  }, [headerColumns, board, mutate])

  const findUserById = userId => (board?.boardMember || []).find(m => m.userId === parseInt(userId ?? '', 10))?.mUser

  const normalizeId = value => {
    if (value === null || typeof value === 'undefined') return ''
    if (typeof value === 'bigint') return value.toString()

    return String(value)
  }

  const toClientColumnId = columnId => Number(columnId)

  // Fungsi Handler Universal untuk Aksi CRUD
  const handleApiCall = async (promise, revalidate = true) => {
    try {
      await promise

      if (revalidate) {
        mutate(`/api/boards/${board.boardId}`)
      }
    } catch (error) {
      console.error('API call failed:', error)
    }
  }

  // --- Fungsi Create ---
  const handleCreateTask = groupId =>
    handleApiCall(
      fetch(`/api/groups/${groupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: newItemTitle || 'New Item' })
      })
    ).then(() => {
      setNewItemTitle('')
      setActiveNewItemInput(null)
    })

  const handleCreateGroup = () =>
    handleApiCall(
      fetch(`/api/boards/${board.boardId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtGroupName: 'New Group' })
      })
    )

  const handleCreateColumn = async columnData => {
    try {
      const res = await fetch(`/api/boards/${board.boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(columnData)
      })

      if (res.ok) {
        // HANYA MUTATE, jangan setHeaderColumns secara manual
        mutate(`/api/boards/${board.boardId}`)
      }
    } catch (e) {
    } finally {
      setIsColumnModalOpen(false)
    }
  }

  // --- Fungsi Update dengan Optimistic UI ---
  const handleUpdateValue = async (itemToUpdate, columnToUpdate, newValue) => {
    const boardApiUrl = `/api/boards/${board.boardId}`
    const originalBoardData = structuredClone(board)
    const sanitizedValue = typeof newValue === 'undefined' || newValue === null ? '' : String(newValue)
    const columnIdNumber = toClientColumnId(columnToUpdate.columnId)

    const newBoardData = structuredClone(board)
    const group = newBoardData.groups.find(g => g.groupId === itemToUpdate.groupId)

    if (!group) return
    const item = group.items.find(i => i.taskId === itemToUpdate.taskId)

    if (!item) return
    let value = item.values.find(v => v.columnId === columnToUpdate.columnId)

    if (value) {
      value.value = sanitizedValue
    } else {
      item.values.push({
        taskValueId: `temp-${Date.now()}`,
        taskId: item.taskId,
        columnId: columnIdNumber,
        value: sanitizedValue
      })
    }

    mutate(boardApiUrl, newBoardData, { revalidate: false })
    setEditingCell(null)
    setEditingTextValue(null)

    try {
      const response = await fetch(`/api/tasks/${itemToUpdate.taskId}/values`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intColumn_ID: columnIdNumber, txtValue: sanitizedValue })
      })

      if (!response.ok) {
        mutate(boardApiUrl, originalBoardData, { revalidate: false })
      } else {
        mutate(boardApiUrl)
      }
    } catch (error) {
      mutate(boardApiUrl, originalBoardData, { revalidate: false })
    }
  }

  const handleUpdateTaskTitle = (taskId, newTitle) =>
    handleApiCall(
      fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: newTitle })
      }),
      false
    ).then(() => setEditingTaskName(null))

  const handleUpdateGroupName = (groupId, newName) =>
    handleApiCall(
      fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: newName })
      }),
      false
    ).then(() => setEditingGroupName(null))

  const handleSaveTextValue = () => {
    if (!editingTextValue) return
    const { item, column, currentValue } = editingTextValue

    handleUpdateValue(item, column, currentValue)
  }

  // --- Fungsi Delete ---
  const handleDeleteTask = taskId =>
    handleApiCall(fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })).then(() => setMenuAnchor({ anchorEl: null }))

  const handleDeleteGroup = groupId =>
    handleApiCall(fetch(`/api/groups/${groupId}`, { method: 'DELETE' })).then(() => setMenuAnchor({ anchorEl: null }))

  const handleCellClick = (event, item, column) => {
    if (column.columnName.toLowerCase() === 'item') {
      setSelectedItem(item)
    } else if (['TEXT', 'LINK', 'NUMBER'].includes(column.columnType)) {
      const cellValue = (item.values || []).find(val => normalizeId(val.columnId) === normalizeId(column.columnId))

      setEditingTextValue({
        taskId: item.taskId,
        columnId: column.columnId,
        item: item,
        column: column,
        currentValue: cellValue?.value || ''
      })
    } else if (['STATUS', 'PERSON', 'DATE'].includes(column.columnType)) {
      setEditingCell({ anchorEl: event.currentTarget, item, column })
    } else if (column.columnType === 'FILES') {
      setFilesPopover({ anchorEl: event.currentTarget, item: item, column: column })
    }
  }

  // Handlers untuk menu Add Column
  const handleOpenAddColumnMenu = event => {
    setAddColumnMenuAnchor(event.currentTarget)
  }

  const handleCloseAddColumnMenu = () => {
    setAddColumnMenuAnchor(null)
  }

  const handleColumnTypeSelect = type => {
    handleCloseAddColumnMenu()
    setSelectedColumnType(type)
    setIsColumnModalOpen(true)
  }

  // Definisi tipe kolom untuk menu
  const columnTypes = {
    essentials: [
      { key: 'STATUS', label: 'Status', icon: 'tabler-progress-check' },
      { key: 'TEXT', label: 'Text', icon: 'tabler-t' },
      { key: 'PERSON', label: 'People', icon: 'tabler-users' },
      { key: 'DROPDOWN', label: 'Dropdown', icon: 'tabler-chevron-down' },
      { key: 'DATE', label: 'Date', icon: 'tabler-calendar' },
      { key: 'NUMBER', label: 'Numbers', icon: 'tabler-hash' }
    ],
    superUseful: [
      { key: 'FILES', label: 'Files', icon: 'tabler-file' },
      { key: 'LINK', label: 'Link', icon: 'tabler-link' },
      { key: 'PROGRESS', label: 'Progress', icon: 'tabler-progress' },
      { key: 'CONNECT', label: 'Connect...', icon: 'tabler-link' },
      { key: 'DOC', label: 'monday Doc', icon: 'tabler-file-text' },
      { key: 'TIMELINE', label: 'Timeline', icon: 'tabler-timeline' },
      { key: 'CHECKBOX', label: 'Checkbox', icon: 'tabler-checkbox' },
      { key: 'FORMULA', label: 'Formula', icon: 'tabler-variable' }
    ]
  }

  // --- Column header kebab menu handlers ---
  const openColumnMenu = (event, column) => {
    setColumnMenuAnchor(event.currentTarget)
    setActiveColumn(column)
  }

  const closeColumnMenu = () => {
    setColumnMenuAnchor(null)
    setActiveColumn(null)
  }

  const handleRenameColumn = async () => {
    if (!activeColumn) return
    const newName = prompt('Rename column to:', activeColumn.columnName)

    if (!newName || newName.trim() === '' || newName === activeColumn.columnName) return

    await handleApiCall(
      fetch(`/api/columns/${activeColumn.columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtColumnName: newName.trim() })
      })
    )
    setHeaderColumns(cols => cols.map(c => (c.columnId === activeColumn.columnId ? { ...c, columnName: newName } : c)))
    closeColumnMenu()
  }

  const handleDeleteColumn = async () => {
    if (!activeColumn) return
    if (!confirm(`Are you sure you want to delete the column "${activeColumn.columnName}"?`)) return

    await handleApiCall(fetch(`/api/columns/${activeColumn.columnId}`, { method: 'DELETE' }))
    setHeaderColumns(cols => cols.filter(c => c.columnId !== activeColumn.columnId))
    closeColumnMenu()
  }

  const handleDuplicateColumn = async () => {
    if (!activeColumn) return

    const payload = {
      txtColumnName: `${activeColumn.columnName} (Copy)`,
      txtColumnType: activeColumn.columnType
    }

    await handleApiCall(
      fetch(`/api/boards/${board.boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    )
    closeColumnMenu()
  }

  const handleAddColumnToRight = async () => {
    if (!activeColumn) return
    await handleCreateColumn({ txtColumnName: 'New Column', txtColumnType: 'TEXT' })
    closeColumnMenu()
  }

  const handleChangeColumnType = async () => {
    if (!activeColumn) return
    const allowed = ['TEXT', 'STATUS', 'PERSON', 'DATE', 'NUMBER', 'CHECKBOX', 'FILES', 'LINK', 'PROGRESS']
    const next = prompt(`Change column type to (${allowed.join(', ')}):`, activeColumn.columnType)

    if (!next || !allowed.includes(next)) return

    await handleApiCall(
      fetch(`/api/columns/${activeColumn.columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtColumnType: next })
      })
    )
    closeColumnMenu()
  }

  // --- Fungsi Kalkulasi Footer ---
  const getStatusSummary = group => {
    const statusColumnId = board.columns.find(c => c.columnName === 'Status')?.columnId

    if (!statusColumnId) return {}
    const summary = {}

    group.items.forEach(item => {
      const statusValue = (item.values || []).find(v => v.columnId === statusColumnId)?.value

      if (statusValue) {
        summary[statusValue] = (summary[statusValue] || 0) + 1
      }
    })

    return summary
  }

  const calculateSummary = (items, columnId, calcType) => {
    const values = items
      .map(item => {
        const cellValue = (item.values || []).find(val => normalizeId(val.columnId) === normalizeId(columnId))

        return parseFloat(cellValue?.value) || 0
      })
      .filter(v => v !== 0)

    if (values.length === 0) return 0

    switch (calcType) {
      case 'Sum':
        return values.reduce((acc, val) => acc + val, 0)
      case 'Average':
        return values.reduce((acc, val) => acc + val, 0) / values.length
      case 'Median':
        const sorted = [...values].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)

        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      case 'Min':
        return Math.min(...values)
      case 'Max':
        return Math.max(...values)
      case 'Count':
        return values.length
      default:
        return values.reduce((acc, val) => acc + val, 0)
    }
  }

  const formatCalculation = (result, unit, calcType) => {
    let formattedResult

    if (unit === '%') {
      formattedResult = `${result.toFixed(2)}%`
    } else if (unit) {
      formattedResult = `${unit}${new Intl.NumberFormat().format(result)}`
    } else {
      formattedResult = new Intl.NumberFormat().format(result)
    }

    return `${calcType}: ${formattedResult}`
  }

  const handleOpenCalcMenu = (event, column) => {
    setCalcMenuAnchor(event.currentTarget)
    setActiveCalcColumn(column)
  }

  const handleCloseCalcMenu = () => {
    setCalcMenuAnchor(null)
    setActiveCalcColumn(null)
  }

  const handleSelectCalcSetting = async (type, value) => {
    if (!activeCalcColumn) return

    const boardApiUrl = `/api/boards/${board.boardId}`
    const columnId = activeCalcColumn.columnId
    const originalBoardData = structuredClone(board)

    // 1. Buat data baru secara lokal
    const newBoardData = structuredClone(board)
    const columnToUpdate = newBoardData.columns.find(c => c.columnId === columnId)

    if (!columnToUpdate) return

    let payload = {}

    if (type === 'calc') {
      columnToUpdate.calculationType = value
      payload = { txtCalculationType: value }
    } else if (type === 'unit') {
      columnToUpdate.unit = value
      payload = { txtUnit: value }
    }

    // 2. Perbarui state SWR (Optimistic Update)
    mutate(boardApiUrl, newBoardData, { revalidate: false })

    // 3. Perbarui state header draggable (Optimistic Update)
    const newHeaderColumns = headerColumns.map(col => (col.columnId === columnId ? columnToUpdate : col))

    setHeaderColumns(newHeaderColumns)

    // 4. Tutup menu
    handleCloseCalcMenu()

    // 5. Kirim request API di latar belakang
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        // Jika API gagal, kembalikan UI ke data asli
        mutate(boardApiUrl, originalBoardData, { revalidate: false })
        setHeaderColumns(originalBoardData.columns)
      }

      // HAPUS pemicu re-fetch agar data optimis tetap ada
      // else { mutate(boardApiUrl); }
    } catch (error) {
      // Jika fetch gagal, kembalikan UI ke data asli
      mutate(boardApiUrl, originalBoardData, { revalidate: false })
      setHeaderColumns(originalBoardData.columns)
    }
  }

  // =================================================================
  // FUNGSI BARU: Menangani Penyimpanan Pengaturan Progress
  // =================================================================
  const handleSaveProgressSettings = async statusColumnsData => {
    if (!progressSettingsModal.column) return

    const boardApiUrl = `/api/boards/${board.boardId}`
    const columnId = progressSettingsModal.column.columnId
    const originalBoardData = structuredClone(board)

    // 1. Buat data baru secara lokal
    const newBoardData = structuredClone(board)
    const columnToUpdate = newBoardData.columns.find(c => c.columnId === columnId)

    if (!columnToUpdate) return

    columnToUpdate.watchedStatusColumns = statusColumnsData.map(({ statusColumnId, weight }) => {
      const statusCol = board.columns.find(c => c.columnId === statusColumnId)

      return {
        progressColumnId: columnId,
        statusColumnId: statusColumnId,
        weight: weight,
        statusColumn: statusCol
      }
    })

    // 2. Perbarui state SWR (Optimistic Update)
    mutate(boardApiUrl, newBoardData, { revalidate: false })

    // 3. Perbarui state header draggable (Optimistic Update)
    const newHeaderColumns = headerColumns.map(col => (col.columnId === columnId ? columnToUpdate : col))

    setHeaderColumns(newHeaderColumns)

    // 4. Tutup modal
    setProgressSettingsModal({ open: false, column: null })

    // 5. Kirim request API di latar belakang
    try {
      const response = await fetch(`/api/columns/${columnId}/progress-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusColumns: statusColumnsData })
      })

      if (!response.ok) {
        // Jika API gagal, kembalikan UI ke data asli
        mutate(boardApiUrl, originalBoardData, { revalidate: false })
        setHeaderColumns(originalBoardData.columns)
      }

      // HAPUS re-fetch agar data optimis tetap ada
      // else { mutate(boardApiUrl); }
    } catch (error) {
      // Jika fetch gagal, kembalikan UI ke data asli
      mutate(boardApiUrl, originalBoardData, { revalidate: false })
      setHeaderColumns(originalBoardData.columns)
    }
  }

  const calcOptions = ['Sum', 'Average', 'Median', 'Min', 'Max', 'Count']

  const unitOptions = [
    { label: 'None', value: null },
    { label: '$', value: '$' },
    { label: '€', value: '€' },
    { label: '£', value: '£' },
    { label: '%', value: '%' }
  ]

  return (
    <div className='relative'>
      <div className='overflow-x-auto rounded-lg border border-divider'>
        <table className='min-w-full border-collapse'>
          <thead className='bg-backgroundPaper'>
            <tr>
              <th className='sticky left-0 z-10 bg-backgroundPaper p-0 w-12 border-r border-divider'>
                <div className='flex justify-center'>
                  <Checkbox />
                </div>
              </th>
              <tr ref={headerRef} className='contents'>
                {headerColumns?.map(column => (
                  <th
                    key={column.columnId}
                    className='p-0 text-left text-sm font-semibold text-textPrimary whitespace-nowrap border-r border-divider table-column-draggable'
                  >
                    <div className='flex items-center justify-between px-3 py-3'>
                      <span className='truncate flex items-center gap-2'>
                        <i className='tabler-arrows-move col-handle text-textSecondary' />
                        {column.columnName}
                      </span>
                      <IconButton size='small' color='secondary' onClick={e => openColumnMenu(e, column)}>
                        <i className='tabler-dots-vertical' />
                      </IconButton>
                    </div>
                  </th>
                ))}
              </tr>
              <th className='w-12 border-r border-divider'>
                <IconButton size='small' onClick={handleOpenAddColumnMenu}>
                  <i className='tabler-plus text-textSecondary' />
                </IconButton>
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-divider'>
            {groups?.map(group => (
              <React.Fragment key={group.groupId}>
                <tr className='bg-backgroundPaper group'>
                  <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-12 border-r border-divider'>
                    <IconButton
                      size='small'
                      className='opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={e => setMenuAnchor({ anchorEl: e.currentTarget, type: 'group', id: group.groupId })}
                    >
                      <i className='tabler-dots-vertical' />
                    </IconButton>
                  </td>
                  <td
                    colSpan={headerColumns.length + 1}
                    className='p-2 font-bold text-textPrimary'
                    style={{ borderLeft: `4px solid ${group.groupColor}` }}
                  >
                    {editingGroupName?.groupId === group.groupId ? (
                      <TextField
                        autoFocus
                        fullWidth
                        variant='standard'
                        value={editingGroupName.currentName}
                        onChange={e => setEditingGroupName({ ...editingGroupName, currentName: e.target.value })}
                        onBlur={() => handleUpdateGroupName(group.groupId, editingGroupName.currentName)}
                        onKeyDown={e =>
                          e.key === 'Enter' && handleUpdateGroupName(group.groupId, editingGroupName.currentName)
                        }
                        InputProps={{ disableUnderline: true, className: '!text-textPrimary !font-semibold' }}
                      />
                    ) : (
                      <Typography
                        variant='subtitle2'
                        onClick={() => setEditingGroupName({ groupId: group.groupId, currentName: group.groupName })}
                        className='cursor-pointer'
                      >
                        {group.groupName}
                      </Typography>
                    )}
                  </td>
                </tr>
                {group.items?.map(item => (
                  <tr key={item.taskId} className='hover:bg-action-hover group'>
                    <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-12 border-r border-divider'>
                      <div className='flex justify-center items-center h-full'>
                        <Checkbox className='group-hover:hidden' />
                        <IconButton
                          size='small'
                          className='hidden group-hover:block'
                          onClick={e => setMenuAnchor({ anchorEl: e.currentTarget, type: 'task', id: item.taskId })}
                        >
                          <i className='tabler-dots-vertical' />
                        </IconButton>
                      </div>
                    </td>
                    {headerColumns.map(column => {
                      const cellValue = (item.values || []).find(
                        val => normalizeId(val.columnId) === normalizeId(column.columnId)
                      )

                      let cellContent

                      const isEditingItemTitle =
                        editingTaskName?.taskId === item.taskId && column.columnName.toLowerCase() === 'item'

                      const isEditingTextValue =
                        editingTextValue?.taskId === item.taskId && editingTextValue?.columnId === column.columnId

                      switch (column.columnType) {
                        case 'PERSON':
                          cellContent = (
                            <div className='flex justify-center'>
                              <PersonAvatar user={cellValue ? findUserById(cellValue.value) : null} />
                            </div>
                          )
                          break
                        case 'STATUS':
                          cellContent = <StatusCell value={cellValue?.value} column={column} />
                          break
                        case 'DATE':
                          cellContent = <DateCell value={cellValue?.value} />
                          break
                        case 'CHECKBOX':
                          cellContent = (
                            <div className='flex justify-center'>
                              <Checkbox
                                checked={cellValue?.value === 'true'}
                                onChange={e => handleUpdateValue(item, column, e.target.checked.toString())}
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                          )
                          break
                        case 'FILES':
                          cellContent = <FilesCell value={cellValue?.value} />
                          break
                        case 'LINK':
                          cellContent = <LinkCell value={cellValue?.value} />
                          break
                        case 'NUMBER':
                          cellContent = <span>{cellValue?.value || '—'}</span>
                          break
                        case 'PROGRESS':
                          cellContent = <ProgressCell item={item} column={column} />
                          break
                        case 'TEXT':
                          if (column.columnName.toLowerCase() === 'item') cellContent = item.taskTitle
                          else cellContent = <span>{cellValue?.value || '—'}</span>
                          break
                        default:
                          cellContent = <span>{cellValue?.value || '—'}</span>
                          break
                      }

                      return (
                        <td key={`${item.taskId}-${column.columnId}`} className={`p-0 h-10 border-r border-divider`}>
                          <div
                            onClick={e => {
                              if (isEditingItemTitle || isEditingTextValue) return
                              handleCellClick(e, item, column)
                            }}
                            className={`flex items-center w-full h-full cursor-pointer ${
                              column.columnType !== 'STATUS' &&
                              column.columnType !== 'TEXT' &&
                              column.columnName.toLowerCase() !== 'item'
                                ? 'justify-center'
                                : 'justify-start'
                            } ${column.columnType !== 'STATUS' ? 'px-3' : ''}`}
                          >
                            {isEditingItemTitle ? (
                              <TextField
                                autoFocus
                                fullWidth
                                variant='standard'
                                value={editingTaskName.currentName}
                                onChange={e => setEditingTaskName({ ...editingTaskName, currentName: e.target.value })}
                                onBlur={() => handleUpdateTaskTitle(item.taskId, editingTaskName.currentName)}
                                onKeyDown={e =>
                                  e.key === 'Enter' && handleUpdateTaskTitle(item.taskId, editingTaskName.currentName)
                                }
                                InputProps={{ disableUnderline: true, className: '!text-textPrimary !font-semibold' }}
                                onClick={e => e.stopPropagation()}
                              />
                            ) : isEditingTextValue ? (
                              <TextField
                                autoFocus
                                fullWidth
                                variant='standard'
                                type={column.columnType === 'NUMBER' ? 'number' : 'text'}
                                value={editingTextValue.currentValue}
                                onChange={e =>
                                  setEditingTextValue({ ...editingTextValue, currentValue: e.target.value })
                                }
                                onBlur={handleSaveTextValue}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveTextValue()
                                }}
                                InputProps={{ disableUnderline: true, className: '!text-textPrimary' }}
                                onClick={e => e.stopPropagation()}
                              />
                            ) : column.columnName.toLowerCase() === 'item' ? (
                              <strong
                                onClick={e => {
                                  e.stopPropagation()
                                  setEditingTaskName({ taskId: item.taskId, currentName: item.taskTitle })
                                  setSelectedItem(null)
                                }}
                              >
                                {cellContent}
                              </strong>
                            ) : (
                              <div className='w-full h-full'>{cellContent}</div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                    <td className='border-r border-divider'></td>
                  </tr>
                ))}
                <tr className='bg-backgroundPaper'>
                  <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-12 border-r border-divider'>
                    <div className='flex justify-center'>
                      <Checkbox className='opacity-0' />
                    </div>
                  </td>
                  <td className='p-2 text-textSecondary border-r border-divider'>
                    {activeNewItemInput === group.groupId ? (
                      <TextField
                        fullWidth
                        autoFocus
                        variant='standard'
                        value={newItemTitle}
                        onChange={e => setNewItemTitle(e.target.value)}
                        onBlur={() => handleCreateTask(group.groupId)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateTask(group.groupId)}
                        placeholder='+ Add Item'
                        InputProps={{ disableUnderline: true }}
                      />
                    ) : (
                      <button
                        onClick={() => setActiveNewItemInput(group.groupId)}
                        className='flex items-center w-full text-left'
                      >
                        <i className='tabler-plus mr-2' />+ Add Item
                      </button>
                    )}
                  </td>
                  <td colSpan={headerColumns.length} className='border-r border-divider'></td>
                </tr>

                {/* Baris Footer Kalkulasi */}
                <tr className='bg-backgroundPaper border-t border-gray-700'>
                  <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-12 border-r border-divider'></td>

                  {headerColumns.map(column => {
                    let summaryContent = null

                    const calcType = column.calculationType || 'Sum'
                    const unit = column.unit || null

                    if (column.columnName.toLowerCase() === 'item') {
                      summaryContent = (
                        <Typography variant='caption' className='text-gray-400 px-3'>
                          Count: {group.items?.length || 0}
                        </Typography>
                      )
                    } else if (column.columnName === 'Status') {
                      const summary = getStatusSummary(group)

                      summaryContent = (
                        <div className='flex h-4 rounded-sm overflow-hidden mx-2'>
                          {Object.entries(summary).map(([status, count]) => {
                            let bgColor = 'bg-gray-500'

                            if (status === 'Selesai') bgColor = 'bg-green-500'
                            else if (status === 'Sedang Dikerjakan') bgColor = 'bg-yellow-500'
                            else if (status === 'Buntu') bgColor = 'bg-red-500'

                            return (
                              <div
                                key={status}
                                className={bgColor}
                                style={{ flexGrow: count }}
                                title={`${status}: ${count}`}
                              ></div>
                            )
                          })}
                        </div>
                      )
                    } else if (column.columnType === 'NUMBER') {
                      const result = calculateSummary(group.items, column.columnId, calcType)

                      summaryContent = (
                        <Button
                          onClick={e => handleOpenCalcMenu(e, column)}
                          className='!text-textSecondary !normal-case !font-semibold !p-0 !min-w-0'
                        >
                          {formatCalculation(result, unit, calcType)}
                        </Button>
                      )
                    } else if (column.columnType === 'PROGRESS') {
                      const watchedColumns = column.watchedStatusColumns || []

                      if (watchedColumns.length > 0) {
                        let totalPercent = 0
                        const DONE_LABELS = ['Selesai', 'Done']

                        group.items.forEach(item => {
                          let totalWeight = 0
                          let completedWeight = 0

                          watchedColumns.forEach(link => {
                            const weight = link.weight || 0

                            totalWeight += weight
                            const taskValue = item.values.find(val => val.columnId === link.statusColumnId)

                            if (taskValue && DONE_LABELS.includes(taskValue.value)) {
                              completedWeight += weight
                            }
                          })

                          if (totalWeight === 0) {
                            const doneCount = watchedColumns.filter(link => {
                              const taskValue = item.values.find(val => val.columnId === link.statusColumnId)

                              return taskValue && DONE_LABELS.includes(taskValue.value)
                            }).length

                            totalPercent += watchedColumns.length === 0 ? 0 : (doneCount / watchedColumns.length) * 100
                          } else {
                            totalPercent += totalWeight === 0 ? 0 : (completedWeight / totalWeight) * 100
                          }
                        })

                        const percent = group.items.length === 0 ? 0 : Math.round(totalPercent / group.items.length)

                        summaryContent = (
                          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px' }}>
                            <Box
                              sx={{
                                width: '70%',
                                height: 16,
                                backgroundColor: 'divider',
                                borderRadius: 1,
                                overflow: 'hidden'
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${percent}%`,
                                  height: '100%',
                                  backgroundColor: 'success.main',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </Box>
                            <Typography variant='caption' sx={{ width: '30%', textAlign: 'right' }}>
                              {percent}%
                            </Typography>
                          </Box>
                        )
                      } else {
                        summaryContent = (
                          <Typography variant='caption' className='text-gray-500 px-3'>
                            N/A
                          </Typography>
                        )
                      }
                    }

                    return (
                      <td key={`footer-${column.columnId}`} className='p-2 border-r border-divider text-center'>
                        {summaryContent}
                      </td>
                    )
                  })}
                  <td className='border-r border-divider'></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Button startIcon={<i className='tabler-plus' />} className='!mt-4 !normal-case' onClick={handleCreateGroup}>
        Add new group
      </Button>

      {/* Menu Aksi */}
      <Menu
        anchorEl={menuAnchor.anchorEl}
        open={Boolean(menuAnchor.anchorEl)}
        onClose={() => setMenuAnchor({ anchorEl: null })}
      >
        <MenuItem
          onClick={() =>
            menuAnchor.type === 'task' ? handleDeleteTask(menuAnchor.id) : handleDeleteGroup(menuAnchor.id)
          }
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Panel Detail */}
      {selectedItem && <ItemDetailPanel item={selectedItem} board={board} onClose={() => setSelectedItem(null)} />}

      {/* Popover Edit Sel */}
      {editingCell && (
        <ValueEditorPopover
          anchorEl={editingCell.anchorEl}
          onClose={() => setEditingCell(null)}
          column={{
            ...editingCell.column,
            currentValue: (editingCell.item.values || []).find(
              v => normalizeId(v.columnId) === normalizeId(editingCell.column.columnId)
            )?.value
          }}
          board={board}
          onValueSelect={newValue => handleUpdateValue(editingCell.item, editingCell.column, newValue)}
        />
      )}

      {/* Popover Upload File */}
      <FilesPopover
        anchorEl={filesPopover.anchorEl}
        onClose={() => setFilesPopover({ anchorEl: null, item: null, column: null })}
        item={filesPopover.item}
        column={filesPopover.column}
        onFileUploaded={newValue => {
          handleUpdateValue(filesPopover.item, filesPopover.column, newValue)
        }}
      />

      {/* Menu Pilihan Tipe Kolom */}
      <Menu
        anchorEl={addColumnMenuAnchor}
        open={isAddColumnMenuOpen}
        onClose={handleCloseAddColumnMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ style: { maxHeight: 500, width: '350px' } }}
      >
        <div className='px-4 pt-2 pb-1'>
          <TextField
            fullWidth
            size='small'
            variant='outlined'
            placeholder='Search or describe your column'
            InputProps={{ startAdornment: <i className='tabler-search text-textDisabled mr-2' /> }}
          />
        </div>
        <ListSubheader className='!bg-transparent uppercase font-semibold !text-xs !text-textDisabled'>
          Essentials
        </ListSubheader>
        <div className='grid grid-cols-2 gap-1 px-2'>
          {columnTypes.essentials.map(type => (
            <MenuItem key={type.key} onClick={() => handleColumnTypeSelect(type.key)} className='!rounded-md'>
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: '32px' }}>
                <i className={`${type.icon} text-lg`} />
              </ListItemIcon>
              <ListItemText primary={type.label} primaryTypographyProps={{ variant: 'body2' }} />
            </MenuItem>
          ))}
        </div>
        <ListSubheader className='!bg-transparent uppercase font-semibold !text-xs !text-textDisabled mt-2'>
          Super useful
        </ListSubheader>
        <div className='grid grid-cols-2 gap-1 px-2'>
          {columnTypes.superUseful.map(type => (
            <MenuItem key={type.key} onClick={() => handleColumnTypeSelect(type.key)} className='!rounded-md'>
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: '32px' }}>
                <i className={`${type.icon} text-lg`} />
              </ListItemIcon>
              <ListItemText primary={type.label} primaryTypographyProps={{ variant: 'body2' }} />
            </MenuItem>
          ))}
        </div>
        <Divider className='!my-2' />
        <MenuItem onClick={handleCloseAddColumnMenu} className='justify-center'>
          <Typography variant='body2' color='primary'>
            More columns
          </Typography>
        </MenuItem>
      </Menu>

      {/* Modal Membuat Kolom */}
      <CreateColumnModal
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        boardId={board.boardId}
        onColumnCreated={handleCreateColumn}
        initialType={selectedColumnType}
      />

      {/* Menu Kebab Kolom */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={closeColumnMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleRenameColumn}>
          <ListItemIcon>
            <i className='tabler-pencil text-lg' />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>

        {activeColumn?.columnType === 'PROGRESS' && (
          <MenuItem
            onClick={() => {
              setProgressSettingsModal({ open: true, column: activeColumn })
              closeColumnMenu()
            }}
          >
            <ListItemIcon>
              <i className='tabler-settings text-lg' />
            </ListItemIcon>
            <ListItemText>Progress Settings</ListItemText>
          </MenuItem>
        )}

        <Divider className='!my-1' />
        <MenuItem onClick={handleDuplicateColumn}>
          <ListItemIcon>
            <i className='tabler-copy text-lg' />
          </ListItemIcon>
          <ListItemText>Duplicate column</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAddColumnToRight}>
          <ListItemIcon>
            <i className='tabler-plus text-lg' />
          </ListItemIcon>
          <ListItemText>Add column to the right</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleChangeColumnType}>
          <ListItemIcon>
            <i className='tabler-arrows-exchange text-lg' />
          </ListItemIcon>
          <ListItemText>Change column type</ListItemText>
        </MenuItem>
        <Divider className='!my-1' />
        <MenuItem onClick={handleDeleteColumn} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <i className='tabler-trash text-lg' />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Menu Kalkulasi Footer */}
      <Menu
        anchorEl={calcMenuAnchor}
        open={Boolean(calcMenuAnchor)}
        onClose={handleCloseCalcMenu}
        PaperProps={{ sx: { width: 300 } }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant='caption' className='uppercase font-semibold text-textDisabled'>
            Unit
          </Typography>
          <Box
            sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
          >
            {unitOptions.map(opt => {
              const currentUnit = activeCalcColumn?.unit || null
              const isSelected = currentUnit === opt.value

              return (
                <Button
                  key={opt.label}
                  onClick={() => handleSelectCalcSetting('unit', opt.value)}
                  sx={{
                    minWidth: 40,
                    borderRadius: 0,
                    backgroundColor: isSelected ? 'primary.main' : 'transparent',
                    color: isSelected ? 'white' : 'text.secondary',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderRight: 'none' }
                  }}
                >
                  {opt.label}
                </Button>
              )
            })}
            <TextField
              variant='standard'
              placeholder='Type your own'
              size='small'
              sx={{ flex: 1, px: 1, input: { color: 'text.primary', fontSize: '0.875rem' } }}
            />
          </Box>

          <Typography
            variant='caption'
            className='uppercase font-semibold text-textDisabled'
            sx={{ mt: 1, display: 'block' }}
          >
            Calculation
          </Typography>
          <Box
            sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
          >
            {calcOptions.map(type => {
              const currentCalc = activeCalcColumn?.calculationType || 'Sum'
              const isSelected = type === currentCalc

              return (
                <Button
                  key={type}
                  onClick={() => handleSelectCalcSetting('calc', type)}
                  sx={{
                    flex: 1,
                    borderRadius: 0,
                    backgroundColor: isSelected ? 'primary.main' : 'transparent',
                    color: isSelected ? 'white' : 'text.secondary',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderRight: 'none' },
                    fontSize: '0.875rem',
                    textTransform: 'capitalize'
                  }}
                >
                  {type}
                </Button>
              )
            })}
          </Box>
        </Box>
      </Menu>

      {/* Modal Pengaturan Progress */}
      {progressSettingsModal.open && (
        <ProgressColumnSettingsModal
          open={progressSettingsModal.open}
          onClose={() => setProgressSettingsModal({ open: false, column: null })}
          board={board}
          column={progressSettingsModal.column}
          onSave={handleSaveProgressSettings} // Teruskan fungsi save
        />
      )}
    </div>
  )
}
