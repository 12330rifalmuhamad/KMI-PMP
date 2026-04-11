import { headers } from 'next/headers'

import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import ProtectedLayoutContent from '@/components/layout/ProtectedLayoutContent' // Pastikan impor ini benar
import TranslationWrapper from '@/hocs/TranslationWrapper'
import { i18n } from '@configs/i18n'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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
        systemMode={systemMode}
        locale={params.lang}
      >
        {children}
      </ProtectedLayoutContent>
    </TranslationWrapper>
  )
}

export default Layout
