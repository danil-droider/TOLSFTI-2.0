/**
 * Client-side image compression used to keep persisted goal photos small enough
 * for localStorage on mobile Safari.
 *
 * DOM APIs (FileReader, HTMLCanvasElement) are only touched inside function
 * bodies so this module imports cleanly in non-DOM test environments.
 */

export interface CompressImageOptions {
  readonly maxWidth?: number
  readonly maxHeight?: number
  readonly quality?: number
  readonly type?: string
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxWidth: 160,
  maxHeight: 160,
  quality: 0.8,
  type: 'image/jpeg',
}

/**
 * Resize and compress an image file into a lightweight Data URL.
 *
 * Returns null if the browser lacks canvas support or the file cannot be read.
 */
export function compressImageToDataUrl(
  file: File,
  options: CompressImageOptions = {},
): Promise<string | null> {
  const { maxWidth, maxHeight, quality, type } = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve) => {
    if (typeof FileReader === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
      resolve(null)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const width = Math.min(img.width, maxWidth)
          const height = Math.min(img.height, maxHeight)
          // Preserve aspect ratio by scaling down to fit within maxWidth x maxHeight.
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height)
          canvas.width = Math.max(1, Math.floor(img.width * scale))
          canvas.height = Math.max(1, Math.floor(img.height * scale))

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(null)
            return
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL(type, quality))
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = (event.target as FileReader).result as string
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}
