import { ButtonHTMLAttributes } from 'react'

export default function Button({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="bg-primary text-black px-4 py-2 rounded"
      {...props}
    >
      {children}
    </button>
  )
}
