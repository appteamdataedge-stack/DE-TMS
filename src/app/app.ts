import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { NavbarComponent } from './core/layout/navbar/navbar';
import { SidebarComponent } from './core/layout/sidebar/sidebar';
import { FooterComponent } from './core/layout/footer/footer';
import { BottomNavComponent } from './core/layout/bottom-nav/bottom-nav';
import { UpperFooterComponent } from './core/layout/upper-footer/upper-footer.component';
import { LayoutService } from './core/services/layout.service';

// Routes that render without the app shell (no navbar/sidebar/footer)
const SHELL_LESS = ['/login', '/unauthorized'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, SidebarComponent, FooterComponent, BottomNavComponent, UpperFooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    style: 'display:flex; flex-direction:column; height:100vh; overflow:hidden;'
  }
})
export class App implements OnInit {
  private layout = inject(LayoutService);
  activeRoute = '';
  showInfoBar = false;
  showFooter  = false;

  private readonly createRoutes = [
    '/mm-deal/create', '/portfolio/create', '/partners/create',
    '/counterparties/create', '/instruments/create',
    '/gl-master/create', '/products/create', '/ssi/create',
  ];

  get sidebarOpen(): boolean { return this.layout.sidebarOpen; }
  get showShell():   boolean { return !SHELL_LESS.some(p => this.activeRoute.startsWith(p)); }
  closeNav(): void           { this.layout.close(); }

  checkRoute(url: string): void {
    const onCreatePage = this.createRoutes.some(r => url.startsWith(r));
    this.showInfoBar = onCreatePage;
    this.showFooter  = onCreatePage;
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkRoute(this.router.url);

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ).subscribe(url => {
      this.activeRoute = url;
      this.layout.close();
      this.checkRoute(url);
    });
  }
}
