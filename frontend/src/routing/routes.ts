export const ROUTES = {
  LOGIN: '/',
  EQUIPMENT: '/(tabs)/equipment',
  EQUIPMENT_DETAIL: (id: string) => `/equipment/${id}` as const,
  EQUIPMENT_ADD: '/equipment/add',
  EQUIPMENT_EDIT: (id: string) => `/equipment/edit/${id}` as const,
  BORROW: '/(tabs)/borrow',
  BORROW_NEW: '/borrow/new',
  RECORDS: '/(tabs)/records',
  RECORD_DETAIL: (code: string) => `/records/${code}` as const,
  RECORD_RETURN: '/records/return',
  STAFF: '/(tabs)/staff',
  STAFF_ADD: '/staff/add',
  STAFF_EDIT: (id: string) => `/staff/${id}` as const,
} as const;

