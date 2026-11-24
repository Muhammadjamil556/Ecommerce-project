import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FormAlert } from '@/components/common/FormAlert'
import { PageLoader } from '@/components/common/PageLoader'
import { fetchAdminSummary, selectAdmin } from '../adminSlice'

export function AdminHomePage() {
  const dispatch = useDispatch()
  const { summary, status, error } = useSelector(selectAdmin)

  useEffect(() => {
    dispatch(fetchAdminSummary())
  }, [dispatch])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
      {(status === 'idle' || status === 'loading') && <PageLoader />}
      {status === 'failed' && <FormAlert>{error.message}</FormAlert>}
      {status === 'succeeded' && (
        <p>
          Registered customers: <strong>{summary.customerCount}</strong>
        </p>
      )}
    </div>
  )
}
