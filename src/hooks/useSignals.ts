import { useQuery } from '@tanstack/react-query'
import { mockSignals } from '../utils/mockData'

export function useSignals() {
  // Placeholder EOD fetcher (reemplazar por fetch a tu API/BigQuery)
  return useQuery({
    queryKey: ['signals'],
    queryFn: async () => {
      // Simular latencia
      await new Promise(r => setTimeout(r, 150))
      return mockSignals
    }
  })
}
