// React Imports
import { useEffect, useState, useRef } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import InputAdornment from '@mui/material/InputAdornment'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { minLength, nonEmpty, object, pipe, string } from 'valibot'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const schema = object({
  title: pipe(string(), nonEmpty('Title is required'), minLength(1))
})

const KanbanDrawer = props => {
  // Props
  const { drawerOpen, setDrawerOpen, task, board, mutate, onClose } = props

  // States
  const [date, setDate] = useState(null)
  const [badgeText, setBadgeText] = useState([])
  const [fileName, setFileName] = useState('')
  const [comment, setComment] = useState('')

  // Refs
  const fileInputRef = useRef(null)

  // Hooks
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: task?.taskTitle || ''
    },
    resolver: valibotResolver(schema)
  })

  // Handle File Upload
  const handleFileUpload = event => {
    const { files } = event.target

    if (files && files.length !== 0) {
      setFileName(files[0].name)
    }
  }

  // Close Drawer
  const handleClose = () => {
    setDrawerOpen(false)
    reset({ title: task?.taskTitle || '' })
    setBadgeText([])
    setDate(null)
    setFileName('')
    setComment('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (onClose) onClose()
  }

  // Update Task
  const updateTask = async data => {
    try {
      await fetch(`/api/tasks/${task.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: data.title })
      })
      mutate(`/api/boards/${board.boardId}`)
      handleClose()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  // Handle Reset
  const handleReset = async () => {
    try {
      await fetch(`/api/tasks/${task.taskId}`, {
        method: 'DELETE'
      })
      mutate(`/api/boards/${board.boardId}`)
      handleClose()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  // To set the initial values according to the task
  useEffect(() => {
    if (task) {
      reset({ title: task.taskTitle })
      setBadgeText([])
      setDate(null)
    }
  }, [task, reset])

  return (
    <div>
      <Drawer
        open={drawerOpen}
        anchor='right'
        variant='temporary'
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
        onClose={handleClose}
      >
        <div className='flex justify-between items-center pli-6 plb-5 border-be'>
          <Typography variant='h5'>Edit Task</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='tabler-x text-2xl text-textPrimary' />
          </IconButton>
        </div>
        <div className='p-6'>
          <form className='flex flex-col gap-y-5' onSubmit={handleSubmit(updateTask)}>
            <Controller
              name='title'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  label='Title'
                  {...field}
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message}
                />
              )}
            />

            <div>
              <Typography variant='caption' color='text.primary'>
                Assigned to
              </Typography>
              <div className='flex gap-1 mt-2'>
                {task.user && (
                  <Tooltip title={task.user.userName}>
                    <CustomAvatar size={26} className='cursor-pointer'>
                      {task.user.userName.charAt(0)}
                    </CustomAvatar>
                  </Tooltip>
                )}
                <CustomAvatar size={26} className='cursor-pointer'>
                  <i className='tabler-plus text-base text-textSecondary' />
                </CustomAvatar>
              </div>
            </div>

            <CustomTextField
              fullWidth
              label='Comment'
              value={comment}
              onChange={e => setComment(e.target.value)}
              multiline
              rows={4}
              placeholder='Write a Comment....'
            />

            <div className='flex gap-4'>
              <Button variant='contained' color='primary' type='submit'>
                Update
              </Button>
              <Button variant='tonal' color='error' type='reset' onClick={handleReset}>
                Delete
              </Button>
            </div>
          </form>
        </div>
      </Drawer>
    </div>
  )
}

export default KanbanDrawer
