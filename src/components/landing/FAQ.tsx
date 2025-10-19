const faqs = [
  { q: '¿Es para day trading?', a: 'No. Es EOD con horizonte 3–5 años.' },
  { q: '¿Puedo cargar mis tickers?', a: 'Sí, via CSV o API en siguientes fases.' },
]
export default function FAQ(){
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {faqs.map(f => (
            <details key={f.q} className="border rounded-xl p-4 bg-gray-50">
              <summary className="font-semibold cursor-pointer">{f.q}</summary>
              <p className="text-gray-600 mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
