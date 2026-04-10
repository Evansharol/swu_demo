// ── Mock Data for Still With You ──
// Structured for future backend integration

// ─── USER ACCOUNTS ───
export const MOCK_USERS = [
  { id: 'u1', name: 'Evan', email: 'evan@gmail.com', password: 'pass123', role: 'user' },
  { id: 'u2', name: 'Sara', email: 'sara@example.com', password: 'pass123', role: 'user' },
];

// ─── ADMIN ACCOUNTS ───
export const MOCK_ADMINS = [
  { 
    id: 'a1', 
    name: 'Super Admin', 
    email: 'admin@stillwithyou.com', 
    password: 'admin123', 
    role: 'admin',
    avatar: '🛡️'
  },
];

// ─── FULFILLMENT LOGS (for Admin) ───
export const MOCK_FULFILLMENT_LOGS = [
  { id: 'log1', userId: 'u1', userName: 'Evan', item: 'Red Rose Bouquet', partner: 'FNP', status: 'ordered', timestamp: '2026-04-08T10:00:00Z' },
  { id: 'log2', userId: 'u2', userName: 'Sara', item: 'Tribute Letter', partner: 'Delhivery', status: 'shipped', timestamp: '2026-04-08T14:30:00Z' },
  { id: 'log3', userId: 'u1', userName: 'Evan', item: 'Memorial Cake', partner: 'Winni', status: 'delivered', timestamp: '2026-04-07T12:00:00Z' },
];

// ─── USER MEMORIES ───
export const MOCK_MEMORIES = [
  {
    id: 'mem1', userId: 'u1', type: 'message', title: 'Letter to Grandma',
    content: 'Dear Grandma, I still remember the cookies you used to bake...',
    occasion: 'Birthday', date: '2026-05-10', status: 'scheduled',
    createdAt: '2026-03-01',
  },
  {
    id: 'mem2', userId: 'u1', type: 'media', title: 'Summer Vacation Photos',
    content: '12 photos from our last trip together',
    occasion: 'Anniversary', date: '2026-06-15', status: 'scheduled',
    createdAt: '2026-03-15',
  },
];

// ─── SCHEDULED SURPRISES ───
export const MOCK_SURPRISES = [
  {
    id: 'sur1', userId: 'u1', recipientName: 'Mom',
    giftType: 'Eternal Rose Bouquet', partner: 'FNP',
    scheduledDate: '2026-05-12', status: 'upcoming',
    image: '🌹',
  },
];

export const DELIVERY_STATUSES = [
  { value: 'active', label: 'User Active', color: '#5aaa38' },
  { value: 'monitoring', label: 'Escalation Stage 1', color: '#c07820' },
  { value: 'notifying', label: 'Escalation Stage 2+', color: '#c04040' },
  { value: 'delivered', label: 'Legacy Delivered', color: '#2a8020' },
];
