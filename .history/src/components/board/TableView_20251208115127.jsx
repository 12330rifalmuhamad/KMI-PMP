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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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

const findUserById = (userId, board) =>
  (board?.boardMember || []).find(m => m.userId === parseInt(userId ?? '', 10))?.mUser

const formatTimelineDate = dateStr => {
  if (!dateStr) return ''
  const date = new Date(dateStr)

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

const getRandomColor = () => {
  const colors = [
    'bg-red-100 text-red-600',
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-yellow-100 text-yellow-600',
    'bg-purple-100 text-purple-600',
    'bg-pink-100 text-pink-600',
    'bg-indigo-100 text-indigo-600',
    'bg-gray-100 text-gray-600'
  ]

  return colors[Math.floor(Math.random() * colors.length)]
}

const colorPalette = [
  'bg-green-100 text-green-600',
  'bg-yellow-100 text-yellow-600',
  'bg-red-100 text-red-600',
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
  'bg-gray-100 text-gray-600',
  'bg-orange-100 text-orange-600',
  'bg-teal-100 text-teal-600'
]

// =================================================================
// CELL COMPONENT DEFINITIONS
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

const TimelineCell = ({ value, column }) => {
  if (!value) return <div className='w-full h-2 bg-gray-200 rounded-full mx-2 opacity-50'></div>
  const [start, end] = value.split(',')

  if (!start || !end) return <span className='text-xs text-red-400'>Set Dates</span>

  const isMilestone = start === end

  const displayRange = isMilestone
    ? formatTimelineDate(start)
    : `${formatTimelineDate(start)} - ${formatTimelineDate(end)}`

  return (
    <div className='w-full px-2 py-1 h-full flex items-center'>
      <div
        className={`flex items-center justify-center text-[11px] text-white font-medium rounded-full bg-[#00c875] hover:bg-[#00b569] h-6 w-full truncate px-2 cursor-pointer transition-colors relative`}
        title={displayRange}
      >
        {isMilestone && <i className='tabler-diamond-filled mr-1 text-[10px]' />}
        {displayRange}
      </div>
    </div>
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

const TagsCell = ({ value, column }) => {
  if (!value) return <span className='text-gray-400 text-xs px-2'>Add tags</span>
  const tags = value.split(',')

  return (
    <div className='flex flex-wrap gap-1 px-2 items-center h-full overflow-hidden'>
      {tags.map((tagLabel, index) => {
        const option = column.options?.find(opt => opt.label === tagLabel)
        const colorClass = option?.color || 'bg-gray-200 text-gray-700'

        if (index > 1) return null

        if (index === 1 && tags.length > 2) {
          return (
            <span
              key='more'
              className='text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-200'
            >
              +{tags.length - 1}
            </span>
          )
        }

        return (
          <span
            key={index}
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[80px] ${colorClass}`}
            title={tagLabel}
          >
            {tagLabel}
          </span>
        )
      })}
    </div>
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

// =================================================================
// REUSABLE BOARD CELL
// =================================================================
const BoardCell = ({ item, column, board, onUpdateValue, onClick }) => {
  const cellValue = (item.values || []).find(val => normalizeId(val.columnId) === normalizeId(column.columnId))

  const handleClick = e => {
    if (onClick) onClick(e)
  }

  if (column.columnName.toLowerCase() === 'item' || column.columnId === 'item_title') {
    return (
      <div className='w-full h-full px-3 flex items-center'>
        <input
          className='bg-transparent w-full outline-none text-sm text-textPrimary truncate border-none p-0 focus:ring-0'
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
    case 'TAGS':
      return (
        <div className='w-full h-full cursor-pointer' onClick={handleClick}>
          <TagsCell value={cellValue?.value} column={column} />
        </div>
      )
    case 'TIMELINE':
      return (
        <div className='w-full h-full flex items-center' onClick={handleClick}>
          <TimelineCell value={cellValue?.value} column={column} />
        </div>
      )
    case 'DATE':
      return (
        <div className='w-full text-center' onClick={handleClick}>
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
          />
        </div>
      )
    case 'FILES':
      return (
        <div onClick={handleClick}>
          <FilesCell value={cellValue?.value} />
        </div>
      )
    case 'LINK':
      return (
        <div className='px-2' onClick={handleClick}>
          <LinkCell value={cellValue?.value} />
        </div>
      )
    case 'NUMBER':
      return (
        <input
          className='bg-transparent w-full text-center outline-none text-xs text-textPrimary truncate border-none focus:ring-0'
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
        <textarea
          className='bg-transparent w-full h-full text-center outline-none text-xs text-textPrimary border-none focus:ring-0 resize-none py-2 px-1'
          value={cellValue?.value || ''}
          placeholder='-'
          onChange={e => onUpdateValue(item, column, e.target.value)}
          onClick={e => e.stopPropagation()}
        />
      )
  }
}

// =================================================================
// SUBITEMS VIEW
// =================================================================
const SubItemsView = ({ parentItem, board, columns, onUpdateValue, onCreateSubitem, onCellClick, onDeleteSubitem }) => {
  const [newSubTitle, setNewSubTitle] = useState('')
  const subItems = parentItem.subItems || []

  const handleKeyDown = e => {
    if (e.key === 'Enter' && newSubTitle.trim()) {
      onCreateSubitem(parentItem.taskId, newSubTitle)
      setNewSubTitle('')
    }
  }

  return (
    <Box sx={{ width: '100%', pl: 5, pr: 0, py: 1, backgroundColor: 'background.default' }}>
      <div className='flex relative'>
        <Box
          sx={{
            position: 'absolute',
            left: -12,
            top: -18,
            bottom: 24,
            width: 16,
            borderLeft: '2px solid',
            borderBottom: '2px solid',
            borderColor: 'divider',
            borderBottomLeftRadius: 12,
            zIndex: 0
          }}
        />
        <Box
          sx={{
            width: '100%',
            backgroundColor: 'background.paper',
            borderLeft: 1,
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: 1,
            zIndex: 10,
            borderRadius: 1
          }}
        >
          <table className='min-w-full border-collapse'>
            <Box component='thead' sx={{ backgroundColor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
              <tr>
                {columns.map(col => (
                  <Box
                    component='th'
                    key={col.columnId}
                    sx={{
                      px: 1,
                      py: 1,
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      borderRight: 1,
                      borderColor: 'divider',
                      textAlign: 'left'
                    }}
                  >
                    {col.columnName}
                  </Box>
                ))}
                <th className='w-8'></th>
              </tr>
            </Box>
            <tbody>
              {subItems.map(sub => (
                <Box
                  component='tr'
                  key={sub.taskId}
                  className='group'
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                    '&:hover': { backgroundColor: 'action.hover' },
                    transition: 'background-color 0.2s'
                  }}
                >
                  {columns.map(col => (
                    <Box
                      component='td'
                      key={`${sub.taskId}-${col.columnId}`}
                      sx={{
                        p: 0,
                        borderRight: 1,
                        borderColor: 'divider',
                        height: 32,
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      <BoardCell
                        item={sub}
                        column={col}
                        board={board}
                        onUpdateValue={onUpdateValue}
                        onClick={e => onCellClick(e, sub, col)}
                      />
                    </Box>
                  ))}
                  <td className='w-8 text-center'>
                    <button
                      className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity'
                      onClick={e => {
                        e.stopPropagation()
                        if (confirm('Delete subitem?')) onDeleteSubitem(parentItem.taskId, sub.taskId)
                      }}
                    >
                      <i className='tabler-trash text-xs'></i>
                    </button>
                  </td>
                </Box>
              ))}
              <tr>
                <Box component='td' colSpan={1} sx={{ borderRight: 1, borderColor: 'divider', p: 0, height: 32 }}>
                  <input
                    type='text'
                    className='w-full h-full px-3 text-sm bg-transparent outline-none placeholder:text-gray-400 transition-colors'
                    placeholder='+ Add subitem'
                    value={newSubTitle}
                    onChange={e => setNewSubTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ color: 'var(--mui-palette-text-primary)' }}
                  />
                </Box>
                <td colSpan={columns.length} className='bg-transparent'></td>
              </tr>
            </tbody>
          </table>
        </Box>
      </div>
    </Box>
  )
}

// =================================================================
// POPOVERS & MODALS
// =================================================================

const TimelinePopover = ({ anchorEl, onClose, item, column, onSave }) => {
  const open = Boolean(anchorEl)
  const cellValue = (item?.values || []).find(v => v.columnId === column?.columnId)?.value
  const [initialStart, initialEnd] = cellValue ? cellValue.split(',') : ['', '']
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(initialStart || today)
  const [endDate, setEndDate] = useState(initialEnd || today)
  const [isMilestone, setIsMilestone] = useState(initialStart && initialEnd && initialStart === initialEnd)

  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0

    return Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
  }, [startDate, endDate])

  const handleSave = () => {
    let finalStart = startDate,
      finalEnd = endDate

    if (isMilestone) finalEnd = finalStart
    else if (new Date(startDate) > new Date(endDate)) {
      finalStart = endDate
      finalEnd = startDate
    }

    onSave(`${finalStart},${finalEnd}`)
    onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{ sx: { width: 340, borderRadius: 2, p: 0 } }}
    >
      <Box sx={{ p: 2 }}>
        <div className='flex justify-between items-center mb-4'>
          <Typography variant='subtitle2' fontWeight='bold'>
            Set dates
          </Typography>
          <Typography variant='caption' className='bg-gray-100 px-2 py-0.5 rounded'>
            {duration} days
          </Typography>
        </div>
        <div className='flex gap-3 mb-4 items-center'>
          <TextField
            type='date'
            size='small'
            fullWidth
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value)
              if (isMilestone) setEndDate(e.target.value)
            }}
            InputLabelProps={{ shrink: true }}
          />
          {!isMilestone && (
            <>
              <div className='text-gray-400 font-bold'>-</div>
              <TextField
                type='date'
                size='small'
                fullWidth
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </div>
        <Divider className='my-3' />
        <div className='flex items-center justify-between'>
          <FormControlLabel
            control={
              <Checkbox
                checked={isMilestone}
                onChange={e => {
                  setIsMilestone(e.target.checked)
                  if (e.target.checked) setEndDate(startDate)
                }}
                size='small'
              />
            }
            label={<Typography variant='body2'>Milestone</Typography>}
          />
          <Button variant='contained' size='small' onClick={handleSave} className='!bg-[#00c875] hover:!bg-[#00b569]'>
            Save
          </Button>
        </div>
      </Box>
    </Popover>
  )
}

const TagsPopover = ({ anchorEl, onClose, item, column, onSave, onAddOption, onManage }) => {
  const open = Boolean(anchorEl)
  const [searchTerm, setSearchTerm] = useState('')
  const cellValue = (item?.values || []).find(v => v.columnId === column?.columnId)?.value
  const selectedTags = useMemo(() => (cellValue ? cellValue.split(',') : []), [cellValue])
  const availableTags = column.options || []
  const filteredTags = availableTags.filter(tag => tag.label.toLowerCase().includes(searchTerm.toLowerCase()))
  const isNewTag = searchTerm && !availableTags.some(t => t.label.toLowerCase() === searchTerm.toLowerCase())

  const handleToggleTag = label => {
    let newTags

    if (selectedTags.includes(label)) newTags = selectedTags.filter(t => t !== label)
    else newTags = [...selectedTags, label]
    onSave(newTags.join(','))
  }

  const handleCreateNewTag = () => {
    if (!searchTerm) return
    const newColor = getRandomColor()

    onAddOption({ label: searchTerm, color: newColor }) // Call parent to update options
    handleToggleTag(searchTerm) // Select it
    setSearchTerm('')
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{ sx: { width: 280, p: 0, borderRadius: 2 } }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          autoFocus
          fullWidth
          size='small'
          placeholder='Find or create a tag...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <i className='tabler-search text-gray-400 mr-2 text-sm' />,
            style: { fontSize: '0.875rem' }
          }}
        />
      </Box>
      <List dense sx={{ maxHeight: 200, overflowY: 'auto', py: 0 }}>
        {filteredTags.map(tag => {
          const isSelected = selectedTags.includes(tag.label)

          return (
            <ListItemButton key={tag.label} onClick={() => handleToggleTag(tag.label)} dense>
              <Checkbox checked={isSelected} size='small' style={{ padding: 4, marginRight: 8 }} />
              <div className={`px-2 py-0.5 rounded text-xs font-medium ${tag.color}`}>{tag.label}</div>
            </ListItemButton>
          )
        })}
        {isNewTag && (
          <ListItemButton onClick={handleCreateNewTag}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <i className='tabler-plus text-primary' />
            </ListItemIcon>
            <ListItemText
              primary={`Create new tag: "${searchTerm}"`}
              primaryTypographyProps={{ variant: 'body2', color: 'primary', fontWeight: 600 }}
            />
          </ListItemButton>
        )}
        {filteredTags.length === 0 && !isNewTag && (
          <Typography variant='caption' className='block text-center py-4 text-gray-400'>
            No tags found
          </Typography>
        )}
      </List>
      <Divider />
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Button
          size='small'
          onClick={onManage}
          sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
        >
          Manage tags
        </Button>
      </Box>
    </Popover>
  )
}

const ManageTagsDialog = ({ open, onClose, column, onUpdateOption, onDeleteOption }) => {
  const [editingId, setEditingId] = useState(null)
  const [tempName, setTempName] = useState('')
  const [colorAnchor, setColorAnchor] = useState(null)
  const [activeColorId, setActiveColorId] = useState(null)

  const tags = column?.options || []

  const handleStartEdit = tag => {
    setEditingId(tag.id || tag.label) // Fallback to label if ID missing (legacy)
    setTempName(tag.label)
  }

  const handleSaveEdit = tag => {
    if (tempName !== tag.label) {
      onUpdateOption({ ...tag, label: tempName })
    }

    setEditingId(null)
  }

  const handleColorClick = (event, tag) => {
    setColorAnchor(event.currentTarget)
    setActiveColorId(tag.id || tag.label)
  }

  const handleColorChange = color => {
    const tag = tags.find(t => (t.id || t.label) === activeColorId)

    if (tag) {
      onUpdateOption({ ...tag, color })
    }

    setColorAnchor(null)
    setActiveColorId(null)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>Manage Tags</DialogTitle>
      <DialogContent dividers>
        <List dense>
          {tags.map((tag, idx) => {
            const isEditing = editingId === (tag.id || tag.label)

            return (
              <Box key={idx} className='flex items-center justify-between py-2 border-b border-gray-100 last:border-0'>
                <div className='flex items-center gap-2 flex-1'>
                  <div
                    className={`w-5 h-5 rounded-full cursor-pointer ${tag.color}`}
                    onClick={e => handleColorClick(e, tag)}
                    title='Change color'
                  />
                  {isEditing ? (
                    <TextField
                      size='small'
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      onBlur={() => handleSaveEdit(tag)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(tag)}
                      autoFocus
                      fullWidth
                    />
                  ) : (
                    <Typography variant='body2' className='cursor-pointer flex-1' onClick={() => handleStartEdit(tag)}>
                      {tag.label}
                    </Typography>
                  )}
                </div>
                <div className='flex gap-1'>
                  {!isEditing && (
                    <IconButton size='small' onClick={() => handleStartEdit(tag)}>
                      <i className='tabler-pencil text-gray-400 text-sm' />
                    </IconButton>
                  )}
                  <IconButton size='small' onClick={() => onDeleteOption(tag)}>
                    <i className='tabler-trash text-gray-400 hover:text-red-500 text-sm' />
                  </IconButton>
                </div>
              </Box>
            )
          })}
          {tags.length === 0 && (
            <Typography variant='caption' className='text-gray-400 text-center block'>
              No tags created yet
            </Typography>
          )}
        </List>
        <ColorPalettePopover
          anchorEl={colorAnchor}
          onClose={() => setColorAnchor(null)}
          onColorSelect={handleColorChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

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
    if (column.columnName.toLowerCase() === 'prioritas')
      return [
        { id: 'p1', label: 'Tinggi', color: 'bg-purple-500/10', text: 'text-purple-400' },
        { id: 'p2', label: 'Medium', color: 'bg-sky-500/10', text: 'text-sky-400' },
        { id: 'p3', label: 'Rendah', color: 'bg-green-500/10', text: 'text-green-400' }
      ]

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
              multiline={column.columnType === 'TEXT'}
              minRows={column.columnType === 'TEXT' ? 2 : 1}
              type={column.columnType === 'NUMBER' ? 'number' : 'text'}
              defaultValue={column.currentValue || ''}
              placeholder={column.columnType === 'LINK' ? 'https://example.com' : ''}
              onBlur={e => {
                onValueSelect(e.target.value)
                onClose()
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && column.columnType !== 'TEXT') {
                  onValueSelect(e.currentTarget.value)
                  onClose()
                } else if (e.key === 'Enter' && e.shiftKey) {
                  e.preventDefault()
                  onValueSelect(e.currentTarget.value)
                  onClose()
                }
              }}
            />
          </div>
        )
      case 'STATUS':
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
                        <IconButton
                          size='small'
                          onClick={() => handleDeleteLabel(option.id)}
                          className='hover:text-red-500'
                        >
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
                variant={column.columnName.toLowerCase() === 'prioritas' ? 'outlined' : 'contained'}
                className={`!font-semibold !justify-start !shadow-none ${option.color} ${option.text}`}
                style={
                  column.columnName.toLowerCase() === 'prioritas' ? { borderColor: option.color.split(' ')[1] } : {}
                }
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
        return <div className='p-2'>Not editable via popover.</div>
    }
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={() => {
        setIsEditingLabels(false)
        setLabels(initialOptions)
        onClose()
      }}
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
              <MenuItem value={'TIMELINE'}>Timeline</MenuItem>
              <MenuItem value={'STATUS'}>Status</MenuItem>
              <MenuItem value={'PERSON'}>People</MenuItem>
              <MenuItem value={'DATE'}>Date</MenuItem>
              <MenuItem value={'NUMBER'}>Numbers</MenuItem>
              <MenuItem value={'CHECKBOX'}>Checkbox</MenuItem>
              <MenuItem value={'TAGS'}>Tags</MenuItem>
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

  const handleToggle = columnId =>
    setColumnSettings(prev => {
      if (prev[columnId]) return { ...prev, [columnId]: { ...prev[columnId], selected: !prev[columnId].selected } }

      return prev
    })

  const handleWeightChange = (columnId, weight) =>
    setColumnSettings(prev => {
      if (prev[columnId])
        return { ...prev, [columnId]: { ...prev[columnId], weight: Math.max(0, Math.min(100, parseInt(weight) || 0)) } }

      return prev
    })

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
        <Box>
          <Button size='small' onClick={handleClearAll} sx={{ mr: 1, textTransform: 'none', color: 'text.secondary' }}>
            Clear all
          </Button>
        </Box>
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
// MAIN TABLEVIEW COMPONENT (OPTIMISTIC UI ENABLED)
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
  const [tagsPopover, setTagsPopover] = useState({ anchorEl: null, item: null, column: null })
  const [manageTagsDialog, setManageTagsDialog] = useState({ open: false, column: null })
  const [calcMenuAnchor, setCalcMenuAnchor] = useState(null)
  const [activeCalcColumn, setActiveCalcColumn] = useState(null)
  const [progressSettingsModal, setProgressSettingsModal] = useState({ open: false, column: null })
  const [timelinePopover, setTimelinePopover] = useState({ anchorEl: null, item: null, column: null })
  const [hiddenColumnIds, setHiddenColumnIds] = useState([])
  const [visMenuAnchor, setVisMenuAnchor] = useState(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [filters, setFilters] = useState([])
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null)
  const [sortAnchor, setSortAnchor] = useState(null)
  const [sortConfig, setSortConfig] = useState({ columnId: null, direction: 'asc' })
  const [expandedItemIds, setExpandedItemIds] = useState([])

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

  useEffect(() => setHeaderColumns(initialColumnsForDnD), [initialColumnsForDnD, setHeaderColumns])

  // --- FILTERING & SORTING LOGIC ---
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

        return sortConfig.direction === 'asc'
          ? String(valA).localeCompare(String(valB))
          : -String(valA).localeCompare(String(valB))
      })

      return { ...group, items: sortedItems }
    })
  }, [groups, filters, sortConfig, board.columns])

  // --- OPTIMISTIC HANDLERS ---

  // 1. CREATE TASK (Optimistic)
  const handleCreateTask = async groupId => {
    const tempId = Date.now() // ID Sementara
    const optimisticTask = { taskId: tempId, taskTitle: newItemTitle || 'New Item', values: [], subItems: [] }

    // UI Update First
    setGroups(prev => prev.map(g => (g.groupId === groupId ? { ...g, items: [...g.items, optimisticTask] } : g)))
    setNewItemTitle('')
    setActiveNewItemInput(null)

    try {
      await fetch(`/api/groups/${groupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: optimisticTask.taskTitle })
      })
      mutate(`/api/boards/${board.boardId}`) // Revalidate to get Real ID
    } catch (e) {
      console.error(e)
    }
  }

  // 2. CREATE GROUP (Optimistic)
  const handleCreateGroup = async () => {
    const tempGroup = { groupId: Date.now(), groupName: 'New Group', groupColor: '#579bfc', items: [] }

    setGroups(prev => [...prev, tempGroup]) // UI First

    try {
      await fetch(`/api/boards/${board.boardId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtGroupName: 'New Group' })
      })
      mutate(`/api/boards/${board.boardId}`)
    } catch (e) {
      console.error(e)
    }
  }

  // 3. CREATE SUBITEM (Optimistic)
  const handleCreateSubitem = async (parentTaskId, title) => {
    const tempSub = { taskId: Date.now(), taskTitle: title, values: [] }

    // UI Update First
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        items: g.items.map(i => (i.taskId === parentTaskId ? { ...i, subItems: [...(i.subItems || []), tempSub] } : i))
      }))
    )

    try {
      await fetch(`/api/tasks/${parentTaskId}/subitems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      mutate(`/api/boards/${board.boardId}`)
    } catch (e) {
      console.error(e)
    }
  }

  // 4. DELETE SUBITEM (Optimistic)
  const handleDeleteSubitem = async (parentTaskId, subitemId) => {
    // UI Update First
    setGroups(prevGroups =>
      prevGroups.map(group => ({
        ...group,
        items: group.items.map(item => {
          if (item.taskId === parentTaskId)
            return { ...item, subItems: item.subItems ? item.subItems.filter(sub => sub.taskId !== subitemId) : [] }

          return item
        })
      }))
    )

    try {
      await fetch(`/api/tasks/${subitemId}`, { method: 'DELETE' })
      mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
      console.error(error)
    }
  }

  // 5. GENERAL UPDATE (Values & Title - Optimistic)
  const handleGeneralUpdate = async (itemToUpdate, columnOrType, newValue) => {
    const isTitle = columnOrType.columnType === 'TITLE'

    // UI Update First (Universal)
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        items: g.items.map(i => {
          // Helper to update specific item (parent or sub)
          const updateItemLogic = currentItem => {
            if (isTitle) return { ...currentItem, taskTitle: newValue }

            const colId = Number(columnOrType.columnId)
            const existing = currentItem.values.find(v => normalizeId(v.columnId) === normalizeId(colId))

            const newValues = existing
              ? currentItem.values.map(v =>
                  normalizeId(v.columnId) === normalizeId(colId) ? { ...v, value: String(newValue) } : v
                )
              : [...(currentItem.values || []), { columnId: colId, value: String(newValue) }]

            return { ...currentItem, values: newValues }
          }

          // Check if this is the item (Parent)
          if (i.taskId === itemToUpdate.taskId) return updateItemLogic(i)

          // Check subitems
          if (i.subItems) {
            const subFound = i.subItems.find(s => s.taskId === itemToUpdate.taskId)

            if (subFound) {
              return {
                ...i,
                subItems: i.subItems.map(s => (s.taskId === itemToUpdate.taskId ? updateItemLogic(s) : s))
              }
            }
          }

          return i
        })
      }))
    )

    // API Call Background
    try {
      if (isTitle) {
        await fetch(`/api/tasks/${itemToUpdate.taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskTitle: newValue })
        })
      } else {
        await fetch(`/api/tasks/${itemToUpdate.taskId}/values`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intColumn_ID: Number(columnOrType.columnId), txtValue: String(newValue) })
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Wrapper for consistency
  const handleUpdateValue = (item, col, val) => handleGeneralUpdate(item, col, val)

  // 6. RENAME TASK (Optimistic wrapper)
  const handleUpdateTaskTitle = (taskId, newTitle) => {
    setEditingTaskName(null)
    handleGeneralUpdate({ taskId }, { columnType: 'TITLE' }, newTitle)
  }

  // 7. RENAME GROUP (Optimistic)
  const handleUpdateGroupName = async (groupId, newName) => {
    setGroups(prev => prev.map(g => (g.groupId === groupId ? { ...g, groupName: newName } : g)))
    setEditingGroupName(null)

    try {
      await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: newName })
      })
    } catch (e) {
      console.error(e)
    }
  }

  // 8. DELETE TASK (Optimistic)
  const handleDeleteTask = async taskId => {
    setMenuAnchor({ anchorEl: null })

    // UI Update First
    setGroups(prev => prev.map(g => ({ ...g, items: g.items.filter(i => i.taskId !== taskId) })))

    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      mutate(`/api/boards/${board.boardId}`)
    } catch (e) {
      console.error(e)
    }
  }

  // 9. DELETE GROUP (Optimistic)
  const handleDeleteGroup = async groupId => {
    setMenuAnchor({ anchorEl: null })

    // UI Update First
    setGroups(prev => prev.filter(g => g.groupId !== groupId))

    try {
      await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
      mutate(`/api/boards/${board.boardId}`)
    } catch (e) {
      console.error(e)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return
    if (!confirm(`Delete ${selectedTaskIds.length} items?`)) return

    setIsBulkDeleting(true)
    const backupGroups = structuredClone(groups) // Backup for revert

    // UI Update First
    setGroups(prev => prev.map(g => ({ ...g, items: g.items.filter(i => !selectedTaskIds.includes(i.taskId)) })))
    setSelectedTaskIds([])

    try {
      await Promise.all(selectedTaskIds.map(id => fetch(`/api/tasks/${id}`, { method: 'DELETE' })))
      mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
      setGroups(backupGroups) // Revert on error
      alert('Failed delete.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // --- STANDARD HANDLERS (View Only / Column Meta) ---
  const handleToggleSelectAll = () => {
    selectedTaskIds.length === allTaskIds.length ? setSelectedTaskIds([]) : setSelectedTaskIds(allTaskIds)
  }

  const handleToggleSelectRow = taskId => {
    setSelectedTaskIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]))
  }

  const toggleExpandItem = taskId => {
    setExpandedItemIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]))
  }

  const handleCreateColumn = async columnData => {
    // Columns are harder to optimistic update due to schema, keeping standard for now
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

  const handleSaveTextValue = () => {
    if (!editingTextValue) return
    handleUpdateValue(editingTextValue.item, editingTextValue.column, editingTextValue.currentValue)
    setEditingTextValue(null)
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
    else if (column.columnType === 'TIMELINE')
      setTimelinePopover({ anchorEl: event.currentTarget, item: item, column: column })
    else if (column.columnType === 'TAGS') setTagsPopover({ anchorEl: event.currentTarget, item: item, column: column })
  }

  // --- COLUMN OPTION HANDLER (ADD/UPDATE/DELETE) ---
  const handleModifyColumnOptions = async (columnId, action, payload) => {
    // 1. Update State (Optimistic)
    setHeaderColumns(prev =>
      prev.map(col => {
        if (col.columnId === columnId) {
          const currentOptions = col.options || []

          if (action === 'ADD') {
            if (currentOptions.some(o => o.label === payload.label)) return col

            return { ...col, options: [...currentOptions, payload] }
          }

          if (action === 'UPDATE') {
            return {
              ...col,
              options: currentOptions.map(o => ((o.id || o.label) === (payload.id || payload.label) ? payload : o))
            }
          }

          if (action === 'DELETE') {
            return { ...col, options: currentOptions.filter(o => (o.id || o.label) !== (payload.id || payload.label)) }
          }
        }

        return col
      })
    )

    // 2. Prepare full new options array for backend
    const updatedColumn = headerColumns.find(c => c.columnId === columnId)
    let newOptions = updatedColumn?.options || []

    // Apply logic to newOptions array to get the final state to send
    if (action === 'ADD') newOptions = [...newOptions, payload]
    if (action === 'UPDATE')
      newOptions = newOptions.map(o => ((o.id || o.label) === (payload.id || payload.label) ? payload : o))
    if (action === 'DELETE') newOptions = newOptions.filter(o => (o.id || o.label) !== (payload.id || payload.label))

    // 3. API Call
    try {
      await fetch(`/api/columns/${columnId}/options`, {
        method: 'PUT', // Assuming PUT replaces options
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: newOptions })
      })
    } catch (e) {
      console.error(e)
    }
  }

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

  // Column Operations (Keep standard async for now as they affect structure)
  const handleRenameColumn = async () => {
    if (!activeColumn) return
    const newName = prompt('Rename:', activeColumn.columnName)

    if (!newName) return
    await fetch(`/api/columns/${activeColumn.columnId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txtColumnName: newName.trim() })
    })
    setHeaderColumns(cols => cols.map(c => (c.columnId === activeColumn.columnId ? { ...c, columnName: newName } : c)))
    closeColumnMenu()
  }

  const handleDeleteColumn = async () => {
    if (!activeColumn || !confirm('Delete column?')) return
    await fetch(`/api/columns/${activeColumn.columnId}`, { method: 'DELETE' })
    setHeaderColumns(cols => cols.filter(c => c.columnId !== activeColumn.columnId))
    closeColumnMenu()
  }

  const handleDuplicateColumn = async () => {
    if (!activeColumn) return
    await fetch(`/api/boards/${board.boardId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txtColumnName: `${activeColumn.columnName} (Copy)`,
        txtColumnType: activeColumn.columnType
      })
    })
    closeColumnMenu()
    mutate(`/api/boards/${board.boardId}`)
  }

  const handleAddColumnToRight = async () => {
    await handleCreateColumn({ txtColumnName: 'New Column', txtColumnType: 'TEXT' })
    closeColumnMenu()
  }

  const handleChangeColumnType = async () => {
    if (!activeColumn) return
    const next = prompt(`Change type:`, activeColumn.columnType)

    if (!next) return
    await fetch(`/api/columns/${activeColumn.columnId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txtColumnType: next })
    })
    closeColumnMenu()
    mutate(`/api/boards/${board.boardId}`)
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
    const payload = type === 'calc' ? { txtCalculationType: value } : { txtUnit: value }
    const updatedCol = { ...activeCalcColumn, [type === 'calc' ? 'calculationType' : 'unit']: value }

    setHeaderColumns(prev => prev.map(c => (c.columnId === activeCalcColumn.columnId ? updatedCol : c)))
    handleCloseCalcMenu()

    try {
      await fetch(`/api/columns/${activeCalcColumn.columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (e) {}
  }

  const handleSaveProgressSettings = async data => {
    setProgressSettingsModal({ open: false, column: null })
    mutate(`/api/boards/${board.boardId}`)
  } // Simplified for brevity

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
      { key: 'DATE', label: 'Date', icon: 'tabler-calendar' },
      { key: 'NUMBER', label: 'Numbers', icon: 'tabler-hash' }
    ],
    superUseful: [
      { key: 'TIMELINE', label: 'Timeline', icon: 'tabler-timeline' },
      { key: 'FILES', label: 'Files', icon: 'tabler-file' },
      { key: 'TAGS', label: 'Tags', icon: 'tabler-tags' },
      { key: 'LINK', label: 'Link', icon: 'tabler-link' },
      { key: 'PROGRESS', label: 'Progress', icon: 'tabler-progress' },
      { key: 'CHECKBOX', label: 'Checkbox', icon: 'tabler-checkbox' },
      { key: 'FORMULA', label: 'Formula', icon: 'tabler-variable' }
    ]
  }

  // --- CALCULATION HELPERS ---
  const getStatusSummary = group => {
    const statusColumnId = board.columns.find(c => c.columnName === 'Status')?.columnId

    if (!statusColumnId) return {}
    const summary = {}

    group.items.forEach(item => {
      const statusValue = (item.values || []).find(v => v.columnId === statusColumnId)?.value

      if (statusValue) summary[statusValue] = (summary[statusValue] || 0) + 1
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

  const renderHeaderRow = (isMainHeader = false) => {
    const isAllSelected = allTaskIds.length > 0 && selectedTaskIds.length === allTaskIds.length
    const isIndeterminate = selectedTaskIds.length > 0 && selectedTaskIds.length < allTaskIds.length

    return (
      <tr
        ref={isMainHeader ? headerRef : null}
        className={`bg-backgroundPaper border-b border-divider ${!isMainHeader ? 'bg-opacity-50' : ''}`}
      >
        <th className={`sticky left-0 top-0 z-30 bg-backgroundPaper p-0 w-12 border-r border-divider`}>
          <div className='flex justify-center'>
            {isMainHeader ? (
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleToggleSelectAll}
                size='small'
              />
            ) : (
              <div className='w-4 h-4' />
            )}
          </div>
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

  // =================================================================
  // MAIN RENDER
  // =================================================================
  return (
    <div className='relative'>
      <div className='flex justify-between items-center mb-2'>
        <div className='flex gap-2'>
          <Button
            variant={filters.length > 0 ? 'contained' : 'outlined'}
            size='small'
            startIcon={<i className='tabler-filter' />}
            onClick={e => setFilterMenuAnchor(e.currentTarget)}
            className={`!border-divider ${filters.length === 0 ? '!text-textSecondary' : ''}`}
          >
            Filter {filters.length > 0 && `(${filters.length})`}
          </Button>
          <Button
            variant={sortConfig.columnId ? 'contained' : 'outlined'}
            size='small'
            startIcon={<i className='tabler-arrows-sort' />}
            onClick={e => setSortAnchor(e.currentTarget)}
            className={`!border-divider ${!sortConfig.columnId ? '!text-textSecondary' : ''}`}
          >
            Sort {sortConfig.columnId ? '/ 1 Rule' : ''}
          </Button>
        </div>
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
            {processedGroups?.map(group => (
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
                {group.items?.map(item => {
                  const isSelected = selectedTaskIds.includes(item.taskId)

                  return (
                    <React.Fragment key={item.taskId}>
                      <tr
                        className={`group hover:bg-action-hover ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                      >
                        <td className='sticky left-0 z-10 bg-backgroundPaper p-0 w-12 border-r border-divider'>
                          <div className='flex justify-center items-center h-full relative'>
                            <div
                              className={`${isSelected ? 'block' : 'hidden group-hover:block'} ${isSelected ? '' : 'absolute'} z-20 bg-backgroundPaper`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleSelectRow(item.taskId)}
                                size='small'
                                className='!p-1'
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
                                <i className='tabler-dots-vertical' />
                              </IconButton>
                            )}
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
                                  <PersonAvatar user={cellValue ? findUserById(cellValue.value, board) : null} />
                                </div>
                              )
                              break
                            case 'STATUS':
                              cellContent = <StatusCell value={cellValue?.value} column={column} />
                              break
                            case 'TAGS':
                              cellContent = (
                                <div
                                  className='w-full h-full cursor-pointer'
                                  onClick={e => {
                                    if (!isEditingItemTitle && !isEditingTextValue) handleCellClick(e, item, column)
                                  }}
                                >
                                  <TagsCell value={cellValue?.value} column={column} />
                                </div>
                              )
                              break
                            case 'TIMELINE':
                              cellContent = (
                                <div
                                  className='w-full h-full flex items-center'
                                  onClick={e => {
                                    if (!isEditingItemTitle && !isEditingTextValue) handleCellClick(e, item, column)
                                  }}
                                >
                                  <TimelineCell value={cellValue?.value} column={column} />
                                </div>
                              )
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
                                    size='small'
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
                              if (column.columnName.toLowerCase() === 'item') {
                                cellContent = (
                                  <div className='flex items-center gap-2'>
                                    <div
                                      className='cursor-pointer p-1 hover:bg-gray-200 rounded transition-colors flex items-center justify-center'
                                      onClick={e => {
                                        e.stopPropagation()
                                        toggleExpandItem(item.taskId)
                                      }}
                                    >
                                      <i
                                        className={`tabler-chevron-right text-gray-400 transition-transform ${expandedItemIds.includes(item.taskId) ? 'rotate-90' : ''}`}
                                      />
                                    </div>
                                    <span className='truncate'>{item.taskTitle}</span>
                                    {(item.subItems?.length || 0) > 0 && (
                                      <span className='text-[10px] bg-gray-100 text-gray-500 px-1 rounded border ml-1'>
                                        {item.subItems.length}
                                      </span>
                                    )}
                                  </div>
                                )
                              } else {
                                cellContent = <span className='whitespace-pre-wrap'>{cellValue?.value || '—'}</span>
                              }

                              break
                            default:
                              cellContent = <span>{cellValue?.value || '—'}</span>
                              break
                          }

                          return (
                            <td
                              key={`${item.taskId}-${column.columnId}`}
                              className={`p-0 h-10 border-r border-divider`}
                            >
                              <div
                                onClick={e => {
                                  if (
                                    column.columnType === 'TAGS' ||
                                    column.columnType === 'TIMELINE' ||
                                    column.columnType === 'FILES'
                                  ) {
                                    // Specific types handled inside their cellContent wrappers to prevent bubbling issues or allow specific click zones
                                  } else {
                                    if (isEditingItemTitle || isEditingTextValue) return
                                    handleCellClick(e, item, column)
                                  }
                                }}
                                className={`flex items-center w-full h-full cursor-pointer ${column.columnType !== 'STATUS' && column.columnType !== 'TEXT' && column.columnName.toLowerCase() !== 'item' ? 'justify-center' : 'justify-start'} ${column.columnType !== 'STATUS' ? 'px-3' : ''}`}
                              >
                                {isEditingItemTitle ? (
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
                                ) : isEditingTextValue ? (
                                  <TextField
                                    autoFocus
                                    fullWidth
                                    multiline={column.columnType === 'TEXT'}
                                    minRows={1}
                                    maxRows={4}
                                    variant='standard'
                                    type={column.columnType === 'NUMBER' ? 'number' : 'text'}
                                    value={editingTextValue.currentValue}
                                    onChange={e =>
                                      setEditingTextValue({ ...editingTextValue, currentValue: e.target.value })
                                    }
                                    onBlur={handleSaveTextValue}
                                    onKeyDown={e => {
                                      if (column.columnType === 'TEXT') {
                                        if (e.key === 'Enter' && !e.shiftKey) e.stopPropagation()

                                        if (e.key === 'Enter' && e.shiftKey) {
                                          e.preventDefault()
                                          handleSaveTextValue()
                                        }
                                      } else {
                                        if (e.key === 'Enter') handleSaveTextValue()
                                      }
                                    }}
                                    InputProps={{ disableUnderline: true, className: '!text-textPrimary' }}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ) : column.columnName.toLowerCase() === 'item' ? (
                                  <div
                                    onClick={e => {
                                      e.stopPropagation()
                                      setEditingTaskName({ taskId: item.taskId, currentName: item.taskTitle })
                                      setSelectedItem(null)
                                    }}
                                    className='w-full'
                                  >
                                    {cellContent}
                                  </div>
                                ) : (
                                  <div className='w-full h-full'>{cellContent}</div>
                                )}
                              </div>
                            </td>
                          )
                        })}
                        <td className='border-r border-divider'></td>
                      </tr>
                      {expandedItemIds.includes(item.taskId) && (
                        <tr className='bg-backgroundPaper'>
                          <td className='border-r border-divider'></td>
                          <td colSpan={visibleColumns.length} className='p-0 border-r border-divider relative'>
                            <SubItemsView
                              parentItem={item}
                              board={board}
                              columns={visibleColumns}
                              onCreateSubitem={handleCreateSubitem}
                              onUpdateValue={handleGeneralUpdate}
                              onCellClick={handleCellClick}
                              onDeleteSubitem={handleDeleteSubitem}
                            />
                          </td>
                          <td className='border-r border-divider'></td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
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

      {/* --- MENUS & MODALS --- */}
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
        onFileUploaded={newValue => handleUpdateValue(filesPopover.item, filesPopover.column, newValue)}
      />
      {timelinePopover.anchorEl && (
        <TimelinePopover
          anchorEl={timelinePopover.anchorEl}
          onClose={() => setTimelinePopover({ anchorEl: null, item: null, column: null })}
          item={timelinePopover.item}
          column={timelinePopover.column}
          onSave={newValue => handleUpdateValue(timelinePopover.item, timelinePopover.column, newValue)}
        />
      )}

      {/* TAGS POPOVER & MANAGER */}
      {tagsPopover.anchorEl && (
        <TagsPopover
          anchorEl={tagsPopover.anchorEl}
          onClose={() => setTagsPopover({ anchorEl: null, item: null, column: null })}
          item={tagsPopover.item}
          column={tagsPopover.column}
          onSave={newValue => handleUpdateValue(tagsPopover.item, tagsPopover.column, newValue)}
          onAddOption={newOption => handleModifyColumnOptions(tagsPopover.column.columnId, 'ADD', newOption)}
          onManage={() => {
            setManageTagsDialog({ open: true, column: tagsPopover.column })
            setTagsPopover({ anchorEl: null, item: null, column: null })
          }}
        />
      )}
      <ManageTagsDialog
        open={manageTagsDialog.open}
        onClose={() => setManageTagsDialog({ open: false, column: null })}
        column={manageTagsDialog.column}
        onUpdateOption={option => handleModifyColumnOptions(manageTagsDialog.column.columnId, 'UPDATE', option)}
        onDeleteOption={option => handleModifyColumnOptions(manageTagsDialog.column.columnId, 'DELETE', option)}
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
      {selectedTaskIds.length > 0 && (
        <div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 shadow-xl border border-divider rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300'>
          <div className='flex items-center gap-2 border-r border-divider pr-4'>
            <div className='bg-primary main text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center'>
              {selectedTaskIds.length}
            </div>
            <Typography variant='subtitle2' className='font-semibold'>
              Selected
            </Typography>
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
