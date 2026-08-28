import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', '..', 'dist')

const app = express()
const port = Number(process.env.PORT || 3001)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shady_store'

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  thumbnail: { type: String, default: '' },
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

function serializeProduct(product) {
  return {
    id: product._id.toString(),
    title: product.title,
    price: product.price,
    category: product.category,
    thumbnail: product.thumbnail,
  }
}

function validateProduct(body) {
  const { title, price, category, thumbnail = '' } = body
  if (!title || !category || price === undefined || Number.isNaN(Number(price)) || Number(price) < 0) {
    return null
  }
  return { title: String(title), price: Number(price), category: String(category), thumbnail: String(thumbnail) }
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))

app.get('/api/products', async (_request, response, next) => {
  try { response.json((await Product.find().sort({ createdAt: -1 })).map(serializeProduct)) } catch (error) { next(error) }
})

app.post('/api/products', async (request, response, next) => {
  try {
    const data = validateProduct(request.body)
    if (!data) return response.status(400).json({ error: 'title, price and category are required' })
    response.status(201).json(serializeProduct(await Product.create(data)))
  } catch (error) { next(error) }
})

app.put('/api/products/:id', async (request, response, next) => {
  try {
    const data = validateProduct(request.body)
    if (!data) return response.status(400).json({ error: 'title, price and category are required' })
    const product = await Product.findByIdAndUpdate(request.params.id, data, { new: true, runValidators: true })
    if (!product) return response.status(404).json({ error: 'Product not found' })
    response.json(serializeProduct(product))
  } catch (error) { next(error) }
})

app.delete('/api/products/:id', async (request, response, next) => {
  try {
    const product = await Product.findByIdAndDelete(request.params.id)
    if (!product) return response.status(404).json({ error: 'Product not found' })
    response.status(204).end()
  } catch (error) { next(error) }
})

app.use(express.static(distDir))

app.get(/^(?!\/api).*/, (_request, response, next) => {
  response.sendFile(path.join(distDir, 'index.html'), (error) => { if (error) next(error) })
})

app.use((error, _request, response, _next) => {
  if (error instanceof mongoose.Error.CastError) return response.status(400).json({ error: 'Invalid product id' })
  console.error(error)
  response.status(500).json({ error: 'Internal server error' })
})

const seedProducts = [
  { title: 'The Eminem Show Tee', price: 34.99, category: 'Apparel', thumbnail: '' },
  { title: 'Slim Shady LP Vinyl', price: 42.5, category: 'Music', thumbnail: '' },
  { title: 'Marshall Mathers Hoodie', price: 64.9, category: 'Apparel', thumbnail: '' },
  { title: 'Eminem Varsity Cap', price: 28, category: 'Accessories', thumbnail: '' },
]

async function start() {
  await mongoose.connect(mongoUri)
  if (process.env.SEED_DATABASE === 'true' && await Product.countDocuments() === 0) await Product.insertMany(seedProducts)
  app.listen(port, () => console.log(`API running on port ${port}`))
}

start().catch((error) => { console.error('Could not connect to MongoDB', error); process.exit(1) })
