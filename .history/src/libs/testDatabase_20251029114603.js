import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function testDatabaseConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Database connection test successful:', result)
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

export async function testTaskUpdate() {
  try {
    // Find the first task
    const firstTask = await prisma.task.findFirst()
    
    if (!firstTask) {
      console.log('No tasks found in database')
      return false
    }

    console.log('Found task:', firstTask.taskTitle)
    
    // Try to update the task title
    const updatedTask = await prisma.task.update({
      where: { taskId: firstTask.taskId },
      data: { 
        taskTitle: `${firstTask.taskTitle} (Test)`,
        dtmUpdated: new Date()
      }
    })

    console.log('Task updated successfully:', updatedTask.taskTitle)
    
    // Revert the change
    await prisma.task.update({
      where: { taskId: firstTask.taskId },
      data: { 
        taskTitle: firstTask.taskTitle,
        dtmUpdated: new Date()
      }
    })

    console.log('Task reverted successfully')
    return true
  } catch (error) {
    console.error('Task update test failed:', error)
    return false
  }
}
