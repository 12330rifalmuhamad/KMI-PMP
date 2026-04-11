import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Return user profile data
    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        phone: session.user.phone || '',
        bio: session.user.bio || '',
        company: session.user.company || '',
        website: session.user.website || '',
        location: session.user.location || ''
      }
    })
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, phone, bio, company, website, location, image } = body

    // Here you would typically update the user profile in your database
    // For now, we'll just return the updated data

    const updatedProfile = {
      id: session.user.id,
      name: name || session.user.name,
      email: email || session.user.email,
      image: image || session.user.image,
      phone: phone || '',
      bio: bio || '',
      company: company || '',
      website: website || '',
      location: location || ''
    }

    // In a real application, you would:
    // 1. Validate the data
    // 2. Update the database
    // 3. Return the updated profile

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedProfile
    })
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
