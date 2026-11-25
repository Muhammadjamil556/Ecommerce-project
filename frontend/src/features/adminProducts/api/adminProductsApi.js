import { apiClient } from '@/lib/apiClient'

const PATH = '/admin/products'

export async function getProducts(params) {
  const response = await apiClient.get(PATH, { params })
  return { items: response.data.data, meta: response.data.meta }
}

export async function getProduct(id) {
  const response = await apiClient.get(`${PATH}/${id}`)
  return response.data.data
}

export async function createProduct(values) {
  const response = await apiClient.post(PATH, values)
  return response.data.data
}

export async function updateProduct({ id, changes }) {
  const response = await apiClient.patch(`${PATH}/${id}`, changes)
  return response.data.data
}

export async function deleteProduct(id) {
  await apiClient.delete(`${PATH}/${id}`)
}

export async function createVariant({ productId, values }) {
  const response = await apiClient.post(`${PATH}/${productId}/variants`, values)
  return response.data.data
}

export async function updateVariant({ productId, id, changes }) {
  const response = await apiClient.patch(
    `${PATH}/${productId}/variants/${id}`,
    changes,
  )
  return response.data.data
}

export async function deleteVariant({ productId, id }) {
  await apiClient.delete(`${PATH}/${productId}/variants/${id}`)
}
