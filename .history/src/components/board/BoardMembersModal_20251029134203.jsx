'use client'

import { useEffect, useMemo, useState } from 'react'

// MUI
import Modal from '@mui/material/Modal'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

const roleOptions = ['owner', 'admin', 'member']

const BoardMembersModal = ({ open, onClose, boardId }) => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  const membersUrl = useMemo(() => (boardId ? `/api/boards/${boardId}/members` : null), [boardId])

  const loadMembers = async () => {
    if (!membersUrl) return
    setLoading(true)

    try {
      const res = await fetch(membersUrl)
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, membersUrl])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch(membersUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      })
      if (res.ok) {
        setInviteEmail('')
        await loadMembers()
      }
    } finally {
      setInviting(false)
    }
  }

  const handleChangeRole = async (userId, role) => {
    await fetch(`${membersUrl}/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    })
    await loadMembers()
  }

  const handleRemove = async userId => {
    const confirm = window.confirm('Remove this member from the board?')
    if (!confirm) return
    await fetch(`${membersUrl}/${userId}`, { method: 'DELETE' })
    await loadMembers()
  }

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: theme => (theme.zIndex?.modal ?? 1300) + 1000 }}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-backgroundPaper'>
        <CardHeader
          title={<Typography variant='h6'>Board members</Typography>}
          action={
            <IconButton onClick={onClose} size='small'>
              <i className='tabler-x' />
            </IconButton>
          }
        />
        <CardContent className='space-y-4'>
          <div className='flex gap-2 items-end'>
            <TextField
              fullWidth
              label='Invite by email'
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
            <TextField select label='Role' value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              {roleOptions.map(r => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <Button variant='contained' onClick={handleInvite} disabled={inviting}>
              {inviting ? 'Inviting…' : 'Invite'}
            </Button>
          </div>

          <Divider />

          <div className='space-y-2 max-h-[50vh] overflow-y-auto'>
            {loading ? (
              <Typography className='text-textSecondary'>Loading members…</Typography>
            ) : members.length === 0 ? (
              <Typography className='text-textSecondary'>No members yet.</Typography>
            ) : (
              members.map(m => {
                const u = m.mUser || m.user || {}
                const name = u.userName || u.name || u.email || 'User'
                const initial = typeof name === 'string' && name.length > 0 ? name.charAt(0) : 'U'
                return (
                  <div key={String(m.boardMemberId)} className='flex items-center gap-3 border border-divider rounded p-2'>
                    <Avatar>{initial}</Avatar>
                    <div className='flex-1'>
                      <div className='font-medium'>{name}</div>
                      <div className='text-xs text-textSecondary'>role: {m.role}</div>
                    </div>
                    <TextField
                      select
                      size='small'
                      value={m.role}
                      onChange={e => handleChangeRole(m.userId, e.target.value)}
                    >
                      {roleOptions.map(r => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </TextField>
                    <IconButton color='error' onClick={() => handleRemove(m.userId)}>
                      <i className='tabler-trash' />
                    </IconButton>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}

export default BoardMembersModal


