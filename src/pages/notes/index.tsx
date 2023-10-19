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
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import Button from '@/components/design/button'
import Footer, { FooterListItem } from '@/components/design/footer'
import useLocalStorage from '@/lib/useLocalStorage'

type NotesFilter = 'my' | 'all'

const NotePage: NextPage = () => {
  const { data: session } = useSession()
  const { data: queriedNotes, isLoading } = api.notes.getAll.useQuery()
  const [notesFilter, setNotesFilter] = useLocalStorage<NotesFilter>(
    'notes-notesFilter',
    'my'
  )

  console.log({
    session,
    queriedNotes,
  })
  const userNotes = session
    ? queriedNotes?.filter(note => note.author === session.user.name)
    : []

  const notes = notesFilter === 'all' ? queriedNotes : userNotes
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
        <Link className='text-cb-yellow' href='/'>
          new note
        </Link>
        {isLoading ? (
          <LoadingIcon className='h-16 w-16 animate-spin-slow text-blue-700 dark:text-blue-200' />
        ) : notes?.length && notes?.length > 0 ? (
          <ul className='space-y-4'>
            {notes.map(note => (
              <li key={note.id}>
                <Link className='text-cb-pink' href={`notes/${note.id}`}>
                  {note.title}
                  {notesFilter === 'all' ? ` - ${note.author}` : ''}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>no notes</p>
        )}
      </Main>
      <Footer>
        <FooterListItem>
          <Link className='flex w-full justify-center py-2' href='/'>
            <XMarkIcon className='h-6 w-6' />
          </Link>
        </FooterListItem>
        {notesFilter === 'all' ? (
          <FooterListItem
            onClick={() => {
              setNotesFilter('my')
            }}
          >
            <UserGroupIcon className='h-6 w-6' />
          </FooterListItem>
        ) : (
          <FooterListItem
            onClick={() => {
              setNotesFilter('all')
            }}
          >
            <UserIcon className='h-6 w-6' />
          </FooterListItem>
        )}

        {session ? (
          <FooterListItem
            onClick={() => {
              signOut().catch(err => console.log(err))
            }}
          >
            <ArrowLeftOnRectangleIcon className='h-6 w-6' />
          </FooterListItem>
        ) : (
          <FooterListItem
            onClick={() => {
              signIn('discord').catch(err => console.log(err))
            }}
          >
            <ArrowRightOnRectangleIcon className='h-6 w-6' />
          </FooterListItem>
        )}
      </Footer>
    </Page>
  )
}

export default NotePage
