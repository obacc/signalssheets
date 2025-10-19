import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

export default function LoginForm(){
  const [email, setEmail] = useState('')
  const { login } = useAuthStore()
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); login(email) }} className="space-y-3">
      <input type="email" required className="w-full border rounded-lg px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="btn-primary w-full">Ingresar</button>
    </form>
  )
}
