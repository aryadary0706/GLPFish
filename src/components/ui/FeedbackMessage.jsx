import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function FeedbackMessage({ type, message }) {
  if (!message) return null
  const isError = type === 'error'
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
      isError
        ? 'bg-red-50 border border-red-200 text-red-600'
        : 'bg-green-50 border border-green-200 text-green-700'
    }`}>
      {isError
        ? <AlertCircle size={15} className="shrink-0" />
        : <CheckCircle size={15} className="shrink-0" />
      }
      {message}
    </div>
  )
}