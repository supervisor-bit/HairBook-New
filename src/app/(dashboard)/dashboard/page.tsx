export default function DashboardPage() {
  return (
    <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-purple-50/30 to-transparent">
      <div className="text-center max-w-2xl">
        <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-6 shadow-glow">
          <span className="text-6xl">✂️</span>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Vítejte v HairBook
        </h1>
        <p className="text-gray-600 mb-12 text-lg font-medium">
          Moderní systém pro správu vašeho kadeřnictví
        </p>
        <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
          <a
            href="/clients"
            className="group p-8 glass rounded-2xl shadow-soft hover:shadow-xl transition-all border border-white/20 transform hover:-translate-y-1"
          >
            <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">👥</div>
            <div className="font-semibold text-gray-900 text-lg">Klienti</div>
            <p className="text-sm text-gray-600 mt-2">Správa klientů a návštěv</p>
          </a>
          <a
            href="/materials"
            className="group p-8 glass rounded-2xl shadow-soft hover:shadow-xl transition-all border border-white/20 transform hover:-translate-y-1"
          >
            <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">📦</div>
            <div className="font-semibold text-gray-900 text-lg">Materiály</div>
            <p className="text-sm text-gray-600 mt-2">Evidence skladu</p>
          </a>
        </div>
      </div>
    </div>
  )
}
