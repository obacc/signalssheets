export default function Pricing(){
  return (
    <section id="pricing" className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold">Precios</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {["Free","Pro","Team"].map((tier, i)=> (
            <div key={tier} className={`rounded-2xl border p-6 ${i===1? 'border-primary-600 shadow-md':''}`}>
              <h3 className="font-bold text-lg">{tier}</h3>
              <p className="text-3xl font-extrabold mt-2">{i===0? '$0' : i===1? '$19' : '$49'}<span className="text-sm text-gray-500">/mes</span></p>
              <ul className="mt-4 text-sm text-gray-600 space-y-2">
                <li>Top 10 diario</li>
                <li>Señales por ticker</li>
                <li>Export CSV</li>
              </ul>
              <button className="btn-primary mt-6 w-full">Elegir</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
