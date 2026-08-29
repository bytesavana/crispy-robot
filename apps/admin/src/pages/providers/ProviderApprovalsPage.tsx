import { Link } from 'react-router-dom'
import { ArrowRight, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmActionButton } from '@/components/ConfirmActionButton'
import { TextPromptButton } from '@/components/TextPromptButton'
import { useAsync } from '@/lib/hooks/useAsync'
import {
  approveCoverage,
  listPendingProviders,
  rejectCoverage,
  verifyProvider,
} from '@/lib/api/providers'
import type { ProviderDto } from '@/types/dto'

function ProviderCard({ provider, onChange }: { provider: ProviderDto; onChange: () => void }) {
  const pendingCoverage = provider.coverage.filter((c) => c.status === 'Pending')
  const providerPending = provider.verificationStatus === 'Pending'

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CardTitle>{provider.name}</CardTitle>
          <Badge variant="secondary">{provider.kind}</Badge>
          <StatusBadge status={provider.verificationStatus} />
        </div>
        <div className="flex items-center gap-2">
          {providerPending && (
            <>
              <ConfirmActionButton
                label="Approve provider"
                title="Approve provider"
                description={`"${provider.name}" becomes verified. Its coverage still needs approving row by row.`}
                variant="default"
                icon={<Check className="size-4" />}
                onConfirm={async () => {
                  await verifyProvider(provider.id, { status: 'Verified' })
                  onChange()
                }}
              />
              <TextPromptButton
                label="Reject"
                title="Reject provider"
                fieldLabel="Reason"
                placeholder="Shown to the applicant"
                variant="destructive"
                icon={<X className="size-4" />}
                onSubmit={async (reason) => {
                  await verifyProvider(provider.id, { status: 'Rejected', reason: reason || null })
                  onChange()
                }}
              />
            </>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/providers/${provider.id}`}>
              Detail <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm text-muted-foreground">
          Requested {new Date(provider.createdAt).toLocaleString()} ·{' '}
          {pendingCoverage.length} service{pendingCoverage.length === 1 ? '' : 's'} awaiting review
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {provider.coverage.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.zoneName}</TableCell>
                <TableCell className="font-mono text-xs">{c.categoryCode}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                  {c.reviewNote && <span className="ml-2 text-xs text-muted-foreground">{c.reviewNote}</span>}
                </TableCell>
                <TableCell className="text-right">
                  {c.status === 'Pending' && (
                    <div className="flex justify-end gap-2">
                      <ConfirmActionButton
                        label="Approve"
                        title="Approve coverage"
                        description={`"${provider.name}" becomes matchable for ${c.categoryCode} in ${c.zoneName}.`}
                        variant="default"
                        onConfirm={async () => {
                          await approveCoverage(provider.id, c.id)
                          onChange()
                        }}
                      />
                      <TextPromptButton
                        label="Reject"
                        title="Reject coverage"
                        fieldLabel="Reason"
                        variant="destructive"
                        onSubmit={async (reason) => {
                          await rejectCoverage(provider.id, c.id, { reason: reason || null })
                          onChange()
                        }}
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {provider.coverage.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No coverage requested.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function ProviderApprovalsPage() {
  const { data: providers, loading, error, refetch } = useAsync(listPendingProviders, [])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Onboarding approvals</h1>
        <p className="text-sm text-muted-foreground">
          Providers awaiting first verification, and verified providers whose newly added services still need a
          review. A provider is matched for a service only once both the provider and that service are approved.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-48 w-full" />}

      {providers && providers.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing waiting — the queue is clear.</p>
      )}

      {providers?.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} onChange={refetch} />
      ))}
    </div>
  )
}
