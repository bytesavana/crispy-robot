import { PROVIDER_REGISTRY_URL, request } from './client'
import type {
  AddCoverageRequest,
  AddCoverageResponse,
  CreateProviderRequest,
  MatchedProviderDto,
  ProviderCoverageDto,
  ProviderDto,
  UpdateProviderRequest,
  VerifyProviderRequest,
} from '@/types/dto'

const base = PROVIDER_REGISTRY_URL

export function createProvider(body: CreateProviderRequest) {
  return request<ProviderDto>(base, '/providers', { method: 'POST', body })
}

export function getProvider(id: string) {
  return request<ProviderDto>(base, `/providers/${id}`)
}

export function listProviders(params: { isActive?: boolean } = {}) {
  const query = params.isActive === undefined ? '' : `?isActive=${params.isActive}`
  return request<ProviderDto[]>(base, `/providers${query}`)
}

export function updateProvider(id: string, body: UpdateProviderRequest) {
  return request<ProviderDto>(base, `/providers/${id}`, { method: 'PUT', body })
}

export function activateProvider(id: string) {
  return request<void>(base, `/providers/${id}/activate`, { method: 'POST' })
}

export function deactivateProvider(id: string) {
  return request<void>(base, `/providers/${id}/deactivate`, { method: 'POST' })
}

export function verifyProvider(id: string, body: VerifyProviderRequest) {
  return request<void>(base, `/providers/${id}/verify`, { method: 'POST', body })
}

export function addCoverage(id: string, body: AddCoverageRequest) {
  return request<AddCoverageResponse>(base, `/providers/${id}/coverage`, { method: 'POST', body })
}

export function listCoverage(id: string) {
  return request<ProviderCoverageDto[]>(base, `/providers/${id}/coverage`)
}

export function deactivateCoverage(id: string, coverageId: string) {
  return request<void>(base, `/providers/${id}/coverage/${coverageId}/deactivate`, { method: 'POST' })
}

export function matchProviders(params: { zoneId: string; categoryCode: string }) {
  const query = new URLSearchParams(params)
  return request<MatchedProviderDto[]>(base, `/providers/match?${query.toString()}`)
}
