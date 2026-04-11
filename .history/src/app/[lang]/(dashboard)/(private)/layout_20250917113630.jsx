'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// MUI Imports
import { useColorScheme } from '@mui/material/styles'
import Button from '@mui/material/Button'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Component Imports
import Providers from '@components/Providers'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Header from '@components/layout/horizontal/Header'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import Customizer from '@core/components/customizer'
import ScrollToTop from '@core/components/scroll-to-top'
import AuthGuard from '@/hocs/AuthGuard'
import ModalProvider from '@/components/ModalProvider'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { i18n } from '@configs/i18n'

const Layout = ({ children, params }) => {
  // Hooks
  const { settings } = useSettings()
  const { setMode } = useColorScheme()
  const pathname = usePathname()

  // Vars
  // Di Client Component, kita tidak bisa 'await getDictionary' dll.
  // Template Vuexy biasanya menyediakan data ini melalui context/hooks.
  // Untuk sementara kita hardcode atau biarkan default.
  const direction = i18n.langDirection[params.lang]
  const dictionary = {} // Placeholder
  const mode = settings.mode // Ambil mode dari settings context
  const systemMode = settings.systemMode // Ambil systemMode dari settings context

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

export default Layout
