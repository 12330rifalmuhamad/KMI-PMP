'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjectManagementRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to default language
    router.replace('/en/project-management')
  }, [router])

  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main mx-auto mb-4'></div>
        <p className='text-textSecondary'>Redirecting...</p>
      </div>
    </div>
  )
}
