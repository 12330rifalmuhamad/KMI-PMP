'use client'

// Component Imports
import Button from '@mui/material/Button'

import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Header from '@components/layout/horizontal/Header'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import Customizer from '@core/components/customizer'
import ScrollToTop from '@core/components/scroll-to-top'
import AuthGuard from '@/hocs/AuthGuard'
import ModalProvider from '@/components/ModalProvider' // Impor ModalProvider
import Providers from '@components/Providers' // Impor Providers

// MUI Imports

const ProtectedLayoutContent = props => {
  const { direction, dictionary, mode, systemMode, children, locale } = props

  return (
    <Providers direction={direction}>
      {/* Kita letakkan ModalProvider di sini.
        Ia akan aktif di semua halaman yang terproteksi.
      */}
      <ModalProvider />
      <AuthGuard locale={locale}>
        <LayoutWrapper
          systemMode={systemMode}
          verticalLayout={
            <VerticalLayout
              navigation={<Navigation dictionary={dictionary} mode={mode} />}
              navbar={<Navbar />}
              footer={<VerticalFooter />}
            >
              {children}
            </VerticalLayout>
          }
          horizontalLayout={
            <HorizontalLayout header={<Header dictionary={dictionary} />} footer={<VerticalFooter />}>
              {children}
            </HorizontalLayout>
          }
        />
        <ScrollToTop className='mui-fixed'>
          <Button
            variant='contained'
            className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'
          >
            <i className='tabler-arrow-up' />
          </Button>
        </ScrollToTop>
        <Customizer dir={direction} />
      </AuthGuard>
    </Providers>
  )
}

export default ProtectedLayoutContent
