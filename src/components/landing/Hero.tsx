import { Link } from 'react-router-dom'

export default function Hero(){
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Señales EOD con <span className="text-primary-600">Trinity Method</span></h1>
          <p className="mt-4 text-gray-600">Combina el sentido común de Lynch, el timing de O'Neil y el margen de seguridad de Graham.</p>
          <div className="mt-6 flex gap-3">
            <Link to="/dashboard" className="btn-primary">Ver Dashboard</Link>
            <a href="#pricing" className="btn-secondary">Precios</a>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="h-40 grid place-items-center text-gray-400">Gráfico demo</div>
        </div>
      </div>
    </section>
  )
}
