// Third-party Imports
import classnames from 'classnames'

// Component Imports
import LayoutContent from './components/vertical/LayoutContent'
import ProjectActionsMenu from '@/components/layout/ProjectActionsMenu'

// Util Imports
import { verticalLayoutClasses } from './utils/layoutClasses'

// Styled Component Imports
import StyledContentWrapper from './styles/vertical/StyledContentWrapper'

const VerticalLayout = props => {
  // Props
  const { navbar, footer, navigation, children, workspaceId } = props

  return (
    <div className={classnames(verticalLayoutClasses.root, 'flex flex-auto')}>
      {navigation || null}
      <StyledContentWrapper
        className={classnames(verticalLayoutClasses.contentWrapper, 'flex flex-col min-is-0 is-full')}
      >
        {/* Inject project actions into navbar if provided */}
        {navbar || null}
        {workspaceId ? (
          <div className='px-4 pt-2'>
            <ProjectActionsMenu workspaceId={workspaceId} />
          </div>
        ) : null}
        <LayoutContent>{children}</LayoutContent>
        {footer || null}
      </StyledContentWrapper>
    </div>
  )
}

export default VerticalLayout
