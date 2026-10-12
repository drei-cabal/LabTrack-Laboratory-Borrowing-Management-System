export const ROUTES = {
  LOGIN: '/',
  EQUIPMENT: '/(tabs)/equipment',
  EQUIPMENT_DETAIL: (id: string) => `/equipment/${id}` as const,
  EQUIPMENT_ADD: '/equipment/add',
  EQUIPMENT_EDIT: (id: string) => `/equipment/edit/${id}` as const,
  BORROW: '/(tabs)/borrow',
  BORROW_NEW: '/borrow/new',
} as const;
