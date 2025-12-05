'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MaterialGroup {
  id: string
  name: string
}

interface Material {
  id: string
  name: string
  unit: string
  packageSize: number
  stockQuantity: number
  minStock: number
  group: {
    id: string
    name: string
  }
}

interface OrderItem {
  id: string
  material: Material
  quantity: number
  price: number | null
}

interface Order {
  id: string
  status: string
  totalPrice: number | null
  note: string | null
  orderedAt: string | null
  deliveredAt: string | null
  createdAt: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<Map<string, { quantity: number }>>(new Map())
  const [orderNote, setOrderNote] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [orderToDeliver, setOrderToDeliver] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deliverSearchQuery, setDeliverSearchQuery] = useState('')
  const [deliveryQuantities, setDeliveryQuantities] = useState<Map<string, number>>(new Map())
  const [additionalMaterials, setAdditionalMaterials] = useState<Map<string, number>>(new Map())
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([])
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    groupId: '',
    unit: 'ks' as 'g' | 'ml' | 'ks',
    packageSize: 1,
    quantity: 1
  })

  useEffect(() => {
    loadOrders()
    loadMaterials()
    loadMaterialGroups()
  }, [])

  const loadOrders = async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    setOrders(data)
  }

  const loadMaterials = async () => {
    const res = await fetch('/api/materials')
    const data = await res.json()
    setMaterials(data)
  }

  const loadMaterialGroups = async () => {
    const res = await fetch('/api/material-groups')
    const data = await res.json()
    setMaterialGroups(data)
  }

  // Get materials that need restocking (below minimum)
  const lowStockMaterials = materials.filter(
    m => m.minStock > 0 && m.stockQuantity <= m.minStock
  )

  // Get suggested quantities (difference between current and minimum)
  const getSuggestedQuantity = (material: Material) => {
    if (material.minStock <= 0) return 0
    const deficit = material.minStock - material.stockQuantity
    return Math.ceil(deficit)
  }

  // Filter materials by search query
  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter deliver order items by search query
  const filteredDeliverItems = orderToDeliver?.items.filter(item =>
    item.material.name.toLowerCase().includes(deliverSearchQuery.toLowerCase()) ||
    item.material.group.name.toLowerCase().includes(deliverSearchQuery.toLowerCase())
  ) || []

  const toggleMaterial = (materialId: string) => {
    const newSelected = new Map(selectedMaterials)
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId)
    } else {
      const material = materials.find(m => m.id === materialId)
      if (material) {
        const suggestedQty = getSuggestedQuantity(material)
        newSelected.set(materialId, { quantity: suggestedQty > 0 ? suggestedQty : 1 })
      }
    }
    setSelectedMaterials(newSelected)
  }

  const updateQuantity = (materialId: string, quantity: number) => {
    const newSelected = new Map(selectedMaterials)
    const existing = newSelected.get(materialId)
    if (existing) {
      newSelected.set(materialId, { quantity })
    }
    setSelectedMaterials(newSelected)
  }

  const handleCreateOrder = async () => {
    if (selectedMaterials.size === 0) return

    const items = Array.from(selectedMaterials.entries()).map(([materialId, data]) => ({
      materialId,
      quantity: data.quantity,
    }))

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, note: orderNote || null }),
    })

    if (res.ok) {
      setShowNewOrderModal(false)
      setSelectedMaterials(new Map())
      setOrderNote('')
      loadOrders()
    }
  }

  const handleStatusChange = async (orderId: string, status: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      loadOrders()
      // When order is delivered, reload materials to update low stock warnings
      if (status === 'delivered') {
        loadMaterials()
      }
    }
  }

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return

    const res = await fetch(`/api/orders/${orderToDelete}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      loadOrders()
      setShowDeleteModal(false)
      setOrderToDelete(null)
    }
  }

  const handleCreateNewMaterial = async () => {
    if (!newMaterial.name || !newMaterial.groupId) return

    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newMaterial.name,
        groupId: newMaterial.groupId,
        unit: newMaterial.unit,
        packageSize: newMaterial.packageSize,
        stockQuantity: 0,
        minStock: 0,
      }),
    })

    if (res.ok) {
      const createdMaterial = await res.json()
      await loadMaterials()
      
      // Add the new material to additional materials list
      const newMap = new Map(additionalMaterials)
      newMap.set(createdMaterial.id, newMaterial.quantity)
      setAdditionalMaterials(newMap)
      
      // Reset form
      setShowNewMaterialForm(false)
      setNewMaterial({
        name: '',
        groupId: '',
        unit: 'ks',
        packageSize: 1,
        quantity: 1
      })
      setDeliverSearchQuery('')
    }
  }

  const confirmDelivery = async () => {
    if (!orderToDeliver) return

    // Prepare items with adjusted quantities
    const items = orderToDeliver.items.map(item => ({
      materialId: item.material.id,
      quantity: deliveryQuantities.get(item.material.id) || item.quantity
    }))

    // Add additional materials
    additionalMaterials.forEach((quantity, materialId) => {
      items.push({ materialId, quantity })
    })

    const res = await fetch(`/api/orders/${orderToDeliver.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered', deliveryItems: items }),
    })

    if (res.ok) {
      loadOrders()
      loadMaterials()
      setShowDeliverModal(false)
      setOrderToDeliver(null)
      setDeliveryQuantities(new Map())
      setAdditionalMaterials(new Map())
      setDeliverSearchQuery('')
      setShowNewMaterialForm(false)
      setNewMaterial({
        name: '',
        groupId: '',
        unit: 'ks',
        packageSize: 1,
        quantity: 1
      })
    }
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar - Orders list */}
      <div className="w-96 bg-white/60 backdrop-blur-md border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Objednávky</h1>
            <button
                onClick={() => {
                  setShowNewOrderModal(true)
                  setSearchQuery('')
                }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              + Nová
            </button>
          </div>

          {/* Low stock alert */}
          {lowStockMaterials.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <span>⚠️</span>
                <span>Nízká zásoba</span>
              </div>
              <div className="text-sm text-red-600">
                {lowStockMaterials.length} {lowStockMaterials.length === 1 ? 'produkt' : 'produktů'} pod minimem
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {orders.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              Žádné objednávky
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {order.status === 'pending' ? 'Čeká' :
                           order.status === 'ordered' ? 'Objednáno' :
                           'Doručeno'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.items.length} {order.items.length === 1 ? 'položka' : 'položek'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'ordered')}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Objednat
                        </button>
                      )}
                      {order.status === 'ordered' && (
                        <button
                          onClick={() => {
                            setOrderToDeliver(order)
                            setShowDeliverModal(true)
                            setDeliverSearchQuery('')
                          }}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Doručeno
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setOrderToDelete(order.id)
                          setShowDeleteModal(true)
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {order.note && (
                    <div className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">
                      {order.note}
                    </div>
                  )}
                  <div className="mt-2 space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-xs text-gray-600 flex justify-between">
                        <span>{item.material.name}</span>
                        <span>{item.quantity} ks</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Suggestions */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-8 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Automatické návrhy</h2>
        
        {lowStockMaterials.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <div className="text-lg font-medium text-gray-900 mb-2">
              Všechny produkty v pořádku
            </div>
            <div className="text-gray-600">
              Žádný produkt není pod minimální zásobou
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockMaterials.map((material) => {
              const deficit = material.minStock - material.stockQuantity
              const suggested = getSuggestedQuantity(material)
              
              return (
                <div
                  key={material.id}
                  className="bg-white/60 backdrop-blur-md rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">⚠️</span>
                        <div className="font-medium text-gray-900">{material.name}</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {material.group.name}
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aktuální zásoba:</span>
                          <span className="font-medium text-red-600">
                            {material.stockQuantity} ks
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Minimum:</span>
                          <span className="font-medium">{material.minStock} ks</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Chybí:</span>
                          <span className="font-medium text-orange-600">
                            {deficit.toFixed(1)} ks
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-1 mt-2">
                          <span className="text-gray-900 font-medium">Navrhujeme objednat:</span>
                          <span className="font-bold text-purple-600">
                            {suggested} ks
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMaterials(new Map([[material.id, { quantity: suggested }]]))
                        setShowNewOrderModal(true)
                      }}
                      className="ml-4 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      Objednat
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 className="text-2xl font-bold text-gray-900">Nová objednávka</h2>
            </div>

            <div className="p-6 border-b border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poznámka (volitelné)
                </label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  placeholder="Dodavatel, termín..."
                />
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Produkty</h3>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hledat produkt..."
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-48"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <div className="space-y-2">
                  {filteredMaterials.map((material) => {
                    const isSelected = selectedMaterials.has(material.id)
                    const data = selectedMaterials.get(material.id)
                    const isLowStock = material.minStock > 0 && material.stockQuantity <= material.minStock

                    return (
                      <div
                        key={material.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMaterial(material.id)}
                            className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {isLowStock && <span className="text-base">⚠️</span>}
                              <div className="font-medium text-gray-900">{material.name}</div>
                            </div>
                            <div className="text-sm text-gray-500">
                              Skladem: {material.stockQuantity} ks
                              {isLowStock && ` (min: ${material.minStock})`}
                            </div>
                            {isSelected && (
                              <div className="mt-2">
                                <label className="text-xs text-gray-600">Množství (ks)</label>
                                <input
                                  type="number"
                                  value={data?.quantity || ''}
                                  onChange={(e) => updateQuantity(material.id, parseInt(e.target.value) || 0)}
                                  className="w-32 px-3 py-1.5 border border-gray-300 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowNewOrderModal(false)
                  setSelectedMaterials(new Map())
                  setOrderNote('')
                  setSearchQuery('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={selectedMaterials.size === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vytvořit objednávku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Smazat objednávku?</h2>
            <p className="text-gray-600 mb-6">
              Opravdu chcete smazat tuto objednávku? Tato akce je nevratná.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setOrderToDelete(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={handleDeleteOrder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Confirmation Modal */}
      {showDeliverModal && orderToDeliver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col my-8 max-h-[90vh]">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {showNewMaterialForm ? 'Vytvořit nový materiál' : 'Doručení objednávky'}
              </h2>
              <p className="text-sm text-gray-600">
                {showNewMaterialForm 
                  ? 'Vyplňte údaje o novém materiálu z dodacího listu'
                  : 'Upravte množství a přidejte další položky z dodacího listu:'
                }
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {!showNewMaterialForm ? (
                  <>
                    {/* Ordered items with editable quantities */}
                    <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Objednané položky</h3>
                  <div className="space-y-2">
                    {orderToDeliver.items.map((item) => {
                      const quantity = deliveryQuantities.get(item.material.id) || item.quantity
                      return (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.material.name}</div>
                            <div className="text-sm text-gray-600">{item.material.group.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Objednáno: {item.quantity} {item.material.unit} • Sklad: {item.material.stockQuantity} {item.material.unit}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newQty = Math.max(0, quantity - 1)
                                const newMap = new Map(deliveryQuantities)
                                newMap.set(item.material.id, newQty)
                                setDeliveryQuantities(newMap)
                              }}
                              className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) => {
                                const newQty = Math.max(0, parseInt(e.target.value) || 0)
                                const newMap = new Map(deliveryQuantities)
                                newMap.set(item.material.id, newQty)
                                setDeliveryQuantities(newMap)
                              }}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                            />
                            <span className="text-sm text-gray-600">{item.material.unit}</span>
                            <button
                              onClick={() => {
                                const newMap = new Map(deliveryQuantities)
                                newMap.set(item.material.id, quantity + 1)
                                setDeliveryQuantities(newMap)
                              }}
                              className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Additional materials list - always visible if there are any */}
                {additionalMaterials.size > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Další položky z dodacího listu</h3>
                    <div className="space-y-2 mb-4">
                      {Array.from(additionalMaterials.entries()).map(([materialId, quantity]) => {
                        const material = materials.find(m => m.id === materialId)
                        if (!material) return null
                        return (
                          <div key={materialId} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{material.name}</div>
                              <div className="text-sm text-gray-600">{material.group.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Aktuální sklad: {material.stockQuantity} {material.unit}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const newQty = Math.max(1, quantity - 1)
                                  const newMap = new Map(additionalMaterials)
                                  newMap.set(materialId, newQty)
                                  setAdditionalMaterials(newMap)
                                }}
                                className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                  const newQty = Math.max(1, parseInt(e.target.value) || 1)
                                  const newMap = new Map(additionalMaterials)
                                  newMap.set(materialId, newQty)
                                  setAdditionalMaterials(newMap)
                                }}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                              />
                              <span className="text-sm text-gray-600">{material.unit}</span>
                              <button
                                onClick={() => {
                                  const newMap = new Map(additionalMaterials)
                                  newMap.set(materialId, quantity + 1)
                                  setAdditionalMaterials(newMap)
                                }}
                                className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                              >
                                +
                              </button>
                              <button
                                onClick={() => {
                                  const newMap = new Map(additionalMaterials)
                                  newMap.delete(materialId)
                                  setAdditionalMaterials(newMap)
                                }}
                                className="ml-2 w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Add more materials section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {additionalMaterials.size > 0 ? 'Přidat další materiály' : 'Další položky z dodacího listu'}
                  </h3>
                  
                  {/* Search materials */}
                  <div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Vyhledat materiál..."
                          value={deliverSearchQuery}
                          onChange={(e) => setDeliverSearchQuery(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => setShowNewMaterialForm(true)}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all whitespace-nowrap font-medium"
                        >
                          + Vytvořit nový
                        </button>
                      </div>
                      
                      {deliverSearchQuery && (
                        <div className="border border-gray-200 rounded-lg">
                          {materials
                            .filter(m => 
                              !orderToDeliver.items.some(item => item.material.id === m.id) &&
                              !additionalMaterials.has(m.id) &&
                              (m.name.toLowerCase().includes(deliverSearchQuery.toLowerCase()) ||
                               m.group.name.toLowerCase().includes(deliverSearchQuery.toLowerCase()))
                            ).length > 0 ? (
                            materials
                              .filter(m => 
                                !orderToDeliver.items.some(item => item.material.id === m.id) &&
                                !additionalMaterials.has(m.id) &&
                                (m.name.toLowerCase().includes(deliverSearchQuery.toLowerCase()) ||
                                 m.group.name.toLowerCase().includes(deliverSearchQuery.toLowerCase()))
                              )
                              .map(material => (
                                <button
                                  key={material.id}
                                  onClick={() => {
                                    const newMap = new Map(additionalMaterials)
                                    newMap.set(material.id, 1)
                                    setAdditionalMaterials(newMap)
                                    setDeliverSearchQuery('')
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{material.name}</div>
                                  <div className="text-sm text-gray-600">{material.group.name} • Sklad: {material.stockQuantity} {material.unit}</div>
                                </button>
                              ))
                          ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              Žádný materiál nenalezen
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  </>
                ) : (
                  <div className="space-y-4">
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Název materiálu
                          </label>
                          <input
                            type="text"
                            value={newMaterial.name}
                            onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="např. Loreal Professionnel Inforcer"
                            autoFocus
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skupina
                          </label>
                          <select
                            value={newMaterial.groupId}
                            onChange={(e) => setNewMaterial(prev => ({ ...prev, groupId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="">Vyberte skupinu materiálu</option>
                            {materialGroups.map(group => (
                              <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Jednotka
                            </label>
                            <select
                              value={newMaterial.unit}
                              onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value as 'g' | 'ml' | 'ks' }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="ks">ks (kusy)</option>
                              <option value="ml">ml (mililitry)</option>
                              <option value="g">g (gramy)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Velikost balení
                            </label>
                            <input
                              type="number"
                              value={newMaterial.packageSize}
                              onChange={(e) => setNewMaterial(prev => ({ ...prev, packageSize: parseInt(e.target.value) || 1 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              min="1"
                              placeholder="1000"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Množství k dodání
                          </label>
                          <input
                            type="number"
                            value={newMaterial.quantity}
                            onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="1"
                            placeholder="Počet balení"
                          />
                        </div>
                        
                      </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              {showNewMaterialForm ? (
                <>
                  <button
                    onClick={() => {
                      setShowNewMaterialForm(false)
                      setNewMaterial({
                        name: '',
                        groupId: '',
                        unit: 'ks',
                        packageSize: 1,
                        quantity: 1
                      })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ← Zpět na seznam
                  </button>
                  <button
                    onClick={handleCreateNewMaterial}
                    disabled={!newMaterial.name || !newMaterial.groupId}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vytvořit a přidat
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowDeliverModal(false)
                      setOrderToDeliver(null)
                      setDeliverSearchQuery('')
                      setDeliveryQuantities(new Map())
                      setAdditionalMaterials(new Map())
                      setShowNewMaterialForm(false)
                      setNewMaterial({
                        name: '',
                        groupId: '',
                        unit: 'ks',
                        packageSize: 1,
                        quantity: 1
                      })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={confirmDelivery}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Potvrdit doručení
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
