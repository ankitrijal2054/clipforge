export function isValidVideoFile(filename: string): boolean {
  const validExtensions = ['.mp4', '.mov', '.webm']
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return validExtensions.includes(extension)
}

export function isValidFilename(filename: string): boolean {
  const invalidChars = /[<>:"/\\|?*]/
  return !invalidChars.test(filename) && filename.length > 0
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_')
}
