import { Toaster } from 'react-hot-toast'

/**
 * Pre-configured Toaster — mount once at the app root.
 * Success icon is styled in rose-gold; position is top-center.
 */
export default function Toast() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#FDF6F0',
          color: '#2C1A1D',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(44, 26, 29, 0.12)',
          fontSize: '14px',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#B76E79',
            secondary: '#FDF6F0',
          },
        },
        error: {
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
        },
      }}
    />
  )
}
