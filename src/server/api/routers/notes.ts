import { z } from 'zod'
import { marked } from 'marked'
import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'

import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'

const window = new JSDOM('').window
const purify = DOMPurify(window as unknown as Window)

export const notesRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.note.findFirstOrThrow({
          where: {
            id: input.id,
          },
        })
      } catch (error) {
        console.log(error)
      }
    }),
  getAllByUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const currentUser = ctx.user.username

      if (!currentUser) {
        return []
      }

      return await ctx.prisma.note.findMany({
        where: {
          author: currentUser,
        },
        orderBy: [
          {
            pinned: 'desc',
          },
          {
            updatedAt: 'desc',
          },
        ],
      })
    } catch (error) {
      console.log(error)
    }
  }),
  save: protectedProcedure
    .input(
      z.object({
        id: z.string().nullish(),
        text: z.string().nullish(),
        title: z.string().nullish(),
        body: z.string().nullish(),
        author: z.string(),
        pinned: z.boolean(),
        tags: z.array(z.string()).nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user.username

      const noteToBeUpdated = await ctx.prisma.note.findFirst({
        where: {
          id: input.id ?? '',
        },
        select: {
          author: true,
        },
      })

      if (input.id && noteToBeUpdated?.author !== currentUser) {
        return null
      }

      const text = input.text ?? 'untitled\nbody'
      const title = input.title ?? 'untitled'
      const body = input.body ?? 'body'

      const isMarkdown = title.startsWith('# ')
      const markdown = isMarkdown ? purify.sanitize(marked.parse(text)) : ''

      const isList = title.startsWith('= ')
      const list = isList ? body.split('\n').filter(item => item !== '') : []

      const isYml = title.startsWith('< ')
      const yml = isYml ? body : ''

      const pinned = input.pinned ?? false
      const tags = input.tags ?? []
      const newNote = {
        text,
        title,
        body,
        markdown,
        list,
        yml,
        author: input.author,
        pinned,
        tags,
      }

      try {
        return await ctx.prisma.note.upsert({
          where: {
            id: input.id ?? '',
          },
          update: newNote,
          create: newNote,
        })
      } catch (error) {
        console.log(error)
      }
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user.username

      const noteToBeDeleted = await ctx.prisma.note.findFirst({
        where: {
          id: input.id ?? '',
        },
        select: {
          author: true,
        },
      })

      if (input.id && noteToBeDeleted?.author !== currentUser) {
        return null
      }

      try {
        return await ctx.prisma.note.delete({
          where: {
            id: input?.id ?? '',
          },
        })
      } catch (error) {
        console.log(error)
      }
    }),

  // getSecretMessage: protectedProcedure.query(() => {
  //   return 'you can now see this secret message!'
  // }),
})
