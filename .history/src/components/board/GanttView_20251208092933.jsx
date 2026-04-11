'use client'

import React, { useRef, useEffect, useMemo } from 'react'

import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'

// Helper untuk menambah 1 hari ke tanggal (agar tampilan Gantt inklusif)
const addOneDay = dateStr => {
  const date = new Date(dateStr)

  date.setDate(date.getDate() + 1)

  return date
}

// Fungsi untuk mempersiapkan data untuk Gantt Chart
const prepareGanttData = board => {
  if (!board?.columns || !board?.groups) return { data: [], links: [] }

  // 1. PRIORITAS UTAMA: Cari kolom bertipe 'TIMELINE'
  const timelineColumn = board.columns.find(c => c.columnType === 'TIMELINE')

  // 2. PRIORITAS KEDUA: Cari kolom Date manual (Fallback)
  const startColumnLegacy = board.columns.find(c => c.columnName.toLowerCase().includes('mulai'))
  const endColumnLegacy = board.columns.find(c => c.columnName.toLowerCase().includes('selesai'))

  // Validasi: Harus ada salah satu cara untuk menentukan waktu
  if (!timelineColumn && (!startColumnLegacy || !endColumnLegacy)) {
    return { data: [], links: [] }
  }

  const tasks = []

  // 3. Loop Group & Items
  board.groups.forEach(group => {
    // Opsional: Tambahkan Group sebagai "Project" (Parent Task) agar Gantt lebih rapi
    // Uncomment baris di bawah ini jika ingin menampilkan nama Group di Gantt
    // tasks.push({ id: `group-${group.groupId}`, text: group.groupName, type: 'project', open: true })

    group.items.forEach(item => {
      let startDateStr = null
      let endDateStr = null

      // A. Ambil data dari kolom TIMELINE (Format: "YYYY-MM-DD,YYYY-MM-DD")
      if (timelineColumn) {
        const val = item.values.find(v => v.columnId === timelineColumn.columnId)?.value

        if (val && val.includes(',')) {
          const parts = val.split(',')

          startDateStr = parts[0]
          endDateStr = parts[1]
        }
      }

      // B. Ambil data dari kolom Manual (Fallback)
      else if (startColumnLegacy && endColumnLegacy) {
        startDateStr = item.values.find(v => v.columnId === startColumnLegacy.columnId)?.value
        endDateStr = item.values.find(v => v.columnId === endColumnLegacy.columnId)?.value
      }

      // C. Validasi & Push ke Gantt
      if (startDateStr && endDateStr) {
        // Fix: dhtmlx-gantt merender end_date secara eksklusif (jam 00:00).
        // Jadi kita perlu menambah 1 hari pada end_date agar visual bar penuh sampai akhir hari.
        const formattedEndDate = addOneDay(endDateStr)

        tasks.push({
          id: item.taskId,
          text: item.taskTitle,
          start_date: startDateStr, // String 'YYYY-MM-DD' diterima
          end_date: formattedEndDate, // Object Date hasil +1 hari
          // parent: `group-${group.groupId}`, // Uncomment jika menggunakan fitur grouping project
          color: group.groupColor || '#3db9d3' // Gunakan warna group untuk bar gantt
        })
      }
    })
  })

  return { data: tasks, links: [] }
}

const GanttView = ({ board }) => {
  const ganttContainer = useRef(null)

  // Recalculate data only when board data changes
  const ganttData = useMemo(() => prepareGanttData(board), [board])

  useEffect(() => {
    if (ganttContainer.current) {
      gantt.clearAll() // Bersihkan data lama sebelum render ulang

      // Konfigurasi Gantt
      gantt.config.date_format = '%Y-%m-%d'
      gantt.config.readonly = true // Read-only mode
      gantt.config.columns = [
        { name: 'text', label: 'Item Name', tree: true, width: 200 },
        { name: 'start_date', label: 'Start Time', align: 'center' },
        { name: 'duration', label: 'Duration', align: 'center' }
      ]

      // Styling Bar
      gantt.templates.task_class = function (start, end, task) {
        return 'rounded-bar' // Custom class hook jika ingin styling CSS tambahan
      }

      gantt.init(ganttContainer.current)
      gantt.parse(ganttData)
    }
  }, [ganttData])

  // Cek ketersediaan kolom
  const hasTimeline = board.columns.some(c => c.columnType === 'TIMELINE')

  const hasLegacyDates =
    board.columns.some(c => c.columnName.toLowerCase().includes('mulai')) &&
    board.columns.some(c => c.columnName.toLowerCase().includes('selesai'))

  if (!hasTimeline && !hasLegacyDates) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300'>
        <i className='tabler-chart-bar text-4xl mb-2 text-gray-300' />
        <p>
          Gantt Chart requires a <strong>Timeline</strong> column.
        </p>
        <p className='text-xs text-gray-400'>(Or manual Start Date & End Date columns)</p>
      </div>
    )
  }

  return (
    <div className='w-full border rounded-lg overflow-hidden shadow-sm bg-white'>
      <div ref={ganttContainer} style={{ width: '100%', height: '600px' }}></div>
    </div>
  )
}

export default GanttView
