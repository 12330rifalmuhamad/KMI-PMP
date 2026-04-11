'use client'

import React, { useState } from 'react'

import { useSWRConfig } from 'swr'

import ItemDetailPanel from './ItemDetailPanel' // Impor komponen baru

// ... (Komponen Avatar dan Badge tidak berubah)
const PersonAvatar = ({ user }) => (
  <div
    className='w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-700'
    title={user?.userName || 'Unassigned'}
  >
    {user ? user.userName.charAt(0).toUpperCase() : '?'}
  </div>
)

const Badge = ({ value, type }) => {
  let colors = 'bg-gray-400 text-white'

  if (type === 'Status') {
    if (value === 'Sedang Dikerjakan') colors = 'bg-yellow-500 text-white'
    else if (value === 'Buntu') colors = 'bg-red-500 text-white'
    else if (value === 'Selesai') colors = 'bg-green-500 text-white'
    else if (value === 'Belum Mulai') colors = 'bg-gray-500 text-white'
  } else if (type === 'Prioritas') {
    if (value === 'Tinggi') colors = 'bg-purple-600 text-white'
    else if (value === 'Medium') colors = 'bg-indigo-500 text-white'
    else if (value === 'Rendah') colors = 'bg-sky-500 text-white'
  }

  return (
    <span className={`cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${colors}`}>
      {value || 'Set'}
    </span>
  )
}

export default function TableView({ board }) {
  const { mutate } = useSWRConfig()
  const [newItemTitle, setNewItemTitle] = useState('')
  const [activeNewItemInput, setActiveNewItemInput] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null) // State untuk item yang dipilih

  const findUserById = userId => {
    const member = board.boardMember.find(m => m.userId === parseInt(userId))

    return member?.mUser
  }

  const handleCreateTask = async groupId => {
    if (!newItemTitle.trim()) {
      setActiveNewItemInput(null)

      return
    }

    await fetch(`/api/groups/${groupId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txtTaskTitle: newItemTitle })
    })
    setNewItemTitle('')
    setActiveNewItemInput(null)
    mutate(`/api/boards/${board.boardId}`)
  }

  return (
    <div className='relative'>
      {' '}
      {/* Tambahkan relative agar panel bisa diposisikan */}
      <div>
        <div className='bg-gray-800 p-3 rounded-md mb-4 flex items-center text-sm'>
          <button className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-md'>
            New Item
          </button>
        </div>

        <div className='overflow-x-auto rounded-lg'>
          <table className='min-w-full border-collapse'>
            <thead className='bg-gray-700'>
              <tr>
                <th className='p-3 text-left text-xs font-semibold text-gray-400 w-12'>
                  <input type='checkbox' className='form-checkbox bg-gray-600 border-gray-500 rounded text-blue-500' />
                </th>
                {board.columns?.map(column => (
                  <th
                    key={column.columnId}
                    className='p-3 text-left text-xs font-semibold text-gray-400 whitespace-nowrap'
                  >
                    {column.columnName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-800'>
              {board.groups?.map(group => (
                <React.Fragment key={group.groupId}>
                  <tr>
                    <td
                      colSpan={board.columns.length + 1}
                      className='p-3 bg-gray-800 font-bold text-gray-300'
                      style={{ borderLeft: `4px solid ${group.groupColor}` }}
                    >
                      {group.groupName}
                    </td>
                  </tr>
                  {group.items?.map(item => (
                    <tr key={item.taskId} className='hover:bg-gray-800'>
                      <td className='p-3 align-middle w-12'>
                        <input
                          type='checkbox'
                          className='form-checkbox bg-gray-700 border-gray-600 rounded text-blue-500'
                        />
                      </td>
                      {board.columns.map(column => {
                        const cellValue = item.values.find(val => val.columnId === column.columnId)
                        let cellContent

                        switch (column.columnType) {
                          case 'PERSON':
                            const user = cellValue ? findUserById(cellValue.value) : null

                            cellContent = <PersonAvatar user={user} />
                            break
                          case 'STATUS':
                            cellContent = <Badge value={cellValue?.value} type={column.columnName} />
                            break
                          case 'DATE':
                            cellContent = cellValue?.value
                              ? new Date(cellValue.value).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short'
                                })
                              : '—'
                            break
                          default:
                            if (column.columnName.toLowerCase() === 'item') {
                              cellContent = (
                                <button
                                  onClick={() => setSelectedItem(item)}
                                  className='font-bold text-left hover:underline'
                                >
                                  {item.taskTitle}
                                </button>
                              )
                            } else {
                              cellContent = cellValue?.value || '—'
                            }

                            break
                        }

                        return (
                          <td key={`${item.taskId}-${column.columnId}`} className='p-3 text-sm align-middle'>
                            {cellContent}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={board.columns.length + 1} className='p-2 bg-gray-800 hover:bg-gray-700 text-gray-400'>
                      {activeNewItemInput === group.groupId ? (
                        <input
                          type='text'
                          autoFocus
                          value={newItemTitle}
                          onChange={e => setNewItemTitle(e.target.value)}
                          onBlur={() => handleCreateTask(group.groupId)}
                          onKeyDown={e => e.key === 'Enter' && handleCreateTask(group.groupId)}
                          placeholder='Type a new item...'
                          className='w-full bg-gray-600 text-white rounded px-2 py-1 outline-none'
                        />
                      ) : (
                        <button
                          onClick={() => setActiveNewItemInput(group.groupId)}
                          className='flex items-center w-full text-left'
                        >
                          <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeWidth='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'></path>
                          </svg>
                          + Add Item
                        </button>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Render Panel Detail jika ada item yang dipilih */}
      {selectedItem && <ItemDetailPanel item={selectedItem} board={board} onClose={() => setSelectedItem(null)} />}
    </div>
  )
}
