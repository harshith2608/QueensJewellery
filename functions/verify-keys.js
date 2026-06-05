// Run: node functions/verify-keys.js KEY_ID KEY_SECRET
const Razorpay = require('./node_modules/razorpay')

const [,, keyId, keySecret] = process.argv

if (!keyId || !keySecret) {
  console.log('Usage: node functions/verify-keys.js rzp_test_XXXX YOUR_SECRET')
  process.exit(1)
}

console.log(`Testing Key ID: ${keyId}`)
console.log(`Testing Key Secret: ${keySecret.slice(0, 4)}${'*'.repeat(keySecret.length - 4)}`)

const rzp = new Razorpay({ key_id: keyId.trim(), key_secret: keySecret.trim() })

rzp.orders.all({ count: 1 })
  .then(() => {
    console.log('✅ Keys are VALID — this pair works!')
    console.log('\nRun these to save them:')
    console.log(`printf "${keyId}" | firebase functions:secrets:set RAZORPAY_KEY_ID`)
    console.log(`printf "${keySecret}" | firebase functions:secrets:set RAZORPAY_KEY_SECRET`)
  })
  .catch(e => {
    console.log('❌ Keys INVALID:', e.error?.description || e.message)
    console.log('Make sure both values are from the same Razorpay key generation.')
  })
