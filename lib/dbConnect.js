import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables')
    console.error('❌ Please set MONGODB_URI in .env.local or deployment platform')
    console.error('❌ Get MongoDB URI from: https://cloud.mongodb.com')
    throw new Error('MONGODB_URI environment variable is required')
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully')
      return mongoose
    }).catch((e) => {
      console.error('❌ MongoDB connection failed:', e.message)
      console.error('❌ Check: 1) MONGODB_URI is correct, 2) IP whitelist in MongoDB Atlas (0.0.0.0/0), 3) Network connectivity')
      throw e
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default dbConnect
