'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BoardRedirect({ params }) {
  const router = useRouter()
  const { boardId } = params

  useEffect(() => {
    // Redirect to default language
    router.replace(`/en/project-management/board/${boardId}`)
  }, [router, boardId])

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main mx-auto mb-4"></div>
        <p className="text-textSecondary">Redirecting...</p>
      </div>
    </div>
  )
}
