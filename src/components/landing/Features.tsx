const feats = [
  { title: 'Señales EOD', desc: 'Procesamiento diario con filtros Trinity.' },
  { title: 'Tablas potentes', desc: 'TanStack Table para ordenar/filtrar.' },
  { title: 'Charts pro', desc: 'Lightweight Charts estilo TradingView.' },
]
export default function Features(){
  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
        {feats.map(f=> (
          <div key={f.title} className="border rounded-2xl p-6 bg-gray-50">
            <h3 className="font-semibold text-lg">{f.title}</h3>
            <p className="text-gray-600 mt-2">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
