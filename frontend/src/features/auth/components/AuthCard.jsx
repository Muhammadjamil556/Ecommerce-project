import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'

export function AuthCard({ title, description, children }) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
