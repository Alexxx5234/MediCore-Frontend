import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, Rol } from '../core/auth.service';
import { AccesibilidadComponent } from '../shared/accesibilidad';
import { NotificacionesComponent } from '../shared/notificaciones';
import { UiService } from '../core/ui.service';
interface MenuItem { titulo: string; url: string; icono: string; roles: Rol[]; }
@Component({
  selector: 'app-private-layout', standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AccesibilidadComponent, NotificacionesComponent],
  template: `
    <a class="skip-link" href="#contenido">Saltar al contenido</a>
    <div class="shell">
      @if (menuAbierto) { <button class="mobile-overlay" type="button" aria-label="Cerrar el menú" (click)="menuAbierto=false"></button> }
      <aside class="sidebar" [class.open]="menuAbierto" aria-label="Navegación principal">
        <div class="sidebar-brand"><span class="brand-icon">✚</span><div><strong>MediCore</strong><small>Gestión clínica</small></div></div>
        <div class="sidebar-user"><span class="avatar">{{ inicial }}</span><div><strong>{{ auth.nombre }}</strong><small>{{ descripcionRol }}</small></div></div>
        <nav class="sidebar-nav" aria-label="Módulos del sistema">
          @for (enlace of menuVisible; track enlace.url) {
            <a [routerLink]="enlace.url" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="menuAbierto=false">
              <span aria-hidden="true">{{ enlace.icono }}</span>{{ enlace.titulo }}
            </a>
          }
        </nav>
        <div class="sidebar-bottom"><button class="sidebar-logout" type="button" (click)="cerrarSesion()">↪ Cerrar sesión</button></div>
      </aside>
      <div class="shell-main">
        <header class="topbar">
          <div class="topbar-left"><button type="button" class="icon-button mobile-toggle" aria-label="Abrir menú" [attr.aria-expanded]="menuAbierto" (click)="menuAbierto=!menuAbierto">☰</button>
          <div class="topbar-title"><strong>Panel {{ descripcionRol }}</strong><small>Plataforma clínica segura</small></div></div>
          <div class="topbar-actions"><app-notificaciones /><app-accesibilidad /></div>
        </header>
        <main id="contenido" class="page-content" tabindex="-1"><router-outlet /></main>
        <div class="sr-only" role="status" aria-live="polite">{{ ui.mensaje() }}</div>
      </div>
    </div>
  `
})
export class PrivateLayoutComponent {
  readonly auth = inject(AuthService);
  readonly ui = inject(UiService);
  private readonly router = inject(Router);
  menuAbierto = false;
  readonly menu: MenuItem[] = [
    { titulo: 'Inicio', url: '/admin', icono: '▦', roles: ['ROLE_ADMIN'] },
    { titulo: 'Inicio', url: '/medico', icono: '▦', roles: ['ROLE_MEDICO'] },
    { titulo: 'Inicio', url: '/recepcion', icono: '▦', roles: ['ROLE_RECEPCION'] },
    { titulo: 'Inicio', url: '/paciente', icono: '▦', roles: ['ROLE_PACIENTE'] },
    { titulo: 'Usuarios', url: '/admin/usuarios', icono: '♟', roles: ['ROLE_ADMIN'] },
    { titulo: 'Pacientes', url: '/datos/pacientes', icono: '♧', roles: ['ROLE_ADMIN', 'ROLE_RECEPCION', 'ROLE_MEDICO'] },
    { titulo: 'Médicos', url: '/datos/medicos', icono: '⚕', roles: ['ROLE_ADMIN','ROLE_RECEPCION','ROLE_MEDICO','ROLE_PACIENTE'] },
    { titulo: 'Citas', url: '/datos/citas', icono: '▦', roles: ['ROLE_ADMIN','ROLE_RECEPCION','ROLE_MEDICO'] },
    { titulo: 'Historiales', url: '/datos/historiales', icono: '≡', roles: ['ROLE_ADMIN','ROLE_MEDICO'] },
    { titulo: 'Especialidades', url: '/datos/especialidades', icono: '✦', roles: ['ROLE_ADMIN','ROLE_RECEPCION','ROLE_MEDICO','ROLE_PACIENTE'] },
    { titulo: 'Solicitar cita', url: '/paciente/nueva-cita', icono: '＋', roles: ['ROLE_PACIENTE'] }
  ];
  get inicial() { return (this.auth.nombre?.charAt(0) || 'U').toUpperCase(); }
  get descripcionRol() { return ({ROLE_ADMIN:'Administrador',ROLE_MEDICO:'Médico',ROLE_RECEPCION:'Recepción',ROLE_PACIENTE:'Paciente'} as Record<string,string>)[this.auth.rol] ?? 'Usuario'; }
  get menuVisible() { return this.menu.filter(x => x.roles.includes(this.auth.rol as Rol)); }
  @HostListener('document:keydown.escape') cerrarMenu() { this.menuAbierto = false; }
  cerrarSesion() { this.auth.cerrarSesion(); this.router.navigateByUrl('/login', { replaceUrl: true }); }
}
