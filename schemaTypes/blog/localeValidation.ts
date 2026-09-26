const isFilled = (value: unknown) => Array.isArray(value) && value.length > 0

// Російський Portable Text: обов'язковий, лише якщо заповнена українська версія.
// На сайті порожня російська версія підміняється українською.
export const validateRuArray = (value: unknown, context: {parent?: unknown}, ukField: string) => {
  const ukValue = (context.parent as Record<string, unknown> | undefined)?.[ukField]

  if (isFilled(ukValue) && !isFilled(value)) {
    return 'Заповніть російську версію (українська вже заповнена)'
  }

  return true
}
