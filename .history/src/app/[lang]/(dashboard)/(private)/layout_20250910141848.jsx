// Next Imports
import { headers } from 'next/headers'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'

// Component Imports
import ProtectedLayoutContent from '@/components/layout/ProtectedLayoutContent'

const Layout = async props => {
  const { children, params } = props

  // Vars - Semua data ini diambil di server
  const direction = i18n.langDirection[params.lang]
  const dictionary = await getDictionary(params.lang)
  const mode = await getMode()
  const systemMode = await getSystemMode()

  return (
    <TranslationWrapper headersList={headers()} lang={params.lang}>
      {/* Render komponen klien dan teruskan semua data
            yang diambil dari server sebagai props.
        */}
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
