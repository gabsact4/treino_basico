import { useEffect, useState, type FormEvent } from 'react'
import eminem from './assets/eminem.jpg'
import './App.css'

type Product = { id: string; title: string; price: number; category: string; thumbnail: string }
type ProductForm = Omit<Product, 'id'>

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/products'
const emptyForm: ProductForm = { title: '', price: 0, category: 'Merch', thumbnail: '' }
const fallbackProducts: Product[] = [
  { id: 'local-1', title: 'The Eminem Show Tee', price: 34.99, category: 'Apparel', thumbnail: eminem },
  { id: 'local-2', title: 'Slim Shady LP Vinyl', price: 42.5, category: 'Music', thumbnail: eminem },
  { id: 'local-3', title: 'Marshall Mathers Hoodie', price: 64.9, category: 'Apparel', thumbnail: eminem },
  { id: 'local-4', title: 'Eminem Varsity Cap', price: 28, category: 'Accessories', thumbnail: eminem },
]

async function requestApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) throw new Error('API request failed')
  return response.json() as Promise<T>
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    requestApi<Product[]>(API_URL)
      .then((apiProducts) => setProducts(apiProducts))
      .catch(() => { setProducts(fallbackProducts); setNotice('API indisponivel: exibindo catalogo local.') })
      .finally(() => setLoading(false))
  }, [])

  function updateField(field: keyof ProductForm, value: string) {
    setForm((current) => ({ ...current, [field]: field === 'price' ? Number(value) : value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setNotice('')
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `${API_URL}/${editingId}` : API_URL
    try {
      const saved = await requestApi<Product>(url, { method, body: JSON.stringify(form) })
      const product = { ...form, id: editingId ?? saved.id }
      setProducts((current) => editingId ? current.map((item) => item.id === editingId ? product : item) : [product, ...current])
      resetForm(); setNotice(editingId ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.')
    } catch { setNotice('Nao foi possivel salvar. Tente novamente.') } finally { setSaving(false) }
  }

  async function removeProduct(id: string) {
    try {
      await requestApi(`${API_URL}/${id}`, { method: 'DELETE' })
      setProducts((current) => current.filter((product) => product.id !== id))
      if (editingId === id) resetForm()
      setNotice('Produto removido do catalogo.')
    } catch { setNotice('Nao foi possivel remover o produto.') }
  }

  function startEditing(product: Product) {
    setEditingId(product.id); setForm({ title: product.title, price: product.price, category: product.category, thumbnail: product.thumbnail })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() { setEditingId(null); setForm(emptyForm) }

  return (
    <main className="store-shell">
      <nav className="topbar"><a className="brand" href="#top">SHADY<span>.</span></a><div className="nav-links"><a href="#catalog">Catalogo</a><a href="#manage">Gerenciar</a><span className="status-dot">API online</span></div></nav>
      <section className="hero-section" id="top"><div className="hero-copy"><p className="eyebrow">EST. 1999 / OFFICIAL MERCH</p><h1>THE REAL<br /><em>SLIM SHADY</em><br />STORE.</h1><p className="hero-text">Pecas raras, discos classicos e a atitude que nunca saiu de moda.</p><a className="primary-button" href="#catalog">Explorar catalogo <span>↘</span></a></div><div className="hero-image"><img src={eminem} alt="Eminem" /><span className="hero-stamp">MM<br /><small>STUDIO<br />COLLECTION</small></span></div></section>
      <section className="workspace" id="manage"><div className="section-heading"><div><p className="eyebrow">01 / INVENTARIO</p><h2>{editingId ? 'Editar produto' : 'Adicionar produto'}</h2></div><p className="api-label">CRUD conectado<br /><strong>dummyjson.com</strong></p></div><form className="product-form" onSubmit={handleSubmit}><label>Nome do produto<input required value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Ex: Encore Tour Tee" /></label><label>Categoria<select value={form.category} onChange={(event) => updateField('category', event.target.value)}><option>Merch</option><option>Apparel</option><option>Music</option><option>Accessories</option></select></label><label>Preco<input required min="0" step="0.01" type="number" value={form.price || ''} onChange={(event) => updateField('price', event.target.value)} placeholder="0.00" /></label><label>URL da imagem<input value={form.thumbnail} onChange={(event) => updateField('thumbnail', event.target.value)} placeholder="https://..." /></label><div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Salvando...' : editingId ? 'Salvar alteracoes' : 'Criar produto'} <span>↗</span></button>{editingId && <button className="text-button" type="button" onClick={resetForm}>Cancelar</button>}</div></form>{notice && <p className="notice">{notice}</p>}</section>
      <section className="catalog-section" id="catalog"><div className="section-heading"><div><p className="eyebrow">02 / DROP ATUAL</p><h2>Catalogo selecionado</h2></div><p className="catalog-count">{products.length} itens<br /><strong>disponiveis agora</strong></p></div>{loading ? <p className="loading">Carregando inventario...</p> : <div className="product-grid">{products.map((product, index) => <article className="product-card" key={product.id}><div className="product-image"><img src={product.thumbnail || eminem} alt={product.title} /><span className="product-number">0{index + 1}</span></div><div className="product-info"><p className="category">{product.category}</p><h3>{product.title}</h3><div className="product-bottom"><strong>${product.price.toFixed(2)}</strong><div><button className="edit-button" type="button" onClick={() => startEditing(product)}>Editar</button><button className="delete-button" type="button" onClick={() => removeProduct(product.id)}>Excluir</button></div></div></div></article>)}</div>}</section>
      <footer><span>SHADY.STORE</span><span>MADE FOR THE REAL ONES</span><span>API / REACT / CRUD</span></footer>
    </main>
  )
}

export default App
