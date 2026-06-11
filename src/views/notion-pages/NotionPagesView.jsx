'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import useSWR from 'swr'
import { Box, Button, Divider, IconButton, Menu, MenuItem, Popover, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const fetcher = async url => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))

    throw new Error(error.message || 'Request failed')
  }

  return res.json()
}

const blockTypes = [
  { type: 'paragraph', label: 'Text', icon: 'tabler-letter-t' },
  { type: 'heading1', label: 'Heading 1', icon: 'tabler-h-1' },
  { type: 'heading2', label: 'Heading 2', icon: 'tabler-h-2' },
  { type: 'heading3', label: 'Heading 3', icon: 'tabler-h-3' },
  { type: 'heading4', label: 'Heading 4', icon: 'tabler-h-4' },
  { type: 'quote', label: 'Quote', icon: 'tabler-quote' },
  { type: 'code', label: 'Code', icon: 'tabler-code' },
  { type: 'table', label: 'Table', icon: 'tabler-table' },
  { type: 'todo', label: 'To-do list', icon: 'tabler-list-check' },
  { type: 'bulleted', label: 'Bulleted list', icon: 'tabler-list' },
  { type: 'numbered', label: 'Numbered list', icon: 'tabler-list-numbers' },
  { type: 'toggle', label: 'Toggle list', icon: 'tabler-caret-right' },
  { type: 'image', label: 'Image', icon: 'tabler-photo' }
]

const emojiOptions = ['😀', '😊', '🙌', '✅', '📘', '📄', '💡', '🔥', '⭐', '🚀', '🧠', '📌', '🛠️', '📊', '📝']

const coverPositions = ['center', 'top', 'bottom']

const colorOptions = [
  { value: 'default', label: 'Default', swatch: '#737373' },
  { value: 'gray', label: 'Gray', swatch: '#8b949e' },
  { value: 'red', label: 'Red', swatch: '#f87171' },
  { value: 'yellow', label: 'Yellow', swatch: '#facc15' },
  { value: 'green', label: 'Green', swatch: '#4ade80' },
  { value: 'blue', label: 'Blue', swatch: '#60a5fa' }
]

const parseMetadata = metadataJson => {
  if (!metadataJson) return {}
  if (typeof metadataJson === 'object') return metadataJson

  try {
    return JSON.parse(metadataJson)
  } catch {
    return {}
  }
}

const normalizeBlock = block => ({
  ...block,
  metadata: parseMetadata(block.metadataJson)
})

const DEFAULT_TABLE_ROWS = 3
const DEFAULT_TABLE_COLUMNS = 3
const DEFAULT_IMAGE_WIDTH_PX = 720
const MIN_IMAGE_WIDTH_PX = 240
const TEXT_PLACEHOLDER = 'Type here.....'
const INDENT_WIDTH_PX = 32
const MAX_INDENT_LEVEL = 6

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const getBlockIndentLevel = block => clamp(Number(block?.metadata?.indentLevel) || 0, 0, MAX_INDENT_LEVEL)

const createDefaultTableMetadata = () => ({
  rows: Array.from({ length: DEFAULT_TABLE_ROWS }, () =>
    Array.from({ length: DEFAULT_TABLE_COLUMNS }, () => '')
  )
})

const normalizeTableMetadata = metadata => {
  const sourceRows = Array.isArray(metadata?.rows) && metadata.rows.length ? metadata.rows : createDefaultTableMetadata().rows

  const columnCount = Math.max(
    DEFAULT_TABLE_COLUMNS,
    ...sourceRows.map(row => (Array.isArray(row) ? row.length : 0))
  )

  const rows = sourceRows.map(row =>
    Array.from({ length: columnCount }, (_, columnIndex) => String(row?.[columnIndex] || ''))
  )

  return {
    ...metadata,
    rows
  }
}

const normalizeImageWidth = metadata => {
  const widthPx = Number(metadata?.widthPx)

  if (Number.isFinite(widthPx) && widthPx > 0) {
    return Math.round(widthPx)
  }

  const legacyWidth = Number(metadata?.width)

  if (Number.isFinite(legacyWidth) && legacyWidth > 0) {
    return legacyWidth <= 100 ? Math.round((DEFAULT_IMAGE_WIDTH_PX * legacyWidth) / 100) : Math.round(legacyWidth)
  }

  return DEFAULT_IMAGE_WIDTH_PX
}

const getColorStyle = color => {
  const colors = {
    gray: { color: '#c8ced8', backgroundColor: 'rgba(148, 163, 184, 0.1)' },
    red: { color: '#fecaca', backgroundColor: 'rgba(248, 113, 113, 0.1)' },
    yellow: { color: '#fde68a', backgroundColor: 'rgba(250, 204, 21, 0.09)' },
    green: { color: '#bbf7d0', backgroundColor: 'rgba(74, 222, 128, 0.09)' },
    blue: { color: '#bfdbfe', backgroundColor: 'rgba(96, 165, 250, 0.1)' }
  }

  return colors[color] || {}
}

const getTextareaClassName = blockType => {
  const base =
    'w-full resize-none border-none bg-transparent outline-none placeholder:text-[color:var(--mui-palette-text-disabled)]'

  const map = {
    heading1: 'text-5xl font-bold leading-tight',
    heading2: 'text-4xl font-bold leading-tight',
    heading3: 'text-3xl font-semibold leading-snug',
    heading4: 'text-2xl font-semibold leading-snug',
    quote: 'text-xl leading-snug',
    code: 'font-mono text-sm leading-relaxed',
    todo: 'text-lg leading-snug',
    bulleted: 'text-lg leading-snug',
    numbered: 'text-lg leading-snug',
    toggle: 'text-lg leading-snug',
    paragraph: 'text-lg leading-snug'
  }

  return `${base} ${map[blockType] || map.paragraph}`
}

const autoResize = element => {
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${Math.max(element.scrollHeight, 36)}px`
}

const formatRelativeTime = value => {
  if (!value) return ''

  const delta = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(delta / 60000))

  if (minutes < 60) return `${minutes}m`

  const hours = Math.round(minutes / 60)

  if (hours < 24) return `${hours}h`

  return `${Math.round(hours / 24)}d`
}

const TypeMenuContent = ({ filter, setFilter, onSelectType, onSelectImage }) => {
  const filteredTypes = blockTypes.filter(type => type.label.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className='w-[320px] max-w-[calc(100vw-32px)] py-2'>
      <div className='px-2 pb-2'>
        <input
          autoFocus
          value={filter}
          onChange={event => setFilter(event.target.value)}
          placeholder='Type to filter...'
          className='w-full rounded-md border px-3 py-2 text-sm outline-none'
          style={{
            backgroundColor: 'var(--mui-palette-background-default)',
            borderColor: 'var(--mui-palette-divider)',
            color: 'var(--mui-palette-text-primary)'
          }}
        />
      </div>

      <div className='max-h-[360px] overflow-y-auto'>
        <div className='px-3 py-1 text-xs font-semibold' style={{ color: 'var(--mui-palette-text-secondary)' }}>
          Text
        </div>
        {filteredTypes
          .filter(type => type.type !== 'image')
          .map(type => (
            <MenuItem key={type.type} onClick={() => onSelectType(type.type)} className='gap-3'>
              <i className={`${type.icon} text-xl`} />
              <span>{type.label}</span>
            </MenuItem>
          ))}

        <Divider className='!my-2' />

        <div className='px-3 py-1 text-xs font-semibold' style={{ color: 'var(--mui-palette-text-secondary)' }}>
          Media
        </div>
        <MenuItem onClick={onSelectImage} className='gap-3'>
          <i className='tabler-photo text-xl' />
          <span>Image</span>
        </MenuItem>
      </div>
    </div>
  )
}

const TableBlock = ({ block, onUpdateMetadata }) => {
  const theme = useTheme()
  const tableRef = useRef(null)
  const [tableData, setTableData] = useState(() => normalizeTableMetadata(block.metadata))
  const [activeCell, setActiveCell] = useState(null)

  useEffect(() => {
    setTableData(normalizeTableMetadata(block.metadata))
  }, [block.blockId, block.metadata])

  const commitTableData = nextData => {
    setTableData(nextData)
    onUpdateMetadata(block, nextData)
  }

  const updateCell = (rowIndex, columnIndex, value) => {
    setTableData(prev => ({
      ...prev,
      rows: prev.rows.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex ? row.map((cell, currentColumnIndex) => (currentColumnIndex === columnIndex ? value : cell)) : row
      )
    }))
  }

  const saveTable = () => {
    onUpdateMetadata(block, normalizeTableMetadata(tableData))
  }

  const addRow = () => {
    const columnCount = tableData.rows[0]?.length || DEFAULT_TABLE_COLUMNS

    const nextData = {
      ...tableData,
      rows: [...tableData.rows, Array.from({ length: columnCount }, () => '')]
    }

    commitTableData(nextData)
  }

  const addColumn = () => {
    const nextData = {
      ...tableData,
      rows: tableData.rows.map(row => [...row, ''])
    }

    commitTableData(nextData)
  }

  return (
    <div ref={tableRef} className='w-full'>
      <div className='mb-2 flex justify-end'>
        <Tooltip title='Add column'>
          <IconButton size='small' onClick={addColumn}>
            <i className='tabler-plus text-base' />
          </IconButton>
        </Tooltip>
      </div>

      <div className='overflow-hidden rounded-md border' style={{ borderColor: theme.palette.divider }}>
        <table className='w-full table-fixed border-collapse'>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, columnIndex) => (
                  <td
                    key={`cell-${rowIndex}-${columnIndex}`}
                    className='border-b border-r last:border-r-0'
                    style={{ borderColor: theme.palette.divider, width: `${100 / row.length}%` }}
                  >
                    <input
                      type='text'
                      value={cell}
                      onChange={event => updateCell(rowIndex, columnIndex, event.target.value)}
                      onBlur={event => {
                        if (!tableRef.current?.contains(event.relatedTarget)) {
                          setActiveCell(null)
                        }

                        saveTable()
                      }}
                      onFocus={() => setActiveCell({ rowIndex, columnIndex })}
                      placeholder=''
                      className='h-12 w-full bg-transparent px-3 outline-none'
                      style={{ color: theme.palette.text.primary }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeCell?.rowIndex === tableData.rows.length - 1 && (
        <button
          type='button'
          onMouseDown={event => event.preventDefault()}
          onClick={addRow}
          className='mt-2 flex h-8 w-full items-center justify-center rounded-md border'
          style={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}
        >
          <i className='tabler-plus text-lg' />
        </button>
      )}
    </div>
  )
}

const BlockEditor = ({
  block,
  index,
  numberLabel,
  isSelected,
  selectedBlockCount,
  shouldFocus,
  onChange,
  onSave,
  onOpenInsert,
  onOpenAction,
  onCreateAfter,
  onAutoNumberList,
  onIndent,
  onSelect,
  onFocusBlock,
  onFocusConsumed,
  onDeleteCurrent,
  onDeleteSelected,
  onMergeWithPrevious,
  onToggleChecked,
  onUpdateMetadata,
  onUploadImage
}) => {
  const theme = useTheme()
  const blockType = block.blockType || 'paragraph'
  const colorStyle = getColorStyle(block.blockColor)
  const indentLevel = getBlockIndentLevel(block)
  const imageFrameRef = useRef(null)
  const imageResizeHandlersRef = useRef(null)
  const imageResizeStateRef = useRef(null)
  const inputRef = useRef(null)
  const skipNextBlurSaveRef = useRef(false)
  const [isResizingImage, setIsResizingImage] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    return () => {
      const handlers = imageResizeHandlersRef.current

      if (handlers) {
        window.removeEventListener('mousemove', handlers.move)
        window.removeEventListener('mouseup', handlers.up)
      }

      imageResizeHandlersRef.current = null
      imageResizeStateRef.current = null
      document.body.style.userSelect = ''
    }
  }, [])

  useEffect(() => {
    autoResize(inputRef.current)
  }, [block.content, blockType])

  useEffect(() => {
    if (!shouldFocus || !inputRef.current) return

    inputRef.current.focus()

    const cursorPosition = inputRef.current.value.length

    inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
    autoResize(inputRef.current)
    onFocusConsumed?.()
  }, [onFocusConsumed, shouldFocus])

  const startImageResize = event => {
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const containerWidth = Math.max(
      MIN_IMAGE_WIDTH_PX,
      imageFrameRef.current?.getBoundingClientRect().width || DEFAULT_IMAGE_WIDTH_PX
    )

    const startWidth = clamp(normalizeImageWidth(block.metadata), MIN_IMAGE_WIDTH_PX, containerWidth)

    imageResizeStateRef.current = {
      startX: event.clientX,
      startWidth,
      maxWidth: containerWidth
    }

    setIsResizingImage(true)
    document.body.style.userSelect = 'none'

    const handleMove = moveEvent => {
      const state = imageResizeStateRef.current

      if (!state) return

      const nextWidth = clamp(state.startWidth + (moveEvent.clientX - state.startX), MIN_IMAGE_WIDTH_PX, state.maxWidth)

      onUpdateMetadata(block, { widthPx: nextWidth }, false)
    }

    const handleUp = moveEvent => {
      const state = imageResizeStateRef.current

      if (!state) return

      const finalWidth = clamp(
        state.startWidth + (moveEvent.clientX - state.startX),
        MIN_IMAGE_WIDTH_PX,
        state.maxWidth
      )

      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)

      imageResizeHandlersRef.current = null
      imageResizeStateRef.current = null
      setIsResizingImage(false)
      document.body.style.userSelect = ''

      onUpdateMetadata(block, { widthPx: finalWidth })
    }

    imageResizeHandlersRef.current = { move: handleMove, up: handleUp }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  const handleKeyDown = async event => {
    const currentContent = block.content || ''
    const selectionStart = event.currentTarget.selectionStart ?? currentContent.length
    const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart
    const selectionCollapsed = selectionStart === selectionEnd

    if (event.key === '/' && !currentContent) {
      onOpenAction(event, block)
    }

    if (
      ['Backspace', 'Delete'].includes(event.key) &&
      selectionCollapsed &&
      selectedBlockCount > 1 &&
      onDeleteSelected &&
      isSelected
    ) {
      event.preventDefault()
      await onDeleteSelected(block)

      return
    }

    if (['Backspace', 'Delete'].includes(event.key) && selectionCollapsed && selectionStart === 0) {
      if (indentLevel > 0) {
        event.preventDefault()
        await onIndent(block, -1)

        return
      }

      if (currentContent.trim() && onMergeWithPrevious && index > 0) {
        event.preventDefault()
        await onMergeWithPrevious(block)

        return
      }
    }

    if (['Backspace', 'Delete'].includes(event.key) && !currentContent.trim()) {
      event.preventDefault()
      await onDeleteCurrent(block)

      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      await onIndent(block, event.shiftKey ? -1 : 1)

      return
    }

    if (
      event.key === ' ' &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      blockType !== 'code'
    ) {
      const selectionStart = event.currentTarget.selectionStart ?? currentContent.length
      const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart
      const beforeCursor = currentContent.slice(0, selectionStart)
      const afterCursor = currentContent.slice(selectionEnd)
      const numberMatch = beforeCursor.match(/^\s*(\d+)\.$/)

      if (numberMatch && !afterCursor.trim()) {
        event.preventDefault()
        await onAutoNumberList(block, Number(numberMatch[1]))

        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && blockType !== 'code') {
      event.preventDefault()

      const selectionStart = event.currentTarget.selectionStart ?? currentContent.length
      const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart
      const beforeCursor = currentContent.slice(0, selectionStart)
      const afterCursor = currentContent.slice(selectionEnd)
      const canContinueList = ['bulleted', 'numbered', 'todo'].includes(blockType) && beforeCursor.trim()
      const nextBlockType = canContinueList ? blockType : 'paragraph'

      const nextMetadata = {
        ...(nextBlockType === blockType ? block.metadata || {} : {}),
        indentLevel
      }

      delete nextMetadata.numberStart

      onChange(block.blockId, { content: beforeCursor })
      await onSave({ ...block, content: beforeCursor })
      skipNextBlurSaveRef.current = true

      const createdBlock = await onCreateAfter(block, {
        blockType: nextBlockType,
        content: afterCursor,
        metadata: nextMetadata,
        isChecked: 0
      })

      if (!createdBlock) {
        skipNextBlurSaveRef.current = false
      }
    }
  }

  const textarea = (placeholder, extraProps = {}) => (
    <textarea
      ref={inputRef}
      rows={1}
      value={block.content || ''}
      placeholder={isFocused ? placeholder : ''}
      className={`${getTextareaClassName(blockType)} ${extraProps.className || ''}`.trim()}
      style={{
        color: colorStyle.color || theme.palette.text.primary,
        ...(extraProps.style || {})
      }}
      onChange={event => {
        autoResize(event.currentTarget)
        onChange(block.blockId, { content: event.target.value })
      }}
      onFocus={() => {
        setIsFocused(true)
        onFocusBlock(block.blockId)
      }}
      onBlur={event => {
        setIsFocused(false)

        if (skipNextBlurSaveRef.current) {
          skipNextBlurSaveRef.current = false

          return
        }

        onSave({ ...block, content: event.currentTarget.value })
      }}
      onKeyDown={handleKeyDown}
    />
  )

  const content = () => {
    if (blockType === 'code') {
      return (
        <div
          className='rounded-lg px-5 py-4'
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.055)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {textarea(TEXT_PLACEHOLDER)}
        </div>
      )
    }

    if (blockType === 'quote') {
      return (
        <div className='border-l-4 py-1 pl-5' style={{ borderColor: theme.palette.text.primary }}>
          {textarea(TEXT_PLACEHOLDER)}
        </div>
      )
    }

    if (blockType === 'todo') {
      return (
        <div className='flex items-start gap-3'>
          <button
            type='button'
            onClick={() => onToggleChecked(block)}
            className='mt-1 flex h-6 w-6 shrink-0 items-center justify-center border'
            style={{
              borderColor: block.isChecked ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: block.isChecked ? theme.palette.primary.main : 'transparent',
              color: block.isChecked ? theme.palette.primary.contrastText : theme.palette.text.secondary
            }}
            >
            {block.isChecked ? <i className='tabler-check text-base' /> : null}
          </button>
          <div className='flex-1'>
            {textarea(TEXT_PLACEHOLDER, {
              className: block.isChecked ? 'opacity-60' : '',
              style: {
                textDecorationLine: block.isChecked ? 'line-through' : 'none',
                textDecorationThickness: '2px',
                opacity: block.isChecked ? 0.7 : 1
              }
            })}
          </div>
        </div>
      )
    }

    if (blockType === 'table') {
      return <TableBlock block={block} onUpdateMetadata={onUpdateMetadata} />
    }

    if (blockType === 'bulleted') {
      return (
        <div className='flex gap-3'>
          <span className='pt-1 text-xl leading-none'>•</span>
          <div className='flex-1'>{textarea(TEXT_PLACEHOLDER)}</div>
        </div>
      )
    }

    if (blockType === 'numbered') {
      return (
        <div className='flex gap-3'>
          <span className='w-6 pt-1 text-right text-base' style={{ color: theme.palette.text.secondary }}>
            {numberLabel || `${index + 1}.`}
          </span>
          <div className='flex-1'>{textarea(TEXT_PLACEHOLDER)}</div>
        </div>
      )
    }

    if (blockType === 'toggle') {
      const isOpen = block.metadata?.open !== false

      return (
        <div>
          <div className='flex items-start gap-2'>
            <button
              type='button'
              onClick={() => onUpdateMetadata(block, { open: !isOpen })}
              className='mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded'
              style={{ color: theme.palette.text.secondary }}
            >
              <i className={`tabler-caret-right text-lg transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <div className='flex-1'>{textarea(TEXT_PLACEHOLDER)}</div>
          </div>
          {isOpen && block.metadata?.caption && (
            <div className='ml-8 text-sm' style={{ color: theme.palette.text.secondary }}>
              {block.metadata.caption}
            </div>
          )}
        </div>
      )
    }

    if (blockType === 'image') {
      const imageUrl = block.metadata?.url || block.content
      const imageWidthPx = normalizeImageWidth(block.metadata)
      const imageWrapperStyle = imageUrl ? { width: `${imageWidthPx}px`, maxWidth: '100%', margin: '0 auto' } : {}

      return (
        <div ref={imageFrameRef} className='group/image'>
          <div style={imageWrapperStyle}>
            {imageUrl ? (
              <div className='relative overflow-hidden rounded-md'>
                <img
                  src={imageUrl}
                  alt={block.metadata?.caption || 'Page image'}
                  className='max-h-[520px] w-full select-none object-cover'
                  draggable={false}
                  onDragStart={event => event.preventDefault()}
                />
                <div className='absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover/image:opacity-100'>
                  <Button size='small' variant='contained' onClick={() => onUploadImage(block)}>
                    Change
                  </Button>
                </div>
                <button
                  type='button'
                  aria-label='Resize image'
                  onMouseDown={startImageResize}
                  className={`absolute inset-y-0 right-0 flex w-4 cursor-ew-resize items-center justify-end pr-1 ${
                    isResizingImage ? 'opacity-100' : 'opacity-0'
                  } transition-opacity group-hover/image:opacity-100`}
                  style={{ touchAction: 'none' }}
                >
                  <span
                    className='block h-10 w-px rounded'
                    style={{ backgroundColor: theme.palette.common.white, opacity: 0.85 }}
                  />
                </button>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => onUploadImage(block)}
                className='flex h-36 w-full items-center justify-center rounded-md border border-dashed'
                style={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}
              >
                <i className='tabler-photo-plus mr-2 text-xl' />
                Image
              </button>
            )}

            <input
              value={block.metadata?.caption || ''}
              onChange={event => onUpdateMetadata(block, { caption: event.target.value }, false)}
              onBlur={event => onUpdateMetadata(block, { caption: event.target.value })}
              placeholder='Caption'
              className='mt-2 w-full bg-transparent text-sm outline-none'
              style={{ color: theme.palette.text.secondary }}
            />
          </div>
        </div>
      )
    }

    return textarea(TEXT_PLACEHOLDER)
  }

  const handleBlockMouseDown = event => {
    const isSelectionShortcut = event.shiftKey || event.ctrlKey || event.metaKey

    if (!isSelectionShortcut) return

    event.preventDefault()
    onSelect(event, block)
  }

  return (
    <div
      className='group/block relative py-[1px]'
      style={{ marginLeft: indentLevel ? `${indentLevel * INDENT_WIDTH_PX}px` : undefined }}
      onMouseDownCapture={handleBlockMouseDown}
      aria-selected={isSelected}
    >
      <div className='absolute -left-12 top-1/2 hidden -translate-y-1/2 justify-end gap-1 opacity-0 transition-opacity group-hover/block:opacity-100 md:flex'>
        <Tooltip title='Add block'>
          <IconButton size='small' onClick={event => onOpenInsert(event, block.blockId)}>
            <i className='tabler-plus text-base' />
          </IconButton>
        </Tooltip>
        <Tooltip title='Block actions'>
          <IconButton size='small' onClick={event => onOpenAction(event, block)}>
            <i className='tabler-grip-vertical text-base' />
          </IconButton>
        </Tooltip>
      </div>
      <Box
        className='min-w-0 rounded py-1 transition-colors'
        sx={{
          ...colorStyle,
          backgroundColor: isSelected ? theme.palette.action.selected : colorStyle.backgroundColor,
          outline: isSelected ? `1px solid ${theme.palette.primary.main}` : 'none',
          outlineOffset: 2
        }}
      >
        {content()}
      </Box>
    </div>
  )
}

export default function NotionPagesView({ pageId }) {
  const theme = useTheme()
  const router = useRouter()
  const coverInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const newBlockInputRef = useRef(null)

  const [title, setTitle] = useState('New page')
  const [blocks, setBlocks] = useState([])
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [newBlockText, setNewBlockText] = useState('')
  const [newBlockFocused, setNewBlockFocused] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [emojiAnchor, setEmojiAnchor] = useState(null)
  const [insertMenu, setInsertMenu] = useState({ anchorEl: null, afterBlockId: null })
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, block: null })
  const [typeFilter, setTypeFilter] = useState('')
  const [imageUploadTarget, setImageUploadTarget] = useState({ blockId: null, afterBlockId: null })
  const [focusedBlockId, setFocusedBlockId] = useState(null)
  const [selectedBlockIds, setSelectedBlockIds] = useState([])
  const [lastSelectedBlockId, setLastSelectedBlockId] = useState(null)

  const { mutate: mutatePages } = useSWR('/api/notion-pages', fetcher)

  const {
    data: page,
    error: pageError,
    isLoading,
    mutate: mutatePage
  } = useSWR(pageId ? `/api/notion-pages/${pageId}` : null, fetcher)

  const comments = page?.comments || []

  const pageActionButtonStyle = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    appearance: 'none',
    WebkitAppearance: 'none',
    boxShadow: 'none'
  }

  const selectedBlockIdSet = useMemo(() => new Set(selectedBlockIds.map(String)), [selectedBlockIds])

  const numberedLabelsByBlockId = useMemo(() => {
    const labels = {}
    const countersByIndent = {}

    blocks.forEach((block, blockIndex) => {
      if (block.blockType !== 'numbered') return

      const indentLevel = getBlockIndentLevel(block)
      const previousBlock = blocks[blockIndex - 1]

      const continuesPreviousList =
        previousBlock?.blockType === 'numbered' && getBlockIndentLevel(previousBlock) === indentLevel

      const explicitStartNumber = Number(block.metadata?.numberStart)

      countersByIndent[indentLevel] = continuesPreviousList
        ? (countersByIndent[indentLevel] || 0) + 1
        : Number.isFinite(explicitStartNumber) && explicitStartNumber > 0
          ? explicitStartNumber
          : 1

      labels[String(block.blockId)] = `${countersByIndent[indentLevel]}.`
    })

    return labels
  }, [blocks])

  useEffect(() => {
    if (!page) return

    setTitle(page.pageTitle || 'Untitled')
    setBlocks((page.blocks || []).map(normalizeBlock))
    setShowComments((page.comments || []).length > 0)
    setFocusedBlockId(null)
    setSelectedBlockIds([])
    setLastSelectedBlockId(null)
  }, [page])

  useEffect(() => {
    autoResize(newBlockInputRef.current)
  }, [newBlockText])

  useEffect(() => {
    if (!newBlockFocused || !newBlockInputRef.current) return

    newBlockInputRef.current.focus()
    const cursorPosition = newBlockInputRef.current.value.length

    newBlockInputRef.current.setSelectionRange(cursorPosition, cursorPosition)
    autoResize(newBlockInputRef.current)
  }, [newBlockFocused])

  const uploadFile = async file => {
    const formData = new FormData()

    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()

    if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed')

    return data.url
  }

  const createPage = async () => {
    setIsCreating(true)

    try {
      const res = await fetch('/api/notion-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageTitle: 'New page' })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))

        throw new Error(errorData.error || errorData.message || 'Failed to create page')
      }

      const newPage = await res.json()

      await mutatePages()
      router.push(`/notion-pages/${newPage.pageId}`)
    } catch (error) {
      console.error(error)
      alert(`Gagal membuat page baru: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const savePage = async updates => {
    if (!pageId) return

    try {
      const res = await fetch(`/api/notion-pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!res.ok) throw new Error('Failed to save page')

      const updatedPage = await res.json()

      mutatePage(updatedPage, false)
      mutatePages()

      return updatedPage
    } catch (error) {
      console.error(error)

      return null
    }
  }

  const updateLocalBlock = (blockId, patch) => {
    setBlocks(currentBlocks =>
      currentBlocks.map(block => (String(block.blockId) === String(blockId) ? { ...block, ...patch } : block))
    )
  }

  const getSelectedTargetBlocks = block => {
    const blockId = String(block?.blockId)

    if (!blockId || !selectedBlockIdSet.has(blockId)) return block ? [block] : []

    return blocks.filter(item => selectedBlockIdSet.has(String(item.blockId)))
  }

  const handleFocusBlock = blockId => {
    setFocusedBlockId(String(blockId))
    setSelectedBlockIds([])
    setLastSelectedBlockId(null)
  }

  const handleSelectBlock = (event, block) => {
    const blockId = String(block.blockId)

    setFocusedBlockId(null)
    setLastSelectedBlockId(blockId)

    if (event.shiftKey && lastSelectedBlockId) {
      const startIndex = blocks.findIndex(item => String(item.blockId) === String(lastSelectedBlockId))
      const endIndex = blocks.findIndex(item => String(item.blockId) === blockId)

      if (startIndex !== -1 && endIndex !== -1) {
        const [from, to] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)]

        setSelectedBlockIds(blocks.slice(from, to + 1).map(item => String(item.blockId)))

        return
      }
    }

    if (event.ctrlKey || event.metaKey) {
      setSelectedBlockIds(currentIds =>
        currentIds.includes(blockId) ? currentIds.filter(item => item !== blockId) : [...currentIds, blockId]
      )

      return
    }

    setSelectedBlockIds([blockId])
  }

  const saveBlock = async block => {
    if (!pageId || !block?.blockId) return

    try {
      const payload = {
        blockType: block.blockType,
        content: block.content || '',
        metadata: block.metadata || {},
        blockColor: block.blockColor || 'default',
        isChecked: block.isChecked ? 1 : 0
      }

      const res = await fetch(`/api/notion-pages/${pageId}/blocks/${block.blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to save block')

      mutatePages()

      return true
    } catch (error) {
      console.error(error)

      return false
    }
  }

  const createBlock = async (blockType = 'paragraph', afterBlockId = null, overrides = {}) => {
    if (!pageId) return null

    try {
      const res = await fetch(`/api/notion-pages/${pageId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType,
          afterBlockId,
          ...overrides
        })
      })

      if (!res.ok) throw new Error('Failed to create block')

      const block = await res.json()

      await mutatePage()
      mutatePages()

      return block
    } catch (error) {
      console.error(error)

      return null
    }
  }

  const createBlockAfter = async (sourceBlock, overrides = {}) => {
    const nextBlockType = overrides.blockType || 'paragraph'
    const payload = { ...overrides }

    delete payload.blockType

    const createdBlock = await createBlock(nextBlockType, sourceBlock?.blockId || null, payload)

    if (createdBlock?.blockId) {
      setFocusedBlockId(String(createdBlock.blockId))
      setSelectedBlockIds([])
      setLastSelectedBlockId(null)
    }

    return createdBlock
  }

  const handleAutoNumberList = async (block, numberStart = 1) => {
    const metadata = {
      ...(block.metadata || {}),
      numberStart: Math.max(1, Number(numberStart) || 1)
    }

    const nextBlock = {
      ...block,
      blockType: 'numbered',
      content: '',
      metadata
    }

    updateLocalBlock(block.blockId, {
      blockType: 'numbered',
      content: '',
      metadata
    })

    await saveBlock(nextBlock)
  }

  const handleIndentBlock = async (block, direction) => {
    const targetBlocks = getSelectedTargetBlocks(block)

    await Promise.all(
      targetBlocks.map(async targetBlock => {
        const indentLevel = clamp(getBlockIndentLevel(targetBlock) + direction, 0, MAX_INDENT_LEVEL)

        const metadata = {
          ...(targetBlock.metadata || {}),
          indentLevel
        }

        updateLocalBlock(targetBlock.blockId, { metadata })

        return saveBlock({ ...targetBlock, metadata })
      })
    )
  }

  const deleteBlocks = useCallback(async targetBlocks => {
    if (!pageId || !targetBlocks.length) return

    try {
      await Promise.all(
        targetBlocks.map(async block => {
          const res = await fetch(`/api/notion-pages/${pageId}/blocks/${block.blockId}`, {
            method: 'DELETE'
          })

          if (!res.ok) throw new Error('Failed to delete block')
        })
      )

      const deletedIds = new Set(targetBlocks.map(item => String(item.blockId)))

      setBlocks(currentBlocks => currentBlocks.filter(item => !deletedIds.has(String(item.blockId))))
      setSelectedBlockIds([])
      setLastSelectedBlockId(null)
      mutatePages()

      return true
    } catch (error) {
      console.error(error)

      return false
    }
  }, [mutatePages, pageId])

  const handleDeleteTargets = async targetBlocks => {
    if (!targetBlocks?.length) return false

    const targetIds = new Set(targetBlocks.map(item => String(item.blockId)))

    const targetIndices = blocks
      .map((block, index) => (targetIds.has(String(block.blockId)) ? index : -1))
      .filter(index => index !== -1)

    const firstTargetIndex = targetIndices[0]
    const lastTargetIndex = targetIndices[targetIndices.length - 1]
    const previousBlock = firstTargetIndex > 0 ? blocks.slice(0, firstTargetIndex).reverse().find(block => !targetIds.has(String(block.blockId))) : null
    const nextBlock = blocks.slice(lastTargetIndex + 1).find(block => !targetIds.has(String(block.blockId)))
    const deleted = await deleteBlocks(targetBlocks)

    if (!deleted) return false

    setSelectedBlockIds([])
    setLastSelectedBlockId(null)

    if (previousBlock) {
      setFocusedBlockId(String(previousBlock.blockId))
    } else if (nextBlock) {
      setFocusedBlockId(String(nextBlock.blockId))
    } else {
      setFocusedBlockId(null)
      setNewBlockFocused(true)
    }

    return true
  }

  const handleDeleteCurrentBlock = async block => {
    await handleDeleteTargets([block])
  }

  const handleDeleteSelectedBlocks = async block => {
    const targetBlocks = getSelectedTargetBlocks(block)

    await handleDeleteTargets(targetBlocks.length ? targetBlocks : [block])
  }

  const handleMergeWithPreviousBlock = async block => {
    if (!block?.blockId) return false

    const currentIndex = blocks.findIndex(item => String(item.blockId) === String(block.blockId))
    const previousBlock = currentIndex > 0 ? blocks[currentIndex - 1] : null

    if (!previousBlock) return false

    const mergedContent = `${previousBlock.content || ''}${block.content || ''}`

    updateLocalBlock(previousBlock.blockId, { content: mergedContent })

    const saved = await saveBlock({ ...previousBlock, content: mergedContent })

    if (!saved) return false

    await handleDeleteTargets([block])

    return true
  }

  const deleteBlock = async block => {
    await handleDeleteTargets(getSelectedTargetBlocks(block))
  }

  useEffect(() => {
    const handleSelectedBlocksKeyDown = event => {
      if (!selectedBlockIds.length || !['Backspace', 'Delete'].includes(event.key)) return

      const activeElement = document.activeElement

      const isTyping =
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.tagName === 'INPUT' ||
        activeElement?.isContentEditable

      if (isTyping) return

      event.preventDefault()
      deleteBlocks(blocks.filter(block => selectedBlockIdSet.has(String(block.blockId))))
    }

    window.addEventListener('keydown', handleSelectedBlocksKeyDown)

    return () => window.removeEventListener('keydown', handleSelectedBlocksKeyDown)
  }, [blocks, deleteBlocks, selectedBlockIdSet, selectedBlockIds.length])

  const changeBlockType = async (block, blockType) => {
    const targetBlocks = getSelectedTargetBlocks(block)

    setActionMenu({ anchorEl: null, block: null })

    await Promise.all(
      targetBlocks.map(async targetBlock => {
        const nextMetadata = blockType === 'table' ? normalizeTableMetadata(targetBlock.metadata) : targetBlock.metadata || {}
        const nextBlock = { ...targetBlock, blockType, metadata: nextMetadata }

        updateLocalBlock(targetBlock.blockId, { blockType, metadata: nextMetadata })

        return saveBlock(nextBlock)
      })
    )
  }

  const duplicateBlock = async block => {
    await createBlock(block.blockType, block.blockId, {
      content: block.content || '',
      metadata: block.metadata || {},
      blockColor: block.blockColor || 'default',
      isChecked: block.isChecked ? 1 : 0
    })
    setActionMenu({ anchorEl: null, block: null })
  }

  const updateBlockMetadata = async (block, patch, shouldSave = true) => {
    const metadata = { ...(block.metadata || {}), ...patch }

    updateLocalBlock(block.blockId, { metadata })

    if (shouldSave) {
      await saveBlock({ ...block, metadata })
    }
  }

  const updateBlockColor = async (block, blockColor) => {
    const targetBlocks = getSelectedTargetBlocks(block)

    await Promise.all(
      targetBlocks.map(async targetBlock => {
        updateLocalBlock(targetBlock.blockId, { blockColor })

        return saveBlock({ ...targetBlock, blockColor })
      })
    )
  }

  const toggleChecked = async block => {
    const isChecked = block.isChecked ? 0 : 1

    updateLocalBlock(block.blockId, { isChecked })
    await saveBlock({ ...block, isChecked })
  }

  const addComment = async () => {
    if (!commentText.trim() || !pageId) return

    try {
      const res = await fetch(`/api/notion-pages/${pageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentContent: commentText })
      })

      if (!res.ok) throw new Error('Failed to add comment')

      setCommentText('')
      setShowComments(true)
      await mutatePage()
      mutatePages()
    } catch (error) {
      console.error(error)
    }
  }

  const deleteComment = async comment => {
    try {
      const res = await fetch(`/api/notion-pages/${pageId}/comments/${comment.commentId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete comment')

      await mutatePage()
    } catch (error) {
      console.error(error)
    }
  }

  const handleCoverUpload = async event => {
    const file = event.target.files?.[0]

    event.target.value = ''
    if (!file) return

    try {
      const url = await uploadFile(file)

      await savePage({ pageCoverUrl: url })
    } catch (error) {
      console.error(error)
      alert('Gagal upload cover.')
    }
  }

  const handleImageUpload = async event => {
    const file = event.target.files?.[0]

    event.target.value = ''
    if (!file) return

    try {
      const url = await uploadFile(file)

      if (imageUploadTarget.blockId) {
        const block = blocks.find(item => String(item.blockId) === String(imageUploadTarget.blockId))
        const metadata = { ...(block?.metadata || {}), url, widthPx: normalizeImageWidth(block?.metadata) }

        updateLocalBlock(imageUploadTarget.blockId, { content: url, metadata })
        await saveBlock({ ...block, content: url, metadata })
      } else {
        await createBlock('image', imageUploadTarget.afterBlockId, {
          content: url,
          metadata: { url, widthPx: DEFAULT_IMAGE_WIDTH_PX }
        })
      }
    } catch (error) {
      console.error(error)
      alert('Gagal upload image.')
    } finally {
      setImageUploadTarget({ blockId: null, afterBlockId: null })
    }
  }

  const handleNewBlockKeyDown = async event => {
    if (
      event.key === ' ' &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const selectionStart = event.currentTarget.selectionStart ?? newBlockText.length
      const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart
      const beforeCursor = newBlockText.slice(0, selectionStart)
      const afterCursor = newBlockText.slice(selectionEnd)
      const numberMatch = beforeCursor.match(/^\s*(\d+)\.$/)

      if (numberMatch && !afterCursor.trim()) {
        event.preventDefault()

        const createdBlock = await createBlock('numbered', blocks.at(-1)?.blockId || null, {
          content: '',
          metadata: { numberStart: Math.max(1, Number(numberMatch[1]) || 1) }
        })

        setNewBlockText('')

        if (createdBlock?.blockId) setFocusedBlockId(String(createdBlock.blockId))

        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()

      const createdBlock = await createBlock('paragraph', blocks.at(-1)?.blockId || null, { content: newBlockText })

      setNewBlockText('')

      if (!newBlockText.trim() && createdBlock?.blockId) {
        setFocusedBlockId(String(createdBlock.blockId))
      }
    }
  }

  const openInsertMenu = (event, afterBlockId = null) => {
    setTypeFilter('')
    setInsertMenu({ anchorEl: event.currentTarget, afterBlockId })
  }

  const closeInsertMenu = () => {
    setInsertMenu({ anchorEl: null, afterBlockId: null })
  }

  const openActionMenu = (event, block) => {
    setTypeFilter('')

    if (!selectedBlockIdSet.has(String(block.blockId))) {
      setSelectedBlockIds([])
      setLastSelectedBlockId(null)
    }

    setActionMenu({ anchorEl: event.currentTarget, block })
  }

  const closeActionMenu = () => {
    setActionMenu({ anchorEl: null, block: null })
  }

  const selectInsertType = async blockType => {
    const createdBlock = await createBlock(
      blockType,
      insertMenu.afterBlockId,
      blockType === 'table' ? { metadata: createDefaultTableMetadata() } : {}
    )

    if (createdBlock?.blockId && !['table', 'image'].includes(blockType)) {
      setFocusedBlockId(String(createdBlock.blockId))
    }

    closeInsertMenu()
  }

  const selectInsertImage = () => {
    setImageUploadTarget({ blockId: null, afterBlockId: insertMenu.afterBlockId })
    closeInsertMenu()
    imageInputRef.current?.click()
  }

  const copyPageLink = async () => {
    if (typeof window === 'undefined') return

    await navigator.clipboard.writeText(window.location.href)
  }

  const cycleCoverPosition = async () => {
    const currentPosition = page?.pageCoverPosition || 'center'
    const currentIndex = coverPositions.indexOf(currentPosition)
    const nextPosition = coverPositions[(currentIndex + 1) % coverPositions.length]

    await savePage({ pageCoverPosition: nextPosition })
  }

  const removeCover = async () => {
    await savePage({
      pageCoverUrl: null,
      pageCoverPosition: 'center'
    })
  }

  const pageContent = () => {
    if (!pageId) {
      return (
        <div className='flex h-full items-center justify-center px-6 text-center'>
          <div>
            <i className='tabler-file-plus mb-4 block text-5xl' style={{ color: theme.palette.text.secondary }} />
            <h2 className='mb-2 text-2xl font-semibold'>New page</h2>
            <Button
              variant='contained'
              startIcon={<i className={isCreating ? 'tabler-loader-2 animate-spin' : 'tabler-plus'} />}
              onClick={createPage}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Add New Page'}
            </Button>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className='flex h-full items-center justify-center' style={{ color: theme.palette.text.secondary }}>
          Loading...
        </div>
      )
    }

    if (pageError || !page) {
      return (
        <div className='flex h-full items-center justify-center px-6 text-center'>
          <div>
            <i className='tabler-alert-circle mb-3 block text-4xl' style={{ color: theme.palette.error.main }} />
            <h2 className='text-xl font-semibold'>Page not found</h2>
          </div>
        </div>
      )
    }

    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <div
          className='flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6'
          style={{ borderColor: theme.palette.divider, backgroundColor: theme.palette.background.default }}
        >
          <div className='flex min-w-0 items-center gap-2'>
            <span className='text-xl'>{page.pageIcon || <i className='tabler-file text-xl' />}</span>
            <span className='truncate font-semibold'>{title || 'Untitled'}</span>
          </div>

          <div className='flex items-center gap-1'>
            <Tooltip title='Copy link'>
              <IconButton size='small' onClick={copyPageLink}>
                <i className='tabler-link text-xl' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Comments'>
              <IconButton size='small' onClick={() => setShowComments(current => !current)}>
                <i className='tabler-message text-xl' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Favorite'>
              <IconButton size='small' onClick={() => savePage({ isFavorite: !page.isFavorite })}>
                <i className={`${page.isFavorite ? 'tabler-star-filled' : 'tabler-star'} text-xl`} />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto'>
          {page.pageCoverUrl && (
            <div className='group/cover relative h-48 w-full overflow-hidden md:h-64'>
              <img
                src={page.pageCoverUrl}
                alt='Page cover'
                className='h-full w-full object-cover'
                style={{ objectPosition: page.pageCoverPosition || 'center' }}
              />
              <div
                className='absolute right-4 top-4 flex overflow-hidden rounded-md border opacity-0 transition-opacity group-hover/cover:opacity-100'
                style={{ borderColor: theme.palette.divider, backgroundColor: theme.palette.background.paper }}
              >
                <button type='button' className='px-3 py-2 text-sm' onClick={() => coverInputRef.current?.click()}>
                  Change
                </button>
                <button
                  type='button'
                  className='border-l px-3 py-2 text-sm'
                  style={{ borderColor: theme.palette.divider }}
                  onClick={removeCover}
                >
                  Remove
                </button>
                <button
                  type='button'
                  className='border-l px-3 py-2 text-sm'
                  style={{ borderColor: theme.palette.divider }}
                  onClick={cycleCoverPosition}
                >
                  Reposition
                </button>
                <a
                  href={page.pageCoverUrl}
                  download
                  className='border-l px-3 py-2'
                  style={{ borderColor: theme.palette.divider }}
                >
                  <i className='tabler-download text-lg' />
                </a>
              </div>
            </div>
          )}

          <main className={`mx-auto max-w-[980px] px-4 pb-32 md:px-10 ${page.pageCoverUrl ? 'pt-0' : 'pt-8'}`}>
            {!page.pageIcon && (
              <div
                className={`mb-5 flex flex-wrap gap-4 text-sm ${page.pageCoverUrl ? 'mt-5' : ''}`}
                style={{ color: theme.palette.text.secondary }}
              >
                <button
                  type='button'
                  className='inline-flex items-center gap-2 bg-transparent p-0 hover:bg-transparent hover:text-white focus:bg-transparent active:bg-transparent'
                  style={pageActionButtonStyle}
                  onClick={event => setEmojiAnchor(event.currentTarget)}
                >
                  <i className='tabler-mood-smile text-lg' />
                  Add icon
                </button>
                {!page.pageCoverUrl && (
                  <button
                    type='button'
                    className='inline-flex items-center gap-2 bg-transparent p-0 hover:bg-transparent hover:text-white focus:bg-transparent active:bg-transparent'
                    style={pageActionButtonStyle}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <i className='tabler-photo text-lg' />
                    Add cover
                  </button>
                )}
                {!showComments && (
                  <button
                    type='button'
                    className='inline-flex items-center gap-2 bg-transparent p-0 hover:bg-transparent hover:text-white focus:bg-transparent active:bg-transparent'
                    style={pageActionButtonStyle}
                    onClick={() => setShowComments(true)}
                  >
                    <i className='tabler-message text-lg' />
                    Add comment
                  </button>
                )}
              </div>
            )}

            {page.pageIcon && (
              <div className={page.pageCoverUrl ? '-mt-12 mb-6' : 'mb-4'}>
                <button
                  type='button'
                  className='relative z-10 inline-flex bg-transparent p-0 text-7xl leading-none shadow-none hover:bg-transparent focus:bg-transparent active:bg-transparent'
                  style={{
                    ...pageActionButtonStyle,
                    outline: 'none'
                  }}
                  onClick={event => setEmojiAnchor(event.currentTarget)}
                >
                  {page.pageIcon}
                </button>

                {(!page.pageCoverUrl || !showComments) && (
                  <div className='mt-4 flex flex-wrap gap-4 text-sm' style={{ color: theme.palette.text.secondary }}>
                    {!page.pageCoverUrl && (
                      <button
                        type='button'
                        className='inline-flex items-center gap-2 bg-transparent p-0 hover:bg-transparent hover:text-white focus:bg-transparent active:bg-transparent'
                        style={pageActionButtonStyle}
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <i className='tabler-photo text-lg' />
                        Add cover
                      </button>
                    )}
                    {!showComments && (
                      <button
                        type='button'
                        className='inline-flex items-center gap-2 bg-transparent p-0 hover:bg-transparent hover:text-white focus:bg-transparent active:bg-transparent'
                        style={pageActionButtonStyle}
                        onClick={() => setShowComments(true)}
                      >
                        <i className='tabler-message text-lg' />
                        Add comment
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <textarea
              value={title}
              rows={1}
              onChange={event => {
                autoResize(event.currentTarget)
                setTitle(event.target.value)
              }}
              onBlur={() => savePage({ pageTitle: title })}
              className='mb-8 w-full resize-none bg-transparent text-5xl font-bold leading-tight outline-none placeholder:text-[color:var(--mui-palette-text-disabled)]'
              placeholder='New page'
              style={{ color: theme.palette.text.primary }}
            />

            {showComments && (
              <div className='mb-12 border-b pb-6' style={{ borderColor: theme.palette.divider }}>
                <div className='space-y-4'>
                  {comments.map(comment => (
                    <div key={comment.commentId} className='group/comment flex gap-3'>
                      <div
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm'
                        style={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}
                      >
                        {(comment.mUser?.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2 text-sm'>
                          <span className='font-semibold'>{comment.mUser?.userName || 'User'}</span>
                          <span style={{ color: theme.palette.text.secondary }}>{formatRelativeTime(comment.dtmInserted)}</span>
                          <IconButton size='small' className='opacity-0 group-hover/comment:opacity-100' onClick={() => deleteComment(comment)}>
                            <i className='tabler-trash text-sm' />
                          </IconButton>
                        </div>
                        <p className='mt-1 whitespace-pre-wrap'>{comment.commentContent}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-5 flex items-center gap-3'>
                  <textarea
                    value={commentText}
                    onChange={event => setCommentText(event.target.value)}
                    rows={1}
                    placeholder='Add a comment...'
                    className='min-h-10 flex-1 resize-none border-b bg-transparent px-1 py-2 outline-none'
                    style={{ borderColor: theme.palette.divider, color: theme.palette.text.primary }}
                  />
                  <IconButton color='primary' onClick={addComment} disabled={!commentText.trim()}>
                    <i className='tabler-arrow-up text-xl' />
                  </IconButton>
                </div>
              </div>
            )}

            <div>
              {blocks.map((block, index) => (
                <BlockEditor
                  key={block.blockId}
                  block={block}
                  index={index}
                  numberLabel={numberedLabelsByBlockId[String(block.blockId)]}
                  isSelected={selectedBlockIdSet.has(String(block.blockId))}
                  selectedBlockCount={selectedBlockIds.length}
                  shouldFocus={String(focusedBlockId) === String(block.blockId)}
                  onChange={updateLocalBlock}
                  onSave={saveBlock}
                  onOpenInsert={openInsertMenu}
                  onOpenAction={openActionMenu}
                  onCreateAfter={createBlockAfter}
                  onAutoNumberList={handleAutoNumberList}
                  onIndent={handleIndentBlock}
                  onSelect={handleSelectBlock}
                  onFocusBlock={handleFocusBlock}
                  onFocusConsumed={() => setFocusedBlockId(null)}
                  onDeleteCurrent={handleDeleteCurrentBlock}
                  onDeleteSelected={handleDeleteSelectedBlocks}
                  onMergeWithPrevious={handleMergeWithPreviousBlock}
                  onToggleChecked={toggleChecked}
                  onUpdateMetadata={updateBlockMetadata}
                  onUploadImage={blockItem => {
                    setImageUploadTarget({ blockId: blockItem.blockId, afterBlockId: null })
                    imageInputRef.current?.click()
                  }}
                />
              ))}

              <div className='group/new relative py-[1px]'>
                <div className='absolute -left-12 top-1/2 hidden -translate-y-1/2 justify-end gap-1 opacity-0 transition-opacity group-hover/new:opacity-100 md:flex'>
                  <Tooltip title='Add block'>
                    <IconButton size='small' onClick={event => openInsertMenu(event, blocks.at(-1)?.blockId || null)}>
                      <i className='tabler-plus text-base' />
                    </IconButton>
                  </Tooltip>
                  <i className='tabler-grip-vertical text-base' style={{ color: theme.palette.text.disabled }} />
                </div>
                <textarea
                  ref={newBlockInputRef}
                  rows={1}
                  value={newBlockText}
                  onChange={event => {
                    autoResize(event.currentTarget)
                    setNewBlockText(event.target.value)
                  }}
                  onFocus={() => {
                    setNewBlockFocused(true)
                    setSelectedBlockIds([])
                    setLastSelectedBlockId(null)
                  }}
                  onBlur={async () => {
                    setNewBlockFocused(false)

                    if (!newBlockText.trim()) return

                    await createBlock('paragraph', blocks.at(-1)?.blockId || null, { content: newBlockText })
                    setNewBlockText('')
                  }}
                  onKeyDown={handleNewBlockKeyDown}
                  placeholder={newBlockFocused ? TEXT_PLACEHOLDER : ''}
                  className='min-h-10 w-full resize-none bg-transparent py-2 text-lg outline-none'
                  style={{ color: theme.palette.text.primary }}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div
      className='flex h-[calc(100vh-136px)] min-h-[720px] overflow-hidden rounded-md border md:min-h-[680px]'
      style={{ borderColor: theme.palette.divider, backgroundColor: theme.palette.background.default }}
    >
      <section className='min-w-0 flex-1'>{pageContent()}</section>

      <input ref={coverInputRef} type='file' accept='image/*' className='hidden' onChange={handleCoverUpload} />
      <input ref={imageInputRef} type='file' accept='image/*' className='hidden' onChange={handleImageUpload} />

      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <div className='grid w-64 grid-cols-5 gap-1 p-3'>
          {emojiOptions.map(emoji => (
            <button
              key={emoji}
              type='button'
              className='flex h-10 items-center justify-center rounded text-2xl hover:bg-white/10'
              onClick={async () => {
                await savePage({ pageIcon: emoji })
                setEmojiAnchor(null)
              }}
            >
              {emoji}
            </button>
          ))}
          <button
            type='button'
            className='col-span-5 rounded px-3 py-2 text-sm hover:bg-white/10'
            onClick={async () => {
              await savePage({ pageIcon: null })
              setEmojiAnchor(null)
            }}
          >
            Remove icon
          </button>
        </div>
      </Popover>

      <Menu anchorEl={insertMenu.anchorEl} open={Boolean(insertMenu.anchorEl)} onClose={closeInsertMenu}>
        <TypeMenuContent
          filter={typeFilter}
          setFilter={setTypeFilter}
          onSelectType={selectInsertType}
          onSelectImage={selectInsertImage}
        />
      </Menu>

      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={closeActionMenu}
        anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
        transformOrigin={{ vertical: 'center', horizontal: 'right' }}
      >
        <div className='w-[340px] max-w-[calc(100vw-32px)] py-2'>
          <div className='px-3 py-2 text-xs font-semibold' style={{ color: theme.palette.text.secondary }}>
            Turn into
          </div>
          <div className='max-h-64 overflow-y-auto'>
            {blockTypes
              .filter(type => type.type !== 'image')
              .map(type => (
                <MenuItem key={type.type} onClick={() => changeBlockType(actionMenu.block, type.type)} className='gap-3'>
                  <i className={`${type.icon} text-xl`} />
                  <span>{type.label}</span>
                </MenuItem>
              ))}
          </div>

          <Divider className='!my-2' />

          <div className='px-3 py-2 text-xs font-semibold' style={{ color: theme.palette.text.secondary }}>
            Color
          </div>
          <div className='grid grid-cols-3 gap-2 px-3 pb-2'>
            {colorOptions.map(color => (
              <button
                key={color.value}
                type='button'
                className='flex items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-white/10'
                onClick={() => updateBlockColor(actionMenu.block, color.value)}
              >
                <span className='h-4 w-4 rounded-full' style={{ backgroundColor: color.swatch }} />
                {color.label}
              </button>
            ))}
          </div>

          <Divider className='!my-2' />

          <MenuItem onClick={() => duplicateBlock(actionMenu.block)} className='gap-3'>
            <i className='tabler-copy text-xl' />
            Duplicate
          </MenuItem>
          <MenuItem
            onClick={() => {
              deleteBlock(actionMenu.block)
              closeActionMenu()
            }}
            className='gap-3'
            sx={{ color: 'error.main' }}
          >
            <i className='tabler-trash text-xl' />
            Delete
          </MenuItem>
        </div>
      </Menu>
    </div>
  )
}
