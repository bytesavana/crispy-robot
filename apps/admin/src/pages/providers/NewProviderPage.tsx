import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContactChannelsEditor } from '@/components/ContactChannelsEditor'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ApiError } from '@/lib/api/client'
import { createProvider } from '@/lib/api/providers'
import type { ContactChannelDto } from '@/types/dto'

export function NewProviderPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [fulfillmentType, setFulfillmentType] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [channels, setChannels] = useState<ContactChannelDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const provider = await createProvider({
        name,
        fulfillmentType,
        contactChannels: channels,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      })
      navigate(`/providers/${provider.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create provider.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/providers">
          <ArrowLeft className="size-4" /> Back to providers
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New provider</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fulfillmentType">Fulfillment type</Label>
              <Input
                id="fulfillmentType"
                value={fulfillmentType}
                onChange={(e) => setFulfillmentType(e.target.value)}
                placeholder="e.g. SelfFulfilled, ThirdParty"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input id="latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input id="longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Contact channels</Label>
              <ContactChannelsEditor channels={channels} onChange={setChannels} />
            </div>

            {error && <ErrorAlert message={error} />}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create provider'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
