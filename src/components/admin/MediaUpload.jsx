import { useState, useRef, useCallback } from 'react'
import { Upload, X, Film, Image, CheckCircle, Loader2, AlertTriangle, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import Cropper from 'react-easy-crop'
import { uploadMedia, deleteMedia } from '../../firebase/storage'
import toast from 'react-hot-toast'

const BROWSER_UNSUPPORTED_VIDEO = ['mov', 'quicktime']

function isMov(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext === 'mov' || file.type === 'video/quicktime'
}

// ─── Canvas crop utility ───────────────────────────────────────────────────────
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new window.Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = url
  })

async function getCroppedBlob(imageSrc, pixelCrop, fileType = 'image/jpeg') {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  // Cap output at 1400px on longest side to keep file sizes sensible
  const scale = Math.min(1, 1400 / Math.max(pixelCrop.width, pixelCrop.height))
  canvas.width = Math.round(pixelCrop.width * scale)
  canvas.height = Math.round(pixelCrop.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, canvas.width, canvas.height
  )
  return new Promise((resolve) => canvas.toBlob(resolve, fileType, 0.92))
}

// ─── Crop modal ────────────────────────────────────────────────────────────────
const ASPECTS = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: 'Free', value: undefined },
]

function ImageCropModal({ file, objectUrl, queueRemaining, onConfirm, onSkip }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1) // default 1:1 (square — matches shop tile)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [processing, setProcessing] = useState(false)

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedBlob(objectUrl, croppedAreaPixels, file.type || 'image/jpeg')
      const croppedFile = new File([blob], file.name, { type: blob.type })
      onConfirm(croppedFile)
    } catch {
      toast.error('Crop failed — using original image')
      onSkip()
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-jewel-dark">Crop Image</h3>
            <p className="text-xs text-jewel-muted mt-0.5 truncate max-w-[260px]">
              {file.name}
              {queueRemaining > 0 && <span className="ml-2 text-rose-gold">{queueRemaining} more after this</span>}
            </p>
          </div>
          <button type="button" onClick={onSkip} className="p-1 rounded-lg hover:bg-gray-100" title="Skip crop">
            <X size={18} />
          </button>
        </div>

        {/* Cropper canvas */}
        <div className="relative bg-gray-900" style={{ height: 300 }}>
          <Cropper
            image={objectUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            style={{ containerStyle: { borderRadius: 0 } }}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-4">
          {/* Aspect ratio */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-jewel-muted w-10 flex-shrink-0">Ratio</span>
            <div className="flex gap-1.5 flex-wrap">
              {ASPECTS.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setAspect(value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    aspect === value
                      ? 'bg-rose-gold text-white shadow-sm'
                      : 'bg-gray-100 text-jewel-muted hover:bg-blush/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-jewel-muted w-10 flex-shrink-0">Zoom</span>
            <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))} className="p-1 text-jewel-muted hover:text-jewel-dark">
              <ZoomOut size={16} />
            </button>
            <input
              type="range" min={1} max={3} step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-rose-gold h-1.5 rounded-full cursor-pointer"
            />
            <button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))} className="p-1 text-jewel-muted hover:text-jewel-dark">
              <ZoomIn size={16} />
            </button>
            <span className="text-xs text-jewel-muted w-8 text-right">{zoom.toFixed(1)}×</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5 justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-jewel-muted hover:bg-gray-50 transition-colors"
          >
            Skip (use original)
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex items-center gap-2 px-5 py-2 bg-rose-gold text-white rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors disabled:opacity-60"
          >
            {processing && <Loader2 size={14} className="animate-spin" />}
            {processing ? 'Processing…' : 'Crop & Use'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main MediaUpload component ────────────────────────────────────────────────
/**
 * Multi-file media uploader with drag-and-drop and image crop support.
 * Props:
 *   existingMedia: [{type, url}]  — already-uploaded media to show initially
 *   onUpdate(mediaArray)           — called whenever the final media list changes
 *   path: string                   — storage path prefix e.g. "products"
 */
export default function MediaUpload({ existingMedia = [], onUpdate, path = 'uploads' }) {
  const [files, setFiles] = useState([]) // { id, file, objectUrl, type, status, progress, url, isMov }
  const [uploadedMedia, setUploadedMedia] = useState(existingMedia)
  const [dragOver, setDragOver] = useState(false)
  const [cropQueue, setCropQueue] = useState([]) // [{file, objectUrl}] — images awaiting crop
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef(null)

  const uploadedMediaRef = useRef(uploadedMedia)
  uploadedMediaRef.current = uploadedMedia

  const generateId = () => Math.random().toString(36).slice(2)

  // Build a file entry ready for the upload queue
  const makeEntry = (file, objectUrl) => ({
    id: generateId(),
    file,
    objectUrl,
    type: file.type.startsWith('video') ? 'video' : 'image',
    isMov: isMov(file),
    status: 'pending',
    progress: 0,
    url: null,
  })

  const addFiles = useCallback((newFiles) => {
    const images = []
    const videos = []

    Array.from(newFiles).forEach((file) => {
      if (file.type.startsWith('video') || isMov(file)) {
        videos.push(makeEntry(file, URL.createObjectURL(file)))
      } else {
        images.push({ file, objectUrl: URL.createObjectURL(file) })
      }
    })

    // Videos skip cropping — add directly
    if (videos.length) setFiles((prev) => [...prev, ...videos])
    // Images go into the crop queue
    if (images.length) setCropQueue((prev) => [...prev, ...images])
  }, [])

  // After crop confirmed — use the cropped file
  const handleCropConfirm = (croppedFile, originalObjectUrl) => {
    URL.revokeObjectURL(originalObjectUrl)
    const croppedObjectUrl = URL.createObjectURL(croppedFile)
    setFiles((prev) => [...prev, makeEntry(croppedFile, croppedObjectUrl)])
    setCropQueue((prev) => prev.slice(1))
  }

  // Skip crop — use original file as-is
  const handleCropSkip = (originalObjectUrl, originalFile) => {
    setFiles((prev) => [...prev, makeEntry(originalFile, originalObjectUrl)])
    setCropQueue((prev) => prev.slice(1))
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  const handleFileInput = (e) => {
    if (e.target.files.length) addFiles(e.target.files)
    e.target.value = ''
  }

  const removeFile = (id) => {
    setFiles((prev) => {
      const entry = prev.find((f) => f.id === id)
      if (entry?.objectUrl) URL.revokeObjectURL(entry.objectUrl)
      const next = prev.filter((f) => f.id !== id)
      const done = next.filter((f) => f.status === 'done').map((f) => ({ type: f.type, url: f.url }))
      onUpdate?.([...uploadedMediaRef.current, ...done])
      return next
    })
  }

  const removeExisting = (index) => {
    const updated = uploadedMedia.filter((_, i) => i !== index)
    setUploadedMedia(updated)
    uploadedMediaRef.current = updated
    const done = files.filter((f) => f.status === 'done').map((f) => ({ type: f.type, url: f.url }))
    onUpdate?.([...updated, ...done])
  }

  const deleteFromStorage = async (index) => {
    const item = uploadedMedia[index]
    setDeleting(true)
    try {
      await deleteMedia(item.url)
      removeExisting(index)
      toast.success('File deleted from storage')
    } catch (err) {
      if (err.code === 'storage/object-not-found') {
        removeExisting(index)
        toast.success('Removed (file was already deleted from storage)')
      } else {
        toast.error('Failed to delete: ' + err.message)
      }
    } finally {
      setDeleting(false)
      setConfirmDeleteIdx(null)
    }
  }

  const runUpload = async (entry) => {
    setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: 'uploading', progress: 0 } : f))
    const ext = entry.file.name.split('.').pop()
    const storagePath = `${path}/${Date.now()}_${generateId()}.${ext}`
    const url = await uploadMedia(entry.file, storagePath, (progress) => {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, progress } : f))
    })
    setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: 'done', progress: 100, url } : f))
    return { type: entry.type, url }
  }

  const uploadFile = async (entry) => {
    try {
      const result = await runUpload(entry)
      setFiles((prev) => {
        const alreadyDone = prev
          .filter((f) => f.id !== entry.id && f.status === 'done')
          .map((f) => ({ type: f.type, url: f.url }))
        onUpdate?.([...uploadedMediaRef.current, ...alreadyDone, result])
        return prev
      })
      toast.success('File uploaded')
    } catch (err) {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: 'error' } : f))
      toast.error('Upload failed: ' + err.message)
    }
  }

  const uploadAll = async () => {
    const pending = files.filter((f) => f.status === 'pending')
    if (!pending.length) return
    const results = await Promise.allSettled(
      pending.map(async (entry) => {
        try { return await runUpload(entry) }
        catch (err) {
          setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: 'error' } : f))
          toast.error(`Failed: ${entry.file.name}`)
          return null
        }
      })
    )
    const newlyUploaded = results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value)
    const alreadyDone = files.filter((f) => f.status === 'done').map((f) => ({ type: f.type, url: f.url }))
    onUpdate?.([...uploadedMediaRef.current, ...alreadyDone, ...newlyUploaded])
    if (newlyUploaded.length) toast.success(`${newlyUploaded.length} file${newlyUploaded.length > 1 ? 's' : ''} uploaded`)
  }

  const hasPending = files.some((f) => f.status === 'pending')

  return (
    <div className="space-y-4">
      {/* Crop modal — shown for each queued image one at a time */}
      {cropQueue.length > 0 && (
        <ImageCropModal
          file={cropQueue[0].file}
          objectUrl={cropQueue[0].objectUrl}
          queueRemaining={cropQueue.length - 1}
          onConfirm={(croppedFile) => handleCropConfirm(croppedFile, cropQueue[0].objectUrl)}
          onSkip={() => handleCropSkip(cropQueue[0].objectUrl, cropQueue[0].file)}
        />
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-rose-gold bg-blush/30' : 'border-gray-200 hover:border-rose-gold hover:bg-ivory'
        }`}
      >
        <Upload className="mx-auto mb-2 text-jewel-muted" size={28} />
        <p className="text-sm font-medium text-jewel-dark">Drag &amp; drop images or videos here</p>
        <p className="text-xs text-jewel-muted mt-1">or click to browse · Images open a crop tool first</p>
        <p className="text-xs text-amber-600 mt-1">
          Videos: use <strong>.mp4</strong> or <strong>.webm</strong> — .mov won't play in Chrome
        </p>
        <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileInput} />
      </div>

      {/* Saved (already-uploaded) media */}
      {uploadedMedia.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-jewel-muted uppercase tracking-wide mb-2">Saved Media</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {uploadedMedia.map((m, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                {m.type === 'video'
                  ? <video src={m.url} className="w-full h-full object-cover" muted />
                  : <img src={m.url} alt="" className="w-full h-full object-cover" />}

                {confirmDeleteIdx === i ? (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1.5 p-1">
                    <p className="text-white text-[10px] text-center leading-tight font-medium">Delete from Storage?</p>
                    <div className="flex gap-1">
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteFromStorage(i) }} disabled={deleting}
                        className="px-2 py-1 bg-red-500 rounded text-white text-[10px] font-semibold hover:bg-red-600 disabled:opacity-60">
                        {deleting ? '…' : 'Yes, Delete'}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDeleteIdx(null) }}
                        className="px-2 py-1 bg-gray-500 rounded text-white text-[10px] font-semibold hover:bg-gray-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeExisting(i) }}
                      title="Remove from product (keeps file in storage)"
                      className="p-1.5 bg-gray-700 rounded-full text-white hover:bg-gray-800">
                      <X size={13} />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDeleteIdx(i) }}
                      title="Delete permanently from Firebase Storage"
                      className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}

                <span className="absolute bottom-1 left-1 bg-black/60 rounded text-white p-0.5">
                  {m.type === 'video' ? <Film size={10} /> : <Image size={10} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newly added files */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-jewel-muted uppercase tracking-wide">New Files ({files.length})</p>
            {hasPending && (
              <button type="button" onClick={uploadAll}
                className="flex items-center gap-1 text-xs bg-rose-gold text-white px-3 py-1.5 rounded-lg hover:bg-rose-gold/90 transition-colors">
                <Upload size={12} /> Upload All
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {files.map((entry) => (
              <div key={entry.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                {entry.type === 'video'
                  ? <video src={entry.objectUrl} className="w-full h-full object-cover" muted />
                  : <img src={entry.objectUrl} alt="" className="w-full h-full object-cover" />}

                {entry.isMov && entry.status === 'pending' && (
                  <div className="absolute inset-x-0 bottom-0 bg-amber-500/90 px-1 py-0.5 flex items-center gap-0.5">
                    <AlertTriangle size={9} className="text-white flex-shrink-0" />
                    <span className="text-white text-[9px] leading-tight">Use .mp4 for Chrome</span>
                  </div>
                )}

                {entry.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <Loader2 size={18} className="text-white animate-spin mb-1" />
                    <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${entry.progress}%` }} />
                    </div>
                    <span className="text-white text-xs mt-1">{entry.progress}%</span>
                  </div>
                )}

                {entry.status === 'done' && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                )}

                {entry.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-600 text-xs font-medium">Error</span>
                  </div>
                )}

                {entry.status === 'pending' && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); uploadFile(entry) }}
                      className="p-1 bg-rose-gold rounded-full text-white" title="Upload">
                      <Upload size={12} />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(entry.id) }}
                      className="p-1 bg-red-500 rounded-full text-white" title="Remove">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {entry.status !== 'uploading' && entry.status !== 'pending' && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(entry.id) }}
                    className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                )}

                <span className="absolute bottom-1 left-1 bg-black/60 rounded text-white p-0.5">
                  {entry.type === 'video' ? <Film size={10} /> : <Image size={10} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
