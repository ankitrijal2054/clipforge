export function isValidVideoFile(filename: string): boolean {
  const validExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv']
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return validExtensions.includes(extension)
}

export function isValidAudioFile(filename: string): boolean {
  const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg']
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return validExtensions.includes(extension)
}

export function isValidMediaFile(filename: string): boolean {
  return isValidVideoFile(filename) || isValidAudioFile(filename)
}

export function isValidFilename(filename: string): boolean {
  const invalidChars = /[<>:"/\\|?*]/
  return !invalidChars.test(filename) && filename.length > 0
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_')
}
