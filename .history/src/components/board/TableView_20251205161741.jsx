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
  Grid,
  useTheme
} from '@mui/material'

import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import ItemDetailPanel from './ItemDetailPanel'

// =================================================================
// HELPER FUNCTIONS (Global)
// =================================================================
const normalizeId = value => {
  if (value === null || typeof value === 'undefined') return ''

  return String(value)
}

const findUserById = (userId, board) =>
  (board?.boardMember || []).find(m => m.userId === parseInt(userId ?? '', 10))?.mUser

// =================================================================
// CELL COMPONENT DEFINITIONS
// =================================================================

const PersonAvatar = ({ user }) => {
  if (!user) {
    return (
      <MuiAvatar
        sx={{ width: 28, height: 28, bgcolor: 'action.selected', color: 'text.disabled', fontSize: '1rem' }}
        title='Unassigned'
      >
        <i className='tabler-user-off' />
      </MuiAvatar>
    )
  }

  return (
    <MuiAvatar sx={{ width: 28, height: 28, fontSize: '0.875rem' }} title={user.userName} src={user.avatarUrl}>
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
        text:
          opt.color.includes('/10') || opt.color.includes('gray') ? 'text-gray-600 dark:text-gray-300' : 'text-white'
      }))
    }

    if (column.columnName.toLowerCase() === 'prioritas') {
      return [
        { label: 'Tinggi', color: 'bg-purple-500/10', text: 'text-purple-500 dark:text-purple-300' },
        { label: 'Medium', color: 'bg-sky-500/10', text: 'text-sky-500 dark:text-sky-300' },
        { label: 'Rendah', color: 'bg-green-500/10', text: 'text-green-500 dark:text-green-300' }
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
    const colors = option
      ? `${option.color} ${option.text}`
      : 'text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600'
    const borderClass =
      option && option.color.includes('/10')
        ? `border border-${option.color.split('-')[1]}-200 dark:border-${option.color.split('-')[1]}-800`
        : ''

    return (
      <div
        className={`flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${colors} ${borderClass}`}
      >
        {displayText}
      </div>
    )
  }

  const colors = option
    ? `${option.color} ${option.text}`
    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'

  return (
    <div className={`flex items-center justify-center w-full h-full text-xs font-bold ${colors}`}>{displayText}</div>
  )
}

const DateCell = ({ value }) => {
  if (!value) return <span className='text-gray-400 dark:text-gray-500'>—</span>

  return (
    <span className='text-gray-700 dark:text-gray-300'>
      {new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
    </span>
  )
}

const FilesCell = ({ value }) => {
  const fileCount = value ? value.split(',').length : 0

  return (
    <div className='flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400'>
      <i className='tabler-paperclip' />
      <span>{fileCount > 0 ? fileCount : '-'}</span>
    </div>
  )
}

const LinkCell = ({ value }) => {
  if (!value) return <span className='text-gray-400 dark:text-gray-500'>—</span>
  let href = value

  if (!href.startsWith('http://') && !href.startsWith('https://')) {
    href = 'https://' + href
  }

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='text-primary hover:underline truncate'
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

      if (taskValue && DONE_LABELS.includes(taskValue.value)) completedWeight += weight
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
      <Box sx={{ width: '70%', height: 6, backgroundColor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${progress.percent}%`,
            height: '100%',
            backgroundColor: progress.percent === 100 ? 'success.main' : 'primary.main',
            transition: 'width 0.3s ease',
            borderRadius: 1
          }}
        />
      </Box>
      <Typography variant='caption' sx={{ width: '30%', textAlign: 'right', color: 'text.secondary' }}>
        {progress.text}
      </Typography>
    </Box>
  )
}

// =================================================================
// REUSABLE BOARD CELL (Light/Dark Compatible)
// =================================================================
const BoardCell = ({ item, column, board, onUpdateValue, onClick }) => {
  const cellValue = (item.values || []).find(val => normalizeId(val.columnId) === normalizeId(column.columnId))

  const handleClick = e => {
    if (onClick) onClick(e)
  }

  // Vuexy-like Input Styles
  const inputClass =
    'bg-transparent w-full outline-none text-sm text-gray-700 dark:text-[#E1DEF5] truncate border-none p-0 focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-600'

  // 1. Handle Kolom Nama (Title)
  if (column.columnName.toLowerCase() === 'item' || column.columnId === 'item_title') {
    return (
      <div className='w-full h-full px-3 flex items-center'>
        <input
          className={`${inputClass} font-medium`}
          value={item.taskTitle}
          onChange={e => onUpdateValue(item, { columnType: 'TITLE' }, e.target.value)}
          onClick={e => e.stopPropagation()}
        />
      </div>
    )
  }

  switch (column.columnType) {
    case 'PERSON':
      return (
        <div className='flex justify-center w-full' onClick={handleClick}>
          <PersonAvatar user={cellValue ? findUserById(cellValue.value, board) : null} />
        </div>
      )
    case 'STATUS':
      return (
        <div className='w-full h-full' onClick={handleClick}>
          <StatusCell value={cellValue?.value} column={column} />
        </div>
      )
    case 'DATE':
      return (
        <div className='w-full text-center cursor-pointer' onClick={handleClick}>
          <DateCell value={cellValue?.value} />
        </div>
      )
    case 'CHECKBOX':
      return (
        <div className='flex justify-center w-full'>
          <Checkbox
            checked={cellValue?.value === 'true'}
            onChange={e => onUpdateValue(item, column, e.target.checked.toString())}
            onClick={e => e.stopPropagation()}
            size='small'
            sx={{ color: 'text.secondary' }}
          />
        </div>
      )
    case 'FILES':
      return (
        <div onClick={handleClick} className='cursor-pointer'>
          <FilesCell value={cellValue?.value} />
        </div>
      )
    case 'LINK':
      return (
        <div className='px-2 cursor-pointer' onClick={handleClick}>
          <LinkCell value={cellValue?.value} />
        </div>
      )
    case 'NUMBER':
      return (
        <input
          className={`${inputClass} text-center`}
          type='number'
          value={cellValue?.value || ''}
          placeholder='-'
          onChange={e => onUpdateValue(item, column, e.target.value)}
          onClick={e => e.stopPropagation()}
        />
      )
    case 'PROGRESS':
      return (
        <div className='px-2 w-full'>
          <ProgressCell item={item} column={column} />
        </div>
      )
    case 'TEXT':
    default:
      return (
        <input
          className={`${inputClass} text-center`}
          value={cellValue?.value || ''}
          placeholder='-'
          onChange={e => onUpdateValue(item, column, e.target.value)}
          onClick={e => e.stopPropagation()}
        />
      )
  }
}

// =================================================================
// DYNAMIC SUBITEMS VIEW (VUEXY STYLED)
// =================================================================
const SubItemsView = ({ parentItem, board, columns, onUpdateValue, onCreateSubitem, onCellClick }) => {
  const [newSubTitle, setNewSubTitle] = useState('')
  const subItems = parentItem.subItems || []

  const handleKeyDown = e => {
    if (e.key === 'Enter' && newSubTitle.trim()) {
      onCreateSubitem(parentItem.taskId, newSubTitle)
      setNewSubTitle('')
    }
  }

  // Define Vuexy Colors
  // Light: background-default (#F8F7FA), Border (#DBDADE)
  // Dark: background-default (#25293C), Paper (#2F3349), Border (#434968)

  return (
    // Outer Container: Matches Vuexy "Body" background to distinguish from Main Item "Paper"
    <Box
      sx={{ width: '100%', pl: 5, pr: 0, py: 1 }}
      className='bg-[#F8F7FA] dark:bg-[#25293C]' // Vuexy Default Background
    >
      <div className='flex relative'>
        {/* L-Shape Connector */}
        <div className='absolute -left-3 top-[-24px] bottom-6 w-4 border-l-2 border-b-2 border-gray-300 dark:border-[#434968] rounded-bl-xl z-0 pointer-events-none'></div>

        {/* Subitem Card Container */}
        <div className='w-full bg-white dark:bg-[#2F3349] border border-gray-200 dark:border-[#434968] rounded-md overflow-hidden shadow-sm z-10'>
          <table className='min-w-full border-collapse'>
            <thead>
              {/* Header: Slightly off-white in light, slightly lighter dark in dark mode */}
              <tr className='bg-gray-50 dark:bg-[#3F445E] border-b border-gray-200 dark:border-[#434968]'>
                {columns.map(col => (
                  <th
                    key={col.columnId}
                    className='px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-[#B6BEE3] uppercase border-r border-gray-200 dark:border-[#434968] text-left tracking-wider'
                  >
                    {col.columnName}
                  </th>
                ))}
                <th className='w-8'></th>
              </tr>
            </thead>

            <tbody>
              {subItems.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className='p-3 text-center text-xs text-gray-400 dark:text-gray-500 italic'
                  >
                    No subitems. Add one below.
                  </td>
                </tr>
              )}
              {subItems.map(sub => (
                <tr
                  key={sub.taskId}
                  className='group hover:bg-gray-50 dark:hover:bg-[#363b54] border-b border-gray-200 dark:border-[#434968] last:border-0 transition-colors'
                >
                  {columns.map(col => (
                    <td
                      key={`${sub.taskId}-${col.columnId}`}
                      className='p-0 border-r border-gray-200 dark:border-[#434968] h-9 relative cursor-pointer'
                    >
                      <BoardCell
                        item={sub}
                        column={col}
                        board={board}
                        onUpdateValue={onUpdateValue}
                        onClick={e => onCellClick(e, sub, col)}
                      />
                    </td>
                  ))}

                  {/* Delete Action */}
                  <td className='w-8 text-center'>
                    <button className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-opacity'>
                      <i className='tabler-trash text-xs'></i>
                    </button>
                  </td>
                </tr>
              ))}

              {/* Input New Subitem Row */}
              <tr>
                <td
                  className='border-r border-gray-200 dark:border-[#434968] p-0 h-10 bg-white dark:bg-[#2F3349]'
                  colSpan={1}
                >
                  <input
                    type='text'
                    className='w-full h-full px-3 text-sm bg-transparent outline-none text-gray-700 dark:text-[#E1DEF5] placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors'
                    placeholder='+ Add subitem'
                    value={newSubTitle}
                    onChange={e => setNewSubTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </td>
                {/* Empty cells for design consistency */}
                <td colSpan={columns.length} className='bg-transparent dark:bg-[#2F3349]'></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Box>
  )
}

// ... (Komponen Popover lainnya)
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

  const handleLabelChange = (id, newText) =>
    setLabels(prev => prev.map(opt => (opt.id === id ? { ...opt, label: newText } : opt)))
  const handleDeleteLabel = id => setLabels(prev => prev.filter(opt => opt.id !== id))
  const handleAddNewLabel = () =>
    setLabels(prev => [
      ...prev,
      { id: crypto.randomUUID(), label: 'New Label', color: 'bg-gray-400', text: 'text-white' }
    ])
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

      if (!response.ok) throw new Error('Failed to save')
      mutate(`/api/boards/${board.boardId}`)
      setIsEditingLabels(false)
    } catch (error) {
      console.error(error)
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
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton size='small' onClick={() => handleDeleteLabel(option.id)}>
                          <i className='tabler-trash text-sm' />
                        </IconButton>
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
                  Apply
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
              className='!normal-case'
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
        return <div className='p-2'>Not editable</div>
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

    return cellValue.split(',').map(url => ({
      url,
      name: url
        .split('/')
        .pop()
        .substring(url.indexOf('_') + 1)
    }))
  }, [cellValue])

  const handleFileChange = async event => {
    const file = event.target.files[0]

    if (!file) return
    setIsUploading(true)
    const formData = new FormData()

    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })

      if (!res.ok) throw new Error()
      const result = await res.json()
      const newValue = cellValue ? `${cellValue},${result.url}` : result.url

      await onFileUploaded(newValue)
    } catch {
      alert('Upload failed')
    } finally {
      setIsUploading(false)
      onClose()
    }
  }

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
              <ListSubheader>Uploaded Files</ListSubheader>
              {files.map(f => (
                <ListItemButton key={f.url} component='a' href={f.url} target='_blank'>
                  <ListItemIcon>
                    <i className='tabler-file-text' />
                  </ListItemIcon>
                  <ListItemText primary={f.name} />
                </ListItemButton>
              ))}
              <Divider sx={{ my: 1 }} />
            </>
          )}
          <ListItemButton onClick={() => fileInputRef.current.click()}>
            <ListItemIcon>
              <i className='tabler-microphone' />
            </ListItemIcon>
            <ListItemText primary='From Computer' />
          </ListItemButton>
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
  const [columnSettings, setColumnSettings] = useState({})

  return (
    <Modal open={open} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-backgroundPaper p-4'>
        <CardContent>
          <Typography variant='h6'>Progress Settings</Typography>
          <Button onClick={() => onSave([])}>Save (Dummy)</Button>
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
          {allColumns.map(col => (
            <FormControlLabel
              key={col.columnId}
              control={
                <Checkbox
                  checked={!hiddenIds.includes(col.columnId)}
                  onChange={() => onToggle(col.columnId)}
                  size='small'
                />
              }
              label={col.columnName}
            />
          ))}
        </FormGroup>
      </Box>
    </Popover>
  )
}

const FilterPopover = ({ anchorEl, onClose, columns, filters, setFilters }) => {
  const open = Boolean(anchorEl)
  const operators = [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' }
  ]
  const handleAddFilter = () =>
    setFilters([...filters, { id: Date.now(), columnId: '', operator: 'contains', value: '' }])
  const handleRemoveFilter = id => setFilters(filters.filter(f => f.id !== id))
  const handleFilterChange = (id, field, value) =>
    setFilters(filters.map(f => (f.id === id ? { ...f, [field]: value } : f)))
  const handleClearAll = () => setFilters([])

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { width: 600, p: 0, borderRadius: 2 } }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant='subtitle1' fontWeight='bold'>
          Advanced filters
        </Typography>
        <Button size='small' onClick={handleClearAll} sx={{ mr: 1, textTransform: 'none', color: 'text.secondary' }}>
          Clear all
        </Button>
      </Box>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filters.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
            No filters applied. Click Add new filter to start.
          </Typography>
        ) : (
          filters.map((filter, index) => (
            <Box key={filter.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant='body2' sx={{ width: 50, color: 'text.secondary', fontWeight: 'medium' }}>
                {index === 0 ? 'Where' : 'And'}
              </Typography>
              <FormControl size='small' sx={{ width: 150 }}>
                <Select
                  value={filter.columnId}
                  onChange={e => handleFilterChange(filter.id, 'columnId', e.target.value)}
                  displayEmpty
                  renderValue={selected => {
                    if (!selected) return <span className='text-gray-400'>Column</span>
                    if (selected === 'item_title') return 'Item Name'

                    return columns.find(c => c.columnId === selected)?.columnName || 'Unknown'
                  }}
                >
                  <MenuItem value='item_title'>Item Name</MenuItem>
                  {columns.map(col => (
                    <MenuItem key={col.columnId} value={col.columnId}>
                      {col.columnName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ width: 150 }}>
                <Select
                  value={filter.operator}
                  onChange={e => handleFilterChange(filter.id, 'operator', e.target.value)}
                >
                  {operators.map(op => (
                    <MenuItem key={op.value} value={op.value}>
                      {op.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size='small'
                placeholder='Value'
                value={filter.value}
                onChange={e => handleFilterChange(filter.id, 'value', e.target.value)}
                sx={{ flex: 1 }}
                disabled={filter.operator === 'is_empty' || filter.operator === 'is_not_empty'}
              />
              <IconButton size='small' onClick={() => handleRemoveFilter(filter.id)}>
                <i className='tabler-x' />
              </IconButton>
            </Box>
          ))
        )}
        <Button
          startIcon={<i className='tabler-plus' />}
          onClick={handleAddFilter}
          sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
        >
          Add new filter
        </Button>
      </Box>
    </Popover>
  )
}

const SortPopover = ({ anchorEl, onClose, columns, sortConfig, onSortChange }) => {
  const open = Boolean(anchorEl)

  const sortOptions = [
    { id: 'item_title', label: 'Item Name', icon: 'tabler-t' },
    ...columns.map(col => {
      let icon = 'tabler-t'

      if (col.columnType === 'STATUS') icon = 'tabler-progress-check'
      if (col.columnType === 'DATE') icon = 'tabler-calendar'
      if (col.columnType === 'NUMBER') icon = 'tabler-hash'
      if (col.columnType === 'PERSON') icon = 'tabler-users'

      return { id: col.columnId, label: col.columnName, icon }
    })
  ]

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { width: 320, p: 2, borderRadius: 2 } }}
    >
      <div className='flex justify-between items-center mb-3'>
        <Typography variant='subtitle2' fontWeight='bold' className='flex items-center gap-1'>
          Sort by <i className='tabler-help-circle text-textDisabled text-xs' />
        </Typography>
        {sortConfig.columnId && (
          <Button
            size='small'
            variant='text'
            color='error'
            onClick={() => onSortChange(null, 'asc')}
            className='!text-xs !min-w-0 !p-1'
          >
            Clear
          </Button>
        )}
      </div>
      <div className='flex gap-2'>
        <FormControl fullWidth size='small'>
          <Select
            value={sortConfig.columnId || ''}
            displayEmpty
            onChange={e => onSortChange(e.target.value, sortConfig.direction)}
            renderValue={selected => {
              if (!selected) return <span className='text-gray-400'>Choose column</span>
              const opt = sortOptions.find(o => String(o.id) === String(selected))

              return opt ? opt.label : selected
            }}
          >
            <MenuItem disabled value=''>
              <em>Choose column</em>
            </MenuItem>
            {sortOptions.map(option => (
              <MenuItem key={option.id} value={option.id}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <i className={`${option.icon} text-textSecondary`} />
                </ListItemIcon>
                <ListItemText primary={option.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 110 }}>
          <Select value={sortConfig.direction} onChange={e => onSortChange(sortConfig.columnId, e.target.value)}>
            <MenuItem value='asc'>Ascending</MenuItem>
            <MenuItem value='desc'>Descending</MenuItem>
          </Select>
        </FormControl>
      </div>
      <Typography variant='caption' className='mt-2 block text-textDisabled text-center'>
        Sorts items within their groups
      </Typography>
    </Popover>
  )
}

// =================================================================
// MAIN TABLEVIEW COMPONENT
// =================================================================
export default function TableView({ board }) {
  const { mutate } = useSWRConfig()
  const theme = useTheme()

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

  // View States
  const [hiddenColumnIds, setHiddenColumnIds] = useState([])
  const [visMenuAnchor, setVisMenuAnchor] = useState(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [expandedItemIds, setExpandedItemIds] = useState([]) // Subitem expand

  // Filter & Sort
  const [filters, setFilters] = useState([])
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null)
  const [sortAnchor, setSortAnchor] = useState(null)
  const [sortConfig, setSortConfig] = useState({ columnId: null, direction: 'asc' })

  const allTaskIds = useMemo(() => groups.flatMap(group => group.items.map(item => item.taskId)), [groups])

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
  const visibleColumns = useMemo(
    () => headerColumns.filter(c => !hiddenColumnIds.includes(c.columnId)),
    [headerColumns, hiddenColumnIds]
  )

  useEffect(() => {
    setHeaderColumns(initialColumnsForDnD)
  }, [initialColumnsForDnD, setHeaderColumns])

  const toClientColumnId = columnId => Number(columnId)

  // Logic Filtering & Sorting (Unified)
  const processedGroups = useMemo(() => {
    const filteredData = groups.map(group => {
      const filteredItems = group.items.filter(item => {
        return filters.every(filter => {
          if (!filter.columnId) return true
          let itemValue = ''

          if (filter.columnId === 'item_title') itemValue = item.taskTitle || ''
          else {
            const valObj = item.values.find(v => normalizeId(v.columnId) === normalizeId(filter.columnId))

            itemValue = valObj ? valObj.value : ''
          }

          const filterVal = filter.value ? filter.value.toLowerCase() : ''
          const strItemValue = String(itemValue).toLowerCase()

          switch (filter.operator) {
            case 'contains':
              return strItemValue.includes(filterVal)
            case 'not_contains':
              return !strItemValue.includes(filterVal)
            case 'is':
              return strItemValue === filterVal
            case 'is_not':
              return strItemValue !== filterVal
            case 'starts_with':
              return strItemValue.startsWith(filterVal)
            case 'ends_with':
              return strItemValue.endsWith(filterVal)
            case 'is_empty':
              return !itemValue || itemValue === ''
            case 'is_not_empty':
              return itemValue && itemValue !== ''
            default:
              return true
          }
        })
      })

      return { ...group, items: filteredItems }
    })

    if (!sortConfig.columnId) return filteredData

    return filteredData.map(group => {
      const sortedItems = [...group.items].sort((a, b) => {
        let valA = '',
          valB = ''

        if (sortConfig.columnId === 'item_title') {
          valA = a.taskTitle || ''
          valB = b.taskTitle || ''
        } else {
          const vA = a.values.find(val => normalizeId(val.columnId) === normalizeId(sortConfig.columnId))

          valA = vA ? vA.value : ''
          const vB = b.values.find(val => normalizeId(val.columnId) === normalizeId(sortConfig.columnId))

          valB = vB ? vB.value : ''
        }

        const columnDef = board.columns.find(c => normalizeId(c.columnId) === normalizeId(sortConfig.columnId))
        const type = columnDef ? columnDef.columnType : 'TEXT'
        let comparison = 0

        if (type === 'NUMBER') comparison = (parseFloat(valA) || 0) - (parseFloat(valB) || 0)
        else if (type === 'DATE')
          comparison = (valA ? new Date(valA).getTime() : 0) - (valB ? new Date(valB).getTime() : 0)
        else comparison = String(valA).localeCompare(String(valB))

        return sortConfig.direction === 'asc' ? comparison : -comparison
      })

      return { ...group, items: sortedItems }
    })
  }, [groups, filters, sortConfig, board.columns])

  const handleApiCall = async promise => {
    try {
      await promise
      mutate(`/api/boards/${board.boardId}`)
    } catch (e) {
      console.error(e)
    }
  }
  const handleToggleSelectAll = () => setSelectedTaskIds(selectedTaskIds.length === allTaskIds.length ? [] : allTaskIds)
  const handleToggleSelectRow = taskId =>
    setSelectedTaskIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]))
  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return
    if (!confirm(`Delete ${selectedTaskIds.length} items?`)) return
    setIsBulkDeleting(true)
    try {
      await Promise.all(selectedTaskIds.map(id => fetch(`/api/tasks/${id}`, { method: 'DELETE' })))
      mutate(`/api/boards/${board.boardId}`)
      setSelectedTaskIds([])
    } catch {
      alert('Failed')
    } finally {
      setIsBulkDeleting(false)
    }
  }
  const toggleExpandItem = taskId =>
    setExpandedItemIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]))
  const handleCreateSubitem = async (parentTaskId, title) => {
    try {
      await fetch(`/api/tasks/${parentTaskId}/subitems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      mutate(`/api/boards/${board.boardId}`)
    } catch {
      alert('Gagal membuat subitem')
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
    } catch {
    } finally {
      setIsColumnModalOpen(false)
    }
  }

  const handleDeleteTask = taskId =>
    handleApiCall(fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })).then(() => setMenuAnchor({ anchorEl: null }))
  const handleDeleteGroup = groupId =>
    handleApiCall(fetch(`/api/groups/${groupId}`, { method: 'DELETE' })).then(() => setMenuAnchor({ anchorEl: null }))
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

  const handleGeneralUpdate = async (itemToUpdate, columnOrType, newValue) => {
    if (columnOrType.columnType === 'TITLE') {
      const newTitle = newValue
      const endpoint = `/api/tasks/${itemToUpdate.taskId}`

      setGroups(prev =>
        prev.map(g => ({
          ...g,
          items: g.items.map(i => {
            if (i.taskId === itemToUpdate.taskId) return { ...i, taskTitle: newTitle }

            if (i.subItems) {
              const updatedSubs = i.subItems.map(sub =>
                sub.taskId === itemToUpdate.taskId ? { ...sub, taskTitle: newTitle } : sub
              )

              return { ...i, subItems: updatedSubs }
            }

            return i
          })
        }))
      )
      try {
        await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskTitle: newTitle })
        })
      } catch (e) {
        console.error(e)
      }

      return
    }

    const columnToUpdate = columnOrType
    const sanitizedValue = String(newValue ?? '')
    const columnIdNumber = Number(columnToUpdate.columnId)

    setGroups(prevGroups => {
      return prevGroups.map(g => ({
        ...g,
        items: g.items.map(i => {
          const updateValues = values => {
            const existing = values.find(v => normalizeId(v.columnId) === normalizeId(columnToUpdate.columnId))

            if (existing)
              return values.map(v =>
                normalizeId(v.columnId) === normalizeId(columnToUpdate.columnId) ? { ...v, value: sanitizedValue } : v
              )

            return [...values, { columnId: columnIdNumber, value: sanitizedValue }]
          }

          if (i.taskId === itemToUpdate.taskId) {
            return { ...i, values: updateValues(i.values || []) }
          }

          if (i.subItems) {
            const subFound = i.subItems.find(s => s.taskId === itemToUpdate.taskId)

            if (subFound) {
              const newSubs = i.subItems.map(s =>
                s.taskId === itemToUpdate.taskId ? { ...s, values: updateValues(s.values || []) } : s
              )

              return { ...i, subItems: newSubs }
            }
          }

          return i
        })
      }))
    })
    try {
      await fetch(`/api/tasks/${itemToUpdate.taskId}/values`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intColumn_ID: columnIdNumber, txtValue: sanitizedValue })
      })
      mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
      console.error(error)
    }
  }

  const handleUpdateValue = async (item, col, val) => handleGeneralUpdate(item, col, val)
  const handleSaveTextValue = () => {
    if (!editingTextValue) return
    handleUpdateValue(editingTextValue.item, editingTextValue.column, editingTextValue.currentValue)
  }

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

  // ... (Menus: Column, Rename, Delete, etc. - Handlers)
  const handleOpenAddColumnMenu = e => setAddColumnMenuAnchor(e.currentTarget)
  const handleCloseAddColumnMenu = () => setAddColumnMenuAnchor(null)
  const handleColumnTypeSelect = t => {
    handleCloseAddColumnMenu()
    setSelectedColumnType(t)
    setIsColumnModalOpen(true)
  }
  const openColumnMenu = (e, c) => {
    setColumnMenuAnchor(e.currentTarget)
    setActiveColumn(c)
  }
  const closeColumnMenu = () => {
    setColumnMenuAnchor(null)
    setActiveColumn(null)
  }

  const handleRenameColumn = async () => {
    if (!activeColumn) return
    const newName = prompt('Rename:', activeColumn.columnName)

    if (!newName) return
    await handleApiCall(
      fetch(`/api/columns/${activeColumn.columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtColumnName: newName })
      })
    )
    setHeaderColumns(cols => cols.map(c => (c.columnId === activeColumn.columnId ? { ...c, columnName: newName } : c)))
    closeColumnMenu()
  }

  const handleDeleteColumn = async () => {
    if (!activeColumn || !confirm('Delete column?')) return
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
    await handleCreateColumn({ txtColumnName: 'New Column', txtColumnType: 'TEXT' })
    closeColumnMenu()
  }

  const handleChangeColumnType = async () => {
    const next = prompt('New type:', activeColumn.columnType)

    if (!next) return
    await handleApiCall(
      fetch(`/api/columns/${activeColumn.columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtColumnType: next })
      })
    )
    closeColumnMenu()
  }

  const handleHideColumn = () => {
    if (activeColumn) {
      setHiddenColumnIds(prev => [...prev, activeColumn.columnId])
      closeColumnMenu()
    }
  }
  const handleOpenCalcMenu = (e, c) => {
    setCalcMenuAnchor(e.currentTarget)
    setActiveCalcColumn(c)
  }
  const handleCloseCalcMenu = () => {
    setCalcMenuAnchor(null)
    setActiveCalcColumn(null)
  }

  const handleSelectCalcSetting = async (t, v) => {
    if (!activeCalcColumn) return
    const col = activeCalcColumn
    const payload = t === 'calc' ? { txtCalculationType: v } : { txtUnit: v }

    mutate(`/api/boards/${board.boardId}`)
    setHeaderColumns(
      headerColumns.map(c =>
        c.columnId === col.columnId ? { ...c, ...(t === 'calc' ? { calculationType: v } : { unit: v }) } : c
      )
    )
    handleCloseCalcMenu()
    try {
      await fetch(`/api/columns/${col.columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch {
      mutate(`/api/boards/${board.boardId}`)
    }
  }

  const getStatusSummary = group => {
    const sId = board.columns.find(c => c.columnName === 'Status')?.columnId

    if (!sId) return {}
    const sum = {}

    group.items.forEach(i => {
      const val = i.values.find(v => v.columnId === sId)?.value

      if (val) sum[val] = (sum[val] || 0) + 1
    })

    return sum
  }

  const calculateSummary = (items, colId, type) => {
    const vals = items
      .map(i => parseFloat(i.values.find(v => normalizeId(v.columnId) === normalizeId(colId))?.value) || 0)
      .filter(v => v !== 0)

    if (vals.length === 0) return 0
    if (type === 'Sum') return vals.reduce((a, b) => a + b, 0)
    if (type === 'Average') return vals.reduce((a, b) => a + b, 0) / vals.length
    if (type === 'Min') return Math.min(...vals)
    if (type === 'Max') return Math.max(...vals)
    if (type === 'Count') return vals.length

    return 0
  }

  const formatCalculation = (res, unit, type) => {
    if (unit === '%') return `${res.toFixed(2)}%`

    return `${type}: ${unit ? unit : ''}${new Intl.NumberFormat().format(res)}`
  }

  const renderHeaderRow = (isMainHeader = false) => {
    return (
      <tr
        ref={isMainHeader ? headerRef : null}
        className={`bg-backgroundPaper border-b border-gray-200 dark:border-gray-700 ${!isMainHeader ? 'opacity-50' : ''}`}
      >
        <th
          className={`sticky left-0 top-0 z-30 bg-backgroundPaper p-0 w-10 border-r border-gray-200 dark:border-gray-700`}
        >
          <div className='flex justify-center'>
            {isMainHeader ? (
              <Checkbox
                size='small'
                checked={selectedTaskIds.length === allTaskIds.length && allTaskIds.length > 0}
                onChange={handleToggleSelectAll}
              />
            ) : (
              <div className='w-4 h-4' />
            )}
          </div>
        </th>
        {visibleColumns?.map(column => (
          <th
            key={column.columnId}
            className={`p-0 text-left text-sm font-semibold text-textPrimary whitespace-nowrap border-r border-gray-200 dark:border-gray-700 sticky top-0 z-20 bg-backgroundPaper ${isMainHeader ? 'table-column-draggable' : ''}`}
          >
            <div className='flex items-center justify-between px-3 py-3'>
              <span className='truncate flex items-center gap-2'>
                {isMainHeader && <i className='tabler-arrows-move col-handle text-textSecondary cursor-grab' />}
                {column.columnName}
              </span>
              <IconButton size='small' onClick={e => openColumnMenu(e, column)}>
                {' '}
                <i className='tabler-dots-vertical text-textSecondary' />{' '}
              </IconButton>
            </div>
          </th>
        ))}
        <th className='w-10 border-r border-gray-200 dark:border-gray-700 sticky top-0 z-20 bg-backgroundPaper'>
          {isMainHeader && (
            <IconButton size='small' onClick={handleOpenAddColumnMenu}>
              <i className='tabler-plus text-textSecondary' />
            </IconButton>
          )}
        </th>
      </tr>
    )
  }

  // =================================================================
  // MAIN RENDER
  // =================================================================
  return (
    <div className='relative'>
      <div className='flex justify-between items-center mb-4'>
        <div className='flex gap-2'>
          <Button
            variant='outlined'
            size='small'
            startIcon={<i className='tabler-filter' />}
            onClick={e => setFilterMenuAnchor(e.currentTarget)}
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          >
            Filter
          </Button>
          <Button
            variant='outlined'
            size='small'
            startIcon={<i className='tabler-arrows-sort' />}
            onClick={e => setSortAnchor(e.currentTarget)}
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          >
            Sort
          </Button>
        </div>
        <Button
          variant='outlined'
          size='small'
          startIcon={<i className='tabler-layout-columns' />}
          onClick={e => setVisMenuAnchor(e.currentTarget)}
          sx={{ borderColor: 'divider', color: 'text.secondary' }}
        >
          Columns
        </Button>
      </div>

      <div className='overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-200px)] relative bg-white dark:bg-[#2F3349]'>
        <table className='min-w-full border-collapse'>
          <thead className='bg-backgroundPaper'>{renderHeaderRow(true)}</thead>
          <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
            {processedGroups?.map(group => (
              <React.Fragment key={group.groupId}>
                <tr className='bg-backgroundPaper group hover:bg-gray-50 dark:hover:bg-[#363b54] transition-colors'>
                  <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-10 border-r border-gray-200 dark:border-gray-700'>
                    <IconButton
                      size='small'
                      className='opacity-0 group-hover:opacity-100'
                      onClick={e => setMenuAnchor({ anchorEl: e.currentTarget, type: 'group', id: group.groupId })}
                    >
                      <i className='tabler-dots-vertical' />
                    </IconButton>
                  </td>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className='p-3 font-bold text-textPrimary'
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
                        variant='subtitle1'
                        sx={{ color: group.groupColor }}
                        onClick={() => setEditingGroupName({ groupId: group.groupId, currentName: group.groupName })}
                        className='cursor-pointer'
                      >
                        {group.groupName}
                      </Typography>
                    )}
                  </td>
                </tr>
                {renderHeaderRow(false)}
                {group.items?.map(item => {
                  const isSelected = selectedTaskIds.includes(item.taskId)

                  return (
                    <React.Fragment key={item.taskId}>
                      <tr
                        className={`group hover:bg-gray-50 dark:hover:bg-[#363b54] transition-colors border-b border-gray-200 dark:border-gray-700`}
                      >
                        <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-10 border-r border-gray-200 dark:border-gray-700'>
                          <div className='flex justify-center items-center h-full relative'>
                            <div
                              className={`${isSelected ? 'block' : 'hidden group-hover:block'} ${isSelected ? '' : 'absolute'} z-20 bg-backgroundPaper`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleSelectRow(item.taskId)}
                                size='small'
                                sx={{ '&.Mui-checked': { color: 'primary.main' } }}
                              />
                            </div>
                            {!isSelected && (
                              <IconButton
                                size='small'
                                className='hidden group-hover:block absolute z-10'
                                onClick={e =>
                                  setMenuAnchor({ anchorEl: e.currentTarget, type: 'task', id: item.taskId })
                                }
                              >
                                <i className='tabler-dots-vertical text-textSecondary' />
                              </IconButton>
                            )}
                          </div>
                        </td>
                        {visibleColumns.map(column => {
                          const cellValue = (item.values || []).find(
                            val => normalizeId(val.columnId) === normalizeId(column.columnId)
                          )
                          let content = (
                            <BoardCell
                              item={item}
                              column={column}
                              board={board}
                              onUpdateValue={handleGeneralUpdate}
                              onClick={e => handleCellClick(e, item, column)}
                            />
                          )

                          if (column.columnName.toLowerCase() === 'item') {
                            content = (
                              <div className='flex items-center gap-2 w-full'>
                                <div
                                  className='cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center justify-center text-gray-400'
                                  onClick={e => {
                                    e.stopPropagation()
                                    toggleExpandItem(item.taskId)
                                  }}
                                >
                                  <i
                                    className={`tabler-chevron-right transition-transform ${expandedItemIds.includes(item.taskId) ? 'rotate-90' : ''}`}
                                  />
                                </div>
                                <div className='flex-1 min-w-0'>
                                  {editingTaskName?.taskId === item.taskId ? (
                                    <TextField
                                      autoFocus
                                      fullWidth
                                      variant='standard'
                                      value={editingTaskName.currentName}
                                      onChange={e =>
                                        setEditingTaskName({ ...editingTaskName, currentName: e.target.value })
                                      }
                                      onBlur={() => handleUpdateTaskTitle(item.taskId, editingTaskName.currentName)}
                                      onKeyDown={e =>
                                        e.key === 'Enter' &&
                                        handleUpdateTaskTitle(item.taskId, editingTaskName.currentName)
                                      }
                                      InputProps={{
                                        disableUnderline: true,
                                        className: '!text-textPrimary !font-semibold'
                                      }}
                                      onClick={e => e.stopPropagation()}
                                    />
                                  ) : (
                                    <div
                                      className='truncate font-medium cursor-pointer'
                                      onClick={e => {
                                        e.stopPropagation()
                                        setEditingTaskName({ taskId: item.taskId, currentName: item.taskTitle })
                                      }}
                                    >
                                      {item.taskTitle}
                                    </div>
                                  )}
                                </div>
                                {(item.subItems?.length || 0) > 0 && (
                                  <span className='text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 rounded-sm'>
                                    {item.subItems.length}
                                  </span>
                                )}
                              </div>
                            )
                          }

                          return (
                            <td
                              key={`${item.taskId}-${column.columnId}`}
                              className={`p-0 h-10 border-r border-gray-200 dark:border-gray-700`}
                            >
                              <div className={`flex items-center w-full h-full px-2`}>{content}</div>
                            </td>
                          )
                        })}
                        <td className='border-r border-gray-200 dark:border-gray-700'></td>
                      </tr>
                      {expandedItemIds.includes(item.taskId) && (
                        <tr className='bg-backgroundPaper'>
                          <td className='border-r border-gray-200 dark:border-gray-700'></td>
                          <td
                            colSpan={visibleColumns.length}
                            className='p-0 border-r border-gray-200 dark:border-gray-700 relative'
                          >
                            <SubItemsView
                              parentItem={item}
                              board={board}
                              columns={visibleColumns}
                              onCreateSubitem={handleCreateSubitem}
                              onUpdateValue={handleGeneralUpdate}
                              onCellClick={handleCellClick}
                            />
                          </td>
                          <td className='border-r border-gray-200 dark:border-gray-700'></td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                {/* Footer Group (Summaries) */}
                <tr className='bg-backgroundPaper border-t border-gray-700'>
                  <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-12 border-r border-gray-200 dark:border-gray-700'></td>
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
                      <td
                        key={`footer-${column.columnId}`}
                        className='p-2 border-r border-gray-200 dark:border-gray-700 text-center'
                      >
                        {summaryContent}
                      </td>
                    )
                  })}
                  <td className='border-r border-gray-200 dark:border-gray-700'></td>
                </tr>
                {/* Add Item Row */}
                <tr className='bg-backgroundPaper'>
                  <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-10 border-r border-gray-200 dark:border-gray-700'></td>
                  <td className='p-2 text-textSecondary border-r border-gray-200 dark:border-gray-700'>
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
                      <div
                        className='flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer'
                        onClick={() => setActiveNewItemInput(group.groupId)}
                      >
                        <i className='tabler-plus mr-2' /> Add Item
                      </div>
                    )}
                  </td>
                  <td colSpan={visibleColumns.length} className='border-r border-gray-200 dark:border-gray-700'></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        startIcon={<i className='tabler-plus' />}
        className='!mt-4 !normal-case'
        variant='contained'
        onClick={handleCreateGroup}
      >
        Add new group
      </Button>
      {/* Menu & Modals */}
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
      <FilterPopover
        anchorEl={filterMenuAnchor}
        onClose={() => setFilterMenuAnchor(null)}
        columns={board?.columns || []}
        filters={filters}
        setFilters={setFilters}
      />
      <SortPopover
        anchorEl={sortAnchor}
        onClose={() => setSortAnchor(null)}
        columns={board?.columns || []}
        sortConfig={sortConfig}
        onSortChange={(colId, dir) => setSortConfig({ columnId: colId, direction: dir })}
      />
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
            placeholder='Search...'
            InputProps={{ startAdornment: <i className='tabler-search text-textDisabled mr-2' /> }}
          />
        </div>
        <ListSubheader>Essentials</ListSubheader>
        <div className='grid grid-cols-2 gap-1 px-2'>
          {columnTypes.essentials.map(t => (
            <MenuItem key={t.key} onClick={() => handleColumnTypeSelect(t.key)}>
              <ListItemIcon>
                <i className={t.icon} />
              </ListItemIcon>
              <ListItemText primary={t.label} />
            </MenuItem>
          ))}
        </div>
      </Menu>
      <CreateColumnModal
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        boardId={board.boardId}
        onColumnCreated={handleCreateColumn}
        initialType={selectedColumnType}
      />
      <Menu anchorEl={columnMenuAnchor} open={Boolean(columnMenuAnchor)} onClose={closeColumnMenu}>
        <MenuItem onClick={handleRenameColumn}>
          <ListItemIcon>
            <i className='tabler-pencil' />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleHideColumn}>
          <ListItemIcon>
            <i className='tabler-eye-off' />
          </ListItemIcon>
          <ListItemText>Hide</ListItemText>
        </MenuItem>
        {activeColumn?.columnType === 'PROGRESS' && (
          <MenuItem
            onClick={() => {
              setProgressSettingsModal({ open: true, column: activeColumn })
              closeColumnMenu()
            }}
          >
            <ListItemIcon>
              <i className='tabler-settings' />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleDuplicateColumn}>
          <ListItemIcon>
            <i className='tabler-copy' />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAddColumnToRight}>
          <ListItemIcon>
            <i className='tabler-plus' />
          </ListItemIcon>
          <ListItemText>Add Right</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleChangeColumnType}>
          <ListItemIcon>
            <i className='tabler-arrows-exchange' />
          </ListItemIcon>
          <ListItemText>Type</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteColumn} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <i className='tabler-trash' />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      <Menu anchorEl={calcMenuAnchor} open={Boolean(calcMenuAnchor)} onClose={handleCloseCalcMenu}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant='caption'>Unit</Typography>
          <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider' }}>
            {unitOptions.map(opt => (
              <Button key={opt.label} onClick={() => handleSelectCalcSetting('unit', opt.value)}>
                {opt.label}
              </Button>
            ))}
          </Box>
          <Typography variant='caption'>Calculation</Typography>
          <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider' }}>
            {calcOptions.map(t => (
              <Button key={t} onClick={() => handleSelectCalcSetting('calc', t)}>
                {t}
              </Button>
            ))}
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
      {selectedTaskIds.length > 0 && (
        <div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 shadow-xl border border-divider rounded-full px-6 py-3 flex items-center gap-4'>
          <div className='bg-primary main text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center'>
            {selectedTaskIds.length}
          </div>
          <Button
            variant='text'
            color='error'
            startIcon={isBulkDeleting ? <CircularProgress size={16} color='error' /> : <i className='tabler-trash' />}
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
          >
            Delete
          </Button>
          <IconButton size='small' onClick={() => setSelectedTaskIds([])}>
            <i className='tabler-x' />
          </IconButton>
        </div>
      )}
    </div>
  )
}
