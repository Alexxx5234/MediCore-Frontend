import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export const API_URL = 'http://localhost:8080/api';
export type Rol = 'ROLE_ADMIN' | 'ROLE_MEDICO' | 'ROLE_RECEPCION' | 'ROLE_PACIENTE';
export type Estado = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'BLOQUEADA';
export interface Sesion {
  token: string;
  tipo: string;
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  estado: Estado;
}
export interface Registro { nombre: string; apellido: string; email: string; password: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private get store(): Storage | null { return typeof window === 'undefined' ? null : window.sessionStorage; }
  private readonly key = 'medicore_sesion';

  login(email: string, password: string) {
    return this.http.post<Sesion>(`${API_URL}/auth/login`, { email: email.trim(), password }).pipe(tap(s => {
      if (!s?.token || !this.rutaPorRol(s.rol) || s.estado !== 'APROBADA') {
        throw new Error('La respuesta de inicio de sesión no es válida.');
      }
      this.store?.setItem(this.key, JSON.stringify(s));
    }));
  }
  registrar(data: Registro) { return this.http.post<{mensaje: string; email: string}>(`${API_URL}/auth/registro`, data); }
  verificar(email: string, codigo: string) { return this.http.post<{mensaje: string}>(`${API_URL}/auth/verificar`, { email, codigo }); }
  get sesion(): Sesion | null {
    try { const value = this.store?.getItem(this.key); return value ? JSON.parse(value) as Sesion : null; }
    catch { return null; }
  }
  get token() { return this.sesion?.token ?? ''; }
  get rol() { return this.sesion?.rol ?? ''; }
  get email() { return this.sesion?.email ?? ''; }
  get nombre() { return this.sesion?.nombre ?? ''; }
  cerrarSesion() { this.store?.removeItem(this.key); }
  autenticado() { return !!this.token; }
  rutaPorRol(rol: string): string {
    const rutas: Record<string, string> = {
      ROLE_ADMIN: '/admin', ROLE_MEDICO: '/medico',
      ROLE_RECEPCION: '/recepcion', ROLE_PACIENTE: '/paciente'
    };
    return rutas[rol] ?? '';
  }
}
