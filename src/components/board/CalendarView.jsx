'use client'

import React, { useMemo } from 'react'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction' // untuk event klik, dll.

// Fungsi untuk mempersiapkan data event untuk kalender
const prepareCalendarEvents = board => {
  if (!board?.columns || !board?.groups) return []

  // 1. Cari ID kolom tanggal di papan Anda
  // Kita asumsikan kolom tanggal pertama adalah tanggal event
  const dateColumn = board.columns.find(c => c.columnType === 'DATE')

  if (!dateColumn) return [] // Jika tidak ada kolom tanggal, tidak ada event

  const events = []

  // 2. Loop semua item/tugas untuk membuat event
  board.groups.forEach(group => {
    group.items.forEach(item => {
      const dateValue = item.values.find(v => v.columnId === dateColumn.columnId)

      if (dateValue?.value) {
        events.push({
          id: item.taskId,
          title: item.taskTitle,
          date: dateValue.value // Format 'YYYY-MM-DD'
          // Anda bisa menambahkan properti lain seperti warna
          // backgroundColor: group.groupColor,
          // borderColor: group.groupColor
        })
      }
    })
  })

  return events
}

const CalendarView = ({ board }) => {
  // Gunakan useMemo agar data tidak diproses ulang di setiap render
  const calendarEvents = useMemo(() => prepareCalendarEvents(board), [board])

  const handleEventClick = clickInfo => {
    // Di sini Anda bisa membuka ItemDetailPanel saat event di-klik
    alert(`Anda mengklik tugas: ${clickInfo.event.title}`)

    // Contoh: setSelectedItem(clickInfo.event.id)
  }

  if (!board.columns.some(c => c.columnType === 'DATE')) {
    return (
      <div className='text-center text-yellow-400'>
        Tampilan Kalender memerlukan setidaknya satu kolom bertipe DATE di papan ini.
      </div>
    )
  }

  return (
    <div className='calendar-container text-textPrimary'>
      {/* FullCalendar memerlukan file CSS-nya sendiri, yang akan kita atasi dengan global import */}
      <style jsx global>{`
        .fc .fc-button-primary {
          background-color: #7367f0; // Warna primary Vuexy
          border-color: #7367f0;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: rgba(115, 103, 240, 0.15);
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        weekends={true}
        events={calendarEvents}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
      />
    </div>
  )
}

export default CalendarView
