import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // ── Public routes (no guard) ───────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./modules/unauthorized/unauthorized.component')
        .then(m => m.UnauthorizedComponent)
  },

  // ── Protected routes (authGuard applied at parent) ─────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      // ── MM Deal ────────────────────────────────────────────────────────────
      {
        path: 'mm-deals',
        loadComponent: () =>
          import('./modules/mm-deal/mm-deal-list/mm-deal-list.component')
            .then(m => m.MmDealListComponent)
      },
      // Static paths MUST precede dynamic :id segment
      {
        path: 'mm-deal/create',
        loadComponent: () =>
          import('./modules/mm-deal/deal-create/deal-create.component')
            .then(m => m.DealCreateComponent)
      },
      {
        path: 'mm-deal/create/basics',
        loadComponent: () =>
          import('./modules/mm-deal/step1-basics/step1-basics.component')
            .then(m => m.Step1BasicsComponent)
      },
      {
        path: 'mm-deal/create/deposit',
        loadComponent: () =>
          import('./modules/mm-deal/step2-deposit/step2-deposit.component')
            .then(m => m.Step2DepositComponent)
      },
      {
        path: 'mm-deal/create/interest',
        loadComponent: () =>
          import('./modules/mm-deal/step3-interest/step3-interest.component')
            .then(m => m.Step3InterestComponent)
      },
      {
        path: 'mm-deal/:id/summary',
        loadComponent: () =>
          import('./modules/mm-deal/deal-summary/deal-summary.component')
            .then(m => m.DealSummaryComponent)
      },
      {
        path: 'mm-deal/:id',
        loadComponent: () =>
          import('./modules/mm-deal/deal-detail/deal-detail.component')
            .then(m => m.DealDetailComponent)
      },

      // ── Portfolio ──────────────────────────────────────────────────────────
      {
        path: 'portfolio',
        loadComponent: () =>
          import('./modules/portfolio/portfolio-list/portfolio-list.component')
            .then(m => m.PortfolioListComponent)
      },
      {
        path: 'portfolio/create',
        loadComponent: () =>
          import('./modules/portfolio/portfolio-setup/portfolio-setup.component')
            .then(m => m.PortfolioSetupComponent)
      },

      // ── Liquidity ──────────────────────────────────────────────────────────
      {
        path: 'liquidity/gap',
        loadComponent: () =>
          import('./modules/liquidity/liquidity-gap/liquidity-gap.component')
            .then(m => m.LiquidityGapComponent)
      },
      {
        path: 'liquidity/stress',
        loadComponent: () =>
          import('./modules/liquidity/stress-test/stress-test.component')
            .then(m => m.StressTestComponent)
      },

      // ── GL Master ──────────────────────────────────────────────────────────
      {
        path: 'gl-master/create',
        loadComponent: () =>
          import('./modules/gl-master/gl-create/gl-create.component')
            .then(m => m.GlCreateComponent)
      },
      {
        path: 'gl-master',
        loadComponent: () =>
          import('./modules/gl-master/gl-list/gl-list.component')
            .then(m => m.GlListComponent)
      },

      // ── Products ───────────────────────────────────────────────────────────
      {
        path: 'products/create',
        loadComponent: () =>
          import('./modules/product/product-create/product-create.component')
            .then(m => m.ProductCreateComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./modules/product/product-list/product-list.component')
            .then(m => m.ProductListComponent)
      },

      // ── SSI ────────────────────────────────────────────────────────────────
      {
        path: 'ssi/create',
        loadComponent: () =>
          import('./modules/ssi/ssi-create/ssi-create.component')
            .then(m => m.SsiCreateComponent)
      },
      {
        path: 'ssi',
        loadComponent: () =>
          import('./modules/ssi/ssi-list/ssi-list.component')
            .then(m => m.SsiListComponent)
      },

      // ── Partners (Business Partners) ──────────────────────────────────────
      {
        path: 'partners',
        loadComponent: () =>
          import('./modules/partners/bp-list/bp-list.component')
            .then(m => m.BpListComponent)
      },
      {
        path: 'partners/create',
        loadComponent: () =>
          import('./modules/partners/bp-create/bp-create.component')
            .then(m => m.BpCreateComponent)
      },
      {
        path: 'partners/:id/roles',
        loadComponent: () =>
          import('./modules/partners/bp-roles/bp-roles.component')
            .then(m => m.BpRolesComponent)
      },
      {
        path: 'bp-role-assignment',
        loadComponent: () =>
          import('./modules/bp-role-assignment/bp-role-assignment.component')
            .then(m => m.BpRoleAssignmentComponent)
      },

      // ── Counterparties ─────────────────────────────────────────────────────
      {
        path: 'counterparties/create',
        loadComponent: () =>
          import('./modules/counterparties/counterparty-create/counterparty-create.component')
            .then(m => m.CounterpartyCreateComponent)
      },
      {
        path: 'counterparties',
        loadComponent: () =>
          import('./modules/counterparties/counterparty-list/counterparty-list.component')
            .then(m => m.CounterpartyListComponent)
      },

      // ── Blotter ────────────────────────────────────────────────────────────
      {
        path: 'blotter',
        loadComponent: () =>
          import('./modules/blotter/blotter.component')
            .then(m => m.BlotterComponent)
      },

      // ── Instruments ────────────────────────────────────────────────────────
      {
        path: 'instruments',
        loadComponent: () =>
          import('./modules/instruments/instrument-list/instrument-list.component')
            .then(m => m.InstrumentListComponent)
      },
      {
        path: 'instruments/create',
        loadComponent: () =>
          import('./modules/instruments/instrument-setup/instrument-setup.component')
            .then(m => m.InstrumentSetupComponent)
      },

      // ── Authorization Inbox ────────────────────────────────────────────────
      {
        path: 'auth-inbox',
        loadComponent: () =>
          import('./modules/approvals/approvals.component')
            .then(m => m.ApprovalsComponent)
      },

      // ── UDF Maintenance ────────────────────────────────────────────────────
      {
        path: 'udf-maintenance',
        loadComponent: () =>
          import('./modules/udf-maintenance/udf-maintenance.component')
            .then(m => m.UdfMaintenanceComponent)
      },

      // ── User Management ────────────────────────────────────────────────────
      {
        path: 'user-management',
        loadComponent: () =>
          import('./modules/user-management/user-management.component')
            .then(m => m.UserManagementComponent)
      },

      // ── Reports ────────────────────────────────────────────────────────────
      {
        path: 'reports/deals',
        loadComponent: () =>
          import('./modules/shared/placeholder/placeholder.component')
            .then(m => m.PlaceholderComponent),
        data: { title: 'Deal Summary Report' }
      },
      {
        path: 'reports/audit',
        loadComponent: () =>
          import('./modules/reports/audit-trail/audit-trail.component')
            .then(m => m.AuditTrailComponent)
      },

      // ── Demo ───────────────────────────────────────────────────────────────
      {
        path: 'demo',
        loadComponent: () =>
          import('./modules/demo/demo.component')
            .then(m => m.DemoComponent)
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
