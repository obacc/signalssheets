import { useState } from 'react'

export interface FiltersState {
  strategy: 'all' | 'lynch' | 'oneil' | 'graham'
  minScore: number
}

export default function Filters({ onChange }: { onChange: (f: FiltersState)=>void }){
  const [state, setState] = useState<FiltersState>({ strategy: 'all', minScore: 0 })
  const update = (p: Partial<FiltersState>) => {
    const next = { ...state, ...p }
    setState(next)
    onChange(next)
  }
  return (
    <div id="filters" className="grid sm:grid-cols-3 gap-3">
      <select value={state.strategy} onChange={e=>update({strategy: e.target.value as FiltersState['strategy']})} className="border rounded-lg px-3 py-2">
        <option value="all">Todas</option>
        <option value="lynch">Lynch</option>
        <option value="oneil">O'Neil</option>
        <option value="graham">Graham</option>
      </select>
      <input type="number" min={0} max={100} value={state.minScore} onChange={e=>update({minScore: Number(e.target.value)})} className="border rounded-lg px-3 py-2" placeholder="Score mínimo"/>
      <button className="btn-secondary" onClick={()=>update({ strategy:'all', minScore:0 })}>Reset</button>
    </div>
  )
}
