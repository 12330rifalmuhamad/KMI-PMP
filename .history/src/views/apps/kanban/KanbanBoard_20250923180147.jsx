'use client'
import { useEffect, useMemo, useState } from 'react'

import useSWR from 'swr'

// Third-party imports
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'
import { useDispatch } from 'react-redux'

// Component Imports
import KanbanList from './KanbanList'
import NewColumn from './NewColumn'
import KanbanDrawer from './KanbanDrawer'

const fetcher = url => fetch(url).then(res => res.json())

const KanbanBoard = () => {
  // State
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Hooks
  const dispatch = useDispatch()
  const { data: board } = useSWR('/api/boards/1', fetcher)

  const initialColumns = useMemo(() => {
    if (!board) return []

    return board.groups.map(group => ({ id: Number(group.groupId), title: group.groupName, taskIds: group.items.map(i => Number(i.taskId)) }))
  }, [board])

  const [boardRef, columns, setColumns] = useDragAndDrop(initialColumns, {
    plugins: [animations()],
    dragHandle: '.list-handle'
  })

  // Add New Column (client-only placeholder; backend route exists at /api/boards/[boardId]/groups)
  const addNewColumn = title => {
    const maxId = columns.length ? Math.max(...columns.map(column => column.id)) : 0

    setColumns([...columns, { id: maxId + 1, title, taskIds: [] }])
  }

  // To get the current task for the drawer (not wired to Redux store anymore)
  const currentTask = null

  // Update Columns on Drag and Drop
  useEffect(() => {
    // keep columns state internal
  }, [columns])

  return (
    <div className='flex items-start gap-6'>
      <div ref={boardRef} className='flex gap-6'>
        {columns.map(column => (
          <KanbanList
            key={column.id}
            column={column}
            setDrawerOpen={setDrawerOpen}
            columns={columns}
            setColumns={setColumns}
            currentTask={currentTask}
            tasks={(board?.groups || [])
              .find(g => Number(g.groupId) === column.id)?.items
              .filter(i => column.taskIds.includes(Number(i.taskId)))
              .map(i => ({ id: Number(i.taskId), title: i.taskTitle })) || []}
          />
        ))}
      </div>
      <NewColumn addNewColumn={addNewColumn} />
      {currentTask && (
        <KanbanDrawer
          task={currentTask}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          dispatch={dispatch}
          columns={columns}
          setColumns={setColumns}
        />
      )}
    </div>
  )
}

export default KanbanBoard
