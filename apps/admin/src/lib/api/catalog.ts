import { request, SERVICE_CATALOG_URL } from './client'
import type {
  EstimateRequest,
  EstimateResponse,
  ServiceCategoryDto,
  ServiceOfferingDto,
  ZoneDto,
} from '@/types/dto'

const base = SERVICE_CATALOG_URL

export function resolveZone(lat: number, lng: number) {
  return request<ZoneDto>(base, `/zones/resolve?lat=${lat}&lng=${lng}`)
}

export function lookupZone(params: { zoneId?: string; zoneName?: string }) {
  const query = new URLSearchParams()
  if (params.zoneId) query.set('zoneId', params.zoneId)
  if (params.zoneName) query.set('zoneName', params.zoneName)
  return request<ZoneDto>(base, `/zones/lookup?${query.toString()}`)
}

export function listZoneServices(params: { zoneId?: string; zoneName?: string }) {
  const query = new URLSearchParams()
  if (params.zoneId) query.set('zoneId', params.zoneId)
  if (params.zoneName) query.set('zoneName', params.zoneName)
  return request<ServiceOfferingDto[]>(base, `/zones/services?${query.toString()}`)
}

export function listCategories() {
  return request<ServiceCategoryDto[]>(base, '/categories')
}

export function getCategory(code: string) {
  return request<ServiceCategoryDto>(base, `/categories/${encodeURIComponent(code)}`)
}

export function estimate(body: EstimateRequest) {
  return request<EstimateResponse>(base, '/estimate', { method: 'POST', body })
}
