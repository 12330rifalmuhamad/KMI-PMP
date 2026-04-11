'use client'

import WorkspaceView from '@/views/project-management/WorkspaceView'

export default function WorkspacePage({ params }) {
  const { workspaceId } = params

  return <WorkspaceView workspaceId={workspaceId} />
}
