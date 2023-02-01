import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  ArrowDownOnSquareIcon,
  Bars2Icon,
  DocumentDuplicateIcon,
  ListBulletIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'

import Main from '@/components/design/main'
import Page from '@/components/page'
import DragDropList from '@/components/dragDropList'
import Footer, { FooterListItem } from '@/components/design/footer'
import useLocalStorage from '@/lib/useLocalStorage'
import copyToClipboard from '@/lib/copyToClipboard'
import { api } from '@/lib/api'
import { useEffect, useState } from 'react'

type Mode = 'text' | 'list'

const NotePage: NextPage = () => {
  const {
    query: { id },
    push,
  } = useRouter()

  const { data: note } = api.notes.get.useQuery({
    id: id as string,
  })
  const [text, setText] = useState<string>((note?.text as string) ?? '')
  useEffect(() => {
    setText(note?.text as string)
  }, [note])
  const [mode, setMode] = useLocalStorage<Mode>('home-note-mode', 'text')

  const textAsList = (text ?? '').split('\n')

  const { mutate: update } = api.notes.save.useMutation()
  const { mutate: deleteNote } = api.notes.delete.useMutation()

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
        <FooterListItem
          onClick={() => {
            deleteNote({ id: id as string })
            push('/notes').catch(err => console.log(err))
          }}
        >
          <TrashIcon className='h-6 w-6 text-red-600' />
        </FooterListItem>
        <FooterListItem onClick={() => copyToClipboard(text)}>
          <DocumentDuplicateIcon className='h-6 w-6' />
        </FooterListItem>
        <FooterListItem
          onClick={() => {
            const [title, body] = text.split('\n')
            update({ id: id as string, text, title, body })
          }}
          disabled={text === note?.text}
        >
          <ArrowDownOnSquareIcon className='h-6 w-6' />
        </FooterListItem>
      </Footer>
    </Page>
  )
}

export default NotePage
