// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'

// Third-party imports
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'
import classnames from 'classnames'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import TaskCard from './TaskCard'
import NewTask from './NewTask'

// Styles Imports
import styles from './styles.module.css'

const KanbanList = props => {
  // Props
  const { column, tasks, board, setDrawerOpen, columns, setColumns, currentTask, onOpenDrawer, mutate } = props

  // States
  const [editDisplay, setEditDisplay] = useState(false)
  const [title, setTitle] = useState(column.title)

  // Hooks
  const [tasksListRef, tasksList, setTasksList] = useDragAndDrop(tasks, {
    group: 'tasksList',
    plugins: [animations()],
    draggable: el => el.classList.contains('item-draggable')
  })

  // Add New Task
  const addNewTask = async taskTitle => {
    try {
      // Find the first group to add the task to
      const firstGroup = board.groups[0]

      if (!firstGroup) return

      const response = await fetch(`/api/groups/${firstGroup.groupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: taskTitle })
      })

      if (response.ok) {
        // Update the task's status to match this column
        const newTask = await response.json()
        const statusColumn = board.columns.find(c => c.columnName === 'Status')

        if (statusColumn) {
          await fetch(`/api/tasks/${newTask.taskId}/values`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              intColumn_ID: statusColumn.columnId,
              txtValue: column.id
            })
          })
        }

        mutate(`/api/boards/${board.boardId}`)
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  // Handle Submit Edit
  const handleSubmitEdit = async e => {
    e.preventDefault()
    setEditDisplay(!editDisplay)

    try {
      // Update column name in database
      const statusColumn = board.columns.find(c => c.columnName === 'Status')

      if (statusColumn) {
        await fetch(`/api/columns/${statusColumn.columnId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txtColumnName: title })
        })
        mutate(`/api/boards/${board.boardId}`)
      }
    } catch (error) {
      console.error('Failed to update column:', error)
    }
  }

  // Cancel Edit
  const cancelEdit = () => {
    setEditDisplay(!editDisplay)
    setTitle(column.title)
  }

  // Delete Column
  const handleDeleteColumn = async () => {
    try {
      const statusColumn = board.columns.find(c => c.columnName === 'Status')

      if (statusColumn) {
        await fetch(`/api/columns/${statusColumn.columnId}`, {
          method: 'DELETE'
        })
        mutate(`/api/boards/${board.boardId}`)
      }
    } catch (error) {
      console.error('Failed to delete column:', error)
    }
  }

  // Update column taskIds on drag and drop
  useEffect(() => {
    if (tasksList !== tasks) {
      const nextTaskIds = Array.from(new Set(tasksList.map(task => task.taskId)))

      // Only update when the taskIds actually changed for this column
      const newColumns = columns.map(col => {
        if (col.id !== column.id) return col

        const isSameOrder =
          col.taskIds?.length === nextTaskIds.length && col.taskIds?.every((id, idx) => id === nextTaskIds[idx])

        if (isSameOrder) return col

        return { ...col, taskIds: nextTaskIds }
      })

      // Avoid triggering parent state update when nothing changed
      const didChange = newColumns.some((c, i) => c !== columns[i])

      if (didChange) setColumns(newColumns)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksList])

  // To update the tasksList when a task is edited
  useEffect(() => {
    const newTasks = tasksList.map(task => {
      if (task?.taskId === currentTask?.taskId) {
        return currentTask
      }

      return task
    })

    if (currentTask !== tasksList.find(task => task?.taskId === currentTask?.taskId)) {
      setTasksList(newTasks)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTask])

  // To update the tasksList when columns are updated
  useEffect(() => {
    // Build the desired task ids order for this column
    const colForThis = columns.find(col => col.id === column.id)
    const desiredIds = Array.from(new Set(colForThis?.taskIds || []))

    // Derive next list from source tasks prop to avoid ping-pong with tasksList
    const nextList = (tasks || []).filter(task => task && desiredIds.includes(task.taskId))

    // Keep the order consistent with desiredIds
    const orderedNextList = desiredIds.map(id => nextList.find(t => t.taskId === id)).filter(Boolean)

    const currentIds = tasksList.map(t => t.taskId)

    const isSame =
      currentIds.length === orderedNextList.length && currentIds.every((id, idx) => id === orderedNextList[idx].taskId)

    if (!isSame) setTasksList(orderedNextList)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns])

  return (
    <div ref={tasksListRef} className='flex flex-col is-[16.5rem] kanban-column-draggable'>
      {editDisplay ? (
        <form
          className='flex items-center mbe-4'
          onSubmit={handleSubmitEdit}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              cancelEdit()
            }
          }}
        >
          <InputBase value={title} autoFocus onChange={e => setTitle(e.target.value)} required className='flex-auto' />
          <IconButton color='success' size='small' type='submit'>
            <i className='tabler-check' />
          </IconButton>
          <IconButton color='error' size='small' type='reset' onClick={cancelEdit}>
            <i className='tabler-x' />
          </IconButton>
        </form>
      ) : (
        <div
          id='no-drag'
          className={classnames(
            'flex items-center justify-between is-[16.5rem] bs-[2.125rem] mbe-4',
            styles.kanbanColumn
          )}
        >
          <Typography variant='h5' noWrap className='max-is-[80%]'>
            {column.title}
          </Typography>
          <div className='flex items-center'>
            <i className={classnames('tabler-arrows-move text-textSecondary list-handle', styles.drag)} />
            <OptionMenu
              iconClassName='text-xl text-textPrimary'
              options={[
                {
                  text: 'Edit',
                  icon: 'tabler-pencil',
                  menuItemProps: {
                    className: 'flex items-center gap-2',
                    onClick: () => setEditDisplay(!editDisplay)
                  }
                },
                {
                  text: 'Delete',
                  icon: 'tabler-trash',
                  menuItemProps: { className: 'flex items-center gap-2', onClick: handleDeleteColumn }
                }
              ]}
            />
          </div>
        </div>
      )}
      {tasksList.map(
        task =>
          task && (
            <TaskCard
              key={task.taskId}
              task={task}
              column={column}
              setColumns={setColumns}
              columns={columns}
              onOpenDrawer={onOpenDrawer}
              tasksList={tasksList}
              setTasksList={setTasksList}
              board={board}
              mutate={mutate}
            />
          )
      )}
      <NewTask addTask={addNewTask} />
    </div>
  )
}

export default KanbanList
