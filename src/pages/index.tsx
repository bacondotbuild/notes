import { useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ArrowDownOnSquareIcon,
  ArrowRightOnRectangleIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Bars2Icon,
  DocumentDuplicateIcon,
  ListBulletIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import classNames from 'classnames'
import { toast } from 'react-toastify'
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
import DragDropList from '@/components/dragDropList'
import Footer, { FooterListItem } from '@/components/design/footer'
import useLocalStorage from '@/lib/useLocalStorage'
import copyToClipboard from '@/lib/copyToClipboard'
import { api } from '@/lib/api'

type Mode = 'text' | 'list'

export default function Home() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()

  const [text, setText] = useLocalStorage('home-note-text', '')
  const [mode, setMode] = useLocalStorage<Mode>('home-note-mode', 'text')
  const [isFullScreen, setIsFullScreen] = useLocalStorage<boolean>(
    'home-note-fullscreen',
    false
  )

  const textAsList = (text ?? '').split('\n')

  const { push } = useRouter()
  const { data, mutate: saveNote, isSuccess } = api.notes.save.useMutation()

  const save = useCallback(() => {
    if (text !== '') {
      const [title, ...body] = text.split('\n\n')
      const note = {
        text,
        title,
        body: body.join('\n\n'),
        author: user?.username ?? '',
        pinned: false,
      }
      saveNote(note)
      setText('')
    }
  }, [saveNote, user, setText, text])

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 's' && e.metaKey) {
        e.preventDefault()
        save()
      }
      if (e.key === 'Escape') {
        push('/notes').catch(err => console.log(err))
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [save, push])

  if (isSuccess && data) {
    const { id } = data
    push(`/notes/${id}`).catch(err => console.log(err))
  }
  return (
    <Page>
      <div className='absolute top-2 right-2'>
        <button
          className='text-cb-yellow'
          type='button'
          onClick={() => {
            setIsFullScreen(!isFullScreen)
          }}
        >
          {isFullScreen ? (
            <ArrowsPointingInIcon className='h-6 w-6' />
          ) : (
            <ArrowsPointingOutIcon className='h-6 w-6' />
          )}
        </button>
      </div>
      <Main className={classNames('flex flex-col', !isFullScreen && 'p-4')}>
        {mode === 'list' ? (
          <div className='space-y-3'>
            <DragDropList
              items={textAsList
                // TODO: Add back after figuring out how to address bug where title can be multiple lines
                // .filter(item => item)
                .map((item, index) => ({ id: `${item}-${index}`, item }))}
              renderItem={({ item }: { item: string }, index: number) => (
                <div key={index} className='rounded-lg bg-cobalt p-3'>
                  {index + 1}. {item}
                </div>
              )}
              setItems={newItems => {
                setText(newItems.map(({ item }) => item).join('\n'))
              }}
              listContainerClassName='space-y-3'
            />
          </div>
        ) : (
          <textarea
            className='h-full w-full flex-grow bg-cobalt'
            value={text}
            onChange={e => setText(e.target.value)}
          />
        )}
      </Main>
      {!isFullScreen && (
        <Footer>
          <FooterListItem>
            <Link className='flex w-full justify-center py-2' href='/notes'>
              <Bars2Icon className='h-6 w-6' />
            </Link>
          </FooterListItem>
          {mode === 'text' ? (
            <FooterListItem onClick={() => setMode('list')}>
              <ListBulletIcon className='h-6 w-6' />
            </FooterListItem>
          ) : (
            <FooterListItem onClick={() => setMode('text')}>
              <PencilSquareIcon className='h-6 w-6' />
            </FooterListItem>
          )}
          <FooterListItem
            onClick={() => {
              copyToClipboard(text)
              toast.success('copied to clipboard')
            }}
          >
            <DocumentDuplicateIcon className='h-6 w-6' />
          </FooterListItem>
          {isSignedIn ? (
            <FooterListItem onClick={save} disabled={text === ''}>
              <ArrowDownOnSquareIcon className='h-6 w-6' />
            </FooterListItem>
          ) : (
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
          )}
        </Footer>
      )}
    </Page>
  )
}
