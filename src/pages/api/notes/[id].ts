import type { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'yaml'

import { prisma } from '@/server/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
  } = req

  try {
    const note = await prisma.note.findFirst({
      where: {
        id: id as string,
      },
    })
    const { yml } = note ?? {}
    const parsedYml: unknown = yml ? parse(yml) : {}
    res.json({
      ...note,
      yml: yml ? parsedYml : '',
    })
  } catch (error) {
    console.log(error)
    res.json({ error })
  }
}
