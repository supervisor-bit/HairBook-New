'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClientGroup {
  id: string
  name: string
  isSystem: boolean
  _count: { clients: number }
}

interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string
  avatar: string | null
  group: { name: string } | null
  _count: { visits: number }
}

export default function ClientsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<ClientGroup[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', phone: '', groupId: '' })
  const [showEditForm, setShowEditForm] = useState(false)
  const [editClient, setEditClient] = useState({ firstName: '', lastName: '', phone: '', groupId: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '' })
  const [showEditGroupForm, setShowEditGroupForm] = useState(false)
  const [editGroup, setEditGroup] = useState({ id: '', name: '' })
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<ClientGroup | null>(null)

  useEffect(() => {
    loadGroups()
    loadClients()
    
    // Auto-select client from URL if present
    const params = new URLSearchParams(window.location.search)
    const clientId = params.get('clientId')
    if (clientId) {
      fetch(`/api/clients/${clientId}`)
        .then(res => res.json())
        .then(data => setSelectedClient(data))
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [selectedGroup])

  const loadGroups = async () => {
    const res = await fetch('/api/client-groups')
    const data = await res.json()
    setGroups([{ id: 'all', name: 'Všichni', isSystem: true, _count: { clients: data.totalClients } }, ...data.groups])
  }

  const loadClients = async () => {
    const url = selectedGroup === 'all' 
      ? '/api/clients' 
      : `/api/clients?groupId=${selectedGroup}`
    const res = await fetch(url)
    const data = await res.json()
    setClients(data)
  }

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client)
    const res = await fetch(`/api/clients/${client.id}`)
    const fullData = await res.json()
    setSelectedClient(fullData)
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient),
    })
    
    if (res.ok) {
      setNewClient({ firstName: '', lastName: '', phone: '', groupId: '' })
      setShowNewClientForm(false)
      loadClients()
    }
  }

  const reloadClientDetail = async () => {
    if (!selectedClient) return
    const res = await fetch(`/api/clients/${selectedClient.id}`)
    if (res.ok) {
      const updatedClient = await res.json()
      setSelectedClient(updatedClient)
    }
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return
    
    const res = await fetch(`/api/clients/${selectedClient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editClient),
    })
    
    if (res.ok) {
      setShowEditForm(false)
      loadClients()
      const updatedClient = await res.json()
      setSelectedClient(updatedClient)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return
    
    const res = await fetch(`/api/clients/${selectedClient.id}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      setShowDeleteConfirm(false)
      setSelectedClient(null)
      loadClients()
    }
  }

  const openEditForm = () => {
    if (!selectedClient) return
    setEditClient({
      firstName: selectedClient.firstName,
      lastName: selectedClient.lastName,
      phone: selectedClient.phone,
      groupId: (selectedClient as any).groupId || '',
    })
    setShowEditForm(true)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/client-groups', {
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
    const res = await fetch(`/api/client-groups/${editGroup.id}`, {
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

  const openEditGroupForm = (group: ClientGroup) => {
    setEditGroup({ id: group.id, name: group.name })
    setShowEditGroupForm(true)
  }

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return
    
    const res = await fetch(`/api/client-groups/${groupToDelete.id}`, {
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

  const openDeleteGroupConfirm = (group: ClientGroup) => {
    setGroupToDelete(group)
    setShowDeleteGroupConfirm(true)
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
                    {group._count?.clients || 0}
                  </span>
                </button>
                {!group.isSystem && (
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

      {/* Clients list */}
      <div className="w-80 glass border-r border-purple-100/50 flex flex-col">
        <div className="p-4 border-b border-purple-100/50">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat klienta..."
            className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {clients.filter(client => {
            const fullName = `${client.firstName} ${client.lastName}`.toLowerCase()
            const phone = client.phone?.toLowerCase() || ''
            const query = searchQuery.toLowerCase()
            return fullName.includes(query) || phone.includes(query)
          }).map((client) => (
            <button
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className={`
                w-full text-left p-4 border-b border-purple-100/30 transition-all duration-200
                ${selectedClient?.id === client.id
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 shadow-soft'
                  : 'hover:bg-white/60 hover:shadow-soft'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(client.firstName)} flex items-center justify-center text-white font-semibold shadow-md`}>
                  {client.avatar || `${client.firstName[0]}${client.lastName[0]}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {client.firstName} {client.lastName}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {client.phone}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-purple-100/50">
          <button
            onClick={() => setShowNewClientForm(true)}
            className="w-full py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
          >
            + Přidat klienta
          </button>
        </div>
      </div>

      {/* Client detail */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-purple-50/30">
        {selectedClient ? (
          <ClientDetail 
            client={selectedClient} 
            onEdit={openEditForm}
            onDelete={() => setShowDeleteConfirm(true)}
            onReload={reloadClientDetail}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-lg">Vyberte klienta ze seznamu</p>
            </div>
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showNewClientForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNewClientForm(false)}>
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Nový klient</h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <input
                type="text"
                placeholder="Jméno"
                value={newClient.firstName}
                onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
                autoFocus
              />
              <input
                type="text"
                placeholder="Příjmení"
                value={newClient.lastName}
                onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <select
                value={newClient.groupId}
                onChange={(e) => setNewClient({ ...newClient, groupId: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Bez skupiny</option>
                {groups.filter(g => g.id !== 'all').map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(false)}
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

      {/* Edit Client Modal */}
      {showEditForm && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEditForm(false)}>
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Upravit klienta</h2>
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <input
                type="text"
                placeholder="Jméno"
                value={editClient.firstName}
                onChange={(e) => setEditClient({ ...editClient, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
                autoFocus
              />
              <input
                type="text"
                placeholder="Příjmení"
                value={editClient.lastName}
                onChange={(e) => setEditClient({ ...editClient, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={editClient.phone}
                onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <select
                value={editClient.groupId}
                onChange={(e) => setEditClient({ ...editClient, groupId: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Bez skupiny</option>
                {groups.filter(g => g.id !== 'all').map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-red-100/50 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Smazat klienta?</h2>
              <p className="text-gray-600">
                Opravdu chcete smazat klienta <strong>{selectedClient.firstName} {selectedClient.lastName}</strong>?
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium mb-2">
                🚨 Tato akce je nevratná!
              </p>
              <p className="text-sm text-red-700">
                Budou smazány také všechny návštěvy tohoto klienta ({selectedClient._count?.visits || 0} návštěv).
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
              >
                Zrušit
              </button>
              <button
                onClick={handleDeleteClient}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
              >
                Ano, smazat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroupForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">Nová skupina</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Název skupiny"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
                autoFocus
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewGroupForm(false)
                    setNewGroup({ name: '' })
                  }}
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
            <form onSubmit={handleEditGroup} className="space-y-4">
              <input
                type="text"
                value={editGroup.name}
                onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
                placeholder="Název skupiny"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
                autoFocus
              />
              <div className="flex gap-3 pt-2">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDeleteGroupConfirm(false)}>
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-red-100/50 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Smazat skupinu?</h2>
              <p className="text-gray-600">
                Opravdu chcete smazat skupinu <strong>{groupToDelete.name}</strong>?
              </p>
            </div>
            
            {groupToDelete._count.clients > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  ❌ Nelze smazat skupinu s klienty ({groupToDelete._count.clients})
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Nejprve přesuňte nebo smažte všechny klienty ze skupiny.
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
                {groupToDelete._count.clients > 0 ? 'Zavřít' : 'Zrušit'}
              </button>
              {groupToDelete._count.clients === 0 && (
                <button
                  onClick={handleDeleteGroup}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Ano, smazat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ClientDetail({ client, onEdit, onDelete, onReload }: { client: any, onEdit: () => void, onDelete: () => void, onReload: () => void }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'visits' | 'products' | 'notes'>('visits')
  const [previewVisit, setPreviewVisit] = useState<any>(null)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<any>(null)
  const [noteText, setNoteText] = useState('')
  const [showDeleteNoteConfirm, setShowDeleteNoteConfirm] = useState<any>(null)
  const [showDeleteVisitConfirm, setShowDeleteVisitConfirm] = useState<any>(null)
  
  // Products state - Mini POS
  const [showProductForm, setShowProductForm] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [productCart, setProductCart] = useState<{materialId: string, quantity: number, price: number}[]>([])
  const [searchProduct, setSearchProduct] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [showDeleteProductConfirm, setShowDeleteProductConfirm] = useState<any>(null)

  // Load materials for product selection
  useEffect(() => {
    if (showProductForm) {
      fetch('/api/materials')
        .then(res => res.json())
        .then(data => setMaterials(data))
    }
  }, [showProductForm])

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    
    const res = await fetch(`/api/clients/${client.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText }),
    })
    
    if (res.ok) {
      setNoteText('')
      setShowNoteForm(false)
      onReload()
    }
  }

  const handleUpdateNote = async () => {
    if (!noteText.trim() || !editingNote) return
    
    const res = await fetch(`/api/clients/${client.id}/notes/${editingNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText }),
    })
    
    if (res.ok) {
      setNoteText('')
      setEditingNote(null)
      onReload()
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const res = await fetch(`/api/clients/${client.id}/notes/${noteId}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      setShowDeleteNoteConfirm(null)
      onReload()
    }
  }

  const openNoteForm = () => {
    setEditingNote(null)
    setNoteText('')
    setShowNoteForm(true)
  }

  // Product functions - Mini POS
  const addToCart = (materialId: string, price: number = 0) => {
    const existing = productCart.find(item => item.materialId === materialId)
    if (existing) {
      setProductCart(productCart.map(item => 
        item.materialId === materialId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setProductCart([...productCart, { materialId, quantity: 1, price }])
    }
  }

  const updateCartQuantity = (materialId: string, quantity: number) => {
    if (quantity <= 0) {
      setProductCart(productCart.filter(item => item.materialId !== materialId))
    } else {
      setProductCart(productCart.map(item => 
        item.materialId === materialId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const removeFromCart = (materialId: string) => {
    setProductCart(productCart.filter(item => item.materialId !== materialId))
  }

  const getTotalPrice = () => {
    return productCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleSaveProducts = async () => {
    if (productCart.length === 0) return
    
    // Validate total price
    if (!totalPrice || totalPrice.trim() === '') {
      alert('Prosím zadejte celkovou cenu')
      return
    }
    
    // Save all products in one request
    const res = await fetch(`/api/clients/${client.id}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: productCart.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
        })),
        totalPrice: totalPrice && totalPrice.trim() !== '' ? totalPrice : null,
        note: null,
      }),
    })
    
    if (!res.ok) {
      const error = await res.json()
      alert(error.error || 'Chyba při ukládání produktů')
      return
    }
    
    setProductCart([])
    setTotalPrice('')
    setShowProductForm(false)
    onReload()
  }

  const handleDeleteProduct = async (productId: string) => {
    const res = await fetch(`/api/clients/${client.id}/products/${productId}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      setShowDeleteProductConfirm(null)
      onReload()
    }
  }

  const openProductForm = () => {
    setProductCart([])
    setSearchProduct('')
    setTotalPrice('')
    setShowProductForm(true)
  }

  const openEditNote = (note: any) => {
    setEditingNote(note)
    setNoteText(note.note)
    setShowNoteForm(true)
  }

  const handleDuplicateVisit = async (visitId: string) => {
    const res = await fetch(`/api/visits/${visitId}/duplicate`, {
      method: 'POST',
    })
    
    if (res.ok) {
      const duplicatedVisit = await res.json()
      // Přesměrovat na editaci duplikované návštěvy
      router.push(`/clients/${duplicatedVisit.clientId}/visit/${duplicatedVisit.id}`)
    }
  }

  const handleDeleteVisit = async (visitId: string) => {
    const res = await fetch(`/api/visits/${visitId}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      setShowDeleteVisitConfirm(null)
      onReload()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass border-b border-purple-100/50 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-full ${getAvatarColor(client.firstName)} flex items-center justify-center text-white text-2xl font-semibold shadow-lg`}>
            {client.avatar || `${client.firstName[0]}${client.lastName[0]}`}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-gray-600 mb-3">{client.phone}</p>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Počet návštěv</div>
                <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {client.visits?.length || 0}
                </div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Celkem utraceno</div>
                <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  {client.visits?.reduce((sum: number, v: any) => sum + (v.totalPrice || 0), 0).toLocaleString('cs-CZ')} Kč
                </div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Zakoupené produkty</div>
                <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  {(() => {
                    const grouped = (client.homeProducts || []).reduce((acc: any, p: any) => {
                      const key = p.purchaseId || p.id
                      if (!acc[key]) acc[key] = p
                      return acc
                    }, {})
                    return Object.values(grouped).reduce((sum: number, p: any) => sum + (p.totalPrice || 0), 0).toLocaleString('cs-CZ')
                  })()} Kč
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
            >
              ✏️ Upravit
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-3 bg-white/80 text-red-600 rounded-lg font-medium hover:bg-red-50 hover:shadow-soft transition-all duration-200"
            >
              🗑️ Smazat
            </button>
            <button
              onClick={() => router.push(`/clients/${client.id}/visit/new`)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
            >
              + Nová návštěva
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-purple-100/50">
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 flex items-center gap-2 ${
              activeTab === 'visits'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            <span>📋 Historie návštěv</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'visits'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {client.visits?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            <span>🛍️ Zakoupené produkty</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {client.homeProducts?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            <span>📝 Poznámky</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'notes'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {client.notes?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'visits' && (
          <div className="space-y-4">
            {client.visits?.length > 0 ? (
              client.visits.map((visit: any) => (
                <div
                  key={visit.id}
                  className="glass rounded-xl p-4 shadow-soft border border-purple-100/30 hover:shadow-glow hover:border-purple-200/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1" onClick={() => router.push(`/clients/${client.id}/visit/${visit.id}`)} style={{cursor: 'pointer'}}>
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-900">
                          {new Date(visit.createdAt).toLocaleDateString('cs-CZ')}
                        </div>
                        {visit.totalPrice && (
                          <div className="text-lg font-bold text-purple-600">
                            {visit.totalPrice.toFixed(0)} Kč
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {visit.services.length} služeb
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewVisit(visit)
                        }}
                        className="p-2 bg-white/80 text-purple-600 rounded-lg hover:bg-purple-50 hover:shadow-soft transition-all duration-200"
                        title="Rychlý náhled"
                      >
                        👁️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateVisit(visit.id)
                        }}
                        className="p-2 bg-white/80 text-blue-600 rounded-lg hover:bg-blue-50 hover:shadow-soft transition-all duration-200"
                        title="Duplikovat návštěvu"
                      >
                        📋
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteVisitConfirm(visit)
                        }}
                        className="p-2 bg-white/80 text-red-600 rounded-lg hover:bg-red-50 hover:shadow-soft transition-all duration-200"
                        title="Smazat návštěvu"
                      >
                        🗑️
                      </button>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        visit.status === 'closed'
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                          : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700'
                      }`}>
                        {visit.status === 'closed' ? 'Uzavřena' : 'Uložena'}
                      </span>
                    </div>
                  </div>
                  {visit.note && (
                    <p className="text-sm text-gray-600">{visit.note}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-12">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-lg">Zatím žádné návštěvy</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Zakoupené produkty</h3>
              <button
                onClick={openProductForm}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200 text-sm"
              >
                + Nový produkt
              </button>
            </div>

            {client.homeProducts?.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  // Group products by purchaseId
                  const grouped = client.homeProducts.reduce((acc: any, product: any) => {
                    const key = product.purchaseId || product.id
                    if (!acc[key]) {
                      acc[key] = []
                    }
                    acc[key].push(product)
                    return acc
                  }, {})

                  // Sort groups by latest createdAt
                  const sortedGroups = Object.values(grouped).sort((a: any, b: any) => {
                    return new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime()
                  })

                  return sortedGroups.map((products: any) => {
                    const firstProduct = products[0]
                    const totalQuantity = products.reduce((sum: number, p: any) => sum + p.quantity, 0)
                    
                    return (
                      <div key={firstProduct.purchaseId || firstProduct.id} className="glass rounded-lg p-4 shadow-soft border border-purple-100/30 hover:shadow-glow hover:scale-[1.01] transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-sm text-gray-500">
                                {new Date(firstProduct.createdAt).toLocaleDateString('cs-CZ', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </div>
                              {firstProduct.totalPrice && (
                                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold">
                                  {firstProduct.totalPrice.toLocaleString('cs-CZ')} Kč
                                </span>
                              )}
                            </div>
                            
                            {/* List of products */}
                            <div className="space-y-2">
                              {products.map((product: any) => (
                                <div key={product.id} className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{product.material.name}</span>
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                    {product.quantity} ks
                                  </span>
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                    {product.material.group.name}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {firstProduct.note && (
                              <p className="text-sm text-gray-600 mt-2">{firstProduct.note}</p>
                            )}
                          </div>
                          <button
                            onClick={() => setShowDeleteProductConfirm(firstProduct)}
                            className="p-2 bg-white/80 text-red-600 rounded-lg hover:bg-red-50 hover:shadow-soft transition-all duration-200 ml-4"
                            title="Smazat"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <div className="text-5xl mb-4">🛍️</div>
                <p>Zatím žádné zakoupené produkty</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Poznámky</h3>
              <button
                onClick={openNoteForm}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200 text-sm"
              >
                + Nová poznámka
              </button>
            </div>

            {client.notes?.length > 0 ? (
              <div className="space-y-3">
                {client.notes.map((note: any) => (
                  <div key={note.id} className="glass rounded-lg p-4 shadow-soft border border-purple-100/30 hover:shadow-glow hover:scale-[1.01] transition-all duration-200 cursor-default">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString('cs-CZ', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditNote(note)}
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          ✏️ Upravit
                        </button>
                        <button
                          onClick={() => setShowDeleteNoteConfirm(note)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          🗑️ Smazat
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <div className="text-5xl mb-4">📝</div>
                <p>Zatím žádné poznámky</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visit Preview Modal */}
      {previewVisit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewVisit(null)}>
          <div className="glass rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-glow border border-purple-100/50" onClick={(e) => e.stopPropagation()}>
            {/* Header - Fixed */}
            <div className="p-6 border-b border-purple-100/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {new Date(previewVisit.createdAt).toLocaleDateString('cs-CZ', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h2>
                  <p className="text-gray-600">
                    {new Date(previewVisit.createdAt).toLocaleTimeString('cs-CZ', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {previewVisit.totalPrice && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Celková cena</div>
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                        {previewVisit.totalPrice.toLocaleString('cs-CZ')} Kč
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setPreviewVisit(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  previewVisit.status === 'closed'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                    : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700'
                }`}>
                  {previewVisit.status === 'closed' ? '✓ Uzavřena - materiály odepsány' : '💾 Uložena'}
                </span>
              </div>
            </div>

            {/* Services - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {previewVisit.services.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Služby ({previewVisit.services.length})
                  </h3>
                  <div className="space-y-3">
                    {previewVisit.services.map((vs: any) => (
                      <div key={vs.id} className="bg-white/60 rounded-lg p-4 border border-purple-100/50">
                        <div className="font-semibold text-gray-900 mb-3">
                          💇 {vs.service.name}
                        </div>
                        {vs.materials.length > 0 && (
                          <div className="ml-5 space-y-2">
                            <div className="text-sm font-medium text-gray-600 mb-2">Použité materiály:</div>
                            {vs.materials.map((vm: any) => (
                              <div key={vm.id} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                                <span className="text-gray-700">
                                  • {vm.material.name}
                                </span>
                                <span className="text-gray-600 font-semibold">
                                  {vm.quantity} {vm.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Note */}
              {previewVisit.note && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="text-sm font-semibold text-blue-800 mb-2">
                    📝 Poznámka
                  </div>
                  <p className="text-gray-700">{previewVisit.note}</p>
                </div>
              )}
            </div>

            {/* Actions - Fixed */}
            <div className="p-6 border-t border-purple-100/50 flex gap-3">
              <button
                onClick={() => setPreviewVisit(null)}
                className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
              >
                Zavřít
              </button>
              <button
                onClick={() => {
                  setPreviewVisit(null)
                  router.push(`/clients/${client.id}/visit/${previewVisit.id}`)
                }}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
              >
                Otevřít detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Form Modal */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNoteForm(false)}>
          <div className="glass rounded-2xl max-w-2xl w-full shadow-glow border border-purple-100/50" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-purple-100/50">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingNote ? 'Upravit poznámku' : 'Nová poznámka'}
              </h2>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('cs-CZ', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Napište poznámku..."
                className="w-full h-40 px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-purple-100/50 flex gap-3">
              <button
                onClick={() => {
                  setShowNoteForm(false)
                  setEditingNote(null)
                  setNoteText('')
                }}
                className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
              >
                Zrušit
              </button>
              <button
                onClick={editingNote ? handleUpdateNote : handleAddNote}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!noteText.trim()}
              >
                {editingNote ? 'Uložit' : 'Přidat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Visit Confirmation Modal */}
      {showDeleteVisitConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteVisitConfirm(null)}>
          <div className="glass rounded-2xl max-w-md w-full shadow-glow border border-purple-100/50" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Smazat návštěvu?</h2>
                <p className="text-gray-600 mb-2">
                  Tato akce je nevratná.
                </p>
                <p className="text-sm text-gray-500">
                  {showDeleteVisitConfirm.status === 'closed' 
                    ? 'Návštěva je uzavřená - materiály už byly odepsány ze skladu.' 
                    : 'Návštěva je uložená - materiály nebyly odepsány.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteVisitConfirm(null)}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleDeleteVisit(showDeleteVisitConfirm.id)}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product POS Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProductForm(false)}>
          <div className="glass rounded-2xl max-w-6xl w-full shadow-glow border border-purple-100/50 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-purple-100/50">
              <h2 className="text-2xl font-bold text-gray-900">Prodej produktů</h2>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('cs-CZ', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Content - Two columns */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left: Product list */}
              <div className="w-2/3 p-6 overflow-y-auto border-r border-purple-100/50">
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="🔍 Hledat produkt..."
                    className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {materials
                    .filter(m => {
                      const matchesSearch = m.name.toLowerCase().includes(searchProduct.toLowerCase())
                      const isRetail = m.isRetailProduct
                      return matchesSearch && isRetail
                    })
                    .map((material) => (
                    <button
                      key={material.id}
                      onClick={() => addToCart(material.id, 0)}
                      disabled={material.stockQuantity <= 0}
                      className="glass p-4 rounded-lg text-left hover:shadow-glow hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-100/30"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-semibold text-gray-900">{material.name}</div>
                        {material.isRetailProduct && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium whitespace-nowrap">
                            🏠 Retail
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{material.group.name}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-sm font-medium ${material.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Sklad: {material.stockQuantity} ks
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Cart */}
              <div className="w-1/3 p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Košík</h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {productCart.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <div className="text-4xl mb-2">🛒</div>
                      <p>Košík je prázdný</p>
                    </div>
                  ) : (
                    productCart.map((item) => {
                      const material = materials.find(m => m.id === item.materialId)
                      if (!material) return null
                      
                      return (
                        <div key={item.materialId} className="glass p-3 rounded-lg border border-purple-100/30">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">{material.name}</div>
                              <div className="text-xs text-gray-500">{material.group.name}</div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.materialId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.materialId, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.materialId, parseInt(e.target.value) || 0)}
                              className="w-16 text-center px-2 py-1 border border-purple-200 rounded-lg"
                              min="1"
                            />
                            <button
                              onClick={() => updateCartQuantity(item.materialId, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold"
                            >
                              +
                            </button>
                            <span className="text-sm text-gray-600 ml-auto">ks</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Total */}
                {productCart.length > 0 && (
                  <div className="border-t border-purple-100/50 pt-4 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Celkem položek:</span>
                      <span className="font-semibold">{productCart.reduce((sum, item) => sum + item.quantity, 0)} ks</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celková cena
                      </label>
                      <input
                        type="number"
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(e.target.value)}
                        placeholder="Zadejte celkovou cenu"
                        className="w-full px-3 py-2 bg-white/60 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowProductForm(false)
                      setProductCart([])
                      setTotalPrice('')
                    }}
                    className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleSaveProducts}
                    disabled={productCart.length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Uložit ({productCart.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {showDeleteProductConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteProductConfirm(null)}>
          <div className="glass rounded-2xl max-w-md w-full shadow-glow border border-red-100/50" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Smazat nákup?</h2>
                <p className="text-gray-600 mb-4">
                  Opravdu chcete smazat tento nákup?
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-medium mb-2">
                  🚨 Tato akce je nevratná!
                </p>
                <p className="text-sm text-red-700">
                  Budou smazány také všechny skladové pohyby tohoto nákupu.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteProductConfirm(null)}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleDeleteProduct(showDeleteProductConfirm.id)}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Ano, smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirmation Modal */}
      {showDeleteNoteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteNoteConfirm(null)}>
          <div className="glass rounded-2xl max-w-md w-full shadow-glow border border-purple-100/50" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Smazat poznámku?</h2>
                <p className="text-gray-600">
                  Tato akce je nevratná.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteNoteConfirm(null)}
                  className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleDeleteNote(showDeleteNoteConfirm.id)}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
