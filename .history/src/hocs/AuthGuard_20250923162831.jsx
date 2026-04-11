'use client'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default function AuthGuard({ children, locale }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return null
  }

  return <>{session ? children : <AuthRedirect lang={locale} />}</>
}
