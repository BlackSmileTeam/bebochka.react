/**
 * Поворачивает изображение на canvas и возвращает новый File.
 * @param {File|Blob|string} source — файл или URL
 * @param {number} degrees — 90, 180, 270
 */
export async function rotateImageSource(source, degrees = 90) {
  const blob = source instanceof Blob
    ? source
    : await fetch(String(source)).then((r) => {
      if (!r.ok) throw new Error('Не удалось загрузить фото')
      return r.blob()
    })

  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const swap = Math.abs(degrees) % 180 === 90
  canvas.width = swap ? bitmap.height : bitmap.width
  canvas.height = swap ? bitmap.width : bitmap.height
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  bitmap.close?.()

  const fileName = source instanceof File ? source.name : 'photo.jpg'

  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error('Не удалось повернуть фото'))
        return
      }
      resolve(new File([result], fileName, { type: result.type || 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}
