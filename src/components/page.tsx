import { ToastContainer } from 'react-toastify'

import Meta from '@/components/meta'
// import Header from '@/components/header'

const DEFAULT_TITLE = 'notes'

const Page = ({
  title = DEFAULT_TITLE,
  children,
}: {
  title?: string
  children: React.ReactNode
}) => (
  <div className='flex min-h-screen flex-col bg-cb-dark-blue text-cb-white'>
    <Meta
      title={title === DEFAULT_TITLE ? title : `${title} - ${DEFAULT_TITLE}`}
    />
    <ToastContainer
      autoClose={1000}
      toastClassName='bg-cb-off-blue text-cb-white rounded-lg'
      bodyClassName=''
      pauseOnFocusLoss={false}
    />
    {/* <Header title={DEFAULT_TITLE} /> */}
    {children}
  </div>
)

export default Page
