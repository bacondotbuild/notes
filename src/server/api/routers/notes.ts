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
        return await ctx.prisma.note.findFirst({
          where: {
            id: input.id,
          },
        })
      } catch (error) {
        console.log(error)
      }
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.note.findMany()
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const text = input.text ?? 'untitled\nbody'
      const title = input.title ?? 'untitled'

      const isMarkdown = title.startsWith('# ')
      const markdown = isMarkdown ? purify.sanitize(marked.parse(text)) : ''

      const newNote = {
        text,
        title,
        body: input.body ?? 'body',
        markdown,
        author: input.author,
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
      z
        .object({
          id: z.string().nullish(),
        })
        .nullish()
    )
    .mutation(async ({ ctx, input }) => {
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
