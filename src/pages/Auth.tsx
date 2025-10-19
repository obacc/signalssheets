import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

export default function Auth(){
  return (
    <div>
      <Header />
      <main className="max-w-md mx-auto px-4 py-12 space-y-6">
        <h1 className="text-2xl font-bold text-center">Acceso</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-2xl p-6 bg-white">
            <h2 className="font-semibold mb-3">Ingresar</h2>
            <LoginForm />
          </div>
          <div className="border rounded-2xl p-6 bg-white">
            <h2 className="font-semibold mb-3">Registro</h2>
            <RegisterForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
