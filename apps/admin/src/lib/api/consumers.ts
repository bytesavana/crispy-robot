import { CONSUMERS_URL, request, withAdminIdentity } from './client'
import type {
  AddAddressRequest,
  AddAddressResponse,
  ConsumerAddressDto,
  ConsumerDto,
  CreateConsumerRequest,
  UpdateConsumerRequest,
} from '@/types/dto'

const base = CONSUMERS_URL

export function createConsumer(body: CreateConsumerRequest) {
  return request<ConsumerDto>(base, '/consumers', { method: 'POST', body, headers: withAdminIdentity() })
}

// `?consumerId=` is the documented admin override in ConsumersController — it's
// honored regardless of the X-User-Id header value, since there's no role check
// on it yet. This is the intended admin lookup path.
export function getConsumerProfile(consumerId: string) {
  return request<ConsumerDto>(base, `/consumers/profile?consumerId=${consumerId}`, { headers: withAdminIdentity() })
}

export function listConsumers(params: { isActive?: boolean } = {}) {
  const query = params.isActive === undefined ? '' : `?isActive=${params.isActive}`
  return request<ConsumerDto[]>(base, `/consumers${query}`, { headers: withAdminIdentity() })
}

export function updateConsumerProfile(consumerId: string, body: UpdateConsumerRequest) {
  return request<ConsumerDto>(base, `/consumers/profile?consumerId=${consumerId}`, {
    method: 'PUT',
    body,
    headers: withAdminIdentity(),
  })
}

export function activateConsumer(consumerId: string) {
  return request<void>(base, `/consumers/profile/activate?consumerId=${consumerId}`, {
    method: 'POST',
    headers: withAdminIdentity(),
  })
}

export function deactivateConsumer(consumerId: string) {
  return request<void>(base, `/consumers/profile/deactivate?consumerId=${consumerId}`, {
    method: 'POST',
    headers: withAdminIdentity(),
  })
}

export function addAddress(consumerId: string, body: AddAddressRequest) {
  return request<AddAddressResponse>(base, `/consumers/profile/addresses?consumerId=${consumerId}`, {
    method: 'POST',
    body,
    headers: withAdminIdentity(),
  })
}

export function listAddresses(consumerId: string) {
  return request<ConsumerAddressDto[]>(base, `/consumers/profile/addresses?consumerId=${consumerId}`, {
    headers: withAdminIdentity(),
  })
}

export function deactivateAddress(consumerId: string, addressId: string) {
  return request<void>(base, `/consumers/profile/addresses/${addressId}/deactivate?consumerId=${consumerId}`, {
    method: 'POST',
    headers: withAdminIdentity(),
  })
}
