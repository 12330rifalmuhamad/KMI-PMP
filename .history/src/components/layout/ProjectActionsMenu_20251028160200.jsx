'use client'

import React, { useState } from 'react'

import { useRouter } from 'next/navigation'
import useSWR, { useSWRConfig } from 'swr'

// MUI
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

const fetcher = url => fetch(url).then(res => res.json())

export default function ProjectActionsMenu({ workspaceId }) {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [anchorEl, setAnchorEl] = useState(null)

  const { data: workspace } = useSWR(workspaceId ? `/api/workspaces/${workspaceId}` : null, fetcher)

  if (!workspaceId) return null

  const openMenu = e => setAnchorEl(e.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  const handleOpenInNewTab = () => {
    window.open(`/project-management/workspace/${workspaceId}`, '_blank', 'noopener')
    closeMenu()
  }

  const handleRename = async () => {
    const newName = prompt('Rename project', workspace?.workspaceName || '')
    if (!newName || newName.trim() === '' || newName === workspace?.workspaceName) return
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName: newName.trim() })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal mengganti nama project')
      }
      await mutate(`/api/workspaces/${workspaceId}`)
      await mutate('/api/workspaces')
    } catch (err) {
      alert(err.message || 'Gagal mengganti nama project')
    } finally {
      closeMenu()
    }
  }

  const handleAddToFavorites = () => {
    try {
      const key = 'favoriteWorkspaces'
      const current = JSON.parse(localStorage.getItem(key) || '[]')
      const idNum = Number(workspaceId)
      const exists = current.includes(idNum)
      const next = exists ? current.filter(id => id !== idNum) : [...current, idNum]
      localStorage.setItem(key, JSON.stringify(next))
      alert(exists ? 'Removed from favorites' : 'Added to favorites')
    } catch {}
    closeMenu()
  }

  const handleDuplicate = async () => {
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName: `${workspace?.workspaceName || 'Project'} (Copy)` })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal menduplikasi project')
      }
      const newWs = await res.json()
      await mutate('/api/workspaces')
      router.push(`/project-management/workspace/${newWs.workspaceId}`)
    } catch (err) {
      alert(err.message || 'Gagal menduplikasi project')
    } finally {
      closeMenu()
    }
  }

  const handleDelete = async () => {
    closeMenu()
    const ok = confirm(
      `Hapus project/workspace "${workspace?.workspaceName || ''}"? Semua board di dalamnya akan ikut terhapus.`
    )
    if (!ok) return
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal menghapus project')
      }
      await mutate('/api/workspaces')
      router.push('/project-management')
    } catch (err) {
      alert(err.message || 'Gagal menghapus project')
    }
  }

  return (
    <>
      <IconButton size='small' color='secondary' onClick={openMenu} aria-controls='proj-menu' aria-haspopup='true'>
        <i className='tabler-dots-vertical' />
      </IconButton>
      <Menu id='proj-menu' anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu} keepMounted>
        <MenuItem onClick={handleOpenInNewTab}>
          <i className='tabler-external-link mr-2' /> Open in new tab
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleRename}>
          <i className='tabler-pencil mr-2' /> Rename
        </MenuItem>
        <MenuItem disabled>
          <i className='tabler-arrow-right mr-2' /> Move to
        </MenuItem>
        <MenuItem disabled>
          <i className='tabler-arrows-exchange mr-2' /> Change type
        </MenuItem>
        <MenuItem onClick={handleAddToFavorites}>
          <i className='tabler-star mr-2' /> Add to favorites
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <i className='tabler-copy mr-2' /> Duplicate
        </MenuItem>
        <MenuItem disabled>
          <i className='tabler-template mr-2' /> Save as a template
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <i className='tabler-trash mr-2' /> Delete
        </MenuItem>
        <MenuItem disabled>
          <i className='tabler-archive mr-2' /> Archive
        </MenuItem>
      </Menu>
    </>
  )
}

