'use client'

import { useState } from 'react'

import { TextField, Button } from '@mui/material'

const NewTask = ({ onAddTask }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    if (!title.trim()) return
    onAddTask(title)
    setTitle('')
    setIsAdding(false)
  }

  if (!isAdding) {
    return (
      <Button
        fullWidth
        startIcon={<i className='tabler-plus' />}
        onClick={() => setIsAdding(true)}
        className='!justify-start !text-textSecondary !normal-case'
      >
        Add another card
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
      <TextField
        fullWidth
        autoFocus
        variant='outlined'
        size='small'
        placeholder='Enter a title for this card...'
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <div className='flex items-center gap-2'>
        <Button type='submit' variant='contained'>
          Add card
        </Button>
        <Button onClick={() => setIsAdding(false)}>
          <i className='tabler-x' />
        </Button>
      </div>
    </form>
  )
}

export default NewTask
