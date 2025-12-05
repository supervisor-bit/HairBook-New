'use client'

import { useState, useEffect } from 'react'

type Material = {
  id: string
  name: string
  unit: string
  stockQuantity: number
  packageSize: number
  minStock: number
  isRetailProduct: boolean
  group: {
    id: string
    name: string
  }
}

type MaterialGroup = {
  id: string
  name: string
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

type SaleMovement = {
  id: string
  createdAt: string
  quantity: number
  note: string | null
  type: string
  totalPrice?: number | null
  client: {
    id: string
    firstName: string
    lastName: string
  } | null
  material: {
    id: string
    name: string
    unit: string
    packageSize: number
  }
}

type Sale = {
  id: string
  createdAt: string
  note: string | null
  type: string
  totalPrice?: number | null
  client: {
    id: string
    firstName: string
    lastName: string
  } | null
  movements: SaleMovement[]
}

export default function SalesPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [note, setNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [transactionType, setTransactionType] = useState<'sale' | 'usage'>('sale')
  const [totalPrice, setTotalPrice] = useState('')

  useEffect(() => {
    loadMaterials()
    loadMaterialGroups()
    loadClients()
    loadSales()
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

  const loadMaterialGroups = async () => {
    try {
      const response = await fetch('/api/material-groups')
      if (response.ok) {
        const data = await response.json()
        setMaterialGroups(data)
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
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

  const loadSales = async () => {
    try {
      const response = await fetch('/api/sales')
      if (response.ok) {
        const movements: SaleMovement[] = await response.json()
        
        // Group movements by createdAt (rounded to second) and clientId
        const grouped = movements.reduce((acc: Record<string, Sale>, movement) => {
          // Round timestamp to the nearest second to group transactions
          const timestamp = new Date(movement.createdAt).getTime()
          const roundedTime = Math.floor(timestamp / 1000) * 1000
          const key = `${roundedTime}_${movement.client?.id || 'anonymous'}`
          
          if (!acc[key]) {
            acc[key] = {
              id: key,
              createdAt: new Date(roundedTime).toISOString(),
              note: movement.note,
              type: movement.type,
              totalPrice: movement.totalPrice,
              client: movement.client,
              movements: []
            }
          }
          
          acc[key].movements.push(movement)
          return acc
        }, {})
        
        setSales(Object.values(grouped).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
      }
    } catch (error) {
      console.error('Failed to load sales:', error)
    }
  }

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGroup = selectedGroup === 'all' || m.group.id === selectedGroup
    const isRetail = m.isRetailProduct // jen produkty pro prodej
    return matchesSearch && matchesGroup && isRetail
  })

  const filteredClients = clients.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  )

  // Výpočet celkového množství v původních jednotkách
  const calculateTotalAmount = (quantity: number, packageSize: number) => {
    return quantity * packageSize
  }

  const addToCart = (material: Material) => {
    const existingItem = cart.find(item => item.material.id === material.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.material.id === material.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { material, quantity: 1 }])
    }
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

  const clearCart = () => {
    setCart([])
    setNote('')
    setTotalPrice('')
    setSelectedClient(null)
    setClientSearch('')
  }

  const processSale = async () => {
    if (cart.length === 0) return

    // Validate price for SALE transactions
    if (transactionType === 'sale' && !totalPrice) {
      alert('⚠️ Zadejte celkovou cenu pro prodej')
      return
    }

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
          type: transactionType === 'sale' ? 'SALE' : 'USAGE',
          totalPrice: transactionType === 'sale' ? totalPrice : null,
          clientId: selectedClient?.id || null,
          note: note || null
        })
      })

      if (response.ok) {
        clearCart()
        const message = transactionType === 'sale' ? '✅ Prodej byl úspěšně zaznamenán!' : '✅ Výdej byl úspěšně zaznamenán!'
        alert(message)
        loadMaterials()
        loadSales()
      } else {
        const error = await response.json()
        alert('❌ ' + (error.error || 'Chyba při zpracování prodeje'))
      }
    } catch (error) {
      console.error('Sale error:', error)
      alert('❌ Chyba při zpracování prodeje')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🛒 Pokladna
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {selectedClient ? (
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
                      {selectedClient.avatar || `${selectedClient.firstName[0]}${selectedClient.lastName[0]}`}
                    </span>
                    {selectedClient.firstName} {selectedClient.lastName}
                  </span>
                ) : (
                  'Anonymní zákazník'
                )}
              </p>
            </div>
            
            {/* Client selector */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Vyhledat klienta..."
                value={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value)
                  setSelectedClient(null)
                  setShowClientDropdown(true)
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="w-80 px-4 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {selectedClient && (
                <button
                  onClick={clearCart}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
              
              {showClientDropdown && clientSearch && !selectedClient && filteredClients.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client)
                        setClientSearch('')
                        setShowClientDropdown(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium flex-shrink-0">
                        {client.avatar || `${client.firstName[0]}${client.lastName[0]}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{client.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-screen-2xl mx-auto px-6 py-6 flex gap-6">
          {/* Sales History Sidebar */}
          <div className="w-96 bg-white/60 backdrop-blur-md border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <h1 className="text-2xl font-bold text-gray-900">Historie prodejů</h1>
              <p className="text-sm text-gray-600 mt-1">Celkem: {sales.length}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {sales.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  Žádné prodeje
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.map(sale => {
                    if (!sale || !sale.movements || !Array.isArray(sale.movements)) {
                      return null
                    }
                    
                    const totalItems = sale.movements.reduce((sum, m) => sum + Math.abs(m?.quantity || 0), 0)
                    const isSelected = selectedSale?.id === sale.id
                    return (
                      <div
                        key={sale.id}
                        className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                sale.type === 'SALE' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {sale.type === 'SALE' ? '🛍️ Prodáno' : '🔧 Výdej'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(sale.createdAt).toLocaleDateString('cs-CZ')} {new Date(sale.createdAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {sale.client ? `${sale.client.firstName} ${sale.client.lastName}` : '👤 Anonymní zákazník'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {sale.movements.length} {sale.movements.length === 1 ? 'položka' : 'položek'} • {totalItems} ks celkem
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSale(isSelected ? null : sale)
                            }}
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          >
                            {isSelected ? 'Skrýt' : 'Detail'}
                          </button>
                        </div>

                        {isSelected && sale.movements && sale.movements.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            {sale.movements.map(movement => {
                              if (!movement || !movement.material) return null
                              return (
                                <div key={movement.id} className="flex items-start justify-between text-sm">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {movement.material.name || 'Neznámý produkt'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {Math.abs(movement.quantity || 0)} ks = {Math.abs(movement.quantity || 0) * (movement.material.packageSize || 0)} {movement.material.unit || ''}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            {sale.totalPrice && sale.type === 'SALE' && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Celková cena:</span>
                                  <span className="font-bold text-gray-900">{sale.totalPrice} Kč</span>
                                </div>
                              </div>
                            )}
                            {sale.note && (
                              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 italic">
                                📝 {sale.note}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Categories & Search */}
            <div className="mb-4 flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Vyhledat produkt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">🏷️ Všechny kategorie</option>
                {materialGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            {/* Product Cards Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                {filteredMaterials.map(material => {
                  const isLowStock = material.minStock > 0 && material.stockQuantity <= material.minStock
                  const isOutOfStock = material.stockQuantity <= 0
                  
                  return (
                    <button
                      key={material.id}
                      onClick={() => addToCart(material)}
                      disabled={isOutOfStock}
                      className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent group relative ${
                        isOutOfStock 
                          ? 'border-red-200' 
                          : isLowStock 
                            ? 'border-orange-200 hover:border-orange-400' 
                            : 'border-transparent hover:border-purple-300'
                      }`}
                    >
                      {isLowStock && !isOutOfStock && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10">
                          ⚠️
                        </div>
                      )}
                      <div className={`rounded-lg mb-2 p-3 min-h-[120px] flex flex-col items-center justify-center relative ${
                        isOutOfStock 
                          ? 'bg-gradient-to-br from-red-100 to-red-50' 
                          : isLowStock 
                            ? 'bg-gradient-to-br from-orange-100 to-yellow-50' 
                            : 'bg-gradient-to-br from-purple-100 to-pink-100'
                      }`}>
                        <div className="text-4xl mb-2">📦</div>
                        <div className="text-xs font-bold text-gray-900 text-center leading-tight px-1">
                          {material.name}
                        </div>
                      </div>
                      {material.group && (
                        <div className="text-xs text-gray-600 mb-2">{material.group.name}</div>
                      )}
                      <div className={`text-xs font-medium ${
                        isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        Sklad: {material.stockQuantity} ks
                      </div>
                      {material.unit !== 'ks' && (
                        <div className="text-xs text-gray-400">
                          ({calculateTotalAmount(material.stockQuantity, material.packageSize)} {material.unit})
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="mt-2 text-xs text-red-600 font-bold">
                          ❌ Není skladem
                        </div>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <div className="mt-2 text-xs text-orange-600 font-medium">
                          ⚠️ Nízká zásoba
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {filteredMaterials.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <div className="text-lg">Žádné produkty</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="w-96 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg text-gray-900">
                  Košík ({getTotalItems()})
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Vyprázdnit
                  </button>
                )}
              </div>
              
              {/* Transaction Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTransactionType('sale')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    transactionType === 'sale'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🛍️ Prodej
                </button>
                <button
                  onClick={() => setTransactionType('usage')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    transactionType === 'usage'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔧 Výdej pro práci
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🛒</div>
                    <div>Košík je prázdný</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.material.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-medium text-sm text-gray-900 line-clamp-2">
                            {item.material.name}
                          </div>
                          {item.material.group && (
                            <div className="text-xs text-gray-600 mt-0.5">
                              {item.material.group.name}
                            </div>
                          )}
                          {item.material.unit !== 'ks' && (
                            <div className="text-xs text-purple-600 font-medium mt-1">
                              {calculateTotalAmount(item.quantity, item.material.packageSize)} {item.material.unit}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.material.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.material.id, item.quantity - 1)}
                          className="w-9 h-9 rounded-lg bg-white border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 flex items-center justify-center font-bold text-gray-600 transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.material.id, parseInt(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          min="1"
                        />
                        <span className="text-sm text-gray-600 w-8">ks</span>
                        <button
                          onClick={() => updateQuantity(item.material.id, item.quantity + 1)}
                          className="w-9 h-9 rounded-lg bg-white border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 flex items-center justify-center font-bold text-gray-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 space-y-3">
                {/* Total Price Input - only for sales */}
                {transactionType === 'sale' && (
                  <div className="relative">
                    <input
                      type="number"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      placeholder="Celková cena"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm pr-12"
                      step="0.01"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      Kč
                    </span>
                  </div>
                )}
                
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={transactionType === 'sale' ? '💬 Poznámka k prodeji...' : '💬 Poznámka k výdeji...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                  rows={2}
                />
                <button
                  onClick={processSale}
                  disabled={isProcessing}
                  className={`w-full py-3.5 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
                    transactionType === 'sale'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                  }`}
                >
                  {isProcessing 
                    ? '⏳ Zpracovávám...' 
                    : transactionType === 'sale' 
                      ? '✓ Dokončit prodej' 
                      : '✓ Odepsat materiál'
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
