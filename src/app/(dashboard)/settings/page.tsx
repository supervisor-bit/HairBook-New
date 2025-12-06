'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'services' | 'salon' | 'password' | 'database'>('services')
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([])
  const [showNewServiceForm, setShowNewServiceForm] = useState(false)
  const [newService, setNewService] = useState({ name: '', groupId: '' })
  
  // Salon info state
  const [salonInfo, setSalonInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    ico: '',
    dic: '',
  })
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  // Database state
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  
  // Modal states
  const [showSalonSuccess, setShowSalonSuccess] = useState(false)
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)
  const [showPasswordError, setShowPasswordError] = useState('')

  useEffect(() => {
    loadServiceGroups()
    loadSalonSettings()
  }, [])

  const loadServiceGroups = async () => {
    const res = await fetch('/api/services')
    const data = await res.json()
    setServiceGroups(data)
  }

  const loadSalonSettings = async () => {
    const res = await fetch('/api/settings/salon')
    const data = await res.json()
    setSalonInfo({
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      ico: data.ico || '',
      dic: data.dic || '',
    })
  }

  const handleSaveSalonInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/settings/salon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salonInfo),
    })
    if (res.ok) {
      setShowSalonSuccess(true)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setShowPasswordError('Nová hesla se neshodují')
      return
    }
    
    if (passwordForm.newPassword.length < 4) {
      setShowPasswordError('Heslo musí mít alespoň 4 znaky')
      return
    }
    
    const res = await fetch('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    })
    
    if (res.ok) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordSuccess(true)
    } else {
      const error = await res.json()
      setShowPasswordError(error.error || 'Změna hesla se nezdařila')
    }
  }

  const handleResetDatabase = async () => {
    const res = await fetch('/api/database/reset', {
      method: 'POST',
    })
    
    if (res.ok) {
      setShowResetConfirm(false)
      alert('Databáze byla resetována. Heslo je nyní: admin')
      router.push('/login')
    }
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
        
        <div className="flex gap-4 border-b border-purple-100/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            ✨ Služby
          </button>
          <button
            onClick={() => setActiveTab('salon')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === 'salon'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            🏪 Informace o salonu
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === 'password'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            🔐 Reset hesla
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-lg'
            }`}
          >
            🗄️ Operace s databází
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

        {activeTab === 'salon' && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informace o salonu</h2>
            <div className="glass rounded-xl p-6 shadow-soft border border-purple-100/30">
              <form onSubmit={handleSaveSalonInfo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Název salonu</label>
                  <input
                    type="text"
                    value={salonInfo.name}
                    onChange={(e) => setSalonInfo({ ...salonInfo, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Můj salon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresa</label>
                  <input
                    type="text"
                    value={salonInfo.address}
                    onChange={(e) => setSalonInfo({ ...salonInfo, address: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Ulice 123, Praha"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={salonInfo.phone}
                      onChange={(e) => setSalonInfo({ ...salonInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="+420 123 456 789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={salonInfo.email}
                      onChange={(e) => setSalonInfo({ ...salonInfo, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="salon@email.cz"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IČO</label>
                    <input
                      type="text"
                      value={salonInfo.ico}
                      onChange={(e) => setSalonInfo({ ...salonInfo, ico: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">DIČ</label>
                    <input
                      type="text"
                      value={salonInfo.dic}
                      onChange={(e) => setSalonInfo({ ...salonInfo, dic: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="CZ12345678"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                  >
                    Uložit změny
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Změna hesla</h2>
            <div className="glass rounded-xl p-6 shadow-soft border border-purple-100/30">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Současné heslo</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nové heslo</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Potvrzení nového hesla</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                  >
                    Změnit heslo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Operace s databází</h2>
            
            <div className="space-y-4">
              {/* Export databáze */}
              <div className="glass rounded-xl p-6 shadow-soft border border-purple-100/30">
                <h3 className="font-semibold text-gray-900 mb-2">📦 Export databáze</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Vyexportujte kompletní zálohu vaší databáze. Zahrnuje všechny klienty, návštěvy, materiály a nastavení.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/database/export')
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'hairbook-backup.db'
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                        setShowExportSuccess(true)
                      }
                      } catch (error) {
                      console.error('Export failed:', error)
                      setShowPasswordError('Export databáze se nezdařil')
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Stáhnout zálohu
                </button>
              </div>

              {/* Reset databáze */}
              <div className="glass rounded-xl p-6 shadow-soft border border-red-100/30">
                <h3 className="font-semibold text-red-600 mb-2">⚠️ Reset databáze</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Smaže všechna data a vrátí aplikaci do výchozího stavu. Tato operace je nevratná!
                </p>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                >
                  Resetovat databázi
                </button>
              </div>
            </div>

            {showExportSuccess && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                      Export dokončen
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Záloha databáze byla úspěšně vyexportována.
                    </p>
                    <button
                      onClick={() => setShowExportSuccess(false)}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                    >
                      Zavřít
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showResetConfirm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-red-100/50 m-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">
                      Resetovat databázi?
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Opravdu chcete smazat všechna data? Tato operace je nevratná a odstraní všechny klienty, návštěvy, materiály a nastavení.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-3 bg-white/80 text-gray-700 rounded-lg font-medium hover:bg-white hover:shadow-soft transition-all duration-200"
                      >
                        Zrušit
                      </button>
                      <button
                        onClick={handleResetDatabase}
                        className="flex-1 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
                      >
                        Ano, resetovat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

      {/* Salon Info Success Modal */}
      {showSalonSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                Uloženo
              </h2>
              <p className="text-gray-600 mb-6">
                Informace o salonu byly úspěšně uloženy.
              </p>
              <button
                onClick={() => setShowSalonSuccess(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Success Modal */}
      {showPasswordSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-purple-100/50 m-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                Heslo změněno
              </h2>
              <p className="text-gray-600 mb-6">
                Vaše heslo bylo úspěšně změněno.
              </p>
              <button
                onClick={() => setShowPasswordSuccess(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showPasswordError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full shadow-glow border border-red-100/50 m-4">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Chyba
              </h2>
              <p className="text-gray-600 mb-6">
                {showPasswordError}
              </p>
              <button
                onClick={() => setShowPasswordError('')}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-glow transition-all duration-200"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
