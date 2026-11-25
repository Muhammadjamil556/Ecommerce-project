import { Badge } from '@/components/ui/badge'

export function StockBadge({ item }) {
  if (item.quantity === 0) return <Badge variant="destructive">Empty</Badge>
  if (item.isLow) return <Badge variant="outline">Low</Badge>
  return <Badge variant="secondary">OK</Badge>
}
