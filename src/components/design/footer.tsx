import type { MouseEventHandler } from 'react'

export default function Footer({ children }: { children?: React.ReactNode }) {
  return (
    <footer className='sticky bottom-0 pb-4'>
      <ul className='mx-4 flex items-center divide-x divide-cb-white rounded-lg bg-cb-dusty-blue text-cb-yellow'>
        {children}
      </ul>
    </footer>
  )
}

export function FooterListItem({
  onClick,
  disabled,
  children,
}: {
  onClick?: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  children?: React.ReactNode
}) {
  return (
    <li className='flex-grow'>
      {onClick ? (
        <button
          className='flex w-full justify-center py-2 disabled:pointer-events-none disabled:opacity-25'
          type='button'
          onClick={onClick}
          disabled={disabled ?? false}
        >
          {children}
        </button>
      ) : (
        children
      )}
    </li>
  )
}
