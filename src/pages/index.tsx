import { type NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ArrowDownOnSquareIcon,
  ArrowRightOnRectangleIcon,
  Bars2Icon,
  DocumentDuplicateIcon,
  ListBulletIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import { signIn, signOut, useSession } from 'next-auth/react'

import Main from '@/components/design/main'
import Page from '@/components/page'
import DragDropList from '@/components/dragDropList'
import Footer, { FooterListItem } from '@/components/design/footer'
import useLocalStorage from '@/lib/useLocalStorage'
import copyToClipboard from '@/lib/copyToClipboard'
import { api } from '@/lib/api'

type Mode = 'text' | 'list'

const Home: NextPage = () => {
  const { data: session } = useSession()
  const [text, setText] = useLocalStorage('home-note-text', '')
  const [mode, setMode] = useLocalStorage<Mode>('home-note-mode', 'text')

  const textAsList = (text ?? '').split('\n')

  const { push } = useRouter()
  const { data, mutate, isSuccess } = api.notes.save.useMutation()

  if (isSuccess && data) {
    const { id } = data
    push(`/notes/${id}`).catch(err => console.log(err))
  }
  return (
    <Page>
      <Main className='flex flex-col p-4'>
        {mode === 'text' ? (
          <textarea
            className='h-full w-full flex-grow bg-cobalt'
            value={text}
            onChange={e => setText(e.target.value)}
          />
        ) : (
          <div className='space-y-3'>
            <DragDropList
              items={textAsList.map(item => ({ id: item, item }))}
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
        )}
      </Main>
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
        <FooterListItem onClick={() => copyToClipboard(text)}>
          <DocumentDuplicateIcon className='h-6 w-6' />
        </FooterListItem>
        {session ? (
          <FooterListItem
            onClick={() => {
              const [title, body] = text.split('\n')
              mutate({ text, title, body })
            }}
          >
            <ArrowDownOnSquareIcon className='h-6 w-6' />
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

export default Home
