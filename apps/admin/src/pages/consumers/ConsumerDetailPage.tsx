import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ActiveBadge } from '@/components/StatusBadge'
import { ConfirmActionButton } from '@/components/ConfirmActionButton'
import { useAsync } from '@/lib/hooks/useAsync'
import { ApiError } from '@/lib/api/client'
import {
  activateConsumer,
  addAddress,
  deactivateAddress,
  deactivateConsumer,
  getConsumerProfile,
  listAddresses,
  updateConsumerProfile,
} from '@/lib/api/consumers'

export function ConsumerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const consumer = useAsync(() => getConsumerProfile(id!), [id])
  const addresses = useAsync(() => listAddresses(id!), [id])

  const [actionError, setActionError] = useState<string | null>(null)

  const [editFullName, setEditFullName] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editZoneName, setEditZoneName] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    if (!consumer.data) return
    setEditFullName(consumer.data.fullName)
    setEditEmail(consumer.data.email ?? '')
    setEditZoneName(consumer.data.defaultZoneName ?? '')
    setEditPaymentMethod(consumer.data.defaultPaymentMethod ?? '')
  }, [consumer.data])

  const [addressLabel, setAddressLabel] = useState('')
  const [addressText, setAddressText] = useState('')
  const [addressError, setAddressError] = useState<string | null>(null)
  const [addressSubmitting, setAddressSubmitting] = useState(false)

  async function handleEditSubmit(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setEditSubmitting(true)
    setActionError(null)
    try {
      await updateConsumerProfile(id, {
        fullName: editFullName ?? '',
        email: editEmail || undefined,
        zoneName: editZoneName || undefined,
        defaultPaymentMethod: editPaymentMethod || undefined,
      })
      consumer.refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update consumer.')
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleAddAddress(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setAddressSubmitting(true)
    setAddressError(null)
    try {
      const result = await addAddress(id, { label: addressLabel, addressText })
      if (result.error) {
        setAddressError(result.error)
      } else {
        setAddressLabel('')
        setAddressText('')
        addresses.refetch()
      }
    } catch (err) {
      setAddressError(err instanceof ApiError ? err.message : 'Failed to add address.')
    } finally {
      setAddressSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/consumers">
          <ArrowLeft className="size-4" /> Back to consumers
        </Link>
      </Button>

      {consumer.error && <ErrorAlert message={consumer.error} />}
      {consumer.loading && <Skeleton className="h-40 w-full" />}
      {actionError && <ErrorAlert message={actionError} />}

      {consumer.data && (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-2xl font-semibold">{consumer.data.fullName}</h1>
                  <ActiveBadge isActive={consumer.data.isActive} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {consumer.data.phone} · {consumer.data.email ?? 'no email'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/requests/lookup?customerId=${encodeURIComponent(consumer.data.userId)}`}>
                    <ClipboardList className="size-4" /> View requests
                  </Link>
                </Button>
                {consumer.data.isActive ? (
                  <ConfirmActionButton
                    label="Deactivate"
                    title="Deactivate consumer"
                    description={`"${consumer.data.fullName}" will no longer be able to place new requests.`}
                    icon={<PowerOff className="size-4" />}
                    onConfirm={async () => {
                      await deactivateConsumer(id!)
                      consumer.refetch()
                    }}
                  />
                ) : (
                  <ConfirmActionButton
                    label="Activate"
                    title="Activate consumer"
                    description={`"${consumer.data.fullName}" will be able to place requests again.`}
                    icon={<Power className="size-4" />}
                    onConfirm={async () => {
                      await activateConsumer(id!)
                      consumer.refetch()
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="editFullName">Full name</Label>
                    <Input
                      id="editFullName"
                      value={editFullName ?? ''}
                      onChange={(e) => setEditFullName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="editEmail">Email</Label>
                    <Input id="editEmail" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="editZoneName">Default zone</Label>
                    <Input id="editZoneName" value={editZoneName} onChange={(e) => setEditZoneName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="editPaymentMethod">Default payment method</Label>
                    <Input
                      id="editPaymentMethod"
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-fit" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {addresses.error && <ErrorAlert message={addresses.error} />}
              {addresses.loading && <Skeleton className="h-24 w-full" />}
              {addresses.data && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addresses.data.map((addr) => (
                      <TableRow key={addr.id}>
                        <TableCell>{addr.label}</TableCell>
                        <TableCell>{addr.addressText}</TableCell>
                        <TableCell>
                          <ActiveBadge isActive={addr.isActive} />
                        </TableCell>
                        <TableCell className="text-right">
                          {addr.isActive && (
                            <ConfirmActionButton
                              label="Deactivate"
                              title="Deactivate address"
                              description={`"${addr.label}" will no longer be usable for deliveries.`}
                              onConfirm={async () => {
                                await deactivateAddress(id!, addr.id)
                                addresses.refetch()
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {addresses.data.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No addresses on file.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              <form className="flex items-end gap-2" onSubmit={handleAddAddress}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="addressLabel">Label</Label>
                  <Input
                    id="addressLabel"
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    placeholder="Home"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="addressText">Address</Label>
                  <Input
                    id="addressText"
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" size="sm" disabled={addressSubmitting}>
                  Add address
                </Button>
              </form>
              {addressError && <ErrorAlert message={addressError} />}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
