'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Service {
  id: string
  name: string
}

interface ServiceGroup {
  id: string
  name: string
  services: Service[]
}

interface Material {
  id: string
  name: string
  unit: string
  packageSize: number
  stockQuantity: number
  group: {
    name: string
  }
}

interface VisitMaterial {
  id: string
  material: Material
  quantity: number
  unit: string
}

interface VisitService {
  id: string
  service: Service
  materials: VisitMaterial[]
}

interface Visit {
  id: string
  status: string
  client: {
    firstName: string
    lastName: string
  }
  services: VisitService[]
}

export default function NewVisitPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  
  const [visit, setVisit] = useState<Visit | null>(null)
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialQuantity, setMaterialQuantity] = useState('')
  const [materialUnit, setMaterialUnit] = useState<'g' | 'ml' | 'ks'>('g')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [totalPrice, setTotalPrice] = useState('')
  const [visitNote, setVisitNote] = useState('')
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterialGroup, setSelectedMaterialGroup] = useState<string | null>(null)
  const [showRemoveServiceDialog, setShowRemoveServiceDialog] = useState(false)
  const [serviceToRemove, setServiceToRemove] = useState<{id: string, name: string, materialsCount: number} | null>(null)
  const [showRemoveMaterialDialog, setShowRemoveMaterialDialog] = useState(false)
  const [materialToRemove, setMaterialToRemove] = useState<{visitServiceId: string, visitMaterialId: string, materialName: string} | null>(null)
  const servicesEndRef = useRef<HTMLDivElement>(null)
  const priceInputRef = useRef<HTMLInputElement>(null)
  const materialQuantityInputRef = useRef<HTMLInputElement>(null)
  
  // Quick mode state
  const [quickMode, setQuickMode] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<Map<string, {quantity: string, unit: 'g' | 'ml' | 'ks'}>>(new Map())
  
  // Edit material state
  const [editingMaterial, setEditingMaterial] = useState<{visitServiceId: string, visitMaterialId: string} | null>(null)

  useEffect(() => {
    createVisit()
    loadServiceGroups()
    loadMaterials()
  }, [])

  useEffect(() => {
    if (showCloseDialog && priceInputRef.current) {
      priceInputRef.current.focus()
    }
  }, [showCloseDialog])

  useEffect(() => {
    if (selectedMaterial && materialQuantityInputRef.current) {
      materialQuantityInputRef.current.focus()
    }
  }, [selectedMaterial])

  const createVisit = async () => {
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    const data = await res.json()
    await loadVisit(data.id)
  }

  const loadVisit = async (visitId: string) => {
    const res = await fetch(`/api/visits/${visitId}`)
    const data = await res.json()
    setVisit(data)
    return data
  }

  const loadServiceGroups = async () => {
    const res = await fetch('/api/services')
    const data = await res.json()
    setServiceGroups(data)
  }

  const loadMaterials = async () => {
    const res = await fetch('/api/materials')
    const data = await res.json()
    setMaterials(data)
  }

  const handleAddService = async (serviceId: string) => {
    if (!visit) return
    
    const res = await fetch(`/api/visits/${visit.id}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId }),
    })
    
    if (res.ok) {
      const updatedVisit = await loadVisit(visit.id)
      
      // Automatically show materials for the newly added service
      if (updatedVisit?.services && updatedVisit.services.length > 0) {
        const newService = updatedVisit.services[updatedVisit.services.length - 1]
        setSelectedServiceId(newService.id)
      }
      
      setTimeout(() => {
        servicesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
    }
  }

  const handleRemoveService = (visitServiceId: string) => {
    if (!visit) return
    
    const service = visit.services.find(s => s.id === visitServiceId)
    if (!service) return
    
    setServiceToRemove({
      id: visitServiceId,
      name: service.service.name,
      materialsCount: service.materials.length
    })
    setShowRemoveServiceDialog(true)
  }

  const confirmRemoveService = async () => {
    if (!visit || !serviceToRemove) return
    
    const res = await fetch(`/api/visits/${visit.id}/services/${serviceToRemove.id}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      await loadVisit(visit.id)
      setShowRemoveServiceDialog(false)
      setServiceToRemove(null)
    }
  }

  const handleAddMaterial = async () => {
    if (!visit || !selectedServiceId || !selectedMaterial || !materialQuantity) return
    
    const currentServiceId = selectedServiceId
    
    const res = await fetch(`/api/visits/${visit.id}/services/${selectedServiceId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materialId: selectedMaterial.id,
        quantity: parseFloat(materialQuantity),
        unit: materialUnit,
      }),
    })
    
    if (res.ok) {
      await loadVisit(visit.id)
      setSelectedMaterial(null)
      setMaterialQuantity('')
      setMaterialSearch('')
      
      setTimeout(() => {
        const serviceElement = document.getElementById(`service-${currentServiceId}`)
        serviceElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }

  const handleEditMaterial = (visitServiceId: string, visitMaterialId: string) => {
    if (!visit) return
    
    const service = visit.services.find(s => s.id === visitServiceId)
    if (!service) return
    
    const material = service.materials.find(m => m.id === visitMaterialId)
    if (!material) return
    
    setEditingMaterial({ visitServiceId, visitMaterialId })
    setSelectedServiceId(visitServiceId)
    setSelectedMaterial(material.material)
    setMaterialQuantity(material.quantity.toString())
    setMaterialUnit(material.unit as 'g' | 'ml' | 'ks')
  }

  const handleUpdateMaterial = async () => {
    if (!visit || !editingMaterial || !selectedMaterial || !materialQuantity) return
    
    const res = await fetch(`/api/visits/${visit.id}/services/${editingMaterial.visitServiceId}/materials/${editingMaterial.visitMaterialId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: parseFloat(materialQuantity),
        unit: materialUnit,
      }),
    })
    
    if (res.ok) {
      await loadVisit(visit.id)
      setEditingMaterial(null)
      setSelectedMaterial(null)
      setMaterialQuantity('')
      setMaterialSearch('')
    }
  }

  const handleRemoveMaterial = (visitServiceId: string, visitMaterialId: string) => {
    if (!visit) return
    
    const service = visit.services.find(s => s.id === visitServiceId)
    if (!service) return
    
    const material = service.materials.find(m => m.id === visitMaterialId)
    if (!material) return
    
    setMaterialToRemove({
      visitServiceId,
      visitMaterialId,
      materialName: material.material.name
    })
    setShowRemoveMaterialDialog(true)
  }

  const confirmRemoveMaterial = async () => {
    if (!visit || !materialToRemove) return
    
    const res = await fetch(`/api/visits/${visit.id}/services/${materialToRemove.visitServiceId}/materials/${materialToRemove.visitMaterialId}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      await loadVisit(visit.id)
      setShowRemoveMaterialDialog(false)
      setMaterialToRemove(null)
    }
  }

  const handleCloseVisit = async () => {
    if (!visit) return
    
    const res = await fetch(`/api/visits/${visit.id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        note: visitNote,
      }),
    })
    
    if (res.ok) {
      router.push(`/clients?clientId=${clientId}`)
    }
  }

  const toggleMaterialSelection = (materialId: string) => {
    const newSelected = new Map(selectedMaterials)
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId)
    } else {
      newSelected.set(materialId, { quantity: '', unit: 'g' })
    }
    setSelectedMaterials(newSelected)
  }

  const updateMaterialQuantity = (materialId: string, quantity: string) => {
    const newSelected = new Map(selectedMaterials)
    const current = newSelected.get(materialId)
    if (current) {
      newSelected.set(materialId, { ...current, quantity })
      setSelectedMaterials(newSelected)
    }
  }

  const updateMaterialUnit = (materialId: string, unit: 'g' | 'ml' | 'ks') => {
    const newSelected = new Map(selectedMaterials)
    const current = newSelected.get(materialId)
    if (current) {
      newSelected.set(materialId, { ...current, unit })
      setSelectedMaterials(newSelected)
    }
  }

  const handleAddAllMaterials = async () => {
    if (!visit || !selectedServiceId || selectedMaterials.size === 0) return

    for (const [materialId, data] of selectedMaterials) {
      if (data.quantity && parseFloat(data.quantity) > 0) {
        await fetch(`/api/visits/${visit.id}/services/${selectedServiceId}/materials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialId,
            quantity: parseFloat(data.quantity),
            unit: data.unit,
          }),
        })
      }
    }

    await loadVisit(visit.id)
    setSelectedMaterials(new Map())
    setQuickMode(false)
    
    setTimeout(() => {
      const serviceElement = document.getElementById(`service-${selectedServiceId}`)
      serviceElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  if (!visit) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Načítání...</div>
      </div>
    )
  }

  const materialGroups = Array.from(new Set(materials.map(m => m.group.name)))
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(materialSearch.toLowerCase())
    const matchesGroup = !selectedMaterialGroup || m.group.name === selectedMaterialGroup
    return matchesSearch && matchesGroup
  })

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nová návštěva - {visit.client.firstName} {visit.client.lastName}
            </h1>
            <p className="text-sm text-gray-600">POS obrazovka</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/clients?clientId=${clientId}`)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              ← Zpět
            </button>
            <button
              onClick={() => router.push(`/clients?clientId=${clientId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Uložit rozpracované
            </button>
            <button
              onClick={() => setShowCloseDialog(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Uzavřít a odepsat materiál
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Services column */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Služby</h2>
          </div>

          <div className="space-y-4">
            {visit.services.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-5xl mb-4">💇</div>
                <p className="text-gray-500">Přidejte první službu</p>
              </div>
            ) : (
              visit.services.map((vs) => (
                <div key={vs.id} id={`service-${vs.id}`} className={`bg-white rounded-lg p-4 shadow-sm border transition-all duration-200 ${
                  selectedServiceId === vs.id 
                    ? 'border-purple-500 shadow-md ring-2 ring-purple-200' 
                    : 'border-gray-200 hover:shadow-md hover:border-purple-300'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{vs.service.name}</h3>
                    <button
                      onClick={() => handleRemoveService(vs.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕ Odebrat
                    </button>
                  </div>

                  {/* Materials for this service */}
                  <div className="space-y-2 mb-3">
                    {vs.materials.map((vm) => (
                      <div key={vm.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">
                          {vm.material.name} - {vm.quantity} {vm.unit}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditMaterial(vs.id, vm.id)
                            }}
                            className="text-purple-600 hover:text-purple-700 text-xs"
                          >
                            ✎
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveMaterial(vs.id, vm.id)
                            }}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedServiceId(vs.id)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Přidat materiál
                  </button>
                </div>
              ))
            )}
            <div ref={servicesEndRef} />
          </div>
        </div>

        {/* Right side - Quick select or Materials */}
        <div className="w-1/2 flex flex-col">
          {!selectedServiceId ? (
            /* Quick service select */
            <div className="bg-white border-b border-gray-200 p-4 overflow-y-auto" style={{maxHeight: '100%'}}>
            <h3 className="font-medium text-gray-900 mb-3">Rychlý výběr služby</h3>
            <div className="space-y-2">
              {serviceGroups.map((group) => (
                <div key={group.id}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{group.name}</h4>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {group.services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleAddService(service.id)}
                        className="px-3 py-2 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded text-sm transition-colors text-left"
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </div>
          ) : (
            /* Materials when service selected */
            <div className="bg-white h-full flex flex-col">
              {/* Fixed header with search and filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{editingMaterial ? 'Upravit materiál' : 'Přidat materiál'}</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setQuickMode(!quickMode)
                        setSelectedMaterials(new Map())
                        setSelectedMaterial(null)
                        setMaterialQuantity('')
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        quickMode
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⚡ Rychlý režim
                    </button>
                    <button
                      onClick={() => setSelectedServiceId(null)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Zpět na služby
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Hledat materiál..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Group filters */}
                <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMaterialGroup(null)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    !selectedMaterialGroup
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Vše
                </button>
                {materialGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectedMaterialGroup(group)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedMaterialGroup === group
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {group}
                  </button>
                ))}
                </div>
              </div>

              {/* Scrollable material selection */}
              <div className="flex-1 overflow-y-auto p-6">
                {!quickMode && !selectedMaterial ? (
                <div className="space-y-2">
                  {filteredMaterials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => {
                        setSelectedMaterial(material)
                        setMaterialUnit('g')
                      }}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-purple-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{material.name}</div>
                      <div className="text-sm text-gray-500">
                        Skladem: {material.stockQuantity} ks (= {material.stockQuantity * material.packageSize} {material.unit})
                      </div>
                    </button>
                  ))}
                </div>
              ) : quickMode ? (
                /* Quick mode - checkboxes with inline quantity/unit inputs */
                <div className="space-y-2 pb-20">
                  {filteredMaterials.map((material) => {
                    const isSelected = selectedMaterials.has(material.id)
                    const materialData = selectedMaterials.get(material.id)
                    
                    return (
                      <div
                        key={material.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMaterialSelection(material.id)}
                            className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{material.name}</div>
                            <div className="text-sm text-gray-500">
                              Skladem: {material.stockQuantity} ks (= {material.stockQuantity * material.packageSize} {material.unit})
                            </div>
                            
                            {isSelected && (
                              <div className="mt-3 flex items-center gap-2">
                                <input
                                  type="number"
                                  value={materialData?.quantity || ''}
                                  onChange={(e) => updateMaterialQuantity(material.id, e.target.value)}
                                  placeholder="Množství"
                                  className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  step="0.01"
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                                
                                <div className="flex gap-1">
                                  {(['g', 'ml', 'ks'] as const).map((unit) => (
                                    <button
                                      key={unit}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateMaterialUnit(material.id, unit)
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        materialData?.unit === unit
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      {unit}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : selectedMaterial ? (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="font-medium text-gray-900">{selectedMaterial.name}</div>
                    <div className="text-sm text-gray-500">
                      Skladem: {selectedMaterial.stockQuantity} {selectedMaterial.unit}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Množství
                    </label>
                    <input
                      ref={materialQuantityInputRef}
                      type="number"
                      value={materialQuantity}
                      onChange={(e) => setMaterialQuantity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && materialQuantity && parseFloat(materialQuantity) > 0) {
                          editingMaterial ? handleUpdateMaterial() : handleAddMaterial()
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jednotka
                    </label>
                    <div className="flex gap-2">
                      {(['g', 'ml', 'ks'] as const).map((unit) => (
                        <button
                          key={unit}
                          onClick={() => setMaterialUnit(unit)}
                          className={`flex-1 px-4 py-2 rounded-lg border ${
                            materialUnit === unit
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedMaterial(null)
                        setMaterialQuantity('')
                        setMaterialSearch('')
                        setEditingMaterial(null)
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Zrušit
                    </button>
                    <button
                      onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial}
                      disabled={!materialQuantity || parseFloat(materialQuantity) <= 0}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingMaterial ? 'Uložit' : 'Přidat'}
                    </button>
                  </div>
                </div>
              ) : null}
              </div>

              {/* Sticky bottom panel for quick mode */}
              {quickMode && selectedMaterials.size > 0 && (
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-purple-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm">
                      <span className="text-gray-600">Vybráno:</span>
                      <span className="ml-2 font-semibold text-purple-600">
                        {selectedMaterials.size} {selectedMaterials.size === 1 ? 'materiál' : selectedMaterials.size < 5 ? 'materiály' : 'materiálů'}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedMaterials(new Map())
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                      >
                        Zrušit výběr
                      </button>
                      <button
                        onClick={handleAddAllMaterials}
                        disabled={Array.from(selectedMaterials.values()).some(m => !m.quantity || parseFloat(m.quantity) <= 0)}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transition-all"
                      >
                        Přidat všechny ({selectedMaterials.size})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Remove service dialog */}
      {showRemoveServiceDialog && serviceToRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => {
          setShowRemoveServiceDialog(false)
          setServiceToRemove(null)
        }}>
          <div className="glass rounded-2xl max-w-md w-full shadow-glow border border-purple-100/50" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Odebrat službu?</h2>
                <p className="text-gray-600 mb-3">
                  Opravdu chcete odebrat službu <strong>{serviceToRemove.name}</strong>?
                </p>
                {serviceToRemove.materialsCount > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm text-yellow-900 font-medium">
                      ⚠️ Táto služba obsahuje <strong>{serviceToRemove.materialsCount} materiál{serviceToRemove.materialsCount > 1 ? 'ů' : ''}</strong>, které budou také odebrány.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveServiceDialog(false)
                    setServiceToRemove(null)
                  }}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  onClick={confirmRemoveService}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Odebrat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove material dialog */}
      {showRemoveMaterialDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRemoveMaterialDialog(false)}>
          <div className="glass rounded-2xl max-w-md w-full shadow-glow border border-purple-100/50" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Odebrat materiál?</h2>
                <p className="text-gray-600">
                  Opravdu chcete odebrat materiál <span className="font-semibold">{materialToRemove?.materialName}</span>?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveMaterialDialog(false)
                    setMaterialToRemove(null)
                  }}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  onClick={confirmRemoveMaterial}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Odebrat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCloseDialog(false)}>
          <div className="glass rounded-2xl max-w-2xl w-full shadow-glow border border-purple-100/50 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {visit.services.length === 0 ? (
              /* Empty visit warning */
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Prázdná návštěva</h2>
                  <p className="text-gray-600">Nelze uzavřít návštěvu bez služeb. Přidejte alespoň jednu službu.</p>
                </div>
                <button
                  onClick={() => setShowCloseDialog(false)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Rozumím
                </button>
              </div>
            ) : (
              /* Normal close flow */
              <>
            <div className="p-6 border-b border-gray-200">
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Uzavřít návštěvu</h2>
                <p className="text-gray-600">Zkontrolujte souhrn a zadejte cenu</p>
              </div>
            </div>

            {/* Scrollable summary */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Materiály k odepsání</h3>
              <div className="space-y-2">
                {visit.services.flatMap(vs => vs.materials).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">🎨</div>
                    <p>Žádné materiály k odepsání</p>
                  </div>
                ) : (
                  visit.services.flatMap(vs => 
                    vs.materials.map(vm => ({
                      ...vm,
                      serviceName: vs.service.name
                    }))
                  ).map((vm, index) => (
                    <div key={`${vm.id}-${index}`} className="bg-white/80 rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{vm.material.name}</div>
                        <div className="text-xs text-gray-500">{vm.serviceName}</div>
                      </div>
                      <div className="text-sm font-semibold text-purple-600">
                        {vm.quantity} {vm.unit}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Price and note */}
            <div className="p-6 border-t border-gray-200 bg-white/50">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Celková cena (volitelné)
                </label>
                <input
                  ref={priceInputRef}
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                  step="0.01"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poznámka (volitelné)
                </label>
                <textarea
                  value={visitNote}
                  onChange={(e) => setVisitNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Poznámka k návštěvě..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseDialog(false)}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleCloseVisit}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Uzavřít a odepsat materiál
                </button>
              </div>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
