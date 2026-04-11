'use client'

import { useState } from 'react'

import { Card, CardContent, Typography, Avatar as MuiAvatar, IconButton, Menu, MenuItem } from '@mui/material'

const PersonAvatar = ({ user }) => {
  if (!user) return null

  return (
    <MuiAvatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }} title={user.userName}>
      {user.userName.charAt(0)}
    </MuiAvatar>
  )
}

const TaskCard = ({ task, onOpenDrawer, onDeleteTask }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const handleMenuClick = e => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleMenuClose = e => {
    e.stopPropagation()
    setAnchorEl(null)
  }

  const handleDelete = e => {
    e.stopPropagation()
    onDeleteTask(task.taskId)
    handleMenuClose()
  }

  return (
    <>
      <Card
        className='item-draggable w-full cursor-grab active:cursor-grabbing overflow-visible relative group'
        onClick={() => onOpenDrawer(task)}
      >
        <CardContent className='flex flex-col gap-y-2 items-start p-3'>
          <IconButton
            size='small'
            onClick={handleMenuClick}
            className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity !bg-action-hover'
          >
            <i className='tabler-dots-vertical text-sm' />
          </IconButton>

          <Typography color='text.primary' className='break-words'>
            {task.taskTitle}
          </Typography>

          <div className='flex justify-end items-center w-full'>
            <PersonAvatar user={task.user} />
          </div>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <i className='tabler-trash mr-2' /> Delete
        </MenuItem>
      </Menu>
    </>
  )
}

export default TaskCard
