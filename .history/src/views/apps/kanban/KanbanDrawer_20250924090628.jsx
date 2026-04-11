'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

import { useSWRConfig } from 'swr'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { minLength, nonEmpty, object, pipe, string } from 'valibot'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker' // Pastikan ini ada

const schema = object({
  title: pipe(string(), nonEmpty('Title is required'), minLength(1))
})

const KanbanDrawer = ({ open, onClose, item, board }) => {
  // Hooks
  const { mutate } = useSWRConfig()

  // Data "Unpacking"
  // Kita bongkar data dari item.values agar mudah digunakan di form
  const taskData = useMemo(() => {
    if (!item || !board) return { title: '', dueDate: null, priority: '' }

    const findValue = columnName => {
      const column = board.columns.find(c => c.columnName === columnName)

      return item.values.find(v => v.columnId === column?.columnId)?.value || null
    }

    return {
      title: item.taskTitle,
      dueDate: findValue('Tanggal Selesai'),
      priority: findValue('Prioritas')
    }
  }, [item, board])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { title: taskData.title },
    resolver: valibotResolver(schema)
  })

  // Update form values when the selected item changes
  useEffect(() => {
    if (item) {
      reset({ title: item.taskTitle })
    }
  }, [item, reset])

  // --- HANDLER UNTUK MENYIMPAN PERUBAHAN ---

  const handleUpdateTask = async (field, value) => {
    let promise

    if (field === 'title') {
      promise = fetch(`/api/tasks/${item.taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: value })
      })
    } else {
      const column = board.columns.find(c => c.columnName === field)

      if (!column) return

      promise = fetch(`/api/tasks/${item.taskId}/values`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intColumn_ID: column.columnId, txtValue: value })
      })
    }

    await promise
    mutate(`/api/boards/${board.boardId}`)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await fetch(`/api/tasks/${item.taskId}`, { method: 'DELETE' })
      mutate(`/api/boards/${board.boardId}`)
      onClose()
    }
  }

  const onSubmit = data => {
    handleUpdateTask('title', data.title)
  }

  if (!open || !item) return null

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex justify-between items-center p-4 border-b border-divider'>
        <Typography variant='h5'>Task Details</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <div className='p-6'>
        <form className='flex flex-col gap-y-5' onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name='title'
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                label='Title'
                {...field}
                onBlur={handleSubmit(onSubmit)} // Auto-save on blur
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
              />
            )}
          />

          <AppReactDatepicker
            selected={taskData.dueDate ? new Date(taskData.dueDate) : null}
            id='due-date-picker'
            onChange={date => handleUpdateTask('Tanggal Selesai', date.toISOString().split('T')[0])}
            placeholderText='Click to select a date'
            dateFormat={'d MMMM, yyyy'}
            customInput={<TextField label='Due Date' fullWidth />}
          />

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              label='Priority'
              value={taskData.priority || ''}
              onChange={e => handleUpdateTask('Prioritas', e.target.value)}
            >
              <MenuItem value='Rendah'>Rendah</MenuItem>
              <MenuItem value='Medium'>Medium</MenuItem>
              <MenuItem value='Tinggi'>Tinggi</MenuItem>
            </Select>
          </FormControl>

          {/* Fitur lain yang belum diimplementasikan disembunyikan sementara */}
          {/* <Typography variant='caption'>Assigned</Typography> */}
          {/* <Typography variant='caption'>Attachments</Typography> */}

          <div className='flex gap-4 mt-4'>
            <Button variant='contained' color='primary' type='submit'>
              Update Title
            </Button>
            <Button variant='tonal' color='error' onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default KanbanDrawer
