import { createContext, useContext, useState, useCallback } from 'react'

const TEST_MODE_KEY = 'qj_test_mode'

const TestModeContext = createContext({ isTestMode: false, toggleTestMode: () => {} })

export function TestModeProvider({ children }) {
  const [isTestMode, setIsTestMode] = useState(
    () => localStorage.getItem(TEST_MODE_KEY) === '1'
  )

  const toggleTestMode = useCallback((val) => {
    const next = val !== undefined ? val : !isTestMode
    setIsTestMode(next)
    if (next) localStorage.setItem(TEST_MODE_KEY, '1')
    else localStorage.removeItem(TEST_MODE_KEY)
  }, [isTestMode])

  return (
    <TestModeContext.Provider value={{ isTestMode, toggleTestMode }}>
      {children}
    </TestModeContext.Provider>
  )
}

export const useTestMode = () => useContext(TestModeContext)
