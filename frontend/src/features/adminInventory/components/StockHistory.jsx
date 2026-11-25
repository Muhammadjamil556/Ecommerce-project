import { LoadError } from '@/components/common/LoadError'
import { PageButtons } from '@/components/common/PageButtons'
import { PageLoader } from '@/components/common/PageLoader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/formatDate'
import { REASON_LABELS } from '../stockReasons'

export function StockHistory({ history, onRetry, onPageChange }) {
  const { items, meta, status, error } = history

  if (status === 'failed') return <LoadError error={error} onRetry={onRetry} />
  if (status !== 'succeeded') return <PageLoader />
  if (meta.total === 0) {
    return <p className="text-sm text-muted-foreground">No changes yet.</p>
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Stock after</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>{formatDate(movement.createdAt)}</TableCell>
              <TableCell>
                {movement.change > 0 ? `+${movement.change}` : movement.change}
              </TableCell>
              <TableCell>{movement.quantityAfter}</TableCell>
              <TableCell>{REASON_LABELS[movement.reason]}</TableCell>
              <TableCell>{movement.createdByName ?? 'System'}</TableCell>
              <TableCell className="min-w-40 whitespace-normal wrap-break-word">
                {movement.note}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PageButtons meta={meta} onChange={onPageChange} />
    </div>
  )
}
