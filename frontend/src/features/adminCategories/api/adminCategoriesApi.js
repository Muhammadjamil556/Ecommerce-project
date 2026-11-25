import { apiClient } from '@/lib/apiClient'

const PATH = '/admin/categories'

export async function getCategories() {
  const response = await apiClient.get(PATH)
  return response.data.data
}

export async function createCategory(values) {
  const response = await apiClient.post(PATH, values)
  return response.data.data
}

export async function updateCategory({ id, changes }) {
  const response = await apiClient.patch(`${PATH}/${id}`, changes)
  return response.data.data
}

export async function deleteCategory(id) {
  await apiClient.delete(`${PATH}/${id}`)
}
