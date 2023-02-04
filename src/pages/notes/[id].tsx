import { useEffect, useState } from 'react'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import type { Note } from '@prisma/client'
import { signIn, useSession } from 'next-auth/react'
import {
  ArrowDownOnSquareIcon,
  ArrowRightOnRectangleIcon,
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

type Mode = 'text' | 'list'

const NotePage: NextPage = () => {
  const { data: session } = useSession()
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

  const utils = api.useContext()
  const { mutate: updateNote } = api.notes.save.useMutation({
    // https://create.t3.gg/en/usage/trpc#optimistic-updates
    async onMutate(newNote) {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.notes.get.cancel()

      // Get the data from the queryCache
      const prevData = utils.notes.get.getData()

      // Optimistically update the data with our new post
      utils.notes.get.setData({ id: id as string }, () => newNote as Note)

      // Return the previous data so we can revert if something goes wrong
      return { prevData }
    },
    onError(err, newNote, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.notes.get.setData({ id: id as string }, ctx?.prevData)
    },
    async onSettled() {
      // Sync with server once mutation has settled
      await utils.notes.get.invalidate()
    },
  })
  const { mutate: deleteNote } = api.notes.delete.useMutation()

  return (
    <Page>
      <Main className='flex flex-col p-4'>
        {mode === 'list' ? (
          <div className='space-y-3'>
            <DragDropList
              items={textAsList
                .filter(item => item)
                .map(item => ({ id: item, item }))}
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
        {session && (
          <FooterListItem
            onClick={() => {
              deleteNote({ id: id as string })
              push('/notes').catch(err => console.log(err))
            }}
          >
            <TrashIcon className='h-6 w-6 text-red-600' />
          </FooterListItem>
        )}
        <FooterListItem onClick={() => copyToClipboard(text)}>
          <DocumentDuplicateIcon className='h-6 w-6' />
        </FooterListItem>
        {session ? (
          <FooterListItem
            onClick={() => {
              const [title, ...body] = text.split('\n\n')
              const newNote = {
                id: id as string,
                text,
                title,
                body: body.join('\n\n'),
                author: session.user.name ?? '',
              }
              updateNote(newNote)
            }}
            disabled={text === note?.text}
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

export default NotePage
