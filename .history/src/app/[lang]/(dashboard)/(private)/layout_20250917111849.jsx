// Next Imports
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

// Component Imports
import { i18n } from '@configs/i18n'

import ProtectedLayoutContent from '@/components/layout/ProtectedLayoutContent'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Util Imports
// FUNGSI SERVER-ONLY DIIMPOR DI SINI (INI AMAN)
import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'

const Layout = async props => {
  const { children, params } = props

  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${params.lang}/login`)
  }

  // Panggil semua fungsi server-only di sini
  const direction = i18n.langDirection[params.lang]
  const dictionary = await getDictionary(params.lang)
  const mode = await getMode()
  const systemMode = await getSystemMode()

  return (
    <TranslationWrapper headersList={headers()} lang={params.lang}>
      {/* Teruskan semua hasilnya sebagai PROPS ke komponen klien */}
      <ProtectedLayoutContent
        direction={direction}
        dictionary={dictionary}
        mode={mode}
        systemMode={systemMode}
        locale={params.lang}
      >
        {children}
      </ProtectedLayoutContent>
    </TranslationWrapper>
  )
}

export default Layout
