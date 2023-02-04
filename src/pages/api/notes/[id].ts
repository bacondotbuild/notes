import type { NextApiRequest, NextApiResponse } from 'next'

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
    res.json(note)
  } catch (error) {
    console.log(error)
    res.json({ error })
  }
}
