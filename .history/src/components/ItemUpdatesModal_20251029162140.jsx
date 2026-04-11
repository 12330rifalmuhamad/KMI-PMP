'use client'

import { useEffect, useState } from 'react'

// MUI
import Modal from '@mui/material/Modal'
import Card from '@mui/material/Card'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

const ItemUpdatesModal = ({ open, onClose, task, boardId }) => {
  const [activeTab, setActiveTab] = useState('updates')
  const [updates, setUpdates] = useState([])
  const [newUpdate, setNewUpdate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!task?.taskId || !open) return

    fetch(`/api/tasks/${task.taskId}/updates`)
      .then(res => res.json())
      .then(data => setUpdates(Array.isArray(data) ? data : []))
      .catch(() => setUpdates([]))
  }, [task, open])

  const handlePostUpdate = async () => {
    if (!newUpdate.trim()) return
    setLoading(true)

    try {
      const res = await fetch(`/api/tasks/${task.taskId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateText: newUpdate.trim() })
      })

      if (res.ok) {
        const created = await res.json()
        setUpdates(prev => [created, ...prev])
        setNewUpdate('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: theme => (theme.zIndex?.modal ?? 1300) + 1000 }}>
      <Card className='absolute top-0 right-0 h-full w-full md:w-[720px] bg-backgroundPaper flex flex-col'>
        <div className='flex items-center justify-between px-4 py-3'>
          <Typography variant='h5' className='font-semibold'>
            {task?.taskTitle || 'New item'}
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </div>

        <Divider />

        <div className='px-2 pt-1'>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant='scrollable' allowScrollButtonsMobile>
            <Tab label='Updates' value='updates' />
            <Tab label='Files' value='files' />
            <Tab icon={<i className='tabler-plus' />} value='more' />
          </Tabs>
        </div>

        <Divider />

        {activeTab === 'updates' && (
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            <Card className='p-3 bg-transparent border border-divider'>
              <Typography variant='body2' className='mb-2'>
                Write an update and mention others with @
              </Typography>
              <TextField
                multiline
                minRows={3}
                fullWidth
                value={newUpdate}
                onChange={e => setNewUpdate(e.target.value)}
                placeholder='Share progress, ask a question, or mention a teammate'
              />
              <div className='flex justify-between items-center mt-2'>
                <div className='flex items-center gap-2 text-textSecondary'>
                  <i className='tabler-at' />
                  <i className='tabler-paperclip' />
                  <i className='tabler-photo' />
                  <i className='tabler-mood-smile' />
                </div>
                <Button variant='contained' onClick={handlePostUpdate} disabled={loading}>
                  {loading ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </Card>

            {updates.length === 0 ? (
              <Box className='flex flex-col items-center justify-center py-16 text-center'>
                <i className='tabler-messages text-5xl text-primary-main/70' />
                <Typography variant='h6' className='mt-3'>
                  No updates yet
                </Typography>
                <Typography className='text-textSecondary'>
                  Share progress, mention a teammate, or upload a file to get things moving
                </Typography>
              </Box>
            ) : (
              <div className='space-y-3'>
                {updates.map(u => (
                  <Card key={String(u.updateId)} className='p-3'>
                    <div className='flex items-center justify-between'>
                      <Typography className='font-medium'>{u.user?.userName || 'User'}</Typography>
                      <Typography variant='caption' className='text-textSecondary'>
                        {new Date(u.dtmInserted).toLocaleString()}
                      </Typography>
                    </div>
                    <Typography className='mt-2 whitespace-pre-wrap'>{u.updateText}</Typography>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className='flex-1 overflow-y-auto p-4'>
            <Typography className='text-textSecondary'>Files tab is coming soon…</Typography>
          </div>
        )}
      </Card>
    </Modal>
  )
}

export default ItemUpdatesModal

