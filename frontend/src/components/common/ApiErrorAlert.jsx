import { FormAlert } from './FormAlert'

/** Shows an API error, including each validation problem. */
export function ApiErrorAlert({ error }) {
  if (!error) return null

  return (
    <FormAlert>
      {error.message}
      {error.details?.length > 0 && (
        <ul className="list-disc pl-5">
          {error.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </FormAlert>
  )
}
