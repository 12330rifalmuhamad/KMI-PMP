// Next Imports
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

// Component Imports
import ProtectedLayoutContent from '@/components/layout/ProtectedLayoutContent'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Util Imports
import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'

const Layout = async props => {
  const { children, params } = props

  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${params.lang}/login`)
  }

  const direction = i18n.langDirection[params.lang]
  const dictionary = await getDictionary(params.lang)
  const mode = await getMode()
  const systemMode = await getSystemMode()

  return (
    <TranslationWrapper headersList={headers()} lang={params.lang}>
      <ProtectedLayoutContent
        direction={direction}
        dictionary={dictionary}
        mode={mode}
        systemMode={systemMode} // Saya juga perbaiki 'system-mode' menjadi 'systemMode'
        locale={params.lang}
      >
        {children}
      </ProtectedLayoutContent>
    </TranslationWrapper> // <-- PERBAIKAN DI SINI
  )
}

export default Layout
