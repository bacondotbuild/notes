import { useState } from 'react'
import { type NextPage } from 'next'
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import classNames from 'classnames'
import type { Note } from '@prisma/client'

import Main from '@/components/design/main'
import Page from '@/components/page'
import LoadingIcon from '@/components/loading-icon'
import { api } from '@/lib/api'
import {
  ArrowDownOnSquareIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import Footer, { FooterListItem } from '@/components/design/footer'
import useLocalStorage from '@/lib/useLocalStorage'
import Modal from '@/components/modal'
import Button from '@/components/design/button'

type NotesFilter = 'my' | 'all'

const EditNote = ({ note }: { note: Note }) => {
  const [tags, setTags] = useState([...note.tags])
  const utils = api.useContext()
  const { mutate: updateNote } = api.notes.save.useMutation({
    // https://create.t3.gg/en/usage/trpc#optimistic-updates
    async onMutate(newNote) {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.notes.get.cancel()

      // Get the data from the queryCache
      const prevData = utils.notes.get.getData()

      // Optimistically update the data with our new post
      utils.notes.get.setData(
        { id: newNote.id as string },
        () => newNote as Note
      )

      // Return the previous data so we can revert if something goes wrong
      return { prevData }
    },
    onError(err, newNote, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.notes.get.setData({ id: newNote.id as string }, ctx?.prevData)
    },
    async onSettled() {
      // Sync with server once mutation has settled
      await utils.notes.getAll.invalidate()
    },
  })
  return (
    <>
      <p>{note?.title}</p>
      <input
        type='text'
        name='tags'
        value={tags.join(' ')}
        onChange={e => {
          const { value } = e.target
          setTags(value.split(' '))
        }}
        className='w-full bg-cobalt'
      />
      <Button
        onClick={() => {
          const newNote = {
            ...note,
            tags,
          }
          updateNote(newNote)
        }}
      >
        <ArrowDownOnSquareIcon className='h-6 w-full' />
      </Button>
    </>
  )
}

const NotePage: NextPage = () => {
  const { data: session } = useSession()
  const { data: queriedNotes, isLoading } = api.notes.getAll.useQuery()
  const [notesFilter, setNotesFilter] = useLocalStorage<NotesFilter>(
    'notes-notesFilter',
    'my'
  )
  const [isSetTagsModalOpen, setIsSetTagsModalOpen] = useState(false)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const selectedNote = selectedNoteId
    ? queriedNotes?.find(note => note.id === selectedNoteId)
    : null

  const utils = api.useContext()
  const { mutate: updateNote } = api.notes.save.useMutation({
    // https://create.t3.gg/en/usage/trpc#optimistic-updates
    async onMutate(newNote) {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.notes.get.cancel()

      // Get the data from the queryCache
      const prevData = utils.notes.get.getData()

      // Optimistically update the data with our new post
      utils.notes.get.setData(
        { id: newNote.id as string },
        () => newNote as Note
      )

      // Return the previous data so we can revert if something goes wrong
      return { prevData }
    },
    onError(err, newNote, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.notes.get.setData({ id: newNote.id as string }, ctx?.prevData)
    },
    async onSettled() {
      // Sync with server once mutation has settled
      await utils.notes.getAll.invalidate()
    },
  })

  const userNotes = session
    ? queriedNotes
        ?.filter(note => note.author === session.user.name)
        .sort(note => (note.pinned ? 1 : 0))
    : []

  const queriedOrUserNotes = notesFilter === 'all' ? queriedNotes : userNotes
  const allTags = queriedOrUserNotes
    ? [
        ...new Set(
          queriedOrUserNotes.reduce((allTagsFoo: string[], note: Note) => {
            const { tags } = note
            const noteTags = [...tags]
            return [...allTagsFoo, ...noteTags]
          }, [])
        ),
      ]
    : []

  const notes = queriedOrUserNotes?.filter(note =>
    selectedTags.length > 0
      ? note.tags.some(tag => selectedTags.includes(tag))
      : true
  )
  return (
    <Page>
      <Main className='flex flex-col p-4'>
        {session ? (
          <div className='flex justify-end space-x-2'>
            <UserIcon className='h-6 w-6' />
            <span>{session.user?.name}</span>
          </div>
        ) : (
          <p>notes</p>
        )}
        {allTags.length > 0 && (
          <ul className='flex space-x-2'>
            {allTags.map(tag => (
              <li key={tag}>
                <button
                  className={classNames(
                    'rounded-lg border bg-cb-dusty-blue p-2',
                    selectedTags.includes(tag)
                      ? 'border-cb-pink'
                      : 'border-cb-dusty-blue'
                  )}
                  onClick={() => {
                    const index = selectedTags.findIndex(t => t === tag)
                    const newSelectedTags = [...selectedTags]
                    if (index > -1) {
                      newSelectedTags.splice(index, 1)
                    } else {
                      newSelectedTags.push(tag)
                    }
                    setSelectedTags(newSelectedTags)
                  }}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        )}
        {isLoading ? (
          <LoadingIcon className='h-16 w-16 animate-spin-slow text-blue-700 dark:text-blue-200' />
        ) : notes?.length && notes?.length > 0 ? (
          <ul className='divide-y divide-cb-dusty-blue'>
            {notes.map(note => (
              <li
                key={note.id}
                className='flex items-center justify-between py-2'
              >
                <Link className='text-cb-pink' href={`notes/${note.id}`}>
                  <div>
                    {note.title}
                    {notesFilter === 'all' ? ` - ${note.author}` : ''}
                  </div>
                  <div>{note.tags.join(' ')}</div>
                </Link>
                {session && notesFilter === 'my' && (
                  <div className='flex space-x-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedNoteId(note.id)
                        setIsSetTagsModalOpen(true)
                      }}
                    >
                      <TagIcon className='h-6 w-6 text-cb-yellow' />
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        const { pinned } = note
                        const newNote = { ...note, pinned: !pinned }
                        updateNote(newNote)
                      }}
                      className='group'
                    >
                      <BookmarkIcon
                        className={classNames(
                          'h-6 w-6',
                          note.pinned
                            ? 'text-cb-yellow group-hover:hidden'
                            : 'text-cb-dusty-blue hover:text-cb-yellow'
                        )}
                      />
                      <BookmarkSlashIcon
                        className={classNames(
                          'hidden h-6 w-6',
                          note.pinned ? 'text-cb-yellow group-hover:block' : ''
                        )}
                      />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {notesFilter === 'all' ? 'no notes' : 'login to see your notes!'}
          </p>
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
      <Modal
        isOpen={isSetTagsModalOpen}
        setIsOpen={setIsSetTagsModalOpen}
        title='add tags'
      >
        {selectedNote && <EditNote note={selectedNote} />}
      </Modal>
    </Page>
  )
}

export default NotePage
