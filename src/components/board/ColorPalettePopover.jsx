'use client'

import { Popover, Box, Grid } from '@mui/material'

// Daftar warna (tailwind class) yang bisa dipilih
const colorPalette = [
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-gray-500',
  'bg-purple-500/10', // Prioritas Tinggi
  'bg-sky-500/10', // Prioritas Medium
  'bg-green-500/10', // Prioritas Rendah
  'bg-gray-400'
]

const ColorPalettePopover = ({ anchorEl, onClose, onColorSelect }) => {
  const open = Boolean(anchorEl)

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Box sx={{ p: 2, width: 200 }}>
        <Grid container spacing={1}>
          {colorPalette.map(color => (
            <Grid item xs={3} key={color}>
              <Box className={`w-10 h-10 rounded cursor-pointer ${color}`} onClick={() => onColorSelect(color)} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Popover>
  )
}

export default ColorPalettePopover
