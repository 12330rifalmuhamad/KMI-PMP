'use client'
import { useMemo } from 'react'

import { Box, Typography } from '@mui/material'

const ProgressCell = ({ item, column }) => {
  const progress = useMemo(() => {
    const watchedColumnIds = (column.watchedStatusColumns || []).map(link => link.statusColumnId)

    if (watchedColumnIds.length === 0) {
      return { percent: 0, text: 'N/A' }
    }

    const DONE_LABELS = ['Selesai', 'Done']
    let doneCount = 0
    let relevantValuesCount = 0

    // Kita harus menghitung berdasarkan ID kolom yang *seharusnya* ada, bukan hanya yang terisi
    watchedColumnIds.forEach(colId => {
      relevantValuesCount++ // Setiap kolom yang dipantau dihitung
      const taskValue = item.values.find(val => val.columnId === colId)

      if (taskValue && DONE_LABELS.includes(taskValue.value)) {
        doneCount++
      }
    })

    const percent = relevantValuesCount === 0 ? 0 : Math.round((doneCount / relevantValuesCount) * 100)

    return { percent, text: `${percent}%` }
  }, [item, column])

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: '70%', height: 20, backgroundColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${progress.percent}%`,
            height: '100%',
            backgroundColor: progress.percent === 100 ? 'success.main' : 'primary.main',
            transition: 'width 0.3s ease'
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
