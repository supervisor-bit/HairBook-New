'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Group {
  id: string
  name: string
  order: number
}

interface Material {
  name: string
  groupId: string
  unit: string
  packageSize: number
  stockQuantity: number
  minStock: number
  isRetailProduct: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'groups' | 'materials'>('groups')
  const [groups, setGroups] = useState<Group[]>([{ id: 'temp-1', name: '', order: 0 }])
  const [materials, setMaterials] = useState<Material[]>([
    { name: '', groupId: '', unit: 'g', packageSize: 0, stockQuantity: 0, minStock: 0, isRetailProduct: false }
  ])
  const [saving, setSaving] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [step])

  const addGroupRow = () => {
    setGroups([...groups, { id: `temp-${Date.now()}`, name: '', order: groups.length }])
  }

  const updateGroup = (index: number, name: string) => {
    const newGroups = [...groups]
    newGroups[index].name = name
    setGroups(newGroups)
  }

  const removeGroup = (index: number) => {
    if (groups.length > 1) {
      setGroups(groups.filter((_, i) => i !== index))
    }
  }

  const addMaterialRow = () => {
    setMaterials([...materials, { name: '', groupId: '', unit: 'g', packageSize: 0, stockQuantity: 0, minStock: 0, isRetailProduct: false }])
  }

  const updateMaterial = (index: number, field: keyof Material, value: any) => {
    const newMaterials = [...materials]
    newMaterials[index][field] = value
    setMaterials(newMaterials)
  }

  const removeMaterial = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index))
    }
  }

  const handleGroupsNext = () => {
    const validGroups = groups.filter(g => g.name.trim())
    if (validGroups.length === 0) {
      alert('Přidejte alespoň jednu skupinu')
      return
    }
    setGroups(validGroups)
    setStep('materials')
  }

  const handleSave = async () => {
    const validGroups = groups.filter(g => g.name.trim())
    const validMaterials = materials.filter(m => m.name.trim() && m.groupId)

    if (validGroups.length === 0) {
      alert('Přidejte alespoň jednu skupinu')
      return
    }

    setSaving(true)
    try {
      // Nejdřív vytvoříme skupiny
      const groupsRes = await fetch('/api/materials/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groups: validGroups.map((g, i) => ({ name: g.name, order: i })),
          materials: [], // Zatím prázdné
        }),
      })

      if (!groupsRes.ok) throw new Error('Failed to create groups')
      
      const { groups: createdGroups } = await groupsRes.json()

      // Pokud jsou materiály, namapujeme je na reálné ID skupin
      if (validMaterials.length > 0) {
        const materialsWithRealIds = validMaterials.map(m => {
          const groupIndex = groups.findIndex(g => g.id === m.groupId)
          const realGroupId = createdGroups[groupIndex]?.id
          return { ...m, groupId: realGroupId }
        }).filter(m => m.groupId) // Pouze s validním groupId

        // Vytvoříme materiály jednotlivě
        await Promise.all(
          materialsWithRealIds.map(m =>
            fetch('/api/materials', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(m),
            })
          )
        )
      }

      router.push('/materials')
      router.refresh()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Chyba při ukládání')
      setSaving(false)
    }
  }

  const handleSkipMaterials = async () => {
    const validGroups = groups.filter(g => g.name.trim())
    
    if (validGroups.length === 0) {
      alert('Přidejte alespoň jednu skupinu')
      return
    }

    setSaving(true)
    try {
      await fetch('/api/materials/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groups: validGroups.map((g, i) => ({ name: g.name, order: i })),
          materials: [],
        }),
      })

      router.push('/materials')
      router.refresh()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Chyba při ukládání')
      setSaving(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Vítejte v HairBook
          </h1>
          <p className="text-gray-600 text-lg">
            {step === 'groups' 
              ? 'Pro začátek vytvořte skupiny materiálů (např. Šampony, Barvy, Folie...)'
              : 'Nyní můžete přidat materiály do skupin, nebo to můžete udělat později'
            }
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 'groups' ? 'text-purple-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'groups' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'}`}>
              {step === 'materials' ? '✓' : '1'}
            </div>
            <span className="font-medium">Skupiny</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step === 'materials' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'materials' ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <span className="font-medium">Materiály</span>
          </div>
        </div>

        {/* Content */}
        <div className="glass rounded-2xl p-8 shadow-glow border border-purple-100/50">
          {step === 'groups' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Skupiny materiálů</h2>
                <button
                  onClick={addGroupRow}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  + Přidat skupinu
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scroll-smooth">
                {groups.map((group, index) => (
                  <div key={group.id} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <input
                        ref={index === 0 ? firstInputRef : null}
                        type="text"
                        value={group.name}
                        onChange={(e) => updateGroup(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addGroupRow()
                            // Focus na nový input po krátké pauze
                            setTimeout(() => {
                              const inputs = document.querySelectorAll('input[type="text"]')
                              const nextInput = inputs[index + 1] as HTMLInputElement
                              if (nextInput) nextInput.focus()
                            }, 100)
                          }
                        }}
                        placeholder="Název skupiny (např. Šampony)"
                        className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    {groups.length > 1 && (
                      <button
                        onClick={() => removeGroup(index)}
                        className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleGroupsNext}
                  disabled={groups.filter(g => g.name.trim()).length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pokračovat →
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Materiály</h2>
                <button
                  onClick={addMaterialRow}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  + Přidat materiál
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto scroll-smooth">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                    <tr className="border-b border-purple-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Název</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Skupina</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Jednotka</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Obsah<br/>balení</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Počet<br/>balení</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Min.<br/>zásoba</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Prodej</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {materials.map((material, index) => (
                      <tr key={index}>
                        <td className="py-2 px-2">
                          <input
                            ref={index === 0 ? firstInputRef : null}
                            type="text"
                            value={material.name}
                            onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                if (index === materials.length - 1) {
                                  addMaterialRow()
                                  setTimeout(() => {
                                    const newRowInput = document.querySelector(`table tbody tr:nth-child(${materials.length + 1}) input`) as HTMLInputElement
                                    if (newRowInput) newRowInput.focus()
                                  }, 100)
                                } else {
                                  const nextRow = document.querySelector(`table tbody tr:nth-child(${index + 2}) input`) as HTMLInputElement
                                  if (nextRow) nextRow.focus()
                                }
                              }
                            }}
                            placeholder="Název"
                            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={material.groupId}
                            onChange={(e) => updateMaterial(index, 'groupId', e.target.value)}
                            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <option value="">Vyberte</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={material.unit}
                            onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="ks">ks</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={material.packageSize || ''}
                            onChange={(e) => updateMaterial(index, 'packageSize', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={material.stockQuantity || ''}
                            onChange={(e) => updateMaterial(index, 'stockQuantity', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={material.minStock || ''}
                            onChange={(e) => updateMaterial(index, 'minStock', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={material.isRetailProduct}
                            onChange={(e) => updateMaterial(index, 'isRetailProduct', e.target.checked)}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          {materials.length > 1 && (
                            <button
                              onClick={() => removeMaterial(index)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleSkipMaterials}
                  disabled={saving}
                  className="px-6 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Přeskočit (přidat později)
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || materials.filter(m => m.name.trim() && m.groupId).length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Ukládám...' : 'Uložit a začít'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 text-center text-sm text-gray-500">
          💡 Tip: Stiskněte Enter pro rychlé přidání dalšího řádku
        </div>
      </div>
    </div>
  )
}
