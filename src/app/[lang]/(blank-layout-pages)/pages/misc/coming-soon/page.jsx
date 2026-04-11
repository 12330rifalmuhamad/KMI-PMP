// Component Imports
import ComingSoon from '@/views/pagesll/misc/ComingSoon'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const ComingSoonPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <ComingSoon mode={mode} />
}

export default ComingSoonPage
