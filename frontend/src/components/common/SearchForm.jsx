import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SearchForm({ label, value, onSearch }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSearch(new FormData(event.currentTarget).get('search').trim())
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex min-w-0 flex-1 gap-2 sm:max-w-sm"
    >
      <Input
        // A new key resets the box when the address changes.
        key={value}
        name="search"
        type="search"
        aria-label={label}
        placeholder="Search"
        maxLength={100}
        defaultValue={value}
      />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  )
}
