import { request, SERVICE_REQUEST_ORCHESTRATOR_URL } from './client'
import type { AdminServiceRequestDto, ServiceRequestDto } from '@/types/dto'

const base = SERVICE_REQUEST_ORCHESTRATOR_URL

// Mirrors AdminController on the backend — cross-customer, no X-Customer-Id
// needed, same "no role check yet" trust model as the rest of the service.

export function listAllRequests() {
  return request<ServiceRequestDto[]>(base, '/admin/requests')
}

// Richer than requests.getRequest: each task also carries its full
// status-transition history and narrative updates.
export function getAdminRequestDetail(id: string) {
  return request<AdminServiceRequestDto>(base, `/admin/requests/${id}`)
}
