import LoadingIcon from '@/components/loading-icon'

export default function Loading() {
  return (
    <div className='flex flex-grow items-center justify-center'>
      <LoadingIcon className='h-16 w-16 animate-spin-slow text-blue-700 dark:text-blue-200' />
    </div>
  )
}
