import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import classNames from 'classnames'
import type { Note } from '@prisma/client'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  useUser,
} from '@clerk/nextjs'

import Main from '@/components/design/main'
import Page from '@/components/page'
import LoadingIcon from '@/components/loading-icon'
import { api } from '@/lib/api'
import {
  ArrowDownOnSquareIcon,
  ArrowRightOnRectangleIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  PlusIcon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import Footer, { FooterListItem } from '@/components/design/footer'
import Modal from '@/components/modal'
import Button from '@/components/design/button'
import useLocalStorage from '@/lib/useLocalStorage'
import useSearch from '@/lib/useSearch'

type NotesFilter = 'my' | 'all'

const AddNewTag = ({ note }: { note: Note }) => {
  const { tags } = note
  const [newTag, setNewTag] = useState('')
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
      <ul className='flex space-x-2'>
        {tags.map(tag => (
          <li
            key={tag}
            className='rounded-lg border border-cb-blue bg-cb-blue p-2'
          >
            {tag}
          </li>
        ))}
      </ul>
      <input
        type='text'
        value={newTag}
        onChange={e => {
          const { value } = e.target
          setNewTag(value)
        }}
        className='w-full bg-cobalt'
        placeholder='new tag'
      />
      <Button
        onClick={() => {
          const newTags = [...tags]
          newTags.push(newTag)
          const newNote = {
            ...note,
            tags: newTags,
          }
          updateNote(newNote)
          setNewTag('')
        }}
        className='disabled:pointer-events-none disabled:opacity-25'
        disabled={newTag === '' || tags.includes(newTag)}
      >
        <ArrowDownOnSquareIcon className='h-6 w-full' />
      </Button>
    </>
  )
}

export default function NotesPage() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()

  const router = useRouter()
  const { query, push } = router
  const { data: queriedNotes, isLoading } = api.notes.getAll.useQuery()
  const [notesFilter, setNotesFilter] = useLocalStorage<NotesFilter>(
    'notes-notesFilter',
    'my'
  )
  const [isSetTagsModalOpen, setIsSetTagsModalOpen] = useState(false)
  const [isAddNewTagModalOpen, setIsAddNewTagModalOpen] = useState(false)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useLocalStorage<string[]>(
    'notes-selectedTags',
    []
  )
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

  const userNotes = isSignedIn
    ? queriedNotes
        ?.filter(note => note.author === user?.username)
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

  const taggedNotes = queriedOrUserNotes?.filter(note =>
    selectedTags?.length > 0
      ? selectedTags.every(tag => note.tags.includes(tag))
      : true
  )

  const { search, setSearch, results, searchRef } = useSearch({
    initialSearch: query.q ? String(query.q) : '',
    list: taggedNotes || [],

    options: {
      keys: ['title', 'body'],
    },
  })
  useEffect(() => {
    if (query.q) {
      setSearch(String(query.q))
    }
  }, [query, setSearch])
  const [focusTabs, setFocusTabs] = useState(false)
  const firstTagButtonRef = useRef<HTMLButtonElement | null>(null)
  const [currentlyFocusedNoteId, setCurrentlyFocusedNoteId] = useState<
    string | null
  >(null)
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        push('/').catch(err => console.log(err))
      }
      if (e.key === 'f' && e.ctrlKey) {
        searchRef?.current?.focus()
      }
      if (e.key === 't' && e.ctrlKey) {
        if (!focusTabs) {
          setFocusTabs(true)
          firstTagButtonRef?.current?.focus()
        } else {
          setFocusTabs(false)
        }
      }
      if (currentlyFocusedNoteId !== null && e.key === 't') {
        setSelectedNoteId(currentlyFocusedNoteId)
        setIsSetTagsModalOpen(true)
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [push, searchRef, currentlyFocusedNoteId, focusTabs])

  const notes = results

  return (
    <Page>
      <Main className='flex flex-col space-y-4 p-4'>
        <div className='flex items-center'>
          <h1>notes</h1>
          <div className='flex flex-grow justify-end'>
            <SignedOut>
              <SignInButton>
                <ArrowRightOnRectangleIcon className='h-6 w-6 hover:cursor-pointer' />
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className='flex space-x-2 text-cb-white'>
                <span>{user?.username}</span>
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
        <div className='flex'>
          <input
            ref={searchRef}
            type='text'
            className='w-full bg-cb-blue'
            placeholder='search'
            value={search}
            onChange={e => {
              const { value } = e.target
              setSearch(value)
              const url = {
                pathname: router.pathname,
                query: value
                  ? {
                      q: value,
                    }
                  : undefined,
              }
              router.push(url).catch(err => console.log(err))
            }}
          />
        </div>
        {allTags.length > 0 && (
          <ul className='flex space-x-2 overflow-x-auto'>
            {allTags.map((tag, index) => (
              <li key={tag}>
                <button
                  ref={index === 0 ? firstTagButtonRef : undefined}
                  className={classNames(
                    'rounded-lg border bg-cb-blue p-2',
                    selectedTags?.includes(tag)
                      ? 'border-cb-pink'
                      : 'border-cb-blue'
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
                  tabIndex={focusTabs ? 0 : -1}
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
              <li key={note.id}>
                <Link
                  className='flex items-center justify-between py-2 text-cb-pink hover:bg-cb-blue focus:bg-cb-blue focus:outline-none'
                  href={{
                    pathname: `notes/${note.id}`,
                    query: search ? { q: search } : undefined,
                  }}
                  onFocus={() => {
                    setCurrentlyFocusedNoteId(note.id)
                  }}
                  onBlur={() => {
                    setCurrentlyFocusedNoteId(null)
                  }}
                >
                  <div>
                    <div>
                      {note?.title}
                      {notesFilter === 'all' ? ` - ${note.author}` : ''}
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div>{note.tags.join(' ')}</div>
                    )}
                  </div>

                  {isSignedIn && notesFilter === 'my' && (
                    <div className='flex space-x-2'>
                      <button
                        type='button'
                        onClick={e => {
                          e.preventDefault()
                          setSelectedNoteId(note.id)
                          setIsSetTagsModalOpen(true)
                        }}
                        tabIndex={-1}
                      >
                        <TagIcon className='h-6 w-6 text-cb-yellow' />
                      </button>
                      <button
                        type='button'
                        onClick={e => {
                          e.preventDefault()
                          const { pinned } = note
                          const newNote = { ...note, pinned: !pinned }
                          updateNote(newNote)
                        }}
                        className='group'
                        tabIndex={-1}
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
                            note.pinned
                              ? 'text-cb-yellow group-hover:block'
                              : ''
                          )}
                        />
                      </button>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : isSignedIn ? (
          <p className='py-2'>
            {notesFilter === 'all'
              ? 'no notes'
              : "you have no notes (or maybe they ' all filtered?)"}
          </p>
        ) : (
          <p className='py-2'>
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

        <FooterListItem>
          <SignedOut>
            <SignInButton>
              <span className='flex w-full justify-center py-2 hover:cursor-pointer'>
                <ArrowRightOnRectangleIcon className='h-6 w-6' />
              </span>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <span className='flex w-full justify-center py-2'>
              <UserButton />
            </span>
          </SignedIn>
        </FooterListItem>
      </Footer>
      <Modal
        isOpen={isSetTagsModalOpen}
        setIsOpen={setIsSetTagsModalOpen}
        title='edit tags'
      >
        {selectedNote && (
          <>
            <p>{selectedNote.title}</p>
            <ul className='grid grid-cols-6 gap-2'>
              {allTags.map(tag => (
                <li key={tag}>
                  <button
                    className={classNames(
                      'rounded-lg border bg-cb-blue p-2',
                      selectedNote.tags.includes(tag)
                        ? 'border-cb-pink'
                        : 'border-cb-blue'
                    )}
                    onClick={() => {
                      const newTags = [...selectedNote.tags]
                      const index = newTags.findIndex(t => t === tag)
                      if (index > -1) {
                        newTags.splice(index, 1)
                      } else {
                        newTags.push(tag)
                      }
                      const newNote = {
                        ...selectedNote,
                        tags: newTags,
                      }
                      updateNote(newNote)
                    }}
                  >
                    {tag}
                  </button>
                </li>
              ))}
              <li>
                <button
                  className='rounded-lg border border-cb-blue bg-cb-blue p-2'
                  onClick={() => {
                    setIsSetTagsModalOpen(false)
                    setIsAddNewTagModalOpen(true)
                  }}
                >
                  <PlusIcon className='h-6 w-6 text-cb-yellow' />
                </button>
              </li>
            </ul>
          </>
        )}
      </Modal>
      <Modal
        isOpen={isAddNewTagModalOpen}
        setIsOpen={setIsAddNewTagModalOpen}
        title='add new tag'
      >
        {selectedNote && <AddNewTag note={selectedNote} />}
      </Modal>
    </Page>
  )
}
