import classnames from 'classnames'

// based on: https://www.joshwcomeau.com/animation/3d-button/
export default function Button({
  className,
  onClick,
  href,
  type,
  disabled,
  children,
}: {
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  href?: string
  type?: 'button' | 'submit' | 'reset' | undefined
  disabled?: boolean
  children?: React.ReactNode
}) {
  if (href) {
    const anchorProps = {
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
    }
    return (
      <a
        className={classnames(
          'group w-full cursor-pointer rounded-lg border-none bg-cb-dark-blue text-center text-lg',
          className
        )}
        {...anchorProps}
      >
        <span className='block translate-y-[-4px] transform rounded-lg bg-[#5a3e84] p-3 text-lg duration-[600ms] ease-[cubic-bezier(.3,.7,.4,1)] hover:ease-[cubic-bezier(.3,.7,.4,1.5)] group-hover:translate-y-[-6px] group-hover:duration-[250ms] group-active:translate-y-[-2px] group-active:duration-[34ms]'>
          {children}
        </span>
      </a>
    )
  }
  const buttonProps = {
    onClick,
    disabled: disabled ?? false,
    type: type ?? 'button',
  }
  return (
    <button
      className={classnames(
        'group w-full cursor-pointer rounded-lg border-none bg-cb-dark-blue text-center text-lg',
        className
      )}
      {...buttonProps}
    >
      <span className='block translate-y-[-4px] transform rounded-lg bg-[#5a3e84] p-3 text-lg duration-[600ms] ease-[cubic-bezier(.3,.7,.4,1)] hover:ease-[cubic-bezier(.3,.7,.4,1.5)] group-hover:translate-y-[-6px] group-hover:duration-[250ms] group-active:translate-y-[-2px] group-active:duration-[34ms]'>
        {children}
      </span>
    </button>
  )
}
