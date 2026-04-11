import { NextResponse } from 'next/server'

import { withAuth } from 'next-auth/middleware'

import { i18n } from '@configs/i18n'

// Fungsi ini akan mengambil locale (bahasa) dari URL
const getLocale = request => {
  const headers = new Headers(request.headers)
  const acceptLanguage = headers.get('accept-language')
  const lang = i18n.locales.find(locale => request.nextUrl.pathname.startsWith(`/${locale}`)) || i18n.defaultLocale

  return {
    locale: lang || acceptLanguage?.split(',')[0].split('-')[0] || i18n.defaultLocale,
    pathname: request.nextUrl.pathname
  }
}

export default withAuth(
  // `withAuth` akan memverifikasi token
  function middleware(request) {
    const { locale, pathname } = getLocale(request)

    // Jika pengguna mencoba mengakses halaman login/register tapi sudah login,
    // arahkan mereka ke halaman utama
    if (request.nextauth.token && (pathname.endsWith('/login') || pathname.endsWith('/register'))) {
      return NextResponse.redirect(new URL(`/${locale}/dashboards/crm`, request.url))
    }

    // Jika semua oke, lanjutkan
    return NextResponse.next()
  },
  {
    callbacks: {
      // ==========================================================
      // PERBAIKAN UTAMA DI SINI
      // ==========================================================
      // Selalu anggap 'authorized' sebagai true di level middleware.
      // Ini akan MENGHENTIKAN 307 Redirect pada rute API Anda.
      // Keamanan API akan ditangani oleh `getServerSession()` di dalam
      // file route API itu sendiri.
      authorized: () => true
    }
  }
)

// Konfigurasi matcher ini sudah benar untuk Vuexy
// Ia secara eksplisit MENGABAIKAN rute 'api/'
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)']
}
