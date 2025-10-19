import { useEffect, useRef } from 'react'

export default function Chart(){
  const ref = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(!ref.current) return
    // Placeholder chart - replace with actual lightweight-charts implementation
    ref.current.innerHTML = '<div class="h-full flex items-center justify-center text-gray-500">Chart placeholder - integrate with lightweight-charts</div>'
  },[])
  return <div ref={ref} className="w-full h-72 border rounded-lg bg-gray-50" />
}
