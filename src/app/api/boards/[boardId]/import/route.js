import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params
  const parsedBoardId = parseInt(boardId)

  try {
    const { data } = await request.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ message: 'No data provided' }, { status: 400 })
    }

    // 1. Identify all unique keys (potential columns)
    // We ignore 'Task Name' or similar if we use it for taskTitle, but let's see.
    // Usually 'Task Name' or 'Title' is the main column.
    // Let's assume the first key of the first row that matches a "title" concept or just "Task Name"
    // For now, let's treat "Task Name" or "Item" as the task title.
    
    // Collect all column names from all rows to be sure
    const allKeys = new Set()
    data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)))
    
    // Filter out keys that we use for Title. 
    // We'll prioritize 'Task Name', 'Task', 'Item', 'Title' as the title.
    const titleCandidates = ['Task Name', 'Task', 'Item', 'Title', 'Name']
    let titleKey = titleCandidates.find(key => allKeys.has(key))
    
    if (!titleKey) {
       // If no obvious title, take the first key of the first row
       titleKey = Object.keys(data[0])[0]
    }

    // 2. Get existing columns
    const existingColumns = await prisma.boardColumn.findMany({
      where: { boardId: parsedBoardId }
    })

    const existingColMap = new Map(existingColumns.map(c => [c.columnName.toLowerCase(), c]))

    // 3. Create missing columns
    // We only care about keys that are NOT the titleKey
    const keysToProcess = Array.from(allKeys).filter(k => k !== titleKey)
    
    // Find max sort order
    const maxSortCol = await prisma.boardColumn.findFirst({
      where: { boardId: parsedBoardId },
      orderBy: { sortOrder: 'desc' }
    })
    let currentSortOrder = (maxSortCol?.sortOrder || 0) + 1

    const columnIdMap = new Map() // Key Name -> Column ID
    
    // Prepare existing columns into map
    existingColumns.forEach(c => columnIdMap.set(c.columnName, c.columnId))

    for (const key of keysToProcess) {
      // Check case-insensitive
      const lowerKey = key.toLowerCase()
      if (existingColMap.has(lowerKey)) {
         columnIdMap.set(key, existingColMap.get(lowerKey).columnId)
         continue
      }

      // Create new column
      const newCol = await prisma.boardColumn.create({
        data: {
          boardId: parsedBoardId,
          columnName: key,
          columnType: 'TEXT', // Default to text for safety
          sortOrder: currentSortOrder,
          txtInsertedBy: session.user.name
        }
      })
      columnIdMap.set(key, newCol.columnId)
      currentSortOrder++
    }

    // 4. Create or Find a Default Group
    let group = await prisma.group.findFirst({
      where: { boardId: parsedBoardId, groupName: 'Imported' }
    })

    if (!group) {
      // Try to get the first existing group
      group = await prisma.group.findFirst({
        where: { boardId: parsedBoardId },
        orderBy: { dtmInserted: 'asc' }
      })
    }

    // If still no group, create "Imported"
    if (!group) {
      group = await prisma.group.create({
        data: {
          boardId: parsedBoardId,
          groupName: 'Imported',
          groupColor: '#579bfc',
          txtInsertedBy: session.user.name
        }
      })
    }

    // 5. Create Tasks and Values
    let taskCount = 0
    
    // Use transaction for tasks and values? Might be too large. 
    // Let's do it in chunks or one by one if it's not huge.
    // For safety with large files, let's do simple loop for now.
    
    for (const row of data) {
       const taskTitle = row[titleKey] ? String(row[titleKey]) : 'Untitled'
       
       const newTask = await prisma.task.create({
         data: {
           groupId: group.groupId,
           taskTitle: taskTitle,
           txtInsertedBy: session.user.name
         }
       })

       // Create values
       const valueCreates = []
       
       for (const key of keysToProcess) {
         if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
           const colId = columnIdMap.get(key)
           if (colId) {
             valueCreates.push({
               taskId: newTask.taskId,
               columnId: colId,
               value: String(row[key]),
               txtInsertedBy: session.user.name
             })
           }
         }
       }

       if (valueCreates.length > 0) {
         await prisma.trTaskValue.createMany({
           data: valueCreates
         })
       }
       taskCount++
    }

    return NextResponse.json({ message: `Successfully imported ${taskCount} items`, success: true })
  } catch (error) {
    console.error('Import Error:', error)
    return NextResponse.json({ message: 'Failed to import data', error: error.message }, { status: 500 })
  }
}
