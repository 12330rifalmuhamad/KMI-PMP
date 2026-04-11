'use client'

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Impor state management modal
import { useModalStore } from '@/store/useModalStore'

const fetcher = url => fetch(url).then(res => res.json())

export default function CreateBoardModal({ onSuccess }) {
  const { isOpen, closeModal } = useModalStore(state => ({
    isOpen: state.isOpen['CREATE_BOARD'],
    closeModal: state.closeModal
  }))
  
  const [formData, setFormData] = useState({
    boardName: '',
    description: '',
    workspaceId: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { data: workspaces } = useSWR('/api/workspaces', fetcher)

  const handleInputChange = (field) => (event) => {
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
    
    if (!formData.boardName.trim()) {
      newErrors.boardName = 'Nama board diperlukan'
    }
    
    if (!formData.workspaceId) {
      newErrors.workspaceId = 'Workspace diperlukan'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        const board = await response.json()
        closeModal('CREATE_BOARD')
        setFormData({ boardName: '', description: '', workspaceId: '' })
        setErrors({})
        
        if (onSuccess) {
          onSuccess(board)
        }
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.message || 'Gagal membuat board' })
      }
    } catch (error) {
      console.error('Error creating board:', error)
      setErrors({ submit: 'Terjadi kesalahan saat membuat board' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      closeModal('CREATE_BOARD')
      setFormData({ boardName: '', description: '', workspaceId: '' })
      setErrors({})
    }
  }

  // Set default workspace if only one exists
  useEffect(() => {
    if (workspaces && workspaces.length === 1 && !formData.workspaceId) {
      setFormData(prev => ({
        ...prev,
        workspaceId: workspaces[0].workspaceId.toString()
      }))
    }
  }, [workspaces, formData.workspaceId])

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box className='flex items-center gap-2'>
            <i className='tabler-layout-board text-2xl text-primary-main' />
            <span>Buat Board Baru</span>
          </Box>
        </DialogTitle>
        
        <DialogContent className='pt-4'>
          <div className='space-y-4'>
            <FormControl fullWidth error={!!errors.workspaceId}>
              <InputLabel>Workspace</InputLabel>
              <Select
                value={formData.workspaceId}
                onChange={handleInputChange('workspaceId')}
                label="Workspace"
                disabled={isLoading}
              >
                {workspaces?.map((workspace) => (
                  <MenuItem key={workspace.workspaceId} value={workspace.workspaceId.toString()}>
                    <Box className='flex items-center gap-2'>
                      <i className='tabler-folder text-sm' />
                      <span>{workspace.workspaceName}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.workspaceId && (
                <Typography variant='caption' className='text-red-500 mt-1'>
                  {errors.workspaceId}
                </Typography>
              )}
            </FormControl>
            
            <TextField
              fullWidth
              label="Nama Board"
              value={formData.boardName}
              onChange={handleInputChange('boardName')}
              error={!!errors.boardName}
              helperText={errors.boardName}
              placeholder="Masukkan nama board"
              disabled={isLoading}
              autoFocus
            />
            
            <TextField
              fullWidth
              label="Deskripsi (Opsional)"
              value={formData.description}
              onChange={handleInputChange('description')}
              multiline
              rows={3}
              placeholder="Deskripsi singkat tentang board ini"
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
          <Button 
            onClick={handleClose}
            disabled={isLoading}
            className='!normal-case'
          >
            Batal
          </Button>
          <Button 
            type="submit"
            variant='contained'
            disabled={isLoading}
            className='!normal-case'
            startIcon={isLoading ? <CircularProgress size={16} /> : <i className='tabler-layout-board' />}
          >
            {isLoading ? 'Membuat...' : 'Buat Board'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
