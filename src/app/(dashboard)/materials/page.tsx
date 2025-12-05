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
  minStock: number
  groupId: string
  isRetailProduct: boolean
  group: { name: string }
  _count?: { movements: number }
}

interface MaterialMovement {
  id: string
  type: string
  quantity: number
  note: string | null
  createdAt: string
  client?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export default function MaterialsPage() {
  const [groups, setGroups] = useState<MaterialGroup[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [movements, setMovements] = useState<MaterialMovement[]>([])
  const [showLowStock, setShowLowStock] = useState(false)
  const [movementFilter, setMovementFilter] = useState<'all' | 'in' | 'out'>('all')
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false)
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showEditMaterialForm, setShowEditMaterialForm] = useState(false)
  const [showDeleteMaterialConfirm, setShowDeleteMaterialConfirm] = useState<Material | null>(null)
  const [showEditGroupForm, setShowEditGroupForm] = useState(false)
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [editMaterial, setEditMaterial] = useState<{
    id: string
    name: string
    groupId: string
    unit: string
    packageSize: string
    minStock: string
    isRetailProduct: boolean
  } | null>(null)
  const [newGroup, setNewGroup] = useState({ name: '' })
  const [editGroup, setEditGroup] = useState({ id: '', name: '' })
  const [groupToDelete, setGroupToDelete] = useState<MaterialGroup | null>(null)
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    groupId: '',
    unit: 'g',
    packageSize: '',
    stockQuantity: '0',
    minStock: '0',
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

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/material-groups/${editGroup.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editGroup.name }),
    })
    
    if (res.ok) {
      setShowEditGroupForm(false)
      setEditGroup({ id: '', name: '' })
      loadGroups()
    }
  }

  const openEditGroupForm = (group: MaterialGroup) => {
    setEditGroup({ id: group.id, name: group.name })
    setShowEditGroupForm(true)
  }

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return
    
    const res = await fetch(`/api/material-groups/${groupToDelete.id}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      setShowDeleteGroupConfirm(false)
      setGroupToDelete(null)
      if (selectedGroup === groupToDelete.id) {
        setSelectedGroup('all')
      }
      loadGroups()
    } else {
      const error = await res.json()
      alert(error.error || 'Chyba při mazání skupiny')
    }
  }

  const openDeleteGroupConfirm = (group: MaterialGroup) => {
    setGroupToDelete(group)
    setShowDeleteGroupConfirm(true)
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
        minStock: '0',
        isRetailProduct: false,
      })
      setShowNewMaterialForm(false)
      loadMaterials()
    }
  }

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMaterial) return
    
    const res = await fetch(`/api/materials/${editMaterial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editMaterial.name,
        groupId: editMaterial.groupId,
        unit: editMaterial.unit,
        packageSize: editMaterial.packageSize,
        minStock: editMaterial.minStock,
        isRetailProduct: editMaterial.isRetailProduct,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setShowEditMaterialForm(false)
      setEditMaterial(null)
      loadMaterials()
      if (selectedMaterial?.id === updated.id) {
        setSelectedMaterial(updated)
      }
    }
  }

  const handleDeleteMaterial = async () => {
    if (!showDeleteMaterialConfirm) return
    
    const res = await fetch(`/api/materials/${showDeleteMaterialConfirm.id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setShowDeleteMaterialConfirm(null)
      if (selectedMaterial?.id === showDeleteMaterialConfirm.id) {
        setSelectedMaterial(null)
      }
      loadMaterials()
    } else {
      const error = await res.json()
      alert(error.error || 'Chyba při mazání produktu')
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
      
      // Reload material detail to get updated stock and movements
      const detailRes = await fetch(`/api/materials/${selectedMaterial.id}`)
      const updatedMaterial = await detailRes.json()
      setSelectedMaterial(updatedMaterial)
      setMovements(updatedMaterial.movements || [])
      
      // Reload materials list
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
            <div
              key={group.id}
              className={`
                w-full px-3 py-2 rounded-lg mb-1 transition-all duration-200 group
                ${selectedGroup === group.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-glow'
                  : 'text-gray-700 hover:bg-white/60 hover:shadow-soft'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedGroup(group.id)}
                  className="flex-1 text-left flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{group.name}</span>
                  <span className={`text-xs ${selectedGroup === group.id ? 'text-white/80' : 'text-gray-500'}`}>
                    {group._count?.materials || 0}
                  </span>
                </button>
                {group.id !== 'all' && (
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditGroupForm(group)}
                      className={`p-1 rounded hover:bg-white/20 transition-all ${
                        selectedGroup === group.id ? 'text-white' : 'text-gray-600'
                      }`}
                      title="Upravit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteGroupConfirm(group)}
                      className={`p-1 rounded hover:bg-white/20 transition-all ${
                        selectedGroup === group.id ? 'text-white' : 'text-gray-600'
                      }`}
                      title="Smazat"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
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
      <div className="w-96 glass border-r border-purple-100/50 flex flex-col">
        <div className="p-4 border-b border-purple-100/50 space-y-3">
          <input
            type="text"
            placeholder="Hledat produkt..."
            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Pouze nízká zásoba</span>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
          {materials
            .filter(material => !showLowStock || (material.minStock > 0 && material.stockQuantity <= material.minStock))
            .map((material) => (
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
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-900 truncate">
                    {material.name}
                  </div>
                  {material.minStock > 0 && material.stockQuantity <= material.minStock && (
                    <span className="text-red-600" title={`Chybí ${material.minStock - material.stockQuantity} ks do minimální zásoby`}>
                      ⚠️
                    </span>
                  )}
                </div>
                <span className={`text-sm font-semibold ${
                  material.minStock > 0 && material.stockQuantity <= material.minStock ? 'text-red-600' : 
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
            onEdit={() => {
              setEditMaterial({
                id: selectedMaterial.id,
                name: selectedMaterial.name,
                groupId: selectedMaterial.groupId,
                unit: selectedMaterial.unit,
                packageSize: selectedMaterial.packageSize.toString(),
                minStock: selectedMaterial.minStock.toString(),
                isRetailProduct: selectedMaterial.isRetailProduct,
              })
              setShowEditMaterialForm(true)
            }}
            onDelete={() => setShowDeleteMaterialConfirm(selectedMaterial)}
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

      {/* Edit Group Modal */}
      {showEditGroupForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Upravit skupinu</h2>
            <form onSubmit={handleEditGroup}>
              <input
                type="text"
                value={editGroup.name}
                onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
                placeholder="Název skupiny"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditGroupForm(false)
                    setEditGroup({ id: '', name: '' })
                  }}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Uložit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroupConfirm && groupToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-red-100/50 m-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Smazat skupinu?</h2>
            <p className="text-gray-700 mb-4">
              Opravdu chcete smazat skupinu <strong>{groupToDelete.name}</strong>?
            </p>
            {groupToDelete._count && groupToDelete._count.materials > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm font-medium">
                  ❌ Nelze smazat skupinu s produkty ({groupToDelete._count.materials})
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteGroupConfirm(false)
                  setGroupToDelete(null)
                }}
                className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={groupToDelete._count && groupToDelete._count.materials > 0}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                Smazat
              </button>
            </div>
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
              <input
                type="number"
                step="0.1"
                value={newMaterial.minStock}
                onChange={(e) => setNewMaterial({ ...newMaterial, minStock: e.target.value })}
                placeholder="Minimální zásoba (ks) - volitelné"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                  <div className="text-sm text-gray-600">Produkt je určen k prodeji klientům (cena se zadává při prodeji)</div>
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

      {/* Edit Material Modal */}
      {showEditMaterialForm && editMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Upravit produkt</h2>
            <form onSubmit={handleUpdateMaterial} className="space-y-4">
              <input
                type="text"
                value={editMaterial.name}
                onChange={(e) => setEditMaterial({ ...editMaterial, name: e.target.value })}
                placeholder="Název produktu"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <select
                value={editMaterial.groupId}
                onChange={(e) => setEditMaterial({ ...editMaterial, groupId: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
              <select
                value={editMaterial.unit}
                onChange={(e) => setEditMaterial({ ...editMaterial, unit: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="g">gramy (g)</option>
                <option value="ml">mililitry (ml)</option>
                <option value="ks">kusy (ks)</option>
              </select>
              <input
                type="number"
                step="0.1"
                value={editMaterial.packageSize}
                onChange={(e) => setEditMaterial({ ...editMaterial, packageSize: e.target.value })}
                placeholder="Velikost balení"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={selectedMaterial?.stockQuantity || 0}
                  disabled
                  placeholder="Stav skladu (ks)"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  nelze upravit
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                value={editMaterial.minStock}
                onChange={(e) => setEditMaterial({ ...editMaterial, minStock: e.target.value })}
                placeholder="Minimální zásoba (ks) - volitelné"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/40 rounded-lg border border-purple-200 hover:bg-white/60 transition-all duration-200">
                <input
                  type="checkbox"
                  checked={editMaterial.isRetailProduct}
                  onChange={(e) => setEditMaterial({ ...editMaterial, isRetailProduct: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-900">🏠 Produkt pro domácí použití</div>
                  <div className="text-sm text-gray-600">Produkt je určen k prodeji klientům (cena se zadává při prodeji)</div>
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditMaterialForm(false)
                    setEditMaterial(null)
                  }}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Uložit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Material Confirmation Modal */}
      {showDeleteMaterialConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-red-100/50 m-4">
            <h2 className="text-2xl font-bold text-red-600 mb-6">Smazat produkt?</h2>
            <div className="mb-6">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-4">
                <div className="font-medium text-gray-900">{showDeleteMaterialConfirm.name}</div>
                {showDeleteMaterialConfirm._count && showDeleteMaterialConfirm._count.movements > 0 && (
                  <div className="text-sm text-red-600 mt-2">
                    ⚠️ Produkt má {showDeleteMaterialConfirm._count.movements} pohybů. Nejprve smažte všechny pohyby.
                  </div>
                )}
              </div>
              <p className="text-gray-700">
                Opravdu chcete smazat tento produkt? Tato akce je nevratná.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteMaterialConfirm(null)}
                className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleDeleteMaterial}
                disabled={showDeleteMaterialConfirm._count && showDeleteMaterialConfirm._count.movements > 0}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                Smazat
              </button>
            </div>
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
  onEdit,
  onDelete,
}: {
  material: Material & { movements?: MaterialMovement[] }
  movements: MaterialMovement[]
  onAddMovement: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [movementFilter, setMovementFilter] = useState<'all' | 'in' | 'out'>('all')
  
  const filteredMovements = movements.filter(movement => {
    if (movementFilter === 'all') return true
    return movement.type === movementFilter
  })
  
  return (
    <div className="h-full flex flex-col">
      <div className="glass border-b border-purple-100/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {material.name}
            </h1>
            <p className="text-gray-600">{material.group.name}</p>
            {material.minStock > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Minimální zásoba: {material.minStock} ks
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-white/80 text-purple-600 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Upravit
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-white/80 text-red-600 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Smazat
            </button>
            <button
              onClick={onAddMovement}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
            >
              + Nový pohyb
            </button>
          </div>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Historie pohybů</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMovementFilter('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                movementFilter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/60 text-gray-700 hover:bg-white'
              }`}
            >
              Vše
            </button>
            <button
              onClick={() => setMovementFilter('in')}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                movementFilter === 'in'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/60 text-gray-700 hover:bg-white'
              }`}
            >
              Příjem
            </button>
            <button
              onClick={() => setMovementFilter('out')}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                movementFilter === 'out'
                  ? 'bg-red-600 text-white'
                  : 'bg-white/60 text-gray-700 hover:bg-white'
              }`}
            >
              Výdej
            </button>
          </div>
        </div>

        {filteredMovements.length > 0 ? (
          <div className="space-y-3">
            {filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="glass rounded-xl p-4 shadow-soft border border-purple-100/30 hover:shadow-glow hover:border-purple-200/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      movement.type === 'DELIVERY' || movement.type === 'PURCHASE'
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                        : movement.type === 'SALE'
                        ? movement.client
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                          : 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700'
                        : movement.type === 'USAGE'
                        ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                        : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                    }`}>
                      {movement.type === 'DELIVERY' || movement.type === 'PURCHASE'
                        ? '📦 Příjem'
                        : movement.type === 'SALE'
                        ? movement.client
                          ? '🛍️ Prodej'
                          : '🛒 Prodej (anonymní)'
                        : movement.type === 'USAGE'
                        ? '🔧 Výdej pro práci'
                        : '🏥 Návštěva'
                      }
                    </span>
                    <span className="font-semibold text-gray-900">
                      {(movement.type === 'DELIVERY' || movement.type === 'PURCHASE') ? '+' : '-'}{Math.abs(movement.quantity)} ks
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
