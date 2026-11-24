import { apiClient } from '@/lib/apiClient'

export async function getAdminSummary() {
  const response = await apiClient.get('/admin/summary')
  return response.data.data
}
