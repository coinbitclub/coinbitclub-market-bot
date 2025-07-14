import { InputHTMLAttributes } from 'react'

export default function FormInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="border rounded p-2 bg-gray-900" {...props} />
}
