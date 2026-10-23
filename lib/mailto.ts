export function mailtoLink(email: string, subject: string, body?: string): string {
  const params = new URLSearchParams({ subject })
  if (body) params.set('body', body)
  return `mailto:${email}?${params.toString().replace(/\+/g, '%20')}`
}
