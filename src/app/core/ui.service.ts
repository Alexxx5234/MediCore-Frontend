import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly platform = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);
  readonly oscuro = signal(false);
  readonly contraste = signal(false);
  readonly tamano = signal(100);
  readonly movimientoReducido = signal(false);
  readonly mensaje = signal('');
  init() {
    if (!isPlatformBrowser(this.platform)) return;
    try {
      const p = JSON.parse(localStorage.getItem('medicore_preferencias') || '{}');
      this.oscuro.set(!!p.oscuro); this.contraste.set(!!p.contraste);
      this.tamano.set(Math.max(90, Math.min(140, Number(p.tamano) || 100)));
      this.movimientoReducido.set(!!p.movimientoReducido);
    } catch { /* Preferencias por defecto */ }
    this.aplicar();
  }
  actualizar(propiedad: 'oscuro'|'contraste'|'tamano'|'movimientoReducido', valor: boolean | number) {
    if (propiedad === 'oscuro') this.oscuro.set(Boolean(valor));
    if (propiedad === 'contraste') this.contraste.set(Boolean(valor));
    if (propiedad === 'movimientoReducido') this.movimientoReducido.set(Boolean(valor));
    if (propiedad === 'tamano') this.tamano.set(Math.max(90, Math.min(140, Number(valor))));
    this.aplicar();
    if (isPlatformBrowser(this.platform)) localStorage.setItem('medicore_preferencias', JSON.stringify({
      oscuro: this.oscuro(), contraste: this.contraste(), tamano: this.tamano(), movimientoReducido: this.movimientoReducido()
    }));
  }
  restaurar() {
    this.oscuro.set(false); this.contraste.set(false);
    this.tamano.set(100); this.movimientoReducido.set(false);
    this.aplicar();
    if (isPlatformBrowser(this.platform)) localStorage.removeItem('medicore_preferencias');
  }
  aplicar() {
    const root = this.doc.documentElement;
    root.classList.toggle('tema-oscuro', this.oscuro());
    root.classList.toggle('alto-contraste', this.contraste());
    root.classList.toggle('sin-movimiento', this.movimientoReducido());
    root.style.fontSize = this.tamano() + '%';
  }
  anunciar(texto: string) { this.mensaje.set(texto); }
  leerTexto(texto: string) {
    if (!isPlatformBrowser(this.platform) || !('speechSynthesis' in window)) {
      this.anunciar('La lectura por voz no está disponible en este navegador.'); return;
    }
    window.speechSynthesis.cancel();
    const mensaje = new SpeechSynthesisUtterance(texto);
    mensaje.lang = 'es-EC'; mensaje.rate = 0.95;
    window.speechSynthesis.speak(mensaje);
  }
  detenerLectura() {
    if (isPlatformBrowser(this.platform) && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }
}
