import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { storage } from './config'

/**
 * Upload a file to Firebase Storage.
 * @param {File} file - The file to upload
 * @param {string} path - Destination path in Storage, e.g. "products/ring.jpg"
 * @param {(progress: number) => void} [onProgress] - Optional progress callback (0–100)
 * @returns {Promise<string>} Resolves with the public download URL
 */
export const uploadMedia = (file, path, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (typeof onProgress === 'function') {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress(Math.round(progress))
        }
      },
      (error) => {
        reject(error)
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}

/**
 * Delete a file from Firebase Storage by its download URL.
 * @param {string} url - The full download URL of the file to delete
 * @returns {Promise<void>}
 */
export const deleteMedia = (url) => {
  const fileRef = ref(storage, url)
  return deleteObject(fileRef)
}

/**
 * Capture the first frame of a video file and return it as a Blob (JPEG).
 * @param {File} videoFile - The video file to generate a thumbnail from
 * @returns {Promise<Blob>} JPEG blob of the first frame
 */
export const getVideoThumbnail = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const objectUrl = URL.createObjectURL(videoFile)

    video.muted = true
    video.playsInline = true
    video.src = objectUrl

    video.addEventListener('loadeddata', () => {
      // Seek to first frame
      video.currentTime = 0
    })

    video.addEventListener('seeked', () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate thumbnail blob'))
          }
        },
        'image/jpeg',
        0.85
      )
    })

    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Video load error: ${e.message}`))
    })

    video.load()
  })
}
