// Next Imports
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

// Component Imports
import ProtectedLayoutContent from '@/components/layout/ProtectedLayoutContent'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Util Imports
import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'

const Layout = async props => {
  const { children, params } = props

  // =======================================================
  // PENGECEKAN SESI DITEMPATKAN DI SINI
  // =======================================================
  const session = await getServerSession(authOptions);

  // Jika tidak ada sesi (belum login), alihkan ke halaman login.
  // Proses render berhenti di sini.
  if (!session) {
    // Arahkan ke halaman login sesuai bahasa
    redirect(`/${params.lang}/login`);
  }

  // Jika ada sesi, lanjutkan untuk merender layout
  const direction = i18n.langDirection[params.lang];
  const dictionary = await getDictionary(params.lang);
  const mode = await getMode();
  const systemMode = await getSystemMode();

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
    </Translation-Wrapper>
  );
}

export default Layout;
