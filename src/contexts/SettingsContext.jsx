import { createContext, useContext, useEffect, useState } from 'react'
import { getSettings } from '../firebase/firestore'

const SettingsContext = createContext({ comingSoon: false, loading: true })

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <SettingsContext.Provider value={{ ...settings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
