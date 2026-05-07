export type Role = 'DEALER' | 'CHECKER' | 'BACK_OFFICE' | 'RISK_OFFICER' | 'ADMIN';

export const ALL_ROLES: Role[] = ['DEALER', 'CHECKER', 'BACK_OFFICE', 'RISK_OFFICER', 'ADMIN'];

// Longer keys must appear first — hasAccess() picks the most-specific prefix match.
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  // MM Deal
  'mm-deal/create':      ['DEALER'],
  'mm-deal':             ALL_ROLES,
  'mm-deals':            ALL_ROLES,
  // BP Role Assignment
  'bp-role-assignment':  ALL_ROLES,
  // Portfolio
  'portfolio/create':    ['DEALER', 'ADMIN'],
  'portfolio':           ['DEALER', 'CHECKER', 'ADMIN'],
  // Instruments
  'instruments/create':  ['ADMIN'],
  'instruments':         ['CHECKER', 'ADMIN'],
  // GL Master
  'gl-master/create':    ['ADMIN'],
  'gl-master':           ['CHECKER', 'ADMIN'],
  // Products
  'products/create':     ['ADMIN'],
  'products':            ['CHECKER', 'ADMIN'],
  // SSI
  'ssi/create':          ['DEALER', 'ADMIN'],
  'ssi':                 ALL_ROLES,
  // Reports
  'reports/audit':       ['RISK_OFFICER', 'ADMIN', 'CHECKER'],
  'reports':             ['RISK_OFFICER', 'ADMIN', 'CHECKER', 'BACK_OFFICE'],
  // Counterparties
  'counterparties':      ALL_ROLES,
  // Partners (future module)
  'partners':            ['DEALER', 'CHECKER', 'BACK_OFFICE', 'ADMIN'],
  // Liquidity
  'liquidity':           ['RISK_OFFICER', 'ADMIN', 'CHECKER', 'BACK_OFFICE'],
  // Open to all authenticated
  'dashboard':           ALL_ROLES,
  'blotter':             ALL_ROLES,
  // Restricted
  'auth-inbox':          ['CHECKER', 'ADMIN'],
  'demo':                ['ADMIN', 'DEALER'],
  'settings':            ['ADMIN'],
  'user-management':     ['ADMIN'],
  'udf-maintenance':     ['ADMIN'],
};

export const ACTION_PERMISSIONS: Record<string, Role[]> = {
  'create_deal':       ['DEALER', 'ADMIN'],
  'authorize_deal':    ['CHECKER', 'ADMIN'],
  'reject_deal':       ['CHECKER', 'ADMIN'],
  'view_audit':        ['RISK_OFFICER', 'ADMIN', 'CHECKER'],
  'manage_users':      ['ADMIN'],
  'create_portfolio':  ['DEALER', 'ADMIN'],
  'approve_portfolio': ['CHECKER', 'ADMIN'],
  'authorize_own':     [],
};

export interface TmsUser {
  username:    string;
  displayName: string;
  role:        Role;
  initials:    string;
  segment:     string;
}
