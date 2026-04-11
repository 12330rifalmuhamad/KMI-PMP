'use client'

import React, { useRef, useEffect, useMemo } from 'react'

import { useTheme } from '@mui/material/styles' // 1. Import Theme Hook
import { gantt } from 'dhtmlx-gantt'

// Gunakan Skin Material agar lebih cocok dengan Vuexy (Light base)
import 'dhtmlx-gantt/codebase/skins/dhtmlxgantt_material.css'

// =================================================================
// CSS VARIABLES & OVERRIDES FOR DARK MODE
// =================================================================
// Kita menyisipkan style ini secara dinamis saat mode dark aktif
// Warna diambil berdasarkan palet umum Vuexy Dark (#2f3349 background)
const darkModeStyles = `
  .gantt_container {
    background-color: #2f3349 !important;
    font-family: inherit;
  }
  .gantt_grid, .gantt_task, .gantt_grid_scale, .gantt_task_scale, .gantt_grid_data, .gantt_task_bg {
    background-color: #2f3349 !important;
    color: #cfd3ec !important;
  }
  .gantt_grid_scale .gantt_grid_head_cell, .gantt_task_scale .gantt_scale_cell {
    color: #cfd3ec !important;
    font-weight: 600;
  }
  .gantt_row, .gantt_task_row {
    background-color: #2f3349 !important;
    border-bottom: 1px solid #434968 !important;
    color: #cfd3ec !important;
  }
  .gantt_row.gantt_selected, .gantt_task_row.gantt_selected {
    background-color: #3b405c !important;
  }
  .gantt_task_cell {
    border-right: 1px solid #434968 !important;
  }
  .gantt_grid_head_cell {
    border-right: 1px solid #434968 !important;
    border-bottom: 1px solid #434968 !important;
  }
  .gantt_scale_cell {
    border-right: 1px solid #434968 !important;
    border-bottom: 1px solid #434968 !important;
  }
  .gantt_ver_scroll, .gantt_hor_scroll {
    background-color: #2f3349 !important;
  }
  /* Scrollbar Dark Mode */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
    background: #2f3349;
  }
  ::-webkit-scrollbar-thumb {
    background: #5d6383;
    border-radius: 5px;
  }
`

// Helper untuk menambah 1 hari
const addOneDay = dateStr => {
  const date = new Date(dateStr)

  date.setDate(date.getDate() + 1)

  return date
}

// Persiapan Data
const prepareGanttData = board => {
  if (!board?.columns || !board?.groups) return { data: [], links: [] }

  const timelineColumn = board.columns.find(c => c.columnType === 'TIMELINE')
  const startColumnLegacy = board.columns.find(c => c.columnName.toLowerCase().includes('mulai'))
  const endColumnLegacy = board.columns.find(c => c.columnName.toLowerCase().includes('selesai'))

  if (!timelineColumn && (!startColumnLegacy || !endColumnLegacy)) {
    return { data: [], links: [] }
  }

  const tasks = []

  board.groups.forEach(group => {
    // Optional: Render Group Parent
    // tasks.push({ id: `group-${group.groupId}`, text: group.groupName, type: 'project', open: true })

    group.items.forEach(item => {
      let startDateStr = null
      let endDateStr = null

      if (timelineColumn) {
        const val = item.values.find(v => v.columnId === timelineColumn.columnId)?.value

        if (val && val.includes(',')) {
          const parts = val.split(',')

          startDateStr = parts[0]
          endDateStr = parts[1]
        }
      } else if (startColumnLegacy && endColumnLegacy) {
        startDateStr = item.values.find(v => v.columnId === startColumnLegacy.columnId)?.value
        endDateStr = item.values.find(v => v.columnId === endColumnLegacy.columnId)?.value
      }

      if (startDateStr && endDateStr) {
        const formattedEndDate = addOneDay(endDateStr)

        tasks.push({
          id: item.taskId,
          text: item.taskTitle,
          start_date: startDateStr,
          end_date: formattedEndDate,

          // parent: `group-${group.groupId}`,
          color: group.groupColor || '#7367F0' // Vuexy Primary Default
        })
      }
    })
  })

  return { data: tasks, links: [] }
}

const GanttView = ({ board }) => {
  const ganttContainer = useRef(null)
  const theme = useTheme() // 2. Ambil theme saat ini
  const isDarkMode = theme.palette.mode === 'dark' // Cek mode

  const ganttData = useMemo(() => prepareGanttData(board), [board])

  useEffect(() => {
    if (ganttContainer.current) {
      gantt.clearAll()

      // =========================================================
      // KONFIGURASI TEMA
      // =========================================================

      // Inject CSS Styles untuk Dark Mode secara manual
      const styleId = 'gantt-dark-mode-styles'
      let styleTag = document.getElementById(styleId)

      if (isDarkMode) {
        // Jika Dark Mode, pasang style tag jika belum ada
        if (!styleTag) {
          styleTag = document.createElement('style')
          styleTag.id = styleId
          styleTag.innerHTML = darkModeStyles
          document.head.appendChild(styleTag)
        }
      } else {
        // Jika Light Mode, hapus style tag dark mode jika ada
        if (styleTag) {
          styleTag.remove()
        }
      }

      // =========================================================
      // KONFIGURASI GANTT
      // =========================================================

      gantt.config.date_format = '%Y-%m-%d'
      gantt.config.readonly = true
      gantt.config.columns = [
        { name: 'text', label: 'Item Name', tree: true, width: 250, resize: true },
        { name: 'start_date', label: 'Start Time', align: 'center', width: 100 },
        { name: 'duration', label: 'Days', align: 'center', width: 70 }
      ]

      // Auto-fit scale
      gantt.config.scale_height = 50
      gantt.config.row_height = 40

      // Styling Bar Task (Dynamic based on theme for borders/text)
      gantt.templates.task_class = function (start, end, task) {
        return isDarkMode ? 'dark-task-border' : ''
      }

      // Ubah warna text di dalam bar jika terlalu terang/gelap (opsional)
      gantt.templates.task_text = function (start, end, task) {
        return `<span style='color: white;'>${task.text}</span>`
      }

      gantt.init(ganttContainer.current)
      gantt.parse(ganttData)
    }

    // Cleanup: Hapus style saat unmount agar tidak bocor ke halaman lain
    return () => {
      const styleTag = document.getElementById('gantt-dark-mode-styles')

      if (styleTag) styleTag.remove()
    }
  }, [ganttData, isDarkMode]) // 3. Re-render saat mode berubah

  const hasTimeline = board.columns.some(c => c.columnType === 'TIMELINE')

  const hasLegacyDates =
    board.columns.some(c => c.columnName.toLowerCase().includes('mulai')) &&
    board.columns.some(c => c.columnName.toLowerCase().includes('selesai'))

  if (!hasTimeline && !hasLegacyDates) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-64 rounded-lg border border-dashed ${isDarkMode ? 'bg-[#2f3349] border-[#434968] text-[#b6bee3]' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
      >
        <i className='tabler-chart-bar text-4xl mb-2 opacity-50' />
        <p>
          Gantt Chart requires a <strong>Timeline</strong> column.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`w-full border rounded-lg overflow-hidden shadow-sm ${isDarkMode ? 'border-[#434968]' : 'border-gray-200'}`}
    >
      <div
        ref={ganttContainer}
        style={{ width: '100%', height: '600px', backgroundColor: isDarkMode ? '#2f3349' : '#fff' }}
      ></div>
    </div>
  )
}

export default GanttView
