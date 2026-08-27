// File → dataURL → HTMLImageElement 공용 로딩 헬퍼 (addSubImage/loadImage 공용)
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve((e.target?.result as string) || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; dataUrl: string }> {
  const dataUrl = await readFileAsDataURL(file)
  const img = await loadImageElement(dataUrl)
  return { img, dataUrl }
}
