export function validateExternalURL(value: null | string | undefined): true | string {
  if (!value) return true

  try {
    const url = new URL(value.trim())
    return ['http:', 'https:'].includes(url.protocol)
      ? true
      : 'Enter a full URL beginning with http:// or https://.'
  } catch {
    return 'Enter a full URL beginning with http:// or https://.'
  }
}
