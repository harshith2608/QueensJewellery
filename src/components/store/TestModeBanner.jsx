import { useTestMode } from '../../contexts/TestModeContext.jsx'

export default function TestModeBanner() {
  const { isTestMode, toggleTestMode } = useTestMode()
  if (!isTestMode) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border-2 border-amber-300 animate-pulse-slow whitespace-nowrap">
      <span className="w-2 h-2 rounded-full bg-white inline-block" />
      TEST MODE ACTIVE — orders won't appear in live admin
      <button
        onClick={() => toggleTestMode(false)}
        className="ml-1 underline font-medium hover:no-underline"
      >
        Exit
      </button>
    </div>
  )
}
