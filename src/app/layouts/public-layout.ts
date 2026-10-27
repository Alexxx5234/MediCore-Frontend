import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccesibilidadComponent } from '../shared/accesibilidad';
@Component({
  selector: 'app-public-layout', standalone: true,
  imports: [RouterOutlet, AccesibilidadComponent],
  template: `<a class="skip-link" href="#contenido">Saltar al contenido</a>
    <div class="public-shell"><header class="public-header"><a href="/login" class="logo">✚ MediCore</a><app-accesibilidad /></header>
    <main id="contenido" class="public-main"><router-outlet /></main></div>`
})
export class PublicLayoutComponent {}
