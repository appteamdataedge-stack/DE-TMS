import { Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApprovalsService } from '../../services/approvals.service';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../auth/auth.service';

interface NavItem  { label: string; route: string; icon: string; }
interface NavGroup { label: string; items: NavItem[]; }

@Component({
  selector: 'de-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  @Input() activeItem = '';
  @Input() isOpen     = false;

  private approvalsService = inject(ApprovalsService);
  private auth             = inject(AuthService);

  get pendingCount(): number { return this.approvalsService.count; }

  private readonly allNavGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard',  route: '/dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
        { label: 'Demo Guide', route: '/demo',      icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
      ]
    },
    {
      label: 'Money Market',
      items: [
        { label: 'Blotter',  route: '/blotter',               icon: 'M3 12h18M3 6h18M3 18h12' },
        { label: 'MM Deals', route: '/mm-deals', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
      ]
    },
    {
      label: 'Liquidity',
      items: [
        { label: 'Gap Analysis',   route: '/liquidity/gap',    icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
        { label: 'Stress Testing', route: '/liquidity/stress', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
      ]
    },
    {
      label: 'Configuration',
      items: [
        { label: 'Portfolios',     route: '/portfolio', icon: 'M3 7h18M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2M3 7l2 13h14l2-13M10 11v4M14 11v4' },
        { label: 'Business Partners', route: '/partners', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
        { label: 'BP Role Assignment', route: '/bp-role-assignment', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
        { label: 'Counterparties', route: '/counterparties',   icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
        { label: 'Instruments',    route: '/instruments',      icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
        { label: 'GL Master',      route: '/gl-master',        icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
        { label: 'Products',       route: '/products',         icon: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01' },
        { label: 'SSI',            route: '/ssi',              icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
      ]
    },
    {
      label: 'Workflow',
      items: [
        { label: 'Auth Inbox', route: '/auth-inbox', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4' },
      ]
    },
    {
      label: 'Reports',
      items: [
        { label: 'Audit Trail', route: '/reports/audit', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
      ]
    },
    {
      label: 'System Admin',
      items: [
        { label: 'UDF Maintenance', route: '/udf-maintenance', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
        { label: 'User Management', route: '/user-management', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
      ]
    }
  ];

  get navGroups(): NavGroup[] {
    return this.allNavGroups
      .map(g => ({ ...g, items: g.items.filter(i => this.auth.hasAccess(i.route)) }))
      .filter(g => g.items.length > 0);
  }
}
