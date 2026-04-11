'use client'

import React, { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Impor state management modal
import { useModalStore } from '@/store/useModalStore'

export default function CreateWorkspaceModal({ onSuccess }) {
  const isOpen = useModalStore(state => state.isOpen['CREATE_WORKSPACE'])
  const closeModal = useModalStore(state => state.closeModal)

  const [formData, setFormData] = useState({
    workspaceName: '',
    description: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = field => event => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.workspaceName.trim()) {
      newErrors.workspaceName = 'Nama workspace diperlukan'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async event => {
    event.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const workspace = await response.json()
        closeModal('CREATE_WORKSPACE')
        setFormData({ workspaceName: '', description: '' })
        setErrors({})

        if (onSuccess) {
          onSuccess(workspace)
        }
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.message || 'Gagal membuat workspace' })
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      setErrors({ submit: 'Terjadi kesalahan saat membuat workspace' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      closeModal('CREATE_WORKSPACE')
      setFormData({ workspaceName: '', description: '' })
      setErrors({})
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth='sm' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box className='flex items-center gap-2'>
            <i className='tabler-folder-plus text-2xl text-primary-main' />
            <span>Buat Workspace Baru</span>
          </Box>
        </DialogTitle>

        <DialogContent className='pt-4'>
          <div className='space-y-4'>
            <TextField
              fullWidth
              label='Nama Workspace'
              value={formData.workspaceName}
              onChange={handleInputChange('workspaceName')}
              error={!!errors.workspaceName}
              helperText={errors.workspaceName}
              placeholder='Masukkan nama workspace'
              disabled={isLoading}
              autoFocus
            />

            <TextField
              fullWidth
              label='Deskripsi (Opsional)'
              value={formData.description}
              onChange={handleInputChange('description')}
              multiline
              rows={3}
              placeholder='Deskripsi singkat tentang workspace ini'
              disabled={isLoading}
            />
          </div>

          {errors.submit && (
            <Box className='mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md'>
              <Typography variant='body2' className='text-red-600 dark:text-red-400'>
                {errors.submit}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions className='px-6 pb-4'>
          <Button onClick={handleClose} disabled={isLoading} className='!normal-case'>
            Batal
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isLoading}
            className='!normal-case'
            startIcon={isLoading ? <CircularProgress size={16} /> : <i className='tabler-folder-plus' />}
          >
            {isLoading ? 'Membuat...' : 'Buat Workspace'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
