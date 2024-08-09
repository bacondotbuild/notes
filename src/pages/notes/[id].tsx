import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import type { Note } from '@prisma/client'
import {
  ArrowDownOnSquareIcon,
  ArrowSmallRightIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Bars2Icon,
  DocumentDuplicateIcon,
  LinkIcon,
  ListBulletIcon,
  PencilSquareIcon,
  ShareIcon,
  TrashIcon,
  WrenchIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { toast } from 'react-toastify'
import classNames from 'classnames'
import { useUser } from '@clerk/nextjs'

import Main from '@/components/design/main'
import Page from '@/components/page'
import DragDropList from '@/components/dragDropList'
import Modal from '@/components/modal'
import Footer, { FooterListItem } from '@/components/design/footer'
import Button from '@/components/design/button'
import useLocalStorage from '@/lib/useLocalStorage'
import copyToClipboard from '@/lib/copyToClipboard'
import { api } from '@/lib/api'

type Mode = 'text' | 'list'

type FooterType = 'default' | 'tools' | 'share'

export default function NotePage() {
  const { user } = useUser()
  const currentUrl =
    typeof window !== 'undefined' ? window?.location.href : null
  const [currentSelectionStart, setCurrentSelectionStart] = useState<
    number | null
  >(null)
  const [currentSelectionEnd, setCurrentSelectionEnd] = useState<number | null>(
    null
  )
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus()
    }
  }, [])
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] =
    useState(false)
  const {
    query: { id, q },
    push,
  } = useRouter()

  const { data: note } = api.notes.get.useQuery({
    id: id as string,
  })
  const [text, setText] = useState<string>((note?.text as string) ?? '')
  useEffect(() => {
    setText(note?.text as string)
  }, [note?.text])
  const [mode, setMode] = useLocalStorage<Mode>('home-note-mode', 'text')
  const [isFullScreen, setIsFullScreen] = useLocalStorage<boolean>(
    'home-note-fullscreen',
    false
  )
  const [commandKey, setCommandKey] = useLocalStorage(
    'home-note-commandKey',
    '!'
  )
  const [footerType, setFooterType] = useState<FooterType>('default')

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

  const readOnly = !user || user.username !== note?.author
  const hasChanges = text !== note?.text
  const canSave = !readOnly && !(!hasChanges || text === '')

  const saveNote = useCallback(() => {
    if (note && canSave) {
      const [title, ...body] = text.split('\n\n')
      const newNote = {
        ...note,
        id: id as string,
        text,
        title,
        body: body.join('\n\n'),
        author: user?.username ?? '',
      }
      updateNote(newNote)
    }
  }, [note, id, user, text, updateNote, canSave])

  const navigateToNotesPage = () => {
    push({
      pathname: '/notes',
      query: q ? { q } : undefined,
    }).catch(err => console.log(err))
  }

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 's' && e.metaKey) {
        e.preventDefault()
        saveNote()
      }
      if (e.key === 'Escape') {
        if (hasChanges) {
          setIsDiscardChangesModalOpen(true)
        } else {
          navigateToNotesPage()
        }
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [saveNote, hasChanges, setIsDiscardChangesModalOpen, push, q])
  return (
    <Page title={note?.title}>
      <div className='absolute right-2 top-2'>
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
            {readOnly ? ( // TODO: Refactor repeated code
              <ul className='space-y-3'>
                {textAsList
                  // TODO: Add back after figuring out how to address bug where title can be multiple lines
                  // .filter(item => item)
                  .map(item => ({ id: item, item }))
                  .map(({ item }: { item: string }, index: number) => (
                    <div key={index} className='rounded-lg bg-cobalt p-3'>
                      {index + 1}. {item}
                    </div>
                  ))}
              </ul>
            ) : (
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
            )}
          </div>
        ) : (
          <textarea
            ref={textAreaRef}
            className='h-full w-full flex-grow bg-cobalt'
            value={text}
            onChange={e => {
              setText(e.target.value)
            }}
            onKeyDown={e => {
              const { key, altKey } = e

              const target = e.target as HTMLTextAreaElement
              const selectionStart = Number(target.selectionStart)
              const selectionEnd = Number(target.selectionEnd)

              if (key === ' ') {
                const textSplit = text.split('')
                let spaceIndex = -1
                for (let i = selectionStart; i > -1; i--) {
                  if (
                    i === selectionStart &&
                    (textSplit[i] === ' ' || textSplit[i] === '\n')
                  )
                    continue
                  if (textSplit[i] === ' ' || textSplit[i] === '\n') {
                    spaceIndex = i
                    break
                  }
                }
                let lastWord = ''
                for (let i = spaceIndex + 1; i < selectionStart; i++) {
                  lastWord += textSplit[i]
                }

                const replaceText = (string: string, replaceStr: string) => {
                  const newText = text.replace(string, replaceStr)
                  const newSelectionStart =
                    selectionStart + (replaceStr.length - string.length)

                  if (textAreaRef.current) {
                    textAreaRef.current.value = newText

                    textAreaRef.current.setSelectionRange(
                      newSelectionStart,
                      newSelectionStart
                    )
                  }

                  setText(newText)
                }

                type Command = {
                  action?: () => void
                  replaceStr?: string
                  skipReplace?: boolean
                }
                const createCommand =
                  ({ action, replaceStr = '', skipReplace }: Command) =>
                  () => {
                    if (!skipReplace) {
                      replaceText(lastWord, replaceStr)
                    }
                    if (action) {
                      action()
                    }
                  }

                const [commandName, ...commandArguments] = lastWord
                  .replace(commandKey, '')
                  .split('-')

                const commands: Record<string, () => void> = {
                  clear: createCommand({
                    action: () => {
                      setText('')
                    },
                  }),
                  c: createCommand({
                    action: () => {
                      setText('')
                    },
                  }),
                  fs: createCommand({
                    action: () => {
                      setIsFullScreen(!isFullScreen)
                    },
                  }),
                  date: createCommand({
                    replaceStr: new Date().toLocaleDateString(),
                  }),
                  // time: createCommand({
                  //   replaceStr: new Date().toLocaleDateString(),
                  // }),
                  '?': createCommand({
                    replaceStr: `cmd = ${commandKey}[command]`,
                  }),
                  setcmd: createCommand({
                    action: () => {
                      const newCommandKey = commandArguments[0]
                      if (newCommandKey) {
                        setCommandKey(newCommandKey)
                      } else {
                        console.error('no command key provided')
                      }
                    },
                  }),
                  n: createCommand({
                    action: () => {
                      navigateToNotesPage()
                    },
                  }),
                  rev: createCommand({
                    action: () => {
                      const [, ...body] = text.split('\n')
                      const newBody = [...body].reverse()
                      replaceText(
                        body.join('\n'),
                        newBody.join('\n').replace(lastWord, '')
                      )
                    },
                  }),
                  t: createCommand({
                    replaceStr: '\t',
                  }),
                  tab: createCommand({
                    replaceStr: '\t',
                  }),
                }

                const command = commands[commandName ?? '']

                const isCommand = lastWord.startsWith(commandKey) && command
                if (isCommand) {
                  e.preventDefault()
                  command()
                }
              } else if (key === 'Tab') {
                e.preventDefault()

                const newText =
                  text.substring(0, selectionStart) +
                  '\t' +
                  text.substring(selectionEnd, text.length)

                if (textAreaRef.current) {
                  textAreaRef.current.focus()
                  textAreaRef.current.value = newText

                  textAreaRef.current.setSelectionRange(
                    selectionStart + 1,
                    selectionStart + 1
                  )
                }

                setText(newText)
              } else if (altKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
                e.preventDefault()
                const contentArray = text.split('\n')
                let index = 0
                let currentLength = 0
                for (let i = 0; i < contentArray.length; i++) {
                  const currentItem = contentArray[i]
                  if (
                    currentItem &&
                    currentLength + currentItem.length + 1 > selectionStart
                  ) {
                    index = i
                    break
                  }
                  currentLength += (currentItem?.length ?? 0) + 1 // for \n
                }
                const offset = selectionStart - currentLength
                const swapLines = (direction: 'ArrowUp' | 'ArrowDown') => {
                  if (textAreaRef.current) {
                    const swapIndex = index + (direction === 'ArrowUp' ? -1 : 1)
                    const item = contentArray[index] ?? ''
                    const removed = contentArray.splice(swapIndex, 1, item)[0]
                    contentArray[index] = removed ?? ''
                    textAreaRef.current?.focus()
                    textAreaRef.current.value = contentArray.join('\n')
                    // set cursor
                    const newStart =
                      contentArray.reduce(
                        (total, line, idx) =>
                          idx <= swapIndex - 1
                            ? total + line.length + 1
                            : total,
                        0
                      ) + offset
                    textAreaRef.current?.setSelectionRange(newStart, newStart)
                  }
                  setText(contentArray.join('\n'))
                }
                if (key === 'ArrowUp') {
                  if (index > 0) {
                    swapLines(key)
                  }
                } else if (index + 1 < contentArray.length) {
                  // ArrowDown
                  swapLines(key)
                }
              }
            }}
            onKeyUp={e => {
              const { selectionStart, selectionEnd } =
                e.target as HTMLInputElement
              setCurrentSelectionStart(selectionStart)
              setCurrentSelectionEnd(selectionEnd)
            }}
            onFocus={e => {
              const { selectionStart, selectionEnd } = e.target
              setCurrentSelectionStart(selectionStart)
              setCurrentSelectionEnd(selectionEnd)
            }}
            onClick={e => {
              const { selectionStart, selectionEnd } =
                e.target as HTMLInputElement
              setCurrentSelectionStart(selectionStart)
              setCurrentSelectionEnd(selectionEnd)
            }}
            readOnly={readOnly}
          />
        )}
      </Main>
      {!isFullScreen && (
        <Footer>
          {footerType === 'tools' ? (
            <>
              <FooterListItem onClick={() => setFooterType('default')}>
                <XMarkIcon className='h-6 w-6' />
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
                  // add tab
                  const newText =
                    text.substring(0, currentSelectionStart ?? undefined) +
                    '\t' +
                    text.substring(currentSelectionEnd ?? 0, text.length)

                  if (
                    textAreaRef.current &&
                    typeof currentSelectionStart === 'number'
                  ) {
                    textAreaRef.current.focus()
                    textAreaRef.current.value = newText

                    textAreaRef.current.setSelectionRange(
                      currentSelectionStart + 1,
                      currentSelectionStart + 1
                    )
                  }

                  setText(newText)
                }}
              >
                <ArrowSmallRightIcon className='h-6 w-6' />
              </FooterListItem>
              {!readOnly && (
                <FooterListItem onClick={() => setIsConfirmModalOpen(true)}>
                  <TrashIcon className='h-6 w-6 text-red-600' />
                </FooterListItem>
              )}
            </>
          ) : footerType === 'share' ? (
            <>
              <FooterListItem onClick={() => setFooterType('default')}>
                <XMarkIcon className='h-6 w-6' />
              </FooterListItem>
              <FooterListItem
                onClick={() => {
                  copyToClipboard(text)
                  toast.success('copied text to clipboard')
                }}
              >
                <DocumentDuplicateIcon className='h-6 w-6' />
              </FooterListItem>
              <FooterListItem
                onClick={() => {
                  copyToClipboard(currentUrl || '')
                  toast.success('copied url to clipboard')
                }}
              >
                <LinkIcon className='h-6 w-6' />
              </FooterListItem>
            </>
          ) : (
            <>
              {hasChanges ? (
                <FooterListItem
                  onClick={() => setIsDiscardChangesModalOpen(true)}
                >
                  <Bars2Icon className='h-6 w-6' />
                </FooterListItem>
              ) : (
                <FooterListItem>
                  <Link
                    className='flex w-full justify-center py-2'
                    href='/notes'
                  >
                    <Bars2Icon className='h-6 w-6' />
                  </Link>
                </FooterListItem>
              )}
              <FooterListItem onClick={() => setFooterType('tools')}>
                <WrenchIcon className='h-6 w-6' />
              </FooterListItem>
              <FooterListItem onClick={() => setFooterType('share')}>
                <ShareIcon className='h-6 w-6' />
              </FooterListItem>
              {!readOnly && (
                <FooterListItem onClick={saveNote} disabled={!canSave}>
                  <ArrowDownOnSquareIcon className='h-6 w-6' />
                </FooterListItem>
              )}
            </>
          )}
        </Footer>
      )}
      <Modal
        isOpen={isConfirmModalOpen && !readOnly}
        setIsOpen={setIsConfirmModalOpen}
        title='are you sure you want to delete?'
      >
        <div className='flex space-x-4'>
          <Button
            onClick={() => {
              deleteNote({ id: id as string })
              push('/notes').catch(err => console.log(err))
            }}
          >
            yes
          </Button>
          <Button
            onClick={() => {
              setIsConfirmModalOpen(false)
            }}
          >
            no
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={isDiscardChangesModalOpen}
        setIsOpen={setIsDiscardChangesModalOpen}
        title='discard changes?'
      >
        <div className='flex space-x-4'>
          <Button href='/notes' internal>
            yes
          </Button>
          <Button
            onClick={() => {
              setIsDiscardChangesModalOpen(false)
            }}
          >
            no
          </Button>
        </div>
      </Modal>
    </Page>
  )
}
