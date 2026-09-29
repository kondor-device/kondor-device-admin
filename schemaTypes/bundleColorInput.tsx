import {Select, Stack, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {set, unset, useClient, useFormValue, type StringInputProps} from 'sanity'

type ColorOption = {code?: string; color?: string}

// Вибір коду кольору зі списку кольорових варіантів обраного товару.
// Вільний текст не дозволяємо: код кольору = sku в CRM, помилка = неправильне списання зі складу.
export function BundleColorInput(props: StringInputProps) {
  const {value, onChange, path, readOnly} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const itemRef = useFormValue([...path.slice(0, -1), 'item', '_ref']) as string | undefined
  const [options, setOptions] = useState<ColorOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!itemRef) {
      setOptions([])
      return
    }

    let cancelled = false
    setLoading(true)

    // Чернетку теж враховуємо: товар міг бути щойно змінений
    client
      .fetch<ColorOption[]>(
        `coalesce(*[_id == "drafts." + $id][0].coloropts, *[_id == $id][0].coloropts, [])[]{code, color}`,
        {id: itemRef},
      )
      .then((result) => {
        if (!cancelled) setOptions(result ?? [])
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [client, itemRef])

  if (!itemRef) {
    return <Text size={1}>Спочатку оберіть товар</Text>
  }

  const selectable = options.filter((option) => option.code)
  const valueMissing = Boolean(value) && !selectable.some((option) => option.code === value)

  return (
    <Stack space={2}>
      <Select
        value={value ?? ''}
        disabled={readOnly || loading}
        onChange={(event) => {
          const next = event.currentTarget.value
          onChange(next ? set(next) : unset())
        }}
      >
        <option value="">{loading ? 'Завантаження…' : 'Оберіть колір'}</option>
        {selectable.map((option) => (
          <option key={option.code} value={option.code}>
            {option.color} ({option.code})
          </option>
        ))}
        {valueMissing && <option value={value}>{value} (немає в товарі)</option>}
      </Select>
      {!loading && selectable.length === 0 && (
        <Text size={1}>У товару немає колірних варіантів із заповненим кодом.</Text>
      )}
    </Stack>
  )
}
