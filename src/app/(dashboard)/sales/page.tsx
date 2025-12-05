'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Material = {
  id: string
  name: string
  unit: string
  stockQuantity: number
  packageSize: number
  group: {
    id: string
    name: string
  }
}

type Client = {
  id: string
  firstName: string
  lastName: string
  phone: string
  avatar: string | null
}

type CartItem = {
  material: Material
  quantity: number
}

export default function SalesPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [note, setNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  useEffect(() => {
    loadMaterials()
    loadClients()
  }, [])

  const loadMaterials = async () => {
    try {
      const response = await fetch('/api/materials')
      if (response.ok) {
        const data = await response.json()
        setMaterials(data)
      }
    } catch (error) {
      console.error('Failed to load materials:', error)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredClients = clients.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  )

  const addToCart = (material: Material) => {
    const existing = cart.find(item => item.material.id === material.id)
    if (existing) {
      setCart(cart.map(item =>
        item.material.id === material.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { material, quantity: 1 }])
    }
    setSearchQuery('')
  }

  const updateQuantity = (materialId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.material.id !== materialId))
    } else {
      setCart(cart.map(item =>
        item.material.id === materialId
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const removeFromCart = (materialId: string) => {
    setCart(cart.filter(item => item.material.id !== materialId))
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const processSale = async () => {
    if (cart.length === 0) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            materialId: item.material.id,
            quantity: item.quantity
          })),
          clientId: selectedClient?.id || null,
          note: note || null
        })
      })

      if (response.ok) {
        // Reset form
        setCart([])
        setNote('')
        setSelectedClient(null)
        setClientSearch('')
        alert('Prodej byl úspěšně zaznamenán!')
        loadMaterials() // Reload to update stock
      } else {
        const error = await response.json()
        alert(error.error || 'Chyba při zpracování prodeje')
      }
    } catch (error) {
      console.error('Sale error:', error)
      alert('Chyba při zpracování prodeje')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Prodej produktů
          </h1>
          <p className="text-gray-600">
            Prodej produktů registrovaným klientům nebo anonymním zákazníkům
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Product selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Client search */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Zákazník</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Vyhledat klienta (nebo nechte prázdné pro anonymní prodej)..."
                  value={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value)
                    setSelectedClient(null)
                    setShowClientDropdown(true)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {selectedClient && (
                  <button
                    onClick={() => {
                      setSelectedClient(null)
                      setClientSearch('')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
                
                {showClientDropdown && clientSearch && !selectedClient && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client)
                          setClientSearch('')
                          setShowClientDropdown(false)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
                          {client.avatar || `${client.firstName[0]}${client.lastName[0]}`}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{client.phone}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedClient && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
                    {selectedClient.avatar || `${selectedClient.firstName[0]}${selectedClient.lastName[0]}`}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{selectedClient.phone}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Product search */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Produkty</h2>
              <input
                type="text"
                placeholder="Vyhledat produkt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              />
              
              {searchQuery && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredMaterials.map(material => (
                    <button
                      key={material.id}
                      onClick={() => addToCart(material)}
                      disabled={material.stockQuantity <= 0}
                      className="w-full p-4 text-left rounded-xl border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{material.name}</div>
                          <div className="text-sm text-gray-600">{material.group.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Sklad: {material.stockQuantity} {material.unit}
                            {material.stockQuantity <= 0 && (
                              <span className="ml-2 text-red-600 font-medium">Není skladem</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg">
                          Přidat
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredMaterials.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Žádný produkt nenalezen
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Cart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 h-fit sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Košík ({getTotalItems()} {getTotalItems() === 1 ? 'produkt' : getTotalItems() < 5 ? 'produkty' : 'produktů'})
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🛒</div>
                <div>Košík je prázdný</div>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.material.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{item.material.name}</div>
                          <div className="text-xs text-gray-600">{item.material.group.name}</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.material.id)}
                          className="text-red-600 hover:text-red-700 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.material.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.material.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center text-sm"
                          min="1"
                        />
                        <span className="text-sm text-gray-600">{item.material.unit}</span>
                        <button
                          onClick={() => updateQuantity(item.material.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poznámka (volitelné)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Interní poznámka k prodeji..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={processSale}
                    disabled={isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Zpracovávám...' : 'Dokončit prodej'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
