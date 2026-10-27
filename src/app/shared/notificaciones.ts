import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { timeout, finalize } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Notificacion } from '../core/models';
import { UiService } from '../core/ui.service';
@Component({
  selector: 'app-notificaciones', standalone: true, imports: [CommonModule, DatePipe],
  template: `
    <div class="popover-wrap">
      <button type="button" class="button button-outline toolbar-button" (click)="alternar()"
        [attr.aria-expanded]="abierto" aria-controls="bandeja-notificaciones" aria-label="Abrir notificaciones">
        🔔 <span>Notificaciones</span> @if (noLeidas > 0) { <span class="count">{{ noLeidas }}</span> }
      </button>
      @if (abierto) {
        <section id="bandeja-notificaciones" class="popover popover-wide" aria-label="Notificaciones">
          <div class="popover-head"><strong>Notificaciones</strong><button type="button" class="icon-button" (click)="abierto = false" aria-label="Cerrar">✕</button></div>
          @if (cargando) { <p class="muted" role="status">Cargando avisos...</p> }
          @if (error) { <p class="message error" role="alert">{{ error }} <button class="text-link" (click)="cargar()">Reintentar</button></p> }
          @if (!cargando && !error && notificaciones.length === 0) { <p class="empty">No tienes avisos por ahora.</p> }
          <div class="notification-list">
            @for (n of notificaciones; track n.id) {
              <article class="notification" [class.unread]="!n.leida">
                <strong>{{ n.titulo }}</strong>
                <p>{{ n.mensaje }}</p>
                <small>{{ n.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</small>
                @if (!n.leida) { <button type="button" class="text-link" (click)="marcarLeida(n)">Marcar como leída</button> }
              </article>
            }
          </div>
        </section>
      }
    </div>
  `
})
export class NotificacionesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ui = inject(UiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private refrescar() { if (!this.destroyRef.destroyed) this.cdr.detectChanges(); }
  abierto = false; cargando = false; error = '';
  notificaciones: Notificacion[] = [];
  get noLeidas() { return this.notificaciones.filter(x => !x.leida).length; }
  ngOnInit() { this.cargar(); }
  alternar() { this.abierto = !this.abierto; if (this.abierto) this.cargar(); }
  cargar() {
    this.cargando = true; this.error = ''; this.cdr.markForCheck();
    this.api.notificaciones().pipe(
      timeout({first:25000}),
      finalize(() => {this.cargando=false;this.refrescar();})
    ).subscribe({
      next: datos => { this.notificaciones = datos; this.refrescar(); },
      error: err => { this.error = err.status === 404 ? 'Falta instalar el módulo de notificaciones en Spring Boot.' : 'No pudimos consultar los avisos (HTTP '+(err.status || 'sin respuesta')+').'; this.refrescar(); }
    });
  }
  marcarLeida(n: Notificacion) {
    this.api.marcarLeida(n.id).pipe(timeout({first:25000})).subscribe({
      next: () => { n.leida = true; this.ui.anunciar('Notificación marcada como leída'); this.refrescar(); },
      error: () => {this.ui.anunciar('No se pudo actualizar la notificación');this.refrescar();}
    });
  }
}
