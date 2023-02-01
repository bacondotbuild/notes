import { type NextPage } from 'next'
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'

import Main from '@/components/design/main'
import Page from '@/components/page'
import LoadingIcon from '@/components/loading-icon'
import { api } from '@/lib/api'
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid'
import Button from '@/components/design/button'

const NotePage: NextPage = () => {
  const { data: session } = useSession()
  const { data: notes, isLoading } = api.notes.getAll.useQuery()

  return (
    <Page>
      <Main className='flex flex-col space-y-4 p-4'>
        {session ? (
          <>
            <p>hi {session.user?.name}</p>
            <Button
              onClick={() => {
                signOut().catch(err => console.log(err))
              }}
            >
              <ArrowLeftOnRectangleIcon className='h-6 w-6' />
            </Button>
          </>
        ) : (
          <Button
            onClick={() => {
              signIn('discord').catch(err => console.log(err))
            }}
          >
            <ArrowRightOnRectangleIcon className='h-6 w-6' />
          </Button>
        )}
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
                  {note.title} - {note.author}
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
