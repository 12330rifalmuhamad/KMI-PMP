import NotionPagesView from '@views/notion-pages/NotionPagesView'

const NotionPageDetail = async props => {
  const params = await props.params

  return <NotionPagesView pageId={params.pageId} />
}

export default NotionPageDetail
