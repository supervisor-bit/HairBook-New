'use client'

import { useEffect, useState } from 'react'

interface ServiceGroup {
  id: string
  name: string
  services: Service[]
}

interface Service {
  id: string
  name: string
  groupId: string | null
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'groups'>('services')
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([])
  const [showNewServiceForm, setShowNewServiceForm] = useState(false)
  const [newService, setNewService] = useState({ name: '', groupId: '' })

  useEffect(() => {
    loadServiceGroups()
  }, [])

  const loadServiceGroups = async () => {
    const res = await fetch('/api/services')
    const data = await res.json()
    setServiceGroups(data)
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Create API endpoint
    setShowNewServiceForm(false)
    setNewService({ name: '', groupId: '' })
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-purple-50/30">
      <div className="glass border-b border-purple-100/50 p-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Nastavení</h1>
        
        <div className="flex gap-4 border-b border-purple-100/50">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
              activeTab === 'services'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            Služby
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
              activeTab === 'groups'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            Skupiny klientů
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'services' && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Číselník služeb</h2>
              <button
                onClick={() => setShowNewServiceForm(true)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
              >
                + Přidat službu
              </button>
            </div>

            <div className="space-y-4">
              {serviceGroups.map((group) => (
                <div key={group.id} className="glass rounded-xl p-6 shadow-soft border border-purple-100/30 hover:shadow-glow hover:border-purple-200/50 transition-all duration-200">
                  <h3 className="font-semibold text-gray-900 mb-4">{group.name}</h3>
                  <div className="space-y-2">
                    {group.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 bg-white/60 rounded-lg hover:bg-white hover:shadow-soft transition-all duration-200"
                      >
                        <span className="text-gray-900">{service.name}</span>
                        <div className="flex gap-3">
                          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
                            Upravit
                          </button>
                          <button className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                            Smazat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="max-w-4xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Skupiny klientů</h2>
            <div className="glass rounded-xl p-8 shadow-soft border border-purple-100/30">
              <p className="text-gray-600 text-center">
                Skupiny klientů můžete spravovat přímo v sekci Klienti.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Service Modal */}
      {showNewServiceForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Nová služba</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <input
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="Název služby"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <select
                value={newService.groupId}
                onChange={(e) => setNewService({ ...newService, groupId: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Vyberte skupinu</option>
                {serviceGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewServiceForm(false)}
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
    </div>
  )
}
