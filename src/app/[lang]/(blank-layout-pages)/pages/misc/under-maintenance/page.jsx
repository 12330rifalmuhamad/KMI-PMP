// Component Imports
import UnderMaintenance from '@/views/pagesll/misc/UnderMaintenance'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const UnderMaintenancePage = async () => {
  // Vars
  const mode = await getServerMode()

  return <UnderMaintenance mode={mode} />
}

export default UnderMaintenancePage
