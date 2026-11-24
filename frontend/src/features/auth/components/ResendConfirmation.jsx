import { useState } from 'react'
import { FormAlert } from '@/components/common/FormAlert'
import { Button } from '@/components/ui/button'
import { resendConfirmation } from '../api/authApi'
import { getAuthErrorMessage } from '../authErrors'

export function ResendConfirmation({ email }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'sent'
  const [errorMessage, setErrorMessage] = useState(null)

  async function handleResend() {
    setStatus('sending')
    setErrorMessage(null)
    try {
      await resendConfirmation(email)
      setStatus('sent')
    } catch (error) {
      setStatus('idle')
      setErrorMessage(getAuthErrorMessage(error))
    }
  }

  return (
    <div className="space-y-3">
      <FormAlert>{errorMessage}</FormAlert>
      {status === 'sent' ? (
        <p role="status" className="text-sm">
          A new confirmation email is on its way.
        </p>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={status === 'sending'}
          onClick={handleResend}
        >
          Resend confirmation email
        </Button>
      )}
    </div>
  )
}
