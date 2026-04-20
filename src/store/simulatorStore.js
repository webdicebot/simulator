import { useSimulator } from '../composables/useSimulator'

// Create a single instance of the simulator state to share across routes
export const simulatorStore = useSimulator()
