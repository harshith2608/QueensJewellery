import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

/**
 * Accessible modal dialog built on @headlessui/react.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   children: React.ReactNode,
 *   size?: 'sm'|'md'|'lg'
 * }} props
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizeClass = sizeClasses[size] ?? sizeClasses.md

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-[closed]:opacity-0"
      />

      {/* Panel container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={[
            'w-full bg-ivory rounded-2xl shadow-xl',
            'max-h-[90vh] overflow-y-auto',
            'transition-all duration-200',
            'data-[closed]:opacity-0 data-[closed]:scale-95',
            sizeClass,
          ].join(' ')}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-blush">
              <DialogTitle className="text-lg font-semibold text-jewel-dark">
                {title}
              </DialogTitle>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-jewel-dark/60 hover:text-jewel-dark hover:bg-blush/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5">{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
