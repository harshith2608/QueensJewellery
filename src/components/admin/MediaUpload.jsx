import { useState, useRef, useCallback } from 'react'
import { Upload, X, Film, Image, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { uploadMedia } from '../../firebase/storage'
import toast from 'react-hot-toast'

// Formats Chrome / Firefox can actually play
const BROWSER_UNSUPPORTED_VIDEO = ['mov', 'quicktime']

function isMov(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext === 'mov' || file.type === 'video/quicktime'
}

/**
 * Multi-file media uploader with drag-and-drop support.
 * Props:
 *   existingMedia: [{type, url}]  — already-uploaded media to show initially
 *   onUpdate(mediaArray)           — called whenever the final media list changes
 *   path: string                   — storage path prefix e.g. "products"
 */
export default function MediaUpload({ existingMedia = [], onUpdate, path = 'uploads' }) {
  const [files, setFiles] = useState([]) // { id, file, objectUrl, type, status, progress, url, isMov }
  const [uploadedMedia, setUploadedMedia] = useState(existingMedia)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  // Keep a ref so async callbacks can read the latest uploadedMedia without stale closure
  const uploadedMediaRef = useRef(uploadedMedia)
  uploadedMediaRef.current = uploadedMedia

  const generateId = () => Math.random().toString(36).slice(2)

  const addFiles = useCallback((newFiles) => {
    const entries = Array.from(newFiles).map((file) => ({
      id: generateId(),
      file,
      objectUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
      isMov: isMov(file),
      status: 'pending',
      progress: 0,
      url: null,
    }))
    setFiles((prev) => [...prev, ...entries])
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const dt = e.dataTransfer
      if (dt.files.length) addFiles(dt.files)
    },
    [addFiles]
  )

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
      // Notify parent of remaining done files
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

  // Core upload logic — returns { type, url } on success, throws on failure
  const runUpload = async (entry) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading', progress: 0 } : f))
    )

    const ext = entry.file.name.split('.').pop()
    const storagePath = `${path}/${Date.now()}_${generateId()}.${ext}`

    const url = await uploadMedia(entry.file, storagePath, (progress) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, progress } : f))
      )
    })

    setFiles((prev) =>
      prev.map((f) =>
        f.id === entry.id ? { ...f, status: 'done', progress: 100, url } : f
      )
    )

    return { type: entry.type, url }
  }

  // Single file upload (via individual Upload button)
  const uploadFile = async (entry) => {
    try {
      const result = await runUpload(entry)
      // Read the latest files state via functional updater to avoid stale closure
      setFiles((prev) => {
        const alreadyDone = prev
          .filter((f) => f.id !== entry.id && f.status === 'done')
          .map((f) => ({ type: f.type, url: f.url }))
        onUpdate?.([...uploadedMediaRef.current, ...alreadyDone, result])
        return prev
      })
      toast.success('File uploaded')
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'error' } : f))
      )
      toast.error('Upload failed: ' + err.message)
    }
  }

  // Upload all pending files — collects all results then calls onUpdate ONCE
  const uploadAll = async () => {
    const pending = files.filter((f) => f.status === 'pending')
    if (pending.length === 0) return

    const results = await Promise.allSettled(
      pending.map(async (entry) => {
        try {
          return await runUpload(entry)
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) => (f.id === entry.id ? { ...f, status: 'error' } : f))
          )
          toast.error(`Failed: ${entry.file.name}`)
          return null
        }
      })
    )

    const newlyUploaded = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value)

    // Also include any files that were already done before this batch
    const alreadyDone = files
      .filter((f) => f.status === 'done')
      .map((f) => ({ type: f.type, url: f.url }))

    // Call onUpdate exactly once with the complete final list
    onUpdate?.([...uploadedMediaRef.current, ...alreadyDone, ...newlyUploaded])

    if (newlyUploaded.length > 0) {
      toast.success(`${newlyUploaded.length} file${newlyUploaded.length > 1 ? 's' : ''} uploaded`)
    }
  }

  const hasPending = files.some((f) => f.status === 'pending')

  return (
    <div className="space-y-4">
      {/* Drag-and-drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-rose-gold bg-blush/30'
            : 'border-gray-200 hover:border-rose-gold hover:bg-ivory'
        }`}
      >
        <Upload className="mx-auto mb-2 text-jewel-muted" size={28} />
        <p className="text-sm font-medium text-jewel-dark">
          Drag &amp; drop images or videos here
        </p>
        <p className="text-xs text-jewel-muted mt-1">or click to browse</p>
        <p className="text-xs text-amber-600 mt-1">
          Videos: use <strong>.mp4</strong> or <strong>.webm</strong> — .mov (QuickTime) won't play in Chrome
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Existing uploaded media */}
      {uploadedMedia.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-jewel-muted uppercase tracking-wide mb-2">
            Saved Media
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {uploadedMedia.map((m, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                {m.type === 'video' ? (
                  <video src={m.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeExisting(i) }}
                    className="p-1 bg-red-500 rounded-full text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
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
            <p className="text-xs font-semibold text-jewel-muted uppercase tracking-wide">
              New Files ({files.length})
            </p>
            {hasPending && (
              <button
                type="button"
                onClick={uploadAll}
                className="flex items-center gap-1 text-xs bg-rose-gold text-white px-3 py-1.5 rounded-lg hover:bg-rose-gold/90 transition-colors"
              >
                <Upload size={12} />
                Upload All
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {files.map((entry) => (
              <div key={entry.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                {entry.type === 'video' ? (
                  <video src={entry.objectUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={entry.objectUrl} alt="" className="w-full h-full object-cover" />
                )}

                {/* .mov warning overlay */}
                {entry.isMov && entry.status === 'pending' && (
                  <div className="absolute inset-x-0 bottom-0 bg-amber-500/90 px-1 py-0.5 flex items-center gap-0.5">
                    <AlertTriangle size={9} className="text-white flex-shrink-0" />
                    <span className="text-white text-[9px] leading-tight">Use .mp4 for Chrome</span>
                  </div>
                )}

                {/* Uploading */}
                {entry.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <Loader2 size={18} className="text-white animate-spin mb-1" />
                    <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${entry.progress}%` }}
                      />
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

                {/* Pending actions */}
                {entry.status === 'pending' && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); uploadFile(entry) }}
                      className="p-1 bg-rose-gold rounded-full text-white"
                      title="Upload"
                    >
                      <Upload size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(entry.id) }}
                      className="p-1 bg-red-500 rounded-full text-white"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Remove button for done/error */}
                {entry.status !== 'uploading' && entry.status !== 'pending' && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(entry.id) }}
                    className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
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
