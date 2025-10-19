export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500 flex flex-wrap items-center justify-between">
        <p>© {new Date().getFullYear()} IndiciumSignals. Todos los derechos reservados.</p>
        <p className="opacity-75">Trinity Method: <span className="text-lynch font-semibold">Lynch</span> • <span className="text-oneil font-semibold">O'Neil</span> • <span className="text-graham font-semibold">Graham</span></p>
      </div>
    </footer>
  )
}
