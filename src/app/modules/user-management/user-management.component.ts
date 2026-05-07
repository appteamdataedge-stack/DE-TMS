import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

type Tab       = 'users' | 'groups' | 'audit';
type UsersView = 'table' | 'value';
type AuditView = 'table' | 'timeline';

interface PermItem    { label: string; perms: string[]; }
interface PermSection { label: string; items: PermItem[]; }

interface UserRecord {
  id:            string;
  name:          string;
  initials:      string;
  role:          string;
  email:         string;
  status:        'ACTIVE' | 'INACTIVE' | 'LOCKED';
  lastLogin:     string;
  group:         string;
  isSystemAdmin: boolean;
}

interface GroupRecord {
  id:             string;
  name:           string;
  userCount:      number;
  description:    string;
  colorClass:     string;
  sections:       PermSection[];
  hiddenSections: string[];
}

interface EmployeeBP {
  bpId:        string;
  name:        string;
  department:  string;
  designation: string;
  email:       string;
}

interface UamAudit {
  id:               string;
  timestamp:        string;
  module:           string;
  action:           string;
  target:           string;
  description:      string;
  user:             string;
  ip:               string;
  oldValue?:        Record<string, unknown> | null;
  newValue?:        Record<string, unknown> | null;
  rejectionReason?: string;
}

interface DateGroup { label: string; rows: UamAudit[]; }

interface MmPermDef { key: string; label: string; perm: string; }

interface RightsRow {
  module:    string;
  create:    boolean;
  view:      boolean;
  modify:    boolean;
  authorise: boolean;
  cancel:    boolean;
  reverse:   boolean;
}

interface LimitRow { currency: string; amount: string; }

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  animations: [
    trigger('slideOver', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms cubic-bezier(0.4,0,0.2,1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4,0,0.2,1)', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('backdropFade', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms ease', style({ opacity: 0 }))])
    ]),
    trigger('expandRow', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('140ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' }))
      ])
    ])
  ],
  templateUrl: './user-management.component.html',
  styleUrl:    './user-management.component.scss'
})
export class UserManagementComponent {

  private cdr = inject(ChangeDetectorRef);

  // ── Shared reference data ──────────────────────────────────────────────────

  readonly portfolioOptions = [
    { id: 'PF-001', label: 'Treasury HFT Portfolio'  },
    { id: 'PF-002', label: 'Treasury HTM Portfolio'  },
    { id: 'PF-003', label: 'MM Interbank Portfolio'  },
    { id: 'PF-004', label: 'Liquidity Portfolio'     },
  ];

  readonly currencyOptions = ['BDT', 'USD', 'EUR', 'GBP', 'JPY'];

  private makeRightsRows(): RightsRow[] {
    return [
      { module: 'Money Market', create: false, view: false, modify: false, authorise: false, cancel: false, reverse: false },
      { module: 'Securities',   create: false, view: false, modify: false, authorise: false, cancel: false, reverse: false },
      { module: 'Forex',        create: false, view: false, modify: false, authorise: false, cancel: false, reverse: false },
      { module: 'Portfolio',    create: false, view: false, modify: false, authorise: false, cancel: false, reverse: false },
    ];
  }

  togglePortfolio(arr: string[], id: string): void {
    const i = arr.indexOf(id);
    if (i === -1) arr.push(id); else arr.splice(i, 1);
  }

  addLimitRow(arr: LimitRow[]): void { arr.push({ currency: 'BDT', amount: '' }); }
  removeLimitRow(arr: LimitRow[], i: number): void { arr.splice(i, 1); }

  activeTab:  Tab       = 'users';
  usersView:  UsersView = 'table';
  auditView:  AuditView = 'table';

  selectedUser:  UserRecord  | null = null;
  selectedGroup: GroupRecord | null = null;

  // ── Permission sections (master reference) ─────────────────────────────────

  readonly allSections: PermSection[] = [
    {
      label: 'Money Market',
      items: [
        { label: 'Blotter',      perms: ['View'] },
        { label: 'MM Deals',     perms: ['Create', 'Submit', 'Authorize'] },
        { label: 'Liquidity',    perms: ['View'] },
      ]
    },
    {
      label: 'Portfolio',
      items: [
        { label: 'Portfolio Setup', perms: ['Create', 'Submit', 'Authorize'] },
      ]
    },
    {
      label: 'Configuration',
      items: [
        { label: 'Counterparties', perms: ['View', 'Create'] },
        { label: 'Instruments',    perms: ['View', 'Create'] },
        { label: 'GL Master',      perms: ['View', 'Create'] },
        { label: 'Products',       perms: ['View', 'Create'] },
        { label: 'SSI',            perms: ['View', 'Create'] },
      ]
    },
    {
      label: 'Workflow',
      items: [{ label: 'Auth Inbox', perms: ['Authorize', 'Reject'] }]
    },
    {
      label: 'Reports',
      items: [
        { label: 'Deal Summary', perms: ['View', 'Export'] },
        { label: 'Audit Trail',  perms: ['View', 'Export'] },
      ]
    },
    {
      label: 'System Admin',
      items: [
        { label: 'UDF Maintenance', perms: ['View', 'Create', 'Edit'] },
        { label: 'User Management', perms: ['View', 'Create', 'Edit'] },
      ]
    },
  ];

  // ── Users ──────────────────────────────────────────────────────────────────

  users: UserRecord[] = [
    { id: 'USR-001', name: 'KM Hossain', initials: 'KH', role: 'Treasury Manager', email: 'km.hossain@dataedge.com', status: 'ACTIVE', lastLogin: '2026-04-30 09:00', group: 'Treasury Managers',     isSystemAdmin: false },
    { id: 'USR-002', name: 'MD Rahman',  initials: 'MR', role: 'Dealer',           email: 'md.rahman@dataedge.com',  status: 'ACTIVE', lastLogin: '2026-04-30 08:45', group: 'Dealers',               isSystemAdmin: false },
    { id: 'USR-003', name: 'FZ Karim',   initials: 'FK', role: 'Senior Dealer',    email: 'fz.karim@dataedge.com',   status: 'ACTIVE', lastLogin: '2026-04-29 17:30', group: 'Senior Dealers',        isSystemAdmin: false },
    { id: 'USR-004', name: 'SN Ahmed',   initials: 'SA', role: 'Deputy Manager',   email: 'sn.ahmed@dataedge.com',   status: 'ACTIVE', lastLogin: '2026-04-28 16:00', group: 'Treasury Managers',     isSystemAdmin: false },
    { id: 'USR-005', name: 'SA Khan',    initials: 'SK', role: 'System Admin',     email: 'sa.khan@dataedge.com',    status: 'ACTIVE', lastLogin: '2026-04-30 07:15', group: 'System Administrators', isSystemAdmin: true  },
  ];

  userSections(u: UserRecord): PermSection[] {
    if (u.isSystemAdmin)
      return this.allSections.filter(s => s.label !== 'Portfolio' && s.label !== 'Money Market');
    if (u.role === 'Treasury Manager' || u.role === 'Deputy Manager')
      return this.allSections.filter(s => s.label !== 'System Admin');
    return this.allSections.filter(s => s.label !== 'System Admin' && s.label !== 'Portfolio');
  }

  roleBadge(role: string): string {
    const m: Record<string, string> = {
      'System Admin': 'purple', 'Treasury Manager': 'navy', 'Deputy Manager': 'navy',
      'Senior Dealer': 'teal', 'Dealer': 'teal',
    };
    return m[role] ?? 'neutral';
  }

  statusBadge(s: string): string {
    return ({ ACTIVE: 'green', INACTIVE: 'neutral', LOCKED: 'red' } as Record<string, string>)[s] ?? 'neutral';
  }

  openUser(u: UserRecord): void  { this.selectedUser = u; this.editMode = false; }
  closeUser(): void               { this.selectedUser = null; this.editMode = false; }

  // ── Edit User ─────────────────────────────────────────────────────────────
  editMode    = false;
  editName    = '';
  editRole    = '';
  editStatus: 'ACTIVE' | 'INACTIVE' | 'LOCKED' = 'ACTIVE';
  editGroup   = '';

  openEditUser(): void {
    if (!this.selectedUser) return;
    this.editName   = this.selectedUser.name;
    this.editRole   = this.selectedUser.role;
    this.editStatus = this.selectedUser.status;
    this.editGroup  = this.selectedUser.group;
    this.editMode   = true;
  }

  cancelEditUser(): void { this.editMode = false; }

  saveEditUser(): void {
    if (!this.selectedUser || !this.editName.trim() || !this.editRole) return;
    // TODO: call PUT /api/users/:id with updated fields
    const updated: UserRecord = {
      ...this.selectedUser,
      name:          this.editName.trim(),
      role:          this.editRole,
      status:        this.editStatus,
      group:         this.editGroup,
      isSystemAdmin: this.editRole === 'System Admin',
    };
    this.users = this.users.map(u => u.id === updated.id ? updated : u);
    this.selectedUser = updated;
    this.editMode     = false;
    this.showToast(`User "${updated.name}" updated successfully.`);
  }

  // ── Create User Panel ──────────────────────────────────────────────────────

  createUserOpen       = false;
  cuEmployeeSearch     = '';
  cuSelectedEmployee:  EmployeeBP | null = null;
  cuRole               = '';
  cuGroupBased         = false;
  cuSelectedGroupId    = '';
  cuStatus             = true;
  cuRights:            RightsRow[] = [];
  cuPortfolios:        string[]    = [];
  cuDealLimits:        LimitRow[]  = [];
  cuOvernightLimits:   LimitRow[]  = [];

  readonly roleOptions = [
    { value: '',                  label: 'Select role…'     },
    { value: 'System Admin',      label: 'System Admin'     },
    { value: 'Treasury Manager',  label: 'Treasury Manager' },
    { value: 'Deputy Manager',    label: 'Deputy Manager'   },
    { value: 'Senior Dealer',     label: 'Senior Dealer'    },
    { value: 'Dealer',            label: 'Dealer'           },
    { value: 'Read-Only',         label: 'Read-Only'        },
  ];

  readonly employeeBPs: EmployeeBP[] = [
    { bpId: 'EMP-001', name: 'Rashid Hossain', department: 'Treasury', designation: 'Head of Treasury',  email: 'r.hossain@dataedge.com' },
    { bpId: 'EMP-002', name: 'Farida Khatun',  department: 'Treasury', designation: 'Treasury Officer',  email: 'f.khatun@dataedge.com'  },
    { bpId: 'EMP-003', name: 'Tarek Ahmed',    department: 'Treasury', designation: 'Senior Analyst',    email: 't.ahmed@dataedge.com'   },
    { bpId: 'EMP-004', name: 'Nadia Islam',    department: 'Treasury', designation: 'Treasury Dealer',   email: 'n.islam@dataedge.com'   },
    { bpId: 'EMP-005', name: 'Karim Uddin',    department: 'IT',       designation: 'IT Administrator',  email: 'k.uddin@dataedge.com'   },
  ];

  get filteredEmployees(): EmployeeBP[] {
    const q = this.cuEmployeeSearch.trim().toLowerCase();
    if (!q) return [];
    return this.employeeBPs.filter(e =>
      e.name.toLowerCase().includes(q) || e.bpId.toLowerCase().includes(q)
    );
  }

  get cuSelectedGroupForPreview(): GroupRecord | null {
    if (!this.cuGroupBased || !this.cuSelectedGroupId) return null;
    return this.groups.find(g => g.id === this.cuSelectedGroupId) ?? null;
  }

  get cuRoleIsAdmin(): boolean { return this.cuRole === 'System Admin'; }

  selectEmployee(emp: EmployeeBP): void {
    this.cuSelectedEmployee  = emp;
    this.cuEmployeeSearch    = emp.name;
  }

  openCreateUser(): void {
    this.createUserOpen      = true;
    this.cuEmployeeSearch    = '';
    this.cuSelectedEmployee  = null;
    this.cuRole              = '';
    this.cuGroupBased        = false;
    this.cuSelectedGroupId   = '';
    this.cuStatus            = true;
    this.cuRights            = this.makeRightsRows();
    this.cuPortfolios        = [];
    this.cuDealLimits        = [{ currency: 'BDT', amount: '' }];
    this.cuOvernightLimits   = [{ currency: 'BDT', amount: '' }];
  }

  closeCreateUser(): void { this.createUserOpen = false; }

  cuUsername = '';
  cuPassword = '';

  submitCreateUser(): void {
    if (!this.cuSelectedEmployee || !this.cuRole) return;
    const emp = this.cuSelectedEmployee;
    const parts = emp.name.split(' ');
    const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    const group = this.cuGroupBased
      ? (this.groups.find(g => g.id === this.cuSelectedGroupId)?.name ?? '—')
      : '—';
    const newUser: UserRecord = {
      id:            `USR-00${this.users.length + 1}`,
      name:          emp.name,
      initials,
      role:          this.cuRole,
      email:         emp.email,
      status:        this.cuStatus ? 'ACTIVE' : 'INACTIVE',
      lastLogin:     'Never',
      group,
      isSystemAdmin: this.cuRole === 'System Admin',
    };
    this.users = [...this.users, newUser];

    // TODO: replace localStorage fallback with real POST /api/users when backend is ready
    if (this.cuUsername.trim() && this.cuPassword.trim()) {
      const storedUsers: Array<{username:string;password:string;displayName:string;role:string;initials:string;segment:string}> =
        JSON.parse(localStorage.getItem('tms_created_users') ?? '[]');
      storedUsers.push({
        username:    this.cuUsername.trim().toLowerCase(),
        password:    this.cuPassword.trim(),
        displayName: emp.name,
        role:        this.cuRole === 'System Admin' ? 'ADMIN' : 'DEALER',
        initials,
        segment:     this.cuRole,
      });
      localStorage.setItem('tms_created_users', JSON.stringify(storedUsers));
    }

    this.createUserOpen = false;
    this.cuUsername     = '';
    this.cuPassword     = '';
    this.showToast(`User "${newUser.name}" created successfully.`);
  }

  // ── Groups ─────────────────────────────────────────────────────────────────

  groups: GroupRecord[] = [
    {
      id: 'GRP-001', name: 'System Administrators', userCount: 1,
      description: 'Full system configuration and user management access',
      colorClass: 'purple', hiddenSections: ['Portfolio', 'Money Market'],
      sections: [
        { label: 'Configuration', items: [
          { label: 'Counterparties', perms: ['View'] }, { label: 'Instruments', perms: ['View'] },
          { label: 'GL Master', perms: ['View'] }, { label: 'Products', perms: ['View'] }, { label: 'SSI', perms: ['View'] },
        ]},
        { label: 'Workflow',     items: [{ label: 'Auth Inbox',       perms: ['View'] }] },
        { label: 'Reports',      items: [{ label: 'Deal Summary', perms: ['View', 'Export'] }, { label: 'Audit Trail', perms: ['View', 'Export'] }] },
        { label: 'System Admin', items: [{ label: 'UDF Maintenance', perms: ['View', 'Create', 'Edit'] }, { label: 'User Management', perms: ['View', 'Create', 'Edit'] }] },
      ]
    },
    {
      id: 'GRP-002', name: 'Treasury Managers', userCount: 2,
      description: 'Full dealing and authorization rights across all treasury modules',
      colorClass: 'navy', hiddenSections: ['System Admin'],
      sections: [
        { label: 'Money Market',  items: [{ label: 'Blotter', perms: ['View'] }, { label: 'MM Deals', perms: ['Create', 'Submit', 'Authorize'] }, { label: 'Liquidity', perms: ['View'] }] },
        { label: 'Portfolio',     items: [{ label: 'Portfolio Setup', perms: ['Create', 'Submit', 'Authorize'] }] },
        { label: 'Configuration', items: [{ label: 'Counterparties', perms: ['View', 'Create'] }, { label: 'Instruments', perms: ['View', 'Create'] }, { label: 'GL Master', perms: ['View', 'Create'] }, { label: 'Products', perms: ['View', 'Create'] }, { label: 'SSI', perms: ['View', 'Create'] }] },
        { label: 'Workflow',      items: [{ label: 'Auth Inbox', perms: ['Authorize', 'Reject'] }] },
        { label: 'Reports',       items: [{ label: 'Deal Summary', perms: ['View', 'Export'] }, { label: 'Audit Trail', perms: ['View', 'Export'] }] },
      ]
    },
    {
      id: 'GRP-003', name: 'Senior Dealers', userCount: 1,
      description: 'Deal creation and submission with read-only configuration access',
      colorClass: 'teal', hiddenSections: ['System Admin'],
      sections: [
        { label: 'Money Market',  items: [{ label: 'Blotter', perms: ['View'] }, { label: 'MM Deals', perms: ['Create', 'Submit'] }, { label: 'Liquidity', perms: ['View'] }] },
        { label: 'Portfolio',     items: [{ label: 'Portfolio Setup', perms: ['View'] }] },
        { label: 'Configuration', items: [{ label: 'Counterparties', perms: ['View'] }, { label: 'Instruments', perms: ['View'] }, { label: 'GL Master', perms: ['View'] }, { label: 'Products', perms: ['View'] }, { label: 'SSI', perms: ['View'] }] },
        { label: 'Reports',       items: [{ label: 'Deal Summary', perms: ['View', 'Export'] }] },
      ]
    },
    {
      id: 'GRP-004', name: 'Dealers', userCount: 1,
      description: 'Basic deal entry and submission rights',
      colorClass: 'teal', hiddenSections: ['System Admin', 'Portfolio'],
      sections: [
        { label: 'Money Market',  items: [{ label: 'MM Deals', perms: ['Create', 'Submit'] }, { label: 'Liquidity', perms: ['View'] }] },
        { label: 'Configuration', items: [{ label: 'Counterparties', perms: ['View'] }, { label: 'Instruments', perms: ['View'] }] },
      ]
    },
    {
      id: 'GRP-005', name: 'Read-Only Viewers', userCount: 0,
      description: 'View-only access to reports and dashboard',
      colorClass: 'neutral', hiddenSections: ['System Admin', 'Portfolio', 'Money Market'],
      sections: [
        { label: 'Reports', items: [{ label: 'Deal Summary', perms: ['View'] }, { label: 'Audit Trail', perms: ['View'] }] },
      ]
    },
  ];

  openGroup(g: GroupRecord): void  { this.selectedGroup = g; this.editGroupMode = false; }
  closeGroup(): void                { this.selectedGroup = null; this.editGroupMode = false; }

  // ── Edit Group ────────────────────────────────────────────────────────────
  editGroupMode = false;
  editGroupName = '';
  editGroupDesc = '';

  openEditGroup(): void {
    if (!this.selectedGroup) return;
    this.editGroupName = this.selectedGroup.name;
    this.editGroupDesc = this.selectedGroup.description;
    this.editGroupMode = true;
  }

  cancelEditGroup(): void { this.editGroupMode = false; }

  saveEditGroup(): void {
    if (!this.selectedGroup || !this.editGroupName.trim()) return;
    // TODO: call PUT /api/groups/:id with updated fields
    const updated: GroupRecord = {
      ...this.selectedGroup,
      name:        this.editGroupName.trim(),
      description: this.editGroupDesc.trim() || this.selectedGroup.description,
    };
    this.groups = this.groups.map(g => g.id === updated.id ? updated : g);
    this.selectedGroup = updated;
    this.editGroupMode = false;
    this.showToast(`Group "${updated.name}" updated successfully.`);
  }

  permBadge(p: string): string {
    const m: Record<string, string> = {
      View: 'neutral', Export: 'amber', Create: 'teal', Submit: 'navy',
      Authorize: 'green', Reject: 'red', Edit: 'purple'
    };
    return m[p] ?? 'neutral';
  }

  // ── Create Group Panel ─────────────────────────────────────────────────────

  createGroupOpen:   boolean     = false;
  cgName             = '';
  cgDesc             = '';
  cgRights:          RightsRow[] = [];
  cgPortfolios:      string[]    = [];
  cgDealLimits:      LimitRow[]  = [];
  cgOvernightLimits: LimitRow[]  = [];

  openCreateGroup(): void {
    this.createGroupOpen     = true;
    this.cgName              = '';
    this.cgDesc              = '';
    this.cgRights            = this.makeRightsRows();
    this.cgPortfolios        = [];
    this.cgDealLimits        = [{ currency: 'BDT', amount: '' }];
    this.cgOvernightLimits   = [{ currency: 'BDT', amount: '' }];
  }

  closeCreateGroup(): void { this.createGroupOpen = false; }

  get nextGroupId(): string { return `GRP-${String(this.groups.length + 1).padStart(3, '0')}`; }

  submitCreateGroup(): void {
    if (!this.cgName.trim()) return;
    const rightsItems: PermItem[] = this.cgRights
      .filter(r => r.create || r.view || r.modify || r.authorise || r.cancel || r.reverse)
      .map(r => {
        const perms: string[] = [];
        if (r.create)    perms.push('Create');
        if (r.view)      perms.push('View');
        if (r.modify)    perms.push('Modify');
        if (r.authorise) perms.push('Authorise');
        if (r.cancel)    perms.push('Cancel');
        if (r.reverse)   perms.push('Reverse');
        return { label: r.module, perms };
      });
    const sections: PermSection[] = rightsItems.length
      ? [{ label: 'Access Rights', items: rightsItems }] : [];
    this.groups = [...this.groups, {
      id: this.nextGroupId, name: this.cgName, userCount: 0,
      description: this.cgDesc || 'No description',
      colorClass: 'teal', hiddenSections: [], sections
    }];
    this.createGroupOpen = false;
    this.showToast(`Group "${this.cgName}" created successfully.`);
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  expandedAuditId: string | null = null;

  toggleExpand(id: string): void {
    this.expandedAuditId = this.expandedAuditId === id ? null : id;
  }

  readonly auditRows: UamAudit[] = [
    {
      id: 'AUD-2026-001', timestamp: '2026-04-22T09:00:00',
      module: 'User Mgmt', action: 'CREATE', target: 'USR-002',
      description: 'MD Rahman user account created', user: 'sa.khan', ip: '10.0.1.50',
      oldValue: null,
      newValue: { id: 'USR-002', name: 'MD Rahman', role: 'Dealer', email: 'md.rahman@dataedge.com', status: 'ACTIVE', group: null },
    },
    {
      id: 'AUD-2026-002', timestamp: '2026-04-22T09:15:00',
      module: 'User Mgmt', action: 'UPDATE', target: 'USR-003',
      description: 'FZ Karim role updated to Senior Dealer', user: 'sa.khan', ip: '10.0.1.50',
      oldValue: { role: 'Dealer',        group: null },
      newValue: { role: 'Senior Dealer', group: 'GRP-003' },
    },
    {
      id: 'AUD-2026-003', timestamp: '2026-04-21T11:30:00',
      module: 'Group Mgmt', action: 'CREATE', target: 'GRP-004',
      description: 'Dealers group created with MM entry rights', user: 'sa.khan', ip: '10.0.1.50',
      oldValue: null,
      newValue: { id: 'GRP-004', name: 'Dealers', permissions: ['MM_DEALS_CREATE', 'MM_DEALS_SUBMIT', 'LIQUIDITY_VIEW'] },
    },
    {
      id: 'AUD-2026-004', timestamp: '2026-04-21T14:00:00',
      module: 'User Mgmt', action: 'UPDATE', target: 'USR-002',
      description: 'MD Rahman assigned to Dealers group', user: 'sa.khan', ip: '10.0.1.50',
      oldValue: { group: null    },
      newValue: { group: 'GRP-004' },
    },
    {
      id: 'AUD-2026-005', timestamp: '2026-04-20T15:45:00',
      module: 'Business Partner', action: 'BLACKLIST', target: 'BP005',
      description: 'Islami Bank blacklisted — regulatory directive', user: 'admin1', ip: '10.0.1.45',
      oldValue: { blacklisted: false, status: 'ACTIVE'   },
      newValue: { blacklisted: true,  status: 'INACTIVE' },
      rejectionReason: 'Regulatory directive — Bangladesh Bank notice BDBB/2026/0142',
    },
    {
      id: 'AUD-2026-006', timestamp: '2026-04-20T17:00:00',
      module: 'Business Partner', action: 'ACTIVATE', target: 'BP001',
      description: 'Sonali Bank activated', user: 'admin1', ip: '10.0.1.45',
      oldValue: { status: 'INACTIVE' },
      newValue: { status: 'ACTIVE'   },
    },
    {
      id: 'AUD-2026-007', timestamp: '2026-04-19T17:00:00',
      module: 'Maker-Checker', action: 'AUTHORIZE', target: 'BP003',
      description: 'BRAC Bank creation authorized', user: 'checker1', ip: '10.0.1.41',
      oldValue: { authStatus: 'PENDING_AUTHORIZATION' },
      newValue: { authStatus: 'APPROVED', status: 'ACTIVE' },
    },
  ];

  get dateGroups(): DateGroup[] {
    const map = new Map<string, UamAudit[]>();
    for (const row of this.auditRows) {
      const d = new Date(row.timestamp);
      const key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries()).map(([label, rows]) => ({ label, rows }));
  }

  auditActionBadge(action: string): string {
    const m: Record<string, string> = {
      CREATE: 'teal', UPDATE: 'navy', DELETE: 'red', RESET: 'amber',
      ACTIVATE: 'green', AUTHORIZE: 'green', BLACKLIST: 'red', ASSIGN: 'amber',
    };
    return m[action] ?? 'neutral';
  }

  auditDotColor(action: string): string {
    const m: Record<string, string> = {
      CREATE: '#0FA383', UPDATE: '#0D1B2A', DELETE: '#DC2626', RESET: '#F5A623',
      ACTIVATE: '#16A34A', AUTHORIZE: '#16A34A', BLACKLIST: '#DC2626', ASSIGN: '#F5A623',
    };
    return m[action] ?? '#9CA3AF';
  }

  moduleBadge(module: string): string {
    const m: Record<string, string> = {
      'User Mgmt': 'navy', 'Group Mgmt': 'purple',
      'Business Partner': 'teal', 'Maker-Checker': 'amber',
    };
    return m[module] ?? 'neutral';
  }

  formatJson(obj: Record<string, unknown> | null | undefined): string {
    if (obj === null || obj === undefined) return '(no prior value)';
    return JSON.stringify(obj, null, 2);
  }

  fmtTimestamp(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  // ── Toast ──────────────────────────────────────────────────────────────────

  toastVisible = false;
  toastMessage = '';

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 3500);
  }
}
