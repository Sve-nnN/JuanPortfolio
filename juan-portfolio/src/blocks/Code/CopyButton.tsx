'use client'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { useState } from 'react'
import { trackEvent } from '@/utilities/analytics'

export function CopyButton({ code }: { code: string }) {
  const [text, setText] = useState('Copy')

  function updateCopyStatus() {
    if (text === 'Copy') {
      setText(() => 'Copied!')
      setTimeout(() => {
        setText(() => 'Copy')
      }, 1000)
    }
  }

  return (
    <div className="flex justify-end align-middle">
      <Button
        className="flex gap-1"
        variant={'secondary'}
        onClick={async () => {
          await navigator.clipboard.writeText(code)
          updateCopyStatus()
          trackEvent('code_copied', { 
            code_length: code.length,
            timestamp: new Date().toISOString()
          })
        }}
      >
        <p>{text}</p>
        <Copy />
      </Button>
    </div>
  )
}
