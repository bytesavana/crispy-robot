import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { StatusBadge } from '@/components/StatusBadge'
import { ApiError } from '@/lib/api/client'
import { getRequestByAgentRef, listRequests } from '@/lib/api/requests'
import type { ServiceRequestDto } from '@/types/dto'

export function RequestLookupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [customerId, setCustomerId] = useState(searchParams.get('customerId') ?? '')
  const [agentRef, setAgentRef] = useState('')
  const [requests, setRequests] = useState<ServiceRequestDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleListByCustomer(event?: FormEvent) {
    event?.preventDefault()
    setError(null)
    setRequests(null)
    setLoading(true)
    try {
      setRequests(await listRequests(customerId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to list requests for this customer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('customerId')) {
      handleListByCustomer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleByAgentRef(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const req = await getRequestByAgentRef(agentRef, customerId)
      navigate(`/requests/${req.id}?customerId=${encodeURIComponent(customerId)}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to find request by agent ref.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Look up request</h1>
        <p className="text-sm text-muted-foreground">
          ServiceRequestOrchestrator scopes every lookup by customer id — there's no admin override here yet, so a
          known customer id is required either way.
        </p>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="byCustomer">
            <TabsList>
              <TabsTrigger value="byCustomer">By customer</TabsTrigger>
              <TabsTrigger value="byAgentRef">By agent ref</TabsTrigger>
            </TabsList>

            <TabsContent value="byCustomer">
              <form className="flex items-end gap-3" onSubmit={handleListByCustomer}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customerId">Customer ID</Label>
                  <Input
                    id="customerId"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="userId from Consumers"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching…' : 'List requests'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="byAgentRef">
              <form className="flex items-end gap-3" onSubmit={handleByAgentRef}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customerId2">Customer ID</Label>
                  <Input
                    id="customerId2"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="agentRef">Agent ref</Label>
                  <Input id="agentRef" value={agentRef} onChange={(e) => setAgentRef(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching…' : 'Find request'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && <ErrorAlert message={error} />}

      {requests && (
        <Card>
          <CardHeader>
            <CardTitle>Requests for {customerId}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent ref</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Tasks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/requests/${r.id}?customerId=${encodeURIComponent(customerId)}`)}
                  >
                    <TableCell className="font-mono text-xs">{r.agentRef}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="flex flex-wrap gap-1">
                      {r.tasks.map((t) => (
                        <StatusBadge key={t.id} status={t.status} />
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No requests found for this customer.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
