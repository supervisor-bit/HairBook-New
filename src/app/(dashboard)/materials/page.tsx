'use client'

import { useEffect, useState } from 'react'

interface MaterialGroup {
  id: string
  name: string
  _count: { materials: number }
}

interface Material {
  id: string
  name: string
  unit: string
  packageSize: number
  stockQuantity: number
  group: { name: string }
}

interface MaterialMovement {
  id: string
  type: string
  quantity: number
  note: string | null
  createdAt: string
}

export default function MaterialsPage() {
  const [groups, setGroups] = useState<MaterialGroup[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [movements, setMovements] = useState<MaterialMovement[]>([])
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false)
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '' })
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    groupId: '',
    unit: 'g',
    packageSize: '',
    stockQuantity: '0',
    isRetailProduct: false,
  })
  const [newMovement, setNewMovement] = useState({
    type: 'in',
    quantity: '',
    note: '',
  })

  useEffect(() => {
    loadGroups()
    loadMaterials()
  }, [])

  useEffect(() => {
    loadMaterials()
  }, [selectedGroup])

  const loadGroups = async () => {
    const res = await fetch('/api/material-groups')
    const data = await res.json()
    setGroups([{ id: 'all', name: 'Všechny', _count: { materials: 0 } }, ...data])
  }

  const loadMaterials = async () => {
    const url = selectedGroup === 'all'
      ? '/api/materials'
      : `/api/materials?groupId=${selectedGroup}`
    const res = await fetch(url)
    const data = await res.json()
    setMaterials(data)
  }

  const handleSelectMaterial = async (material: Material) => {
    setSelectedMaterial(material)
    const res = await fetch(`/api/materials/${material.id}`)
    const fullData = await res.json()
    setMovements(fullData.movements || [])
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/material-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroup),
    })

    if (res.ok) {
      setNewGroup({ name: '' })
      setShowNewGroupForm(false)
      loadGroups()
    }
  }

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMaterial),
    })

    if (res.ok) {
      setNewMaterial({
        name: '',
        groupId: '',
        unit: 'g',
        packageSize: '',
        stockQuantity: '0',
        isRetailProduct: false,
      })
      setShowNewMaterialForm(false)
      loadMaterials()
    }
  }

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterial) return

    const res = await fetch(`/api/materials/${selectedMaterial.id}/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMovement),
    })

    if (res.ok) {
      setNewMovement({ type: 'in', quantity: '', note: '' })
      setShowMovementForm(false)
      handleSelectMaterial(selectedMaterial)
      loadMaterials()
    }
  }

  return (
    <div className="h-full flex">
      {/* Groups sidebar */}
      <div className="w-56 bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-sm border-r border-purple-100/50 flex flex-col">
        <div className="p-4 border-b border-purple-100/50">
          <h2 className="font-semibold text-gray-900">Skupiny</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`
                w-full text-left px-3 py-2 rounded-lg mb-1 transition-all duration-200
                ${selectedGroup === group.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-glow'
                  : 'text-gray-700 hover:bg-white/60 hover:shadow-soft'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{group.name}</span>
                <span className={`text-xs ${selectedGroup === group.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {group._count?.materials || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-purple-100/50">
          <button
            onClick={() => setShowNewGroupForm(true)}
            className="w-full py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
          >
            + Přidat skupinu
          </button>
        </div>
      </div>

      {/* Materials list */}
      <div className="w-80 glass border-r border-purple-100/50 flex flex-col">
        <div className="p-4 border-b border-purple-100/50">
          <input
            type="text"
            placeholder="Hledat produkt..."
            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {materials.map((material) => (
            <button
              key={material.id}
              onClick={() => handleSelectMaterial(material)}
              className={`
                w-full text-left p-4 border-b border-purple-100/30 transition-all duration-200
                ${selectedMaterial?.id === material.id
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 shadow-soft'
                  : 'hover:bg-white/60 hover:shadow-soft'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-gray-900 truncate">
                  {material.name}
                </div>
                <span className={`text-sm font-semibold ${
                  material.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {material.stockQuantity} ks
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {material.group.name} • {material.packageSize} {material.unit}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-purple-100/50">
          <button
            onClick={() => setShowNewMaterialForm(true)}
            className="w-full py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
          >
            + Přidat produkt
          </button>
        </div>
      </div>

      {/* Material detail */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-purple-50/30">
        {selectedMaterial ? (
          <MaterialDetail
            material={selectedMaterial}
            movements={movements}
            onAddMovement={() => setShowMovementForm(true)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg">Vyberte produkt ze seznamu</p>
            </div>
          </div>
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroupForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Nová skupina</h2>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ name: e.target.value })}
                placeholder="Název skupiny"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewGroupForm(false)}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Vytvořit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Material Modal */}
      {showNewMaterialForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Nový produkt</h2>
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <input
                type="text"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                placeholder="Název produktu"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <select
                value={newMaterial.groupId}
                onChange={(e) => setNewMaterial({ ...newMaterial, groupId: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Vyberte skupinu</option>
                {groups.filter(g => g.id !== 'all').map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <select
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="g">g (gramy)</option>
                <option value="ml">ml (mililitry)</option>
                <option value="ks">ks (kusy)</option>
              </select>
              <input
                type="number"
                step="0.1"
                value={newMaterial.packageSize}
                onChange={(e) => setNewMaterial({ ...newMaterial, packageSize: e.target.value })}
                placeholder="Velikost balení"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <input
                type="number"
                step="0.1"
                value={newMaterial.stockQuantity}
                onChange={(e) => setNewMaterial({ ...newMaterial, stockQuantity: e.target.value })}
                placeholder="Počáteční stav skladu (ks)"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/40 rounded-lg border border-purple-200 hover:bg-white/60 transition-all duration-200">
                <input
                  type="checkbox"
                  checked={newMaterial.isRetailProduct}
                  onChange={(e) => setNewMaterial({ ...newMaterial, isRetailProduct: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-900">🏠 Produkt pro domácí použití</div>
                  <div className="text-sm text-gray-600">Produkt je určen k prodeji klientům</div>
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMaterialForm(false)}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Vytvořit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementForm && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Nový pohyb</h2>
            <form onSubmit={handleAddMovement} className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="font-medium text-gray-900">{selectedMaterial.name}</div>
                <div className="text-sm text-gray-600">
                  Aktuální stav: {selectedMaterial.stockQuantity} ks
                </div>
              </div>
              <select
                value={newMovement.type}
                onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="in">Příjem</option>
                <option value="out">Výdej</option>
              </select>
              <input
                type="number"
                step="0.1"
                value={newMovement.quantity}
                onChange={(e) => setNewMovement({ ...newMovement, quantity: e.target.value })}
                placeholder="Množství (v kusech)"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <textarea
                value={newMovement.note}
                onChange={(e) => setNewMovement({ ...newMovement, note: e.target.value })}
                placeholder="Poznámka (nepovinné)"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                rows={3}
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementForm(false)}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Přidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MaterialDetail({
  material,
  movements,
  onAddMovement,
}: {
  material: Material & { movements?: MaterialMovement[] }
  movements: MaterialMovement[]
  onAddMovement: () => void
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="glass border-b border-purple-100/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {material.name}
            </h1>
            <p className="text-gray-600">{material.group.name}</p>
          </div>
          <button
            onClick={onAddMovement}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
          >
            + Nový pohyb
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="glass p-4 rounded-xl border border-purple-100/50">
            <div className="text-sm text-gray-600 mb-1">Velikost balení</div>
            <div className="text-xl font-semibold text-gray-900">
              {material.packageSize} {material.unit}
            </div>
          </div>
          <div className="glass p-4 rounded-xl border border-purple-100/50">
            <div className="text-sm text-gray-600 mb-1">Stav skladu</div>
            <div className={`text-xl font-semibold ${
              material.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {material.stockQuantity} ks
            </div>
          </div>
          <div className="glass p-4 rounded-xl border border-purple-100/50">
            <div className="text-sm text-gray-600 mb-1">Celkem produktů</div>
            <div className="text-xl font-semibold text-gray-900">
              {(material.stockQuantity * material.packageSize).toFixed(1)} {material.unit}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historie pohybů</h2>

        {movements.length > 0 ? (
          <div className="space-y-3">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="glass rounded-xl p-4 shadow-soft border border-purple-100/30 hover:shadow-glow hover:border-purple-200/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      movement.type === 'in'
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                        : movement.type === 'out'
                        ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'
                        : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                    }`}>
                      {movement.type === 'in' ? 'Příjem' : movement.type === 'out' ? 'Výdej' : 'Návštěva'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {movement.type === 'in' ? '+' : '-'}{movement.quantity} ks
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(movement.createdAt).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
                {movement.note && (
                  <p className="text-sm text-gray-600">{movement.note}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-lg">Zatím žádné pohyby</p>
          </div>
        )}
      </div>
    </div>
  )
}
