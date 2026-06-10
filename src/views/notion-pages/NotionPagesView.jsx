'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
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
    quote: 'text-xl leading-relaxed',
    code: 'font-mono text-sm leading-relaxed',
    todo: 'text-lg leading-relaxed',
    bulleted: 'text-lg leading-relaxed',
    numbered: 'text-lg leading-relaxed',
    toggle: 'text-lg leading-relaxed',
    paragraph: 'text-lg leading-relaxed'
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

const FeatureSidebar = ({ pages = [], activePageId, onCreatePage, onDeletePage, isCreating }) => {
  const theme = useTheme()

  return (
    <aside
      className='flex h-full w-full shrink-0 flex-col border-r md:w-[260px]'
      style={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }}
    >
      <div className='flex items-center justify-between px-4 pb-2 pt-4'>
        <span className='text-sm font-semibold' style={{ color: theme.palette.text.secondary }}>
          Private
        </span>
        <Tooltip title='Add New Page'>
          <IconButton size='small' onClick={onCreatePage} disabled={isCreating}>
            <i className='tabler-plus text-lg' />
          </IconButton>
        </Tooltip>
      </div>

      <div className='flex-1 overflow-y-auto px-2 pb-4'>
        {pages.map(page => {
          const isActive = String(page.pageId) === String(activePageId)

          return (
            <div key={page.pageId} className='group relative'>
              <Link href={`/notion-pages/${page.pageId}`} className='block'>
                <Box
                  className='flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium'
                  sx={{
                    color: isActive ? 'text.primary' : 'text.secondary',
                    backgroundColor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                      color: 'text.primary',
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <span className='flex w-6 shrink-0 items-center justify-center text-lg'>
                    {page.pageIcon || <i className='tabler-file text-xl' />}
                  </span>
                  <span className='truncate'>{page.pageTitle || 'Untitled'}</span>
                </Box>
              </Link>

              <Tooltip title='Delete page'>
                <IconButton
                  size='small'
                  onClick={() => onDeletePage(page)}
                  className='!absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100'
                  sx={{ color: 'text.secondary' }}
                >
                  <i className='tabler-trash text-sm' />
                </IconButton>
              </Tooltip>
            </div>
          )
        })}

        {pages.length === 0 && (
          <button
            type='button'
            onClick={onCreatePage}
            className='mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm'
            style={{ color: theme.palette.text.secondary }}
          >
            <i className='tabler-file-plus text-lg' />
            New page
          </button>
        )}
      </div>
    </aside>
  )
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

const BlockEditor = ({
  block,
  index,
  onChange,
  onSave,
  onOpenInsert,
  onOpenAction,
  onCreateAfter,
  onToggleChecked,
  onUpdateMetadata,
  onUploadImage
}) => {
  const theme = useTheme()
  const blockType = block.blockType || 'paragraph'
  const colorStyle = getColorStyle(block.blockColor)
  const inputRef = useRef(null)

  useEffect(() => {
    autoResize(inputRef.current)
  }, [block.content, blockType])

  const handleKeyDown = event => {
    if (event.key === '/' && !block.content) {
      onOpenAction(event, block)
    }

    if (event.key === 'Enter' && !event.shiftKey && blockType !== 'code') {
      event.preventDefault()
      onSave(block)
      onCreateAfter(block)
    }
  }

  const textarea = placeholder => (
    <textarea
      ref={inputRef}
      rows={1}
      value={block.content || ''}
      placeholder={placeholder}
      className={getTextareaClassName(blockType)}
      style={{ color: colorStyle.color || theme.palette.text.primary }}
      onChange={event => {
        autoResize(event.currentTarget)
        onChange(block.blockId, { content: event.target.value })
      }}
      onBlur={() => onSave(block)}
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
          {textarea('Code')}
        </div>
      )
    }

    if (blockType === 'quote') {
      return (
        <div className='border-l-4 py-1 pl-5' style={{ borderColor: theme.palette.text.primary }}>
          {textarea('Quote')}
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
          <div className={`flex-1 ${block.isChecked ? 'line-through opacity-60' : ''}`}>{textarea('To-do')}</div>
        </div>
      )
    }

    if (blockType === 'bulleted') {
      return (
        <div className='flex gap-3'>
          <span className='pt-1 text-xl leading-none'>•</span>
          <div className='flex-1'>{textarea('List')}</div>
        </div>
      )
    }

    if (blockType === 'numbered') {
      return (
        <div className='flex gap-3'>
          <span className='w-6 pt-1 text-right text-base' style={{ color: theme.palette.text.secondary }}>
            {index + 1}.
          </span>
          <div className='flex-1'>{textarea('List')}</div>
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
            <div className='flex-1'>{textarea('Toggle')}</div>
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

      return (
        <div className='group/image'>
          {imageUrl ? (
            <div className='relative overflow-hidden rounded-md'>
              <img src={imageUrl} alt={block.metadata?.caption || 'Page image'} className='max-h-[520px] w-full object-cover' />
              <div className='absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover/image:opacity-100'>
                <Button size='small' variant='contained' onClick={() => onUploadImage(block)}>
                  Change
                </Button>
              </div>
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
      )
    }

    return textarea(blockType.startsWith('heading') ? 'Heading' : "Press 'space' for AI or '/' for commands")
  }

  return (
    <div className='group/block relative flex gap-2 py-1'>
      <div className='flex w-12 shrink-0 justify-end gap-1 pt-1 opacity-0 transition-opacity group-hover/block:opacity-100'>
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
      <Box className='min-w-0 flex-1 rounded px-2 py-1' sx={{ ...colorStyle }}>
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

  const [title, setTitle] = useState('New page')
  const [blocks, setBlocks] = useState([])
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [newBlockText, setNewBlockText] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [emojiAnchor, setEmojiAnchor] = useState(null)
  const [insertMenu, setInsertMenu] = useState({ anchorEl: null, afterBlockId: null })
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, block: null })
  const [typeFilter, setTypeFilter] = useState('')
  const [imageUploadTarget, setImageUploadTarget] = useState({ blockId: null, afterBlockId: null })

  const { data: pages = [], mutate: mutatePages } = useSWR('/api/notion-pages', fetcher)

  const {
    data: page,
    error: pageError,
    isLoading,
    mutate: mutatePage
  } = useSWR(pageId ? `/api/notion-pages/${pageId}` : null, fetcher)

  const comments = page?.comments || []

  useEffect(() => {
    if (!page) return

    setTitle(page.pageTitle || 'Untitled')
    setBlocks((page.blocks || []).map(normalizeBlock))
    setShowComments((page.comments || []).length > 0)
  }, [page])

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

  const deletePage = async targetPage => {
    if (!targetPage?.pageId) return
    if (!confirm(`Delete page "${targetPage.pageTitle || 'Untitled'}"?`)) return

    try {
      const res = await fetch(`/api/notion-pages/${targetPage.pageId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete page')

      const nextPage = pages.find(item => String(item.pageId) !== String(targetPage.pageId))

      await mutatePages()

      if (String(targetPage.pageId) === String(pageId)) {
        router.push(nextPage ? `/notion-pages/${nextPage.pageId}` : '/notion-pages')
      }
    } catch (error) {
      console.error(error)
      alert('Gagal menghapus page.')
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

  const deleteBlock = async block => {
    if (!pageId || !block?.blockId) return

    try {
      const res = await fetch(`/api/notion-pages/${pageId}/blocks/${block.blockId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete block')

      setBlocks(currentBlocks => currentBlocks.filter(item => String(item.blockId) !== String(block.blockId)))
      mutatePages()
    } catch (error) {
      console.error(error)
    }
  }

  const changeBlockType = async (block, blockType) => {
    const nextBlock = { ...block, blockType }

    updateLocalBlock(block.blockId, { blockType })
    setActionMenu({ anchorEl: null, block: null })
    await saveBlock(nextBlock)
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
    updateLocalBlock(block.blockId, { blockColor })
    await saveBlock({ ...block, blockColor })
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
        const metadata = { ...(block?.metadata || {}), url }

        updateLocalBlock(imageUploadTarget.blockId, { content: url, metadata })
        await saveBlock({ ...block, content: url, metadata })
      } else {
        await createBlock('image', imageUploadTarget.afterBlockId, {
          content: url,
          metadata: { url }
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
    if (event.key === 'Enter' && !event.shiftKey && newBlockText.trim()) {
      event.preventDefault()
      await createBlock('paragraph', blocks.at(-1)?.blockId || null, { content: newBlockText })
      setNewBlockText('')
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
    setActionMenu({ anchorEl: event.currentTarget, block })
  }

  const closeActionMenu = () => {
    setActionMenu({ anchorEl: null, block: null })
  }

  const selectInsertType = async blockType => {
    await createBlock(blockType, insertMenu.afterBlockId)
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

  const pageContent = () => {
    if (!pageId) {
      return (
        <div className='flex h-full items-center justify-center px-6 text-center'>
          <div>
            <i className='tabler-file-plus mb-4 block text-5xl' style={{ color: theme.palette.text.secondary }} />
            <h2 className='mb-2 text-2xl font-semibold'>New page</h2>
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={createPage}>
              Add New Page
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
            <span className='hidden items-center gap-1 text-sm md:flex' style={{ color: theme.palette.text.secondary }}>
              <i className='tabler-lock text-base' />
              Private
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <Button variant='outlined' size='small' startIcon={<i className='tabler-lock' />}>
              Share
            </Button>
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
              <div className='absolute right-4 top-4 flex overflow-hidden rounded-md border opacity-0 transition-opacity group-hover/cover:opacity-100' style={{ borderColor: theme.palette.divider, backgroundColor: theme.palette.background.paper }}>
                <button type='button' className='px-3 py-2 text-sm' onClick={() => coverInputRef.current?.click()}>
                  Change
                </button>
                <button type='button' className='border-l px-3 py-2 text-sm' style={{ borderColor: theme.palette.divider }} onClick={cycleCoverPosition}>
                  Reposition
                </button>
                <a href={page.pageCoverUrl} download className='border-l px-3 py-2' style={{ borderColor: theme.palette.divider }}>
                  <i className='tabler-download text-lg' />
                </a>
              </div>
            </div>
          )}

          <main className='mx-auto max-w-[980px] px-4 pb-32 pt-8 md:px-10'>
            {!page.pageCoverUrl && !page.pageIcon && (
              <div className='mb-5 flex flex-wrap gap-4 text-sm' style={{ color: theme.palette.text.secondary }}>
                <button type='button' className='flex items-center gap-2 hover:text-white' onClick={event => setEmojiAnchor(event.currentTarget)}>
                  <i className='tabler-mood-smile text-lg' />
                  Add icon
                </button>
                <button type='button' className='flex items-center gap-2 hover:text-white' onClick={() => coverInputRef.current?.click()}>
                  <i className='tabler-photo text-lg' />
                  Add cover
                </button>
                <button type='button' className='flex items-center gap-2 hover:text-white' onClick={() => setShowComments(true)}>
                  <i className='tabler-message text-lg' />
                  Add comment
                </button>
              </div>
            )}

            {page.pageIcon && (
              <button type='button' className='mb-4 text-7xl leading-none' onClick={event => setEmojiAnchor(event.currentTarget)}>
                {page.pageIcon}
              </button>
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
                  onChange={updateLocalBlock}
                  onSave={saveBlock}
                  onOpenInsert={openInsertMenu}
                  onOpenAction={openActionMenu}
                  onCreateAfter={blockItem => createBlock('paragraph', blockItem.blockId)}
                  onToggleChecked={toggleChecked}
                  onUpdateMetadata={updateBlockMetadata}
                  onUploadImage={blockItem => {
                    setImageUploadTarget({ blockId: blockItem.blockId, afterBlockId: null })
                    imageInputRef.current?.click()
                  }}
                />
              ))}

              <div className='group/new flex gap-2 py-1'>
                <div className='flex w-12 shrink-0 justify-end gap-1 pt-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover/new:opacity-100'>
                  <Tooltip title='Add block'>
                    <IconButton size='small' onClick={event => openInsertMenu(event, blocks.at(-1)?.blockId || null)}>
                      <i className='tabler-plus text-base' />
                    </IconButton>
                  </Tooltip>
                  <i className='tabler-grip-vertical pt-2 text-base' style={{ color: theme.palette.text.disabled }} />
                </div>
                <textarea
                  rows={1}
                  value={newBlockText}
                  onChange={event => {
                    autoResize(event.currentTarget)
                    setNewBlockText(event.target.value)
                  }}
                  onBlur={async () => {
                    if (!newBlockText.trim()) return
                    await createBlock('paragraph', blocks.at(-1)?.blockId || null, { content: newBlockText })
                    setNewBlockText('')
                  }}
                  onKeyDown={handleNewBlockKeyDown}
                  placeholder="Press 'space' for AI or '/' for commands"
                  className='min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-lg outline-none'
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
      <FeatureSidebar
        pages={pages}
        activePageId={pageId}
        onCreatePage={createPage}
        onDeletePage={deletePage}
        isCreating={isCreating}
      />

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

      <Menu anchorEl={actionMenu.anchorEl} open={Boolean(actionMenu.anchorEl)} onClose={closeActionMenu}>
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
