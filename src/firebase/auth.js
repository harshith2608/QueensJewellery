import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './config'

/**
 * Start phone OTP sign-in flow.
 * @param {string} phoneNumber - E.164 format, e.g. "+919876543210"
 * @param {import('firebase/auth').ApplicationVerifier} appVerifier - reCAPTCHA verifier instance
 * @returns {Promise<import('firebase/auth').ConfirmationResult>}
 */
export const signInWithPhone = (phoneNumber, appVerifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier)
}

/**
 * Confirm OTP code returned by signInWithPhone.
 * @param {import('firebase/auth').ConfirmationResult} confirmationResult
 * @param {string} otp - 6-digit code entered by the user
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const verifyOTP = (confirmationResult, otp) => {
  return confirmationResult.confirm(otp)
}

/**
 * Sign in an admin user with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const signInAdminWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Sign out the currently authenticated user.
 * @returns {Promise<void>}
 */
export const signOutUser = () => {
  return signOut(auth)
}

/**
 * Subscribe to authentication state changes.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {import('firebase/auth').Unsubscribe} - call to stop listening
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}
