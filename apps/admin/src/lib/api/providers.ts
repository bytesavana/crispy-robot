import { PROVIDER_REGISTRY_URL, request, withOpsKey } from './client'
import type {
  AddCoverageRequest,
  AddCoverageResponse,
  CatalogItemDto,
  CreateProviderRequest,
  MatchedProviderDto,
  ProviderCoverageDto,
  ProviderDto,
  ProviderKind,
  RejectCoverageRequest,
  UpdateProviderRequest,
  VerificationStatus,
  VerifyProviderRequest,
} from '@/types/dto'

const base = PROVIDER_REGISTRY_URL
const ops = () => ({ headers: withOpsKey() })

export function createProvider(body: CreateProviderRequest) {
  return request<ProviderDto>(base, '/providers', { method: 'POST', body, headers: withOpsKey() })
}

export function getProvider(id: string) {
  return request<ProviderDto>(base, `/admin/providers/${id}`, ops())
}

export function listProviders(
  params: { isActive?: boolean; kind?: ProviderKind; verificationStatus?: VerificationStatus } = {},
) {
  const query = new URLSearchParams()
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive))
  if (params.kind) query.set('kind', params.kind)
  if (params.verificationStatus) query.set('verificationStatus', params.verificationStatus)
  const qs = query.toString()
  return request<ProviderDto[]>(base, `/admin/providers${qs ? `?${qs}` : ''}`, ops())
}

/** Onboarding review queue: providers Pending verification, or with any coverage row Pending. */
export function listPendingProviders() {
  return request<ProviderDto[]>(base, '/admin/providers/pending', ops())
}

export function updateProvider(id: string, body: UpdateProviderRequest) {
  return request<ProviderDto>(base, `/providers/${id}`, { method: 'PUT', body, headers: withOpsKey() })
}

export function activateProvider(id: string) {
  return request<void>(base, `/admin/providers/${id}/activate`, { method: 'POST', headers: withOpsKey() })
}

export function deactivateProvider(id: string) {
  return request<void>(base, `/admin/providers/${id}/deactivate`, { method: 'POST', headers: withOpsKey() })
}

export function verifyProvider(id: string, body: VerifyProviderRequest) {
  return request<void>(base, `/admin/providers/${id}/verify`, { method: 'POST', body, headers: withOpsKey() })
}

export function addCoverage(id: string, body: AddCoverageRequest) {
  return request<AddCoverageResponse>(base, `/providers/${id}/coverage`, { method: 'POST', body, headers: withOpsKey() })
}

export function listCoverage(id: string) {
  return request<ProviderCoverageDto[]>(base, `/providers/${id}/coverage`, ops())
}

export function deactivateCoverage(id: string, coverageId: string) {
  return request<void>(base, `/providers/${id}/coverage/${coverageId}/deactivate`, { method: 'POST', headers: withOpsKey() })
}

export function approveCoverage(id: string, coverageId: string) {
  return request<ProviderCoverageDto>(base, `/admin/providers/${id}/coverage/${coverageId}/approve`, {
    method: 'POST',
    headers: withOpsKey(),
  })
}

export function rejectCoverage(id: string, coverageId: string, body: RejectCoverageRequest) {
  return request<ProviderCoverageDto>(base, `/admin/providers/${id}/coverage/${coverageId}/reject`, {
    method: 'POST',
    body,
    headers: withOpsKey(),
  })
}

export function matchProviders(params: { zoneId: string; categoryCode: string }) {
  const query = new URLSearchParams(params)
  return request<MatchedProviderDto[]>(base, `/providers/match?${query.toString()}`, ops())
}

/** Browse offerings — omit both filters to list everything (capped server-side at 500). */
export function listOfferings(params: { categoryCode?: string; providerId?: string; limit?: number } = {}) {
  const query = new URLSearchParams()
  if (params.categoryCode) query.set('categoryCode', params.categoryCode)
  if (params.providerId) query.set('providerId', params.providerId)
  if (params.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return request<CatalogItemDto[]>(base, `/providers/items${qs ? `?${qs}` : ''}`, ops())
}
