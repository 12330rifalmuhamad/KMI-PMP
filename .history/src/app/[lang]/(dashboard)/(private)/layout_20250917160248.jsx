'use client'

// React Imports
// (useEffect dan useState mungkin dibutuhkan oleh hook di bawahnya)
import { useEffect, useState } from 'react'

// Component Imports
import Button from '@mui/material/Button'

import Providers from '@components/Providers'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import AuthGuard from '@/hocs/AuthGuard'
import ModalProvider from '@/components/ModalProvider'
import Customizer from '@core/components/customizer'
import ScrollToTop from '@core/components/scroll-to-top'

// MUI Imports

// Hook Imports
// Kita akan menggunakan hook dari sisi klien untuk mendapatkan pengaturan
import { useSettings } from '@core/hooks/useSettings'

// Config Imports
import { i18n } from '@configs/i18n'

const Layout = ({ children, params }) => {
  // Hooks
  const { settings } = useSettings()

  // Vars
  // Data ini sekarang diambil dari context di sisi klien atau props statis
  const direction = i18n.langDirection[params.lang]
  const dictionary = {} // Placeholder, karena getDictionary adalah fungsi server
  const mode = settings.mode
  const systemMode = settings.systemMode

  return (
    <Providers direction={direction}>
      <ModalProvider />
      <AuthGuard locale={params.lang}>
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
          // horizontalLayout bisa dihapus jika tidak dipakai
          horizontalLayout={<></>}
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

export default Layout
