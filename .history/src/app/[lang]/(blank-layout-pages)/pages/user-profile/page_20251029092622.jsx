'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// MUI Imports
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  InputAdornment
} from '@mui/material'

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
      location: ''
    }
  })

  // Handle form submission
  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Here you would typically make an API call to update the user profile
      // For now, we'll just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
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
  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle password change
  const handlePasswordChange = async (data) => {
    setLoading(true)
    try {
      // Here you would make an API call to change the password
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSnackbar({
        open: true,
        message: 'Password changed successfully!',
        severity: 'success'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to change password. Please try again.',
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
    <Box className='flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50'>
      <Card className='w-full max-w-4xl'>
        <CardHeader>
          <Typography variant='h4' className='text-center font-bold'>
            User Profile
          </Typography>
          <Typography variant='body2' className='text-center text-gray-600 mt-2'>
            Manage your account settings and profile information
          </Typography>
        </CardHeader>
        
        <CardContent className='space-y-6'>
          {/* Profile Picture Section */}
          <Box className='flex flex-col items-center space-y-4'>
            <Avatar
              src={profileImage}
              alt={session?.user?.name || 'User'}
              className='w-24 h-24'
            />
            <Box className='flex flex-col items-center space-y-2'>
              <input
                accept='image/*'
                style={{ display: 'none' }}
                id='profile-image-upload'
                type='file'
                onChange={handleImageChange}
              />
              <label htmlFor='profile-image-upload'>
                <Button variant='outlined' component='span' size='small'>
                  <i className='tabler-camera mr-2' />
                  Change Photo
                </Button>
              </label>
              <Typography variant='caption' className='text-gray-500'>
                JPG, PNG or GIF. Max size 2MB.
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Personal Information Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <Typography variant='h6' className='font-semibold'>
              Personal Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name='name'
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      label='Full Name'
                      placeholder='Enter your full name'
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-user' />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name='email'
                  control={control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      label='Email'
                      placeholder='Enter your email'
                      type='email'
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-mail' />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name='phone'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      label='Phone Number'
                      placeholder='Enter your phone number'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-phone' />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name='company'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      label='Company'
                      placeholder='Enter your company name'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-building' />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name='website'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      label='Website'
                      placeholder='https://your-website.com'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-world' />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name='location'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      label='Location'
                      placeholder='Enter your location'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-map-pin' />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name='bio'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      label='Bio'
                      placeholder='Tell us about yourself'
                      multiline
                      rows={4}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-file-text' />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Box className='flex justify-end space-x-2 pt-4'>
              <Button
                variant='outlined'
                onClick={() => reset()}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                type='submit'
                variant='contained'
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-check' />}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>

          <Divider />

          {/* Password Change Section */}
          <Box>
            <Typography variant='h6' className='font-semibold mb-4'>
              Change Password
            </Typography>
            
            <form onSubmit={handlePasswordChange} className='space-y-4'>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <CustomTextField
                    label='Current Password'
                    type='password'
                    placeholder='Enter current password'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-lock' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <CustomTextField
                    label='New Password'
                    type='password'
                    placeholder='Enter new password'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-key' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <CustomTextField
                    label='Confirm New Password'
                    type='password'
                    placeholder='Confirm new password'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-key' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>

              <Box className='flex justify-end pt-4'>
                <Button
                  type='submit'
                  variant='contained'
                  color='warning'
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-key' />}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </form>
          </Box>

          <Divider />

          {/* Account Actions */}
          <Box>
            <Typography variant='h6' className='font-semibold mb-4'>
              Account Actions
            </Typography>
            
            <Box className='space-y-2'>
              <Button
                variant='outlined'
                color='error'
                startIcon={<i className='tabler-logout' />}
                onClick={() => router.push('/en/login')}
                className='w-full'
              >
                Sign Out
              </Button>
              
              <Button
                variant='outlined'
                color='error'
                startIcon={<i className='tabler-trash' />}
                className='w-full'
                disabled
              >
                Delete Account (Coming Soon)
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          className='w-full'
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default UserProfilePage
