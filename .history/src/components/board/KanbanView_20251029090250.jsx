'use client'

import { useEffect, useMemo, useState, useRef } from 'react'

import useSWR, { useSWRConfig } from 'swr'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

// Component Imports
import KanbanList from './kanban/KanbanList'
import NewColumn from './kanban/NewColumn'
import KanbanDrawer from './kanban/KanbanDrawer'

const fetcher = url => fetch(url).then(res => res.json())

const KanbanView = ({ board }) => {
  // State
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)

  // Hooks
  const { mutate } = useSWRConfig()

  // Transform board data to kanban format
  const { kanbanColumns, tasksMap } = useMemo(() => {
    if (!board) return { kanbanColumns: [], tasksMap: new Map() }

    // Find Status column for kanban columns
    const statusColumn = board.columns.find(c => c.columnName === 'Status')
    const personColumn = board.columns.find(c => c.columnType === 'PERSON')
    const dateColumn = board.columns.find(c => c.columnType === 'DATE')

    if (!statusColumn) return { kanbanColumns: [], tasksMap: new Map() }

    // Create map of all tasks for quick access
    const allTasks = new Map()

    board.groups.forEach(group => {
      group.items.forEach(item => {
        const rawStatus = item.values.find(v => v.columnId === statusColumn.columnId)?.value || 'Belum Mulai'

        const statusMap = {
          'Belum Mulai': 'Belum Mulai',
          'Sedang Dikerjakan': 'Sedang Dikerjakan',
          Buntu: 'Buntu',
          Selesai: 'Selesai'
        }

        const statusValue = statusMap[rawStatus] || rawStatus
        const personValue = item.values.find(v => v.columnId === personColumn?.columnId)?.value

        const dateValue =
          item.values.find(v => v.columnId === dateColumn?.columnId)?.value ||
          item.values.find(v => v.column?.columnType === 'DATE')?.value ||
          null

        const user = personValue ? board.boardMember.find(m => m.userId === parseInt(personValue))?.mUser : null

        allTasks.set(item.taskId, {
          ...item,
          status: statusValue,
          user: user,
          date: dateValue
        })
      })
    })

    // Create kanban columns based on unique status values (matching table view)
    const statusOrder = ['Belum Mulai', 'Sedang Dikerjakan', 'Buntu', 'Selesai']

    const columns = statusOrder.map(status => ({
      id: status,
      title: status,
      taskIds: []
    }))

    const uncategorizedColumn = { id: 'Belum Mulai', title: 'Belum Mulai', taskIds: [] }

    // Assign tasks to appropriate status columns
    allTasks.forEach(task => {
      const targetColumn = columns.find(c => c.id === task.status)

      if (targetColumn) {
        targetColumn.taskIds.push(task.taskId)
      } else {
        uncategorizedColumn.taskIds.push(task.taskId)
      }
    })

    if (uncategorizedColumn.taskIds.length > 0) columns.push(uncategorizedColumn)

    return { kanbanColumns: columns, tasksMap: allTasks }
  }, [board])

  // Setup drag-and-drop for columns
  const [boardRef, columns, setColumns] = useDragAndDrop(kanbanColumns, {
    plugins: [animations()],
    dragHandle: '.list-handle',
    draggable: el => !!el?.classList?.contains?.('kanban-column-draggable')
  })

  // Handle cross-column task movement
  const handleTaskMove = (movedTaskId, fromColumnId, toColumnId) => {
    if (fromColumnId === toColumnId) return

    const newColumns = columns.map(col => {
      if (col.id === fromColumnId) {
        return { ...col, taskIds: col.taskIds.filter(id => id !== movedTaskId) }
      }

      if (col.id === toColumnId) {
        return { ...col, taskIds: [...col.taskIds, movedTaskId] }
      }

      return col
    })

    setColumns(newColumns)

    // Update task status in backend
    const newStatus = toColumnId
    const statusColumnId = board.columns.find(c => c.columnName === 'Status')?.columnId

    if (statusColumnId) {
      fetch(`/api/tasks/${movedTaskId}/values`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intColumn_ID: statusColumnId, txtValue: newStatus })
      }).then(() => {
        mutate(`/api/boards/${board.boardId}`)
      })
    }
  }

  // Save changes to backend on drag-and-drop
  const prevColumnsRef = useRef(columns)

  useEffect(() => {
    if (JSON.stringify(prevColumnsRef.current) !== JSON.stringify(columns)) {
      for (const newColumn of columns) {
        const prevColumn = prevColumnsRef.current.find(c => c.id === newColumn.id)
        const movedTaskId = newColumn.taskIds.find(id => !prevColumn?.taskIds.includes(id))

        if (movedTaskId) {
          const newStatus = newColumn.id
          const statusColumnId = board.columns.find(c => c.columnName === 'Status')?.columnId

          fetch(`/api/tasks/${movedTaskId}/values`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intColumn_ID: statusColumnId, txtValue: newStatus })
          }).then(() => {
            mutate(`/api/boards/${board.boardId}`)
          })
          break
        }
      }
    }

    prevColumnsRef.current = columns
  }, [columns, board, mutate])

  // Add new column (status)
  const addNewColumn = async title => {
    try {
      await fetch(`/api/boards/${board.boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txtColumnName: title,
          txtColumnType: 'STATUS'
        })
      })
      mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
      console.error('Failed to create column:', error)
    }
  }

  // Open task drawer
  const handleOpenDrawer = task => {
    setCurrentTask(task)
    setDrawerOpen(true)
  }

  // Close task drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setCurrentTask(null)
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-x-auto overflow-y-hidden'>
        <div
          ref={boardRef}
          className='flex gap-6 min-w-max h-full pb-4'
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const taskId = e.dataTransfer.getData('text/plain')
            const targetColumn = e.target.closest('.kanban-column-draggable')

            if (taskId && targetColumn) {
              const targetColumnId = targetColumn.getAttribute('data-column-id')

              if (targetColumnId && targetColumnId !== column?.id) {
                handleTaskMove(parseInt(taskId), column?.id, targetColumnId)
              }
            }
          }}
        >
          {columns.map(column => (
            <KanbanList
              key={column.id}
              column={column}
              board={board}
              setDrawerOpen={setDrawerOpen}
              columns={columns}
              setColumns={setColumns}
              currentTask={currentTask}
              tasks={column.taskIds.map(taskId => tasksMap.get(taskId)).filter(Boolean)}
              onOpenDrawer={handleOpenDrawer}
              onTaskMove={handleTaskMove}
              mutate={mutate}
            />
          ))}
          <NewColumn addNewColumn={addNewColumn} />
        </div>
      </div>
      {currentTask && (
        <KanbanDrawer
          task={currentTask}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          onClose={handleCloseDrawer}
          board={board}
          mutate={mutate}
        />
      )}
    </div>
  )
}

export default KanbanView
