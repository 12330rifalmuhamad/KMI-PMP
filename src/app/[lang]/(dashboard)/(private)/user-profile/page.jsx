'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

// MUI Imports
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  InputAdornment,
  Chip,
  Tab
} from '@mui/material'

import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

// Third-party imports
import { Controller, useForm } from 'react-hook-form'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const UserProfilePage = () => {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [profileImage, setProfileImage] = useState(session?.user?.image || '')
  const [activeTab, setActiveTab] = useState('personal-info')

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: '',
      bio: '',
      company: '',
      website: '',
      location: '',
      jobTitle: '',
      birthday: '',
      workAnniversary: ''
    }
  })

  // Handle form submission
  const onSubmit = async data => {
    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          image: profileImage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const result = await response.json()

      setSnackbar({
        open: true,
        message: result.message || 'Profile updated successfully!',
        severity: 'success'
      })

      // Update session if needed
      await update({
        ...session,
        user: {
          ...session.user,
          name: data.name,
          email: data.email,
          image: profileImage
        }
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update profile. Please try again.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle profile image change
  const handleImageChange = event => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        setProfileImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle password change
  const handlePasswordChange = async event => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.target)
    const currentPassword = formData.get('currentPassword')
    const newPassword = formData.get('newPassword')
    const confirmPassword = formData.get('confirmPassword')

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password')
      }

      setSnackbar({
        open: true,
        message: result.message || 'Password changed successfully!',
        severity: 'success'
      })

      // Clear the form
      event.target.reset()
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to change password. Please try again.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
         <TabContext value={activeTab}>
            <TabList onChange={handleTabChange} aria-label='user profile tabs'>
              <Tab value='personal-info' label='Personal Info' icon={<i className='tabler-user' />} iconPosition='start' />
              <Tab value='password' label='Change Password' icon={<i className='tabler-lock' />} iconPosition='start' />
              <Tab value='notifications' label='Notifications' icon={<i className='tabler-bell' />} iconPosition='start' />
            </TabList>
            
            <Box className='mt-4'>
                <TabPanel value='personal-info' className='p-0'>
                  <Grid container spacing={6}>
                    <Grid item xs={12} md={5} lg={4}>
                      <Card>
                        <CardContent className='flex flex-col items-center gap-4'>
                            <Avatar
                              src={profileImage}
                              alt={session?.user?.name || 'User'}
                              variant='rounded'
                              className='w-[100px] h-[100px]'
                            />
                            <div className='flex flex-col gap-2 items-center text-center'>
                                <Typography variant='h5'>{session?.user?.name || 'User'}</Typography>
                                <Chip label='Member' size='small' color='secondary' className='rounded-sm' />
                            </div>
                            
                            <div className='flex gap-2 justify-center w-full'>
                                <Button component='label' variant='contained' color='success'>
                                    Upload Photo
                                    <input
                                      hidden
                                      type='file'
                                      accept='image/*'
                                      onChange={handleImageChange}
                                    />
                                </Button>
                                <Button variant='tonal' color='secondary' onClick={() => setProfileImage('')}>
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={7} lg={8}>
                        <Card>
                            <CardContent>
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <Grid container spacing={5}>
                                        <Grid item xs={12} sm={6}>
                                            <Controller
                                                name='name'
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                <CustomTextField fullWidth label='Full Name' placeholder='John Doe' {...field} />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Controller
                                                name='email'
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                <CustomTextField fullWidth type='email' label='Email' placeholder='john.doe@example.com' {...field} />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Controller
                                                name='company'
                                                control={control}
                                                render={({ field }) => (
                                                <CustomTextField fullWidth label='Company' placeholder='Pixinvent' {...field} />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Controller
                                                name='jobTitle'
                                                control={control}
                                                render={({ field }) => (
                                                <CustomTextField fullWidth label='Job Title' placeholder='Product Manager' {...field} />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Controller
                                                name='phone'
                                                control={control}
                                                render={({ field }) => (
                                                <CustomTextField fullWidth label='Phone Number' placeholder='+1 (234) 567-8901' {...field} />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Controller
                                                name='location'
                                                control={control}
                                                render={({ field }) => (
                                                <CustomTextField fullWidth label='Location' placeholder='New York, NY' {...field} />
                                                )}
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} className='flex gap-4'>
                                            <Button variant='contained' type='submit' disabled={loading} color='success'>
                                                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                                            </Button>
                                            <Button variant='tonal' color='secondary' onClick={() => reset()}>Reset</Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>
                  </Grid>
                </TabPanel>
                
                <TabPanel value='password' className='p-0'>
                    <Card>
                        <CardContent>
                             <form onSubmit={handlePasswordChange}>
                                <Grid container spacing={5}>
                                    <Grid item xs={12} sm={6}>
                                        <CustomTextField
                                            fullWidth
                                            name='currentPassword'
                                            label='Current Password'
                                            type='password'
                                            placeholder='············'
                                            InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position='start'>
                                                    <i className='tabler-lock' />
                                                  </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>
                                     <Grid item xs={12} sm={6}>
                                        <CustomTextField
                                            fullWidth
                                            name='newPassword'
                                            label='New Password'
                                            type='password'
                                            placeholder='············'
                                            InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position='start'>
                                                    <i className='tabler-key' />
                                                  </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <CustomTextField
                                            fullWidth
                                            name='confirmPassword'
                                            label='Confirm New Password'
                                            type='password'
                                            placeholder='············'
                                            InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position='start'>
                                                    <i className='tabler-key' />
                                                  </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    
                                     <Grid item xs={12}>
                                            <Button variant='contained' type='submit' disabled={loading} color='success'>
                                                {loading ? <CircularProgress size={24} /> : 'Change Password'}
                                            </Button>
                                     </Grid>
                                </Grid>
                             </form>
                        </CardContent>
                    </Card>
                </TabPanel>
                
                <TabPanel value='notifications' className='p-0'>
                    <Card>
                        <CardContent>
                            <Typography variant='h6'>Notifications</Typography>
                            <Typography variant='body2' className='mt-2'>Manage your notification preferences here.</Typography>
                        </CardContent>
                    </Card>
                </TabPanel>
            </Box>
         </TabContext>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} className='w-full'>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default UserProfilePage
