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

// =================================================================
// HELPER FUNCTIONS (Global)
// =================================================================
const normalizeId = value => {
  if (value === null || typeof value === 'undefined') return ''

  return String(value)
}

// =================================================================
// COMPONENT DEFINITIONS
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

    if (watchedColumns.length === 0) return { percent: 0, text: 'N/A' }

    const DONE_LABELS = ['Selesai', 'Done']
    let totalWeight = 0
    let completedWeight = 0

    watchedColumns.forEach(link => {
      const weight = link.weight || 0

      totalWeight += weight
      const taskValue = item.values.find(val => normalizeId(val.columnId) === normalizeId(link.statusColumnId))

      if (taskValue && DONE_LABELS.includes(taskValue.value)) {
        completedWeight += weight
      }
    })

    if (totalWeight === 0) {
      const doneCount = watchedColumns.filter(link => {
        const taskValue = item.values.find(val => normalizeId(val.columnId) === normalizeId(link.statusColumnId))

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
    setLabels(prev => [
      ...prev,
      { id: crypto.randomUUID(), label: 'New Label', color: 'bg-gray-400', text: 'text-white' }
    ])
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
    const renameMap = {}

    initialOptions.forEach(originalOpt => {
      const newOpt = labels.find(l => l.id === originalOpt.id)

      if (newOpt && newOpt.label !== originalOpt.label) renameMap[originalOpt.label] = newOpt.label
    })
    const optionsToSave = labels.map(({ id, label, color }) => ({ label, color: color.split(' ')[0] }))

    try {
      const response = await fetch(`/api/columns/${column.columnId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: optionsToSave, renameMap: renameMap })
      })

      if (!response.ok) throw new Error('Failed to save labels')
      mutate(`/api/boards/${board.boardId}`)
      setIsEditingLabels(false)
    } catch (error) {
      console.error('Gagal menyimpan label:', error)
      alert('Gagal menyimpan label.')
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

        if (isEditingLabels) {
          return (
            <Box className='p-3 flex flex-col gap-2' sx={{ width: 300 }}>
              <Typography variant='body2' className='font-semibold'>
                Edit Labels
              </Typography>
              {labels.map(option => (
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

        return (
          <Box className='p-2 flex flex-col gap-2' sx={{ width: 220 }}>
            {labels.map(option => (
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

  const handleFileChange = async event => {
    const file = event.target.files[0]

    if (!file) return
    setIsUploading(true)
    const formData = new FormData()

    formData.append('file', file)

    try {
      const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData })

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
    { label: 'From Computer', icon: 'tabler-microphone', action: () => fileInputRef.current.click() },
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
                      style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
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

  const statusColumns = useMemo(
    () => board.columns.filter(c => c.columnType === 'STATUS' && c.columnId !== column.columnId),
    [board.columns, column.columnId]
  )

  const findWatched = colId =>
    column?.watchedStatusColumns
      ? column.watchedStatusColumns.find(link => normalizeId(link.statusColumnId) === normalizeId(colId))
      : null

  const [columnSettings, setColumnSettings] = useState(() => {
    const initialSettings = {}

    statusColumns.forEach(col => {
      const watched = findWatched(col.columnId)

      initialSettings[col.columnId] = { selected: !!watched, weight: watched?.weight || 0 }
    })

    return initialSettings
  })

  useEffect(() => {
    if (column) {
      const newSettings = {}

      statusColumns.forEach(col => {
        const watched = findWatched(col.columnId)

        newSettings[col.columnId] = { selected: !!watched, weight: watched?.weight || 0 }
      })
      setColumnSettings(newSettings)
    }
  }, [column, statusColumns])

  const handleToggle = columnId => {
    setColumnSettings(prev => {
      if (prev[columnId]) return { ...prev, [columnId]: { ...prev[columnId], selected: !prev[columnId].selected } }

      return prev
    })
  }

  const handleWeightChange = (columnId, weight) => {
    setColumnSettings(prev => {
      if (prev[columnId])
        return { ...prev, [columnId]: { ...prev[columnId], weight: Math.max(0, Math.min(100, parseInt(weight) || 0)) } }

      return prev
    })
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
        if (newSettings[colId] && newSettings[colId].selected) {
          newSettings[colId] = { ...newSettings[colId], weight: equalWeight + (first ? remainder : 0) }
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

      await onSave(statusColumnsData)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-backgroundPaper p-4'>
        <CardContent className='flex flex-col gap-4'>
          <Typography variant='h6'>Progress column settings</Typography>
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
                      InputProps={{ endAdornment: <InputAdornment position='end'>%</InputAdornment> }}
                      sx={{ width: 100 }}
                    />
                  )}
                </Box>
              )
            })}
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

const ColumnVisibilityPopover = ({ anchorEl, onClose, allColumns, hiddenIds, onToggle }) => {
  const open = Boolean(anchorEl)

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <Box sx={{ p: 2, width: 250, maxHeight: 400, overflowY: 'auto' }}>
        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
          Show/Hide Columns
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <FormGroup>
          {allColumns.map(col => {
            const isHidden = hiddenIds.includes(col.columnId)

            return (
              <FormControlLabel
                key={col.columnId}
                control={<Checkbox checked={!isHidden} onChange={() => onToggle(col.columnId)} size='small' />}
                label={<span className='text-sm truncate max-w-[150px] block'>{col.columnName}</span>}
              />
            )
          })}
        </FormGroup>
      </Box>
    </Popover>
  )
}

// =================================================================
// MAIN TABLEVIEW COMPONENT
// =================================================================
export default function TableView({ board }) {
  const { mutate } = useSWRConfig()

  // --- STATES ---
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

  // Visibility States
  const [hiddenColumnIds, setHiddenColumnIds] = useState([])
  const [visMenuAnchor, setVisMenuAnchor] = useState(null)

  // --- NEW STATE: SUB ITEMS EXPANSION ---
  const [expandedItemIds, setExpandedItemIds] = useState([])

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

  const visibleColumns = useMemo(() => {
    return headerColumns.filter(c => !hiddenColumnIds.includes(c.columnId))
  }, [headerColumns, hiddenColumnIds])

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
  const toClientColumnId = columnId => Number(columnId)

  // --- HANDLERS ---

  // NEW: Handler untuk Toggle Sub Item
  const handleToggleSubItems = taskId => {
    setExpandedItemIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]))
  }

  const handleApiCall = async (promise, revalidate = true) => {
    try {
      await promise
      if (revalidate) mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
      console.error('API call failed:', error)
    }
  }

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

  // =======================================================
  // REAL IMPLEMENTATION: Create Sub Task (Connects to Backend)
  // =======================================================
  const handleCreateSubTask = async parentTaskId => {
    // 1. Cari Group ID yang menampung Parent Task
    let targetGroupId = null

    groups.forEach(g => {
      // Cek di top level items
      const found = g.items.find(i => String(i.taskId) === String(parentTaskId))

      if (found) targetGroupId = g.groupId
    })

    if (!targetGroupId) {
      console.error('Parent task group not found.')

      return
    }

    // 2. Call API dengan menyertakan parentId
    await handleApiCall(
      fetch(`/api/groups/${targetGroupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txtTaskTitle: 'New Subitem',
          parentId: parentTaskId // Field penting untuk backend
        })
      })
    )

    // 3. Auto expand parent agar user langsung melihat subitem baru
    if (!expandedItemIds.includes(parentTaskId)) {
      setExpandedItemIds(prev => [...prev, parentTaskId])
    }
  }

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

      if (res.ok) mutate(`/api/boards/${board.boardId}`)
    } catch (e) {
    } finally {
      setIsColumnModalOpen(false)
    }
  }

  const handleUpdateValue = async (itemToUpdate, columnToUpdate, newValue) => {
    const boardApiUrl = `/api/boards/${board.boardId}`
    const originalBoardData = structuredClone(board)
    const sanitizedValue = typeof newValue === 'undefined' || newValue === null ? '' : String(newValue)
    const columnIdNumber = toClientColumnId(columnToUpdate.columnId)
    const newBoardData = structuredClone(board)

    // 1. UPDATE SWR Cache (Global) with Sub-item support
    const group = newBoardData.groups.find(g => String(g.groupId) === String(itemToUpdate.groupId))

    if (group) {
      // Coba cari di Main Items
      let item = group.items.find(i => String(i.taskId) === String(itemToUpdate.taskId))

      // Jika tidak ketemu di main items, lakukan Deep Search ke Subitems
      if (!item) {
        for (const pItem of group.items) {
          if (pItem.subItems) {
            const sub = pItem.subItems.find(s => String(s.taskId) === String(itemToUpdate.taskId))

            if (sub) {
              item = sub
              break
            }
          }
        }
      }

      // Jika item (entah parent atau sub) ditemukan, update nilainya secara optimistik
      if (item) {
        let value = item.values.find(v => String(v.columnId) === String(columnToUpdate.columnId))

        if (value) value.value = sanitizedValue
        else
          item.values.push({
            taskValueId: `temp-${Date.now()}`,
            taskId: item.taskId,
            columnId: columnIdNumber,
            value: sanitizedValue
          })
        mutate(boardApiUrl, newBoardData, { revalidate: false })
      }
    }

    // 2. Clear Editing States
    setEditingCell(null)
    setEditingTextValue(null)

    // 3. Call API
    try {
      const response = await fetch(`/api/tasks/${itemToUpdate.taskId}/values`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intColumn_ID: columnIdNumber, txtValue: sanitizedValue })
      })

      if (!response.ok) mutate(boardApiUrl, originalBoardData, { revalidate: false })
      else mutate(boardApiUrl) // Revalidate to ensure sync
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

  const handleDeleteTask = taskId =>
    handleApiCall(fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })).then(() => setMenuAnchor({ anchorEl: null }))

  const handleDeleteGroup = groupId =>
    handleApiCall(fetch(`/api/groups/${groupId}`, { method: 'DELETE' })).then(() => setMenuAnchor({ anchorEl: null }))

  const handleCellClick = (event, item, column) => {
    if (column.columnName.toLowerCase() === 'item') setSelectedItem(item)
    else if (['TEXT', 'LINK', 'NUMBER'].includes(column.columnType)) {
      const cellValue = (item.values || []).find(val => normalizeId(val.columnId) === normalizeId(column.columnId))

      setEditingTextValue({
        taskId: item.taskId,
        columnId: column.columnId,
        item: item,
        column: column,
        currentValue: cellValue?.value || ''
      })
    } else if (['STATUS', 'PERSON', 'DATE'].includes(column.columnType))
      setEditingCell({ anchorEl: event.currentTarget, item, column })
    else if (column.columnType === 'FILES')
      setFilesPopover({ anchorEl: event.currentTarget, item: item, column: column })
  }

  // --- COLUMN MENUS HANDLERS (SAMA SEPERTI SEBELUMNYA) ---
  const handleOpenAddColumnMenu = event => setAddColumnMenuAnchor(event.currentTarget)
  const handleCloseAddColumnMenu = () => setAddColumnMenuAnchor(null)

  const handleColumnTypeSelect = type => {
    handleCloseAddColumnMenu()
    setSelectedColumnType(type)
    setIsColumnModalOpen(true)
  }

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
    await handleApiCall(
      fetch(`/api/boards/${board.boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txtColumnName: `${activeColumn.columnName} (Copy)`,
          txtColumnType: activeColumn.columnType
        })
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

  const handleToggleColumnVisibility = columnId => {
    setHiddenColumnIds(prev => (prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]))
  }

  const handleHideColumn = () => {
    if (activeColumn) {
      handleToggleColumnVisibility(activeColumn.columnId)
      closeColumnMenu()
    }
  }

  // --- CALCULATION HANDLERS (SAMA SEPERTI SEBELUMNYA) ---
  const getStatusSummary = group => {
    const statusColumnId = board.columns.find(c => c.columnName === 'Status')?.columnId

    if (!statusColumnId) return {}
    const summary = {}

    group.items.forEach(item => {
      const statusValue = (item.values || []).find(v => v.columnId === statusColumnId)?.value

      if (statusValue) summary[statusValue] = (summary[statusValue] || 0) + 1

      // Note: Summary saat ini hanya menghitung Main Item, jika ingin menghitung sub item perlu logic tambahan
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

    if (unit === '%') formattedResult = `${result.toFixed(2)}%`
    else if (unit) formattedResult = `${unit}${new Intl.NumberFormat().format(result)}`
    else formattedResult = new Intl.NumberFormat().format(result)

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
    const columnId = activeCalcColumn.columnId
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

    mutate(`/api/boards/${board.boardId}`, newBoardData, { revalidate: false })
    setHeaderColumns(headerColumns.map(col => (col.columnId === columnId ? columnToUpdate : col)))
    handleCloseCalcMenu()

    try {
      await fetch(`/api/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      mutate(`/api/boards/${board.boardId}`)
    }
  }

  const handleSaveProgressSettings = async statusColumnsData => {
    if (!progressSettingsModal.column) return
    const columnId = progressSettingsModal.column.columnId
    const newBoardData = structuredClone(board)
    const columnToUpdate = newBoardData.columns.find(c => c.columnId === columnId)

    if (!columnToUpdate) return
    columnToUpdate.watchedStatusColumns = statusColumnsData.map(({ statusColumnId, weight }) => {
      const statusCol = board.columns.find(c => c.columnId === statusColumnId)

      return { progressColumnId: columnId, statusColumnId, weight: weight || 0, statusColumn: statusCol }
    })
    mutate(`/api/boards/${board.boardId}`, newBoardData, { revalidate: false })
    setHeaderColumns(headerColumns.map(col => (col.columnId === columnId ? columnToUpdate : col)))
    setProgressSettingsModal({ open: false, column: null })

    try {
      await fetch(`/api/columns/${columnId}/progress-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusColumns: statusColumnsData })
      })
    } catch (error) {
      mutate(`/api/boards/${board.boardId}`)
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

  // --- RENDER HEADER ROW ---
  const renderHeaderRow = (isMainHeader = false) => {
    return (
      <tr
        ref={isMainHeader ? headerRef : null}
        className={`bg-backgroundPaper border-b border-divider ${!isMainHeader ? 'bg-opacity-50' : ''}`}
      >
        <th className={`sticky left-0 top-0 z-30 bg-backgroundPaper p-0 w-12 border-r border-divider`}>
          <div className='flex justify-center'>{isMainHeader ? <Checkbox /> : <div className='w-4 h-4' />}</div>
        </th>
        {visibleColumns?.map(column => (
          <th
            key={column.columnId}
            className={`p-0 text-left text-sm font-semibold text-textPrimary whitespace-nowrap border-r border-divider sticky top-0 z-20 bg-backgroundPaper ${isMainHeader ? 'table-column-draggable' : ''}`}
          >
            <div className='flex items-center justify-between px-3 py-3'>
              <span className='truncate flex items-center gap-2'>
                {isMainHeader && <i className='tabler-arrows-move col-handle text-textSecondary cursor-grab' />}
                {column.columnName}
              </span>
              <IconButton size='small' color='secondary' onClick={e => openColumnMenu(e, column)}>
                <i className='tabler-dots-vertical' />
              </IconButton>
            </div>
          </th>
        ))}
        <th className='w-12 border-r border-divider sticky top-0 z-20 bg-backgroundPaper'>
          {isMainHeader && (
            <IconButton size='small' onClick={handleOpenAddColumnMenu}>
              <i className='tabler-plus text-textSecondary' />
            </IconButton>
          )}
        </th>
      </tr>
    )
  }

  // --- RENDER ROW HELPER (Untuk Parent dan Sub Item) ---
  const renderRow = (item, group, isSubItem = false) => {
    const isExpanded = expandedItemIds.includes(item.taskId)
    const hasSubItems = item.subItems && item.subItems.length > 0

    return (
      <React.Fragment key={item.taskId}>
        <tr className={`hover:bg-action-hover group ${isSubItem ? 'bg-gray-50/50' : ''}`}>
          <td
            className={`sticky left-0 z-10 p-0 w-12 border-r border-divider ${isSubItem ? 'bg-gray-50' : 'bg-backgroundPaper'}`}
          >
            <div className='flex justify-center items-center h-full relative'>
              {/* TOGGLE SUB ITEMS BUTTON (Hanya di parent) */}
              {!isSubItem && (
                <div className='absolute left-0 h-full flex items-center justify-center w-6'>
                  <IconButton
                    size='small'
                    onClick={() => handleToggleSubItems(item.taskId)}
                    className='!p-0.5 text-textSecondary hover:text-textPrimary hover:bg-transparent'
                  >
                    <i className={`text-xs ${isExpanded ? 'tabler-chevron-down' : 'tabler-chevron-right'}`} />
                  </IconButton>
                </div>
              )}

              <Checkbox className={`group-hover:hidden ${!isSubItem ? 'ml-4' : ''}`} size='small' />

              <IconButton
                size='small'
                className='hidden group-hover:block absolute right-0'
                onClick={e => setMenuAnchor({ anchorEl: e.currentTarget, type: 'task', id: item.taskId })}
              >
                <i className='tabler-dots-vertical' />
              </IconButton>
            </div>
          </td>
          {visibleColumns.map(column => {
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
                  className={`flex items-center w-full h-full cursor-pointer ${column.columnType !== 'STATUS' && column.columnType !== 'TEXT' && column.columnName.toLowerCase() !== 'item' ? 'justify-center' : 'justify-start'} ${column.columnType !== 'STATUS' ? 'px-3' : ''}`}
                >
                  {/* Indentasi visual untuk Sub Item pada kolom 'Item' */}
                  {column.columnName.toLowerCase() === 'item' && isSubItem && (
                    <div className='w-6 h-full flex items-center justify-center mr-2 border-l-2 border-divider border-b-2 rounded-bl-md mb-2 ml-4'>
                      {/* L-shape visual line */}
                    </div>
                  )}

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
                      onChange={e => setEditingTextValue({ ...editingTextValue, currentValue: e.target.value })}
                      onBlur={handleSaveTextValue}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveTextValue()
                      }}
                      InputProps={{ disableUnderline: true, className: '!text-textPrimary' }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : column.columnName.toLowerCase() === 'item' ? (
                    <div className='flex items-center gap-2 w-full'>
                      <strong
                        onClick={e => {
                          e.stopPropagation()
                          setEditingTaskName({ taskId: item.taskId, currentName: item.taskTitle })
                          setSelectedItem(null)
                        }}
                        className={`flex-1 truncate ${isSubItem ? 'text-sm font-normal text-textSecondary' : ''}`}
                      >
                        {cellContent}
                      </strong>
                      {!isSubItem && (
                        <div className='text-xs text-textDisabled px-1 border border-divider rounded'>
                          {hasSubItems ? item.subItems.length : 0} sub
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='w-full h-full flex items-center'>{cellContent}</div>
                  )}
                </div>
              </td>
            )
          })}
          <td className='border-r border-divider'></td>
        </tr>

        {/* RENDER SUB ITEMS (RECURSIVE-LIKE BUT FLATTENED FOR TABLE) */}
        {isExpanded &&
          hasSubItems &&
          item.subItems.map(
            subItem => renderRow(subItem, group, true) // Recursive call with isSubItem = true
          )}

        {/* ADD SUB ITEM BUTTON ROW (Optional) */}
        {isExpanded && (
          <tr className='bg-gray-50/50'>
            <td className='sticky left-0 z-10 bg-gray-50 p-0 border-r border-divider'></td>
            <td colSpan={visibleColumns.length + 1} className='p-0 border-r border-divider'>
              <div className='pl-12 pr-2 py-1'>
                <Button
                  size='small'
                  startIcon={<i className='tabler-plus' />}
                  className='!text-textSecondary !text-xs !justify-start'
                  onClick={() => handleCreateSubTask(item.taskId)}
                >
                  Add subitem
                </Button>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    )
  }

  return (
    <div className='relative'>
      <div className='flex justify-end mb-2'>
        <Button
          variant='outlined'
          size='small'
          startIcon={<i className='tabler-layout-columns' />}
          onClick={e => setVisMenuAnchor(e.currentTarget)}
          className='!text-textSecondary !border-divider'
        >
          Columns{' '}
          {hiddenColumnIds.length > 0 && `(${headerColumns.length - hiddenColumnIds.length}/${headerColumns.length})`}
        </Button>
      </div>

      <div className='overflow-auto rounded-lg border border-divider max-h-[calc(100vh-200px)] relative'>
        <table className='min-w-full border-collapse'>
          <thead className='bg-backgroundPaper'>{renderHeaderRow(true)}</thead>
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
                    colSpan={visibleColumns.length + 1}
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

                {renderHeaderRow(false)}

                {/* ITEM LOOP USING HELPER */}
                {group.items?.map(item => renderRow(item, group, false))}

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
                  <td colSpan={visibleColumns.length} className='border-r border-divider'></td>
                </tr>

                {/* FOOTER SUMMARY ROW (SAMA SEPERTI SEBELUMNYA) */}
                <tr className='bg-backgroundPaper border-t border-gray-700'>
                  <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-12 border-r border-divider'></td>
                  {visibleColumns.map(column => {
                    let summaryContent = null
                    const calcType = column.calculationType || 'Sum'
                    const unit = column.unit || null

                    if (column.columnName.toLowerCase() === 'item')
                      summaryContent = (
                        <Typography variant='caption' className='text-gray-400 px-3'>
                          Count: {group.items?.length || 0}
                        </Typography>
                      )
                    else if (column.columnName === 'Status') {
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

      {selectedItem && <ItemDetailPanel item={selectedItem} board={board} onClose={() => setSelectedItem(null)} />}

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

      <FilesPopover
        anchorEl={filesPopover.anchorEl}
        onClose={() => setFilesPopover({ anchorEl: null, item: null, column: null })}
        item={filesPopover.item}
        column={filesPopover.column}
        onFileUploaded={newValue => {
          handleUpdateValue(filesPopover.item, filesPopover.column, newValue)
        }}
      />

      {/* MENUS (Add Column, Column Context, dsb sama seperti sebelumnya) */}
      <Menu
        anchorEl={addColumnMenuAnchor}
        open={isAddColumnMenuOpen}
        onClose={handleCloseAddColumnMenu}
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

      <CreateColumnModal
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        boardId={board.boardId}
        onColumnCreated={handleCreateColumn}
        initialType={selectedColumnType}
      />

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
        <MenuItem onClick={handleHideColumn}>
          <ListItemIcon>
            <i className='tabler-eye-off text-lg' />
          </ListItemIcon>
          <ListItemText>Hide column</ListItemText>
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
              const isSelected = (activeCalcColumn?.unit || null) === opt.value

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
              const isSelected = type === (activeCalcColumn?.calculationType || 'Sum')

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

      {progressSettingsModal.open && (
        <ProgressColumnSettingsModal
          open={progressSettingsModal.open}
          onClose={() => setProgressSettingsModal({ open: false, column: null })}
          board={board}
          column={progressSettingsModal.column}
          onSave={handleSaveProgressSettings}
        />
      )}
      <ColumnVisibilityPopover
        anchorEl={visMenuAnchor}
        onClose={() => setVisMenuAnchor(null)}
        allColumns={headerColumns}
        hiddenIds={hiddenColumnIds}
        onToggle={handleToggleColumnVisibility}
      />
    </div>
  )
}
