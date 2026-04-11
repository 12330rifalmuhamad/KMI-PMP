'use client'

// Component Imports
import Button from '@mui/material/Button'

import Providers from '@components/Providers'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import Customizer from '@core/components/customizer'
import ScrollToTop from '@core/components/scroll-to-top'
import AuthGuard from '@/hocs/AuthGuard'

// =======================================================
// PASTIKAN MODAL PROVIDER DIIMPOR DI SINI
// =======================================================
import ModalProvider from '@/components/ModalProvider'

const ProtectedLayoutContent = props => {
  const { direction, dictionary, mode, systemMode, children, locale } = props

  return (
    <Providers direction={direction}>
      {/*
          =======================================================
          PASTIKAN ModalProvider ADA DI SINI
          Ia akan "mendengarkan" panggilan dari menu di dalam Navigation
          =======================================================
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
            {
              /* ... horizontal layout ... */
            }
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
