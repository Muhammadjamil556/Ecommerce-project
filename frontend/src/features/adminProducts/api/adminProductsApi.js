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

// A photo can take a while on a slow connection.
const UPLOAD_TIMEOUT_MS = 60_000

export async function uploadImage({ productId, file, details }) {
  const form = new FormData()
  for (const [key, value] of Object.entries(details)) form.append(key, value)
  form.append('file', file)

  const response = await apiClient.post(`${PATH}/${productId}/images`, form, {
    timeout: UPLOAD_TIMEOUT_MS,
  })
  return response.data.data
}

export async function updateImage({ productId, id, changes }) {
  const response = await apiClient.patch(
    `${PATH}/${productId}/images/${id}`,
    changes,
  )
  return response.data.data
}

export async function reorderImages({ productId, imageIds }) {
  const response = await apiClient.put(`${PATH}/${productId}/images/order`, {
    imageIds,
  })
  return response.data.data
}

export async function deleteImage({ productId, id }) {
  await apiClient.delete(`${PATH}/${productId}/images/${id}`)
}
