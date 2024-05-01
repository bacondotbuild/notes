import { useState, useRef } from 'react'
import Fuse from 'fuse.js'

const useSearch = <T>({
  initialSearch,
  list,
  options,
}: {
  initialSearch?: string
  list: T[]
  options: Record<string, string[]>
}) => {
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [search, setSearch] = useState(initialSearch ?? '')

  const fuse = new Fuse(list, options)

  const results =
    search === '' ? list : fuse.search(search).map(result => result.item)

  return { search, setSearch, results, searchRef }
}

export default useSearch
