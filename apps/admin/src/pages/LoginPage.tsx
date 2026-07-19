import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isAuthenticated, login } from '@/lib/auth/session'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (login(username, password)) {
      const from = (location.state as { from?: Location })?.from
      navigate(from?.pathname ?? '/dashboard', { replace: true })
    } else {
      setError('Invalid username or password.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>MtaaPal Admin</CardTitle>
          <CardDescription>Internal operations console. Sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ops"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="mt-2 w-full">
              Sign in
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Placeholder login for v1 — not backed by IdentityServer yet.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
