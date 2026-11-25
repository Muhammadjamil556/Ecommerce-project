import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '../productStatus'

const VARIANTS = {
  draft: 'outline',
  published: 'default',
  archived: 'secondary',
}

export function StatusBadge({ status }) {
  return <Badge variant={VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
}
