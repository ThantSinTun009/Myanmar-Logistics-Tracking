export type DemoUser = { id: string; name: string; email: string; password: string; role: 'ADMIN' | 'TRADER' }

export const DEMO_USERS: DemoUser[] = [
  { id: 'demo-admin', name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'ADMIN' },
  { id: 'demo-trader', name: 'Trader User', email: 'trader@example.com', password: 'trader123', role: 'TRADER' },
]

const KEY = 'logistics-demo-state-v1'

const initialState = {
  users: DEMO_USERS,
  routes: [
    { id: 'route-muse', name: 'Yangon → Mandalay → Lashio → Muse', origin: 'Yangon', destination: 'Muse', status: 'OPEN', description: 'Northern logistics corridor', updated_at: new Date().toISOString() },
    { id: 'route-myawaddy', name: 'Yangon → Bago → Naypyidaw → Myawaddy', origin: 'Yangon', destination: 'Myawaddy', status: 'OPEN', description: 'Eastern logistics corridor', updated_at: new Date().toISOString() },
  ],
  shipments: [
    { id: 'shipment-demo-1', tracking_number: 'MYT-2026-001', trader_id: 'demo-trader', driver_id: 'demo-driver', route_id: 'route-muse', cargo_description: 'Agricultural products', origin: 'Yangon', destination: 'Muse', status: 'IN_TRANSIT', latitude: 21.9588, longitude: 96.0891, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  ],
  events: [
    { id: 'event-1', shipment_id: 'shipment-demo-1', status: 'REQUESTED', description: 'Shipment requested', latitude: 16.8409, longitude: 96.1735, created_by: 'demo-trader', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'event-2', shipment_id: 'shipment-demo-1', status: 'PICKED_UP', description: 'Goods picked up', latitude: 16.8409, longitude: 96.1735, created_by: 'demo-driver', created_at: new Date(Date.now() - 82800000).toISOString() },
    { id: 'event-3', shipment_id: 'shipment-demo-1', status: 'IN_TRANSIT', description: 'Transportation started', latitude: 21.9588, longitude: 96.0891, created_by: 'demo-driver', created_at: new Date(Date.now() - 3600000).toISOString() },
  ],
  alerts: [],
}

export function getDemoState() {
  if (typeof window === 'undefined') return structuredClone(initialState)
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(initialState))
    return structuredClone(initialState)
  }
  return JSON.parse(raw)
}

export function setDemoState(state: any) {
  localStorage.setItem(KEY, JSON.stringify(state))
  window.dispatchEvent(new Event('logistics-demo-update'))
}

export function getDemoUser() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('logistics-demo-user')
  return raw ? JSON.parse(raw) : null
}

export function loginDemo(email: string, password: string) {
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password)
  if (!user) return null
  localStorage.setItem('logistics-demo-user', JSON.stringify(user))
  return user
}

export function logoutDemo() {
  localStorage.removeItem('logistics-demo-user')
}

export function routeById(state: any, id: string) {
  return state.routes.find((r: any) => r.id === id)
}

export function shipmentWithRelations(state: any, shipment: any) {
  return {
    ...shipment,
    profiles: state.users.find((u: any) => u.id === shipment.trader_id),
    driver: state.users.find((u: any) => u.id === shipment.driver_id),
    routes: routeById(state, shipment.route_id),
  }
}
