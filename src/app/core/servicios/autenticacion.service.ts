
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export const API_BASE_URL = 'http://localhost:8080/api';

export type RolUsuario =
  | 'ROLE_ADMIN'
  | 'ROLE_MEDICO'
  | 'ROLE_RECEPCION'
  | 'ROLE_PACIENTE';

export interface Credenciales {
  email: string;
  password: string;
}

export interface RespuestaLogin {
  token: string;
  tipo: string;
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${API_BASE_URL}/auth`;

  // Almacenamiento independiente por pestaña
  private get almacenamiento(): Storage | null {
    return typeof window !== 'undefined'
      ? window.sessionStorage
      : null;
  }

  // Iniciar sesión con Spring Boot
  login(
    credenciales: Credenciales
  ): Observable<RespuestaLogin> {

    return this.http.post<RespuestaLogin>(
      `${this.apiUrl}/login`,
      {
        email: credenciales.email.trim(),
        password: credenciales.password
      }
    ).pipe(
      tap(respuesta => {

        if (!respuesta.token || !respuesta.rol) {
          throw new Error('Respuesta de autenticación inválida');
        }

        if (respuesta.estado !== 'APROBADA') {
          throw new Error('La cuenta no está aprobada');
        }

        const almacenamiento = this.almacenamiento;

        if (!almacenamiento) {
          throw new Error('Almacenamiento no disponible');
        }

        // Guardar datos de la sesión actual
        almacenamiento.setItem('token', respuesta.token);
        almacenamiento.setItem('rol', respuesta.rol);
        almacenamiento.setItem('email', respuesta.email);
        almacenamiento.setItem('nombre', respuesta.nombre);
        almacenamiento.setItem('id', String(respuesta.id));
      })
    );
  }

  // Cerrar sesión de esta pestaña
  cerrarSesion(): void {
    const almacenamiento = this.almacenamiento;

    almacenamiento?.removeItem('token');
    almacenamiento?.removeItem('rol');
    almacenamiento?.removeItem('email');
    almacenamiento?.removeItem('nombre');
    almacenamiento?.removeItem('id');
  }

  // Consultar autenticación
  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  obtenerToken(): string {
    return this.almacenamiento?.getItem('token') || '';
  }

  obtenerRol(): string {
    return this.almacenamiento?.getItem('rol') || '';
  }

  obtenerEmail(): string {
    return this.almacenamiento?.getItem('email') || '';
  }

  obtenerNombre(): string {
    return this.almacenamiento?.getItem('nombre') || '';
  }

  obtenerId(): number {
    return Number(this.almacenamiento?.getItem('id') || 0);
  }

  // Obtener la ruta correspondiente al rol
  obtenerRutaPorRol(): string {

    switch (this.obtenerRol()) {

      case 'ROLE_ADMIN':
        return '/admin/dashboard';

      case 'ROLE_MEDICO':
        return '/medico/dashboard';

      case 'ROLE_RECEPCION':
        return '/recepcion/dashboard';

      case 'ROLE_PACIENTE':
        return '/paciente/dashboard';

      default:
        return '/login';
    }
  }
}
