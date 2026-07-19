import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ApiError } from '@/lib/api/client'
import { estimate } from '@/lib/api/catalog'
import type { EstimateResponse } from '@/types/dto'

export function EstimatorPage() {
  const [taskType, setTaskType] = useState('')
  const [zoneName, setZoneName] = useState('')
  const [result, setResult] = useState<EstimateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      setResult(await estimate({ taskType, zoneName: zoneName || undefined }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to compute estimate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Estimator</h1>
        <p className="text-sm text-muted-foreground">
          Sanity-check pricing and ETA for a task type + zone combination, same as the customer app would see.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Estimate a task</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taskType">Task type (category code)</Label>
              <Input
                id="taskType"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                placeholder="grocery_run"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zoneName">Zone name</Label>
              <Input
                id="zoneName"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Kilimani"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Estimating…' : 'Get estimate'}
            </Button>
          </form>

          {error && (
            <div className="mt-4">
              <ErrorAlert message={error} />
            </div>
          )}

          {result && (
            <div className="mt-4 flex gap-6 rounded-md border border-border bg-secondary/50 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Estimated price</p>
                <p className="text-xl font-semibold">{result.estimatedPrice}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated ETA</p>
                <p className="text-xl font-semibold">{result.estimatedEtaMinutes} min</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
