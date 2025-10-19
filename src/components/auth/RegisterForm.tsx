export default function RegisterForm(){
  return (
    <form className="space-y-3">
      <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
      <input className="w-full border rounded-lg px-3 py-2" placeholder="Password" type="password" />
      <button className="btn-secondary w-full">Crear cuenta</button>
    </form>
  )
}
