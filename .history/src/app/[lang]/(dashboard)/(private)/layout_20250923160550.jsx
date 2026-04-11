// Next Imports
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

// Component Imports
import ProtectedLayoutContent from '@/components/layout/ProtectedLayoutContent'
import Providers from '@components/Providers'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Util Imports
import { getDictionary } from '@/utils/getDictionary'
// HAPUS IMPOR DARI SERVERHELPERS
// import { getMode, getSystemMode } from '@core/utils/serverHelpers'

const Layout = async props => {
  const { children, params } = props

  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${params.lang}/login`)
  }

  // Ambil data di server
  const direction = i18n.langDirection[params.lang]
  const dictionary = await getDictionary(params.lang)

  // =======================================================
  // PERUBAHAN UTAMA DI SINI
  // Kita tidak lagi memanggil getMode() atau getSystemMode()
  // Kita gunakan nilai default 'dark' untuk sementara.
  // =======================================================
  const mode = 'dark'
  const systemMode = 'dark'

  return (
    <TranslationWrapper headersList={headers()} lang={params.lang}>
      <Providers direction={direction} mode={mode} systemMode={systemMode}>
        <ProtectedLayoutContent
          direction={direction}
          dictionary={dictionary}
          mode={mode}
          systemMode={systemMode}
          locale={params.lang}
        >
          {children}
        </ProtectedLayoutContent>
      </Providers>
    </TranslationWrapper>
  )
}

export default Layout
