import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithPhone as firebaseSignInWithPhone,
  verifyOTP as firebaseVerifyOTP,
  signOutUser,
  onAuthChange,
} from '../firebase/auth'
import { getOrCreateUser } from '../firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const data = await getOrCreateUser(
            firebaseUser.uid,
            firebaseUser.phoneNumber || ''
          )
          setUserData(data)
        } catch (err) {
          console.error('Failed to sync user data:', err)
          setUserData(null)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Holds the ConfirmationResult from signInWithPhoneNumber so verifyOTP can use it
  const [confirmationResult, setConfirmationResult] = useState(null)

  const signInWithPhone = async (phoneNumber, appVerifier) => {
    const result = await firebaseSignInWithPhone(phoneNumber, appVerifier)
    setConfirmationResult(result)
    return result
  }

  const verifyOTP = async (otp) => {
    if (!confirmationResult) throw new Error('No OTP confirmation in progress')
    const credential = await firebaseVerifyOTP(confirmationResult, otp)
    setConfirmationResult(null)
    return credential
  }

  const signOut = async () => {
    await signOutUser()
    setUser(null)
    setUserData(null)
  }

  const value = {
    user,
    userData,
    loading,
    // Only treat as customer-authenticated if signed in with phone (not admin email)
    isAuthenticated: !!user && !!user.phoneNumber,
    signInWithPhone,
    verifyOTP,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
