import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { app } from './config'

const functions = getFunctions(app, 'asia-south1') // Mumbai region — lowest latency for India

// Uncomment during local development with emulator:
// if (location.hostname === 'localhost') {
//   connectFunctionsEmulator(functions, 'localhost', 5001)
// }

export const createRazorpayOrderFn = httpsCallable(functions, 'createRazorpayOrder')
export const verifyRazorpayPaymentFn = httpsCallable(functions, 'verifyRazorpayPayment')
export const processRazorpayRefundFn = httpsCallable(functions, 'processRazorpayRefund')
