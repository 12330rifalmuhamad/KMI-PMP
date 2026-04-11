'use client'

import { useMemo } from 'react'

import { Box, Typography } from '@mui/material'

const ProgressCell = ({ item, column, allColumns }) => {
  // Hitung progres
  const progress = useMemo(() => {
    // 1. Dapatkan daftar kolom status yang dipantau
    const watchedColumnIds = (column.watchedStatusColumns || []).map(link => link.statusColumnId)

    if (watchedColumnIds.length === 0) {
      return { percent: 0, text: 'N/A' }
    }

    // 2. Dapatkan label "Selesai" dari semua kolom status yang dipantau
    // Untuk saat ini, kita asumsikan label "Selesai" adalah universal.
    // TODO: Ambil label 'Done' dari mColumnOption
    const DONE_LABELS = ['Selesai', 'Done']

    // 3. Hitung berapa banyak yang selesai
    let doneCount = 0

    item.values.forEach(val => {
      if (watchedColumnIds.includes(val.columnId) && DONE_LABELS.includes(val.value)) {
        doneCount++
      }
    })

    const percent = Math.round((doneCount / watchedColumnIds.length) * 100)

    return { percent, text: `${percent}%` }
  }, [item, column])

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: '70%', height: 20, backgroundColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${progress.percent}%`,
            height: '100%',
            backgroundColor: progress.percent === 100 ? 'success.main' : 'primary.main'
          }}
        />
      </Box>
      <Typography variant='body2' sx={{ width: '30%', textAlign: 'right' }}>
        {progress.text}
      </Typography>
    </Box>
  )
}

export default ProgressCell
