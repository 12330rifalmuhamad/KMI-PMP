import { NextResponse } from 'next/server'
import { testDatabaseConnection, testTaskUpdate } from '@/libs/testDatabase'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database connection failed' 
      }, { status: 500 })
    }

    console.log('Testing task update...')
    
    const updateTest = await testTaskUpdate()
    if (!updateTest) {
      return NextResponse.json({ 
        success: false, 
        message: 'Task update test failed' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All tests passed' 
    })
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Test failed', 
      error: error.message 
    }, { status: 500 })
  }
}
