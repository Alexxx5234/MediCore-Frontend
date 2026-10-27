import { Component, HostListener, inject, OnInit } from '@angular/core';
import { UiService } from '../core/ui.service';
@Component({
  selector: 'app-accesibilidad', standalone: true,
  template: `
    <div class="popover-wrap">
      <button type="button" class="button button-outline toolbar-button" (click)="abierto = !abierto"
        [attr.aria-expanded]="abierto" aria-controls="panel-accesibilidad">♿ <span>Accesibilidad</span></button>
      @if (abierto) {
        <section id="panel-accesibilidad" class="popover" aria-label="Herramientas de accesibilidad">
          <div class="popover-head"><strong>Accesibilidad</strong><button type="button" class="icon-button" (click)="abierto=false" aria-label="Cerrar accesibilidad">✕</button></div>
          <label for="letra-rango">Tamaño de texto: {{ ui.tamano() }}%</label>
          <input id="letra-rango" type="range" min="90" max="140" step="10" [value]="ui.tamano()"
            (input)="ui.actualizar('tamano', +$any($event.target).value)" />
          <label class="check-row"><input type="checkbox" [checked]="ui.oscuro()" (change)="ui.actualizar('oscuro', $any($event.target).checked)" /> Modo oscuro</label>
          <label class="check-row"><input type="checkbox" [checked]="ui.contraste()" (change)="ui.actualizar('contraste', $any($event.target).checked)" /> Alto contraste</label>
          <label class="check-row"><input type="checkbox" [checked]="ui.movimientoReducido()" (change)="ui.actualizar('movimientoReducido', $any($event.target).checked)" /> Reducir animaciones</label>
          <div class="inline-actions">
            <button class="button button-outline" type="button" (click)="ui.leerTexto('Bienvenido a MediCore. Puedes navegar con el teclado, ajustar el contraste y cambiar el tamaño de texto.')">🔊 Leer</button>
            <button class="button button-outline" type="button" (click)="ui.detenerLectura()">Detener</button>
          </div>
          <button class="button button-quiet full" type="button" (click)="ui.restaurar()">Restablecer ajustes</button>
        </section>
      }
    </div>
  `
})
export class AccesibilidadComponent implements OnInit {
  readonly ui = inject(UiService);
  abierto = false;
  ngOnInit() { this.ui.init(); }
  @HostListener('document:keydown.escape') alEscape() { this.abierto = false; }
}
