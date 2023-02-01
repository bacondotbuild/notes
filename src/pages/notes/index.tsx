import { type NextPage } from 'next'
import Link from 'next/link'

import Main from '@/components/design/main'
import Page from '@/components/page'
import LoadingIcon from '@/components/loading-icon'
import { api } from '@/lib/api'
import Title from '@/components/design/title'

const NotePage: NextPage = () => {
  const { data: notes, isLoading } = api.notes.getAll.useQuery()

  return (
    <Page>
      <Main className='flex flex-col space-y-4 p-4'>
        <Title>notes</Title>
        <Link className='text-cb-pink' href='/'>
          new note
        </Link>
        {isLoading ? (
          <LoadingIcon className='h-16 w-16 animate-spin-slow text-blue-700 dark:text-blue-200' />
        ) : notes?.length && notes?.length > 0 ? (
          <ul className='space-y-4 '>
            {notes.map(note => (
              <li key={note.id}>
                <Link className='text-cb-pink' href={`notes/${note.id}`}>
                  {note.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>no notes</p>
        )}
      </Main>
    </Page>
  )
}

export default NotePage
