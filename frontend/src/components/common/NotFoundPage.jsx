import { Link } from 'react-router'
import { MessagePage } from '@/components/common/MessagePage'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <MessagePage
      title="Page not found"
      message="The page you are looking for does not exist."
    >
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </MessagePage>
  )
}
