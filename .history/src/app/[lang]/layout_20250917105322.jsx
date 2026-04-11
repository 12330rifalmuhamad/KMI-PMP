// Next Imports
import { headers } from 'next/headers'
import { redirect } from 'next/navigation' // Impor fungsi redirect

import { getServerSession } from 'next-auth' // Impor untuk cek sesi di server

// Component Imports
import ProtectedLayoutContent from '@/components/layout/ProtectedLayoutContent'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'
import { authOptions } from '@/app/api/auth/[...nextauth]/route' // Impor authOptions

// Util Imports
import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'

const Layout = async props => {
  const { children, params } = props

  // =======================================================
  // PENGECEKAN SESI DI SINI
  // =======================================================
  const session = await getServerSession(authOptions)

  // Jika tidak ada sesi (belum login), alihkan ke halaman login
  // Jangan render sisa layoutnya
  if (!session) {
    redirect(`/${params.lang}/login`) // redirect() akan menghentikan eksekusi
  }

  // Jika ada sesi, lanjutkan untuk mengambil data dan merender layout
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
        systemMode={systemMode}
        locale={params.lang}
      >
        {children}
      </ProtectedLayoutContent>
    </TranslationWrapper>
  )
}

export default Layout
