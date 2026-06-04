import { createContext, useContext, useEffect, useState } from 'react'
import { signInAdminWithEmail, signOutUser, onAuthChange } from '../firebase/auth'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      // Admin users authenticate with email; phone users have no email
      if (firebaseUser && firebaseUser.email) {
        setAdminUser(firebaseUser)
      } else {
        setAdminUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInAdmin = async (email, password) => {
    const credential = await signInAdminWithEmail(email, password)
    setAdminUser(credential.user)
    return credential
  }

  const signOutAdmin = async () => {
    await signOutUser()
    setAdminUser(null)
  }

  const value = {
    adminUser,
    loading,
    isAdmin: !!adminUser,
    signInAdmin,
    signOutAdmin,
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  return ctx
}
