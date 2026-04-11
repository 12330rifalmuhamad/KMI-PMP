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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
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
  const [activeTab, setActiveTab] = useState('personal-info')

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

  // Navigation items
  const navigationItems = [
    { id: 'personal-info', label: 'Personal info', icon: 'tabler-user' },
    { id: 'working-status', label: 'Working status', icon: 'tabler-briefcase' },
    { id: 'notifications', label: 'Notifications', icon: 'tabler-bell' },
    { id: 'language-region', label: 'Language & region', icon: 'tabler-world' },
    { id: 'password', label: 'Password', icon: 'tabler-lock' },
    { id: 'session-history', label: 'Session history', icon: 'tabler-list' }
  ]

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'personal-info':
        return (
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* User Information Card */}
            <Card className='bg-gray-800 border-gray-700'>
              <CardContent className='p-6'>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Box className='flex flex-col items-center space-y-4'>
                      <Avatar
                        src={profileImage}
                        alt={session?.user?.name || 'User'}
                        className='w-24 h-24 bg-gray-600'
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
                          <Button
                            variant='outlined'
                            component='span'
                            size='small'
                            className='text-white border-gray-500 hover:border-gray-400'
                          >
                            <i className='tabler-camera mr-2' />
                            Change Photo
                          </Button>
                        </label>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Box className='space-y-4'>
                      <Typography variant='h5' className='text-white font-semibold'>
                        {session?.user?.name || 'PMDev'}
                      </Typography>

                      <Controller
                        name='jobTitle'
                        control={control}
                        render={({ field }) => (
                          <CustomTextField
                            {...field}
                            placeholder='Add a job title'
                            className='text-gray-300'
                            InputProps={{
                              className: 'text-gray-300',
                              sx: { '& input': { color: 'white' } }
                            }}
                          />
                        )}
                      />

                      <Controller
                        name='company'
                        control={control}
                        render={({ field }) => (
                          <CustomTextField
                            {...field}
                            placeholder='Add a company name'
                            className='text-gray-300'
                            InputProps={{
                              className: 'text-gray-300',
                              sx: { '& input': { color: 'white' } }
                            }}
                          />
                        )}
                      />

                      <Chip label='Guest' className='bg-purple-600 text-white' size='small' />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Contact Information Card */}
            <Card className='bg-gray-800 border-gray-700'>
              <CardContent className='p-6'>
                <Typography variant='h6' className='text-white font-semibold mb-4'>
                  Contact Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box className='flex items-center space-x-3'>
                      <i className='tabler-mail text-gray-400' />
                      <Box>
                        <Typography variant='body2' className='text-gray-400'>
                          Email
                        </Typography>
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
                              placeholder='Add email'
                              error={!!errors.email}
                              helperText={errors.email?.message}
                              InputProps={{
                                sx: { '& input': { color: 'white' } }
                              }}
                            />
                          )}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box className='flex items-center space-x-3'>
                      <i className='tabler-phone text-gray-400' />
                      <Box>
                        <Typography variant='body2' className='text-gray-400'>
                          Phone
                        </Typography>
                        <Controller
                          name='phone'
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              placeholder='Add a phone'
                              InputProps={{
                                sx: { '& input': { color: 'white' } }
                              }}
                            />
                          )}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box className='flex items-center space-x-3'>
                      <i className='tabler-device-mobile text-gray-400' />
                      <Box>
                        <Typography variant='body2' className='text-gray-400'>
                          Mobile phone
                        </Typography>
                        <CustomTextField
                          placeholder='Add a mobile phone'
                          InputProps={{
                            sx: { '& input': { color: 'white' } }
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box className='flex items-center space-x-3'>
                      <i className='tabler-map-pin text-gray-400' />
                      <Box>
                        <Typography variant='body2' className='text-gray-400'>
                          Location
                        </Typography>
                        <Controller
                          name='location'
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              placeholder='Add a location'
                              InputProps={{
                                sx: { '& input': { color: 'white' } }
                              }}
                            />
                          )}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Dates Card */}
            <Card className='bg-gray-800 border-gray-700'>
              <CardContent className='p-6'>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box className='flex items-center space-x-3'>
                      <i className='tabler-gift text-gray-400' />
                      <Box>
                        <Typography variant='body2' className='text-gray-400'>
                          Birthday
                        </Typography>
                        <Controller
                          name='birthday'
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              placeholder='Add a birthday'
                              InputProps={{
                                sx: { '& input': { color: 'white' } }
                              }}
                            />
                          )}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box className='flex items-center space-x-3'>
                      <i className='tabler-calendar text-gray-400' />
                      <Box>
                        <Typography variant='body2' className='text-gray-400'>
                          Work anniversary
                        </Typography>
                        <Controller
                          name='workAnniversary'
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              placeholder='Add a work anniversary'
                              InputProps={{
                                sx: { '& input': { color: 'white' } }
                              }}
                            />
                          )}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Assigned Boards Card */}
            <Card className='bg-gray-800 border-gray-700'>
              <CardContent className='p-6'>
                <Typography variant='h6' className='text-white font-semibold mb-4'>
                  My assigned boards
                </Typography>

                <Box className='flex items-center space-x-3'>
                  <i className='tabler-file-text text-gray-400' />
                  <Typography className='text-white'>Trial Develop New Monday</Typography>
                </Box>
              </CardContent>
            </Card>

            <Box className='flex justify-end space-x-2 pt-4'>
              <Button
                variant='outlined'
                onClick={() => reset()}
                disabled={loading}
                className='text-white border-gray-500 hover:border-gray-400'
              >
                Reset
              </Button>
              <Button
                type='submit'
                variant='contained'
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-check' />}
                className='bg-purple-600 hover:bg-purple-700'
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
        )

      case 'password':
        return (
          <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-6'>
              <Typography variant='h6' className='text-white font-semibold mb-4'>
                Change Password
              </Typography>

              <form onSubmit={handlePasswordChange} className='space-y-4'>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <CustomTextField
                      name='currentPassword'
                      label='Current Password'
                      type='password'
                      placeholder='Enter current password'
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-lock' />
                          </InputAdornment>
                        ),
                        sx: { '& input': { color: 'white' } }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <CustomTextField
                      name='newPassword'
                      label='New Password'
                      type='password'
                      placeholder='Enter new password'
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-key' />
                          </InputAdornment>
                        ),
                        sx: { '& input': { color: 'white' } }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <CustomTextField
                      name='confirmPassword'
                      label='Confirm New Password'
                      type='password'
                      placeholder='Confirm new password'
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-key' />
                          </InputAdornment>
                        ),
                        sx: { '& input': { color: 'white' } }
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
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-6'>
              <Typography variant='h6' className='text-white font-semibold mb-4'>
                {navigationItems.find(item => item.id === activeTab)?.label}
              </Typography>
              <Typography className='text-gray-400'>This section is coming soon...</Typography>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <Box className='min-h-screen bg-gray-900'>
      {/* Notification Banner */}
      <Box className='bg-purple-600 text-white p-3 flex items-center justify-center space-x-4'>
        <Typography variant='body2'>Enable desktop notifications on this computer</Typography>
        <Button variant='contained' size='small' className='bg-purple-500 hover:bg-purple-400'>
          Enable now
        </Button>
        <Button variant='text' size='small' className='text-white'>
          <i className='tabler-x' />
        </Button>
      </Box>

      <Box className='flex'>
        {/* Sidebar */}
        <Box className='w-64 bg-gray-800 min-h-screen p-6'>
          <Typography variant='h4' className='text-white font-bold mb-8'>
            Profile
          </Typography>

          <List className='space-y-2'>
            {navigationItems.map(item => (
              <ListItem
                key={item.id}
                button
                onClick={() => setActiveTab(item.id)}
                className={`rounded-lg mb-2 ${activeTab === item.id ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
              >
                <ListItemIcon>
                  <i className={`${item.icon} ${activeTab === item.id ? 'text-white' : 'text-gray-400'}`} />
                </ListItemIcon>
                <ListItemText primary={item.label} className={activeTab === item.id ? 'text-white' : 'text-gray-300'} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Main Content */}
        <Box className='flex-1 p-8'>{renderContent()}</Box>
      </Box>

      {/* Snackbar for notifications */}
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
    </Box>
  )
}

export default UserProfilePage
