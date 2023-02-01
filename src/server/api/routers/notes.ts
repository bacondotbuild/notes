import { z } from 'zod'

import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'

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
      try {
        return await ctx.prisma.note.upsert({
          where: {
            id: input.id ?? '',
          },
          update: {
            text: input.text ?? 'untitled\nbody',
            title: input.title ?? 'untitled',
            body: input.body ?? 'body',
            author: input.author,
          },
          create: {
            text: input.text ?? 'untitled\nbody',
            title: input.title ?? 'untitled',
            body: input.body ?? 'body',
            author: input.author,
          },
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
