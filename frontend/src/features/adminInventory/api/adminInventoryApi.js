import { apiClient } from '@/lib/apiClient'

const PATH = '/admin/inventory'

export async function getInventory(params) {
  const response = await apiClient.get(PATH, { params })
  return { items: response.data.data, meta: response.data.meta }
}

export async function getInventoryItem(variantId) {
  const response = await apiClient.get(`${PATH}/${variantId}`)
  return response.data.data
}

export async function getMovements({ variantId, page }) {
  const response = await apiClient.get(`${PATH}/${variantId}/movements`, {
    params: { page },
  })
  return { items: response.data.data, meta: response.data.meta }
}

export async function adjustStock({ variantId, values }) {
  const response = await apiClient.post(
    `${PATH}/${variantId}/adjustments`,
    values,
  )
  return response.data.data
}

export async function updateThreshold({ variantId, lowStockThreshold }) {
  const response = await apiClient.patch(`${PATH}/${variantId}`, {
    lowStockThreshold,
  })
  return response.data.data
}
