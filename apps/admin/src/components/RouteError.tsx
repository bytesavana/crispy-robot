import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ErrorAlert'

function messageFor(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong rendering this page.'
}

export function RouteError() {
  const error = useRouteError()

  return (
    <div className="flex flex-col gap-4 p-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/orders">
          <ArrowLeft className="size-4" /> Back to orders
        </Link>
      </Button>
      <ErrorAlert message={messageFor(error)} />
    </div>
  )
}
