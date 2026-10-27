import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, Estado, Rol } from './auth.service';
import { Usuario, Notificacion, Cita, Medico, Paciente, Historial, Especialidad } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  usuarios() { return this.http.get<Usuario[]>(`${API_URL}/admin/usuarios`); }
  cambiarEstado(id: number, nuevoEstado: Estado) { return this.http.put(`${API_URL}/admin/usuarios/${id}/estado`, { nuevoEstado }); }
  cambiarRol(id: number, nuevoRol: Rol) { return this.http.put(`${API_URL}/admin/usuarios/${id}/rol`, { nuevoRol }); }
  medicos() { return this.http.get<Medico[]>(`${API_URL}/medicos`); }
  pacientes() { return this.http.get<Paciente[]>(`${API_URL}/pacientes`); }
  especialidades() { return this.http.get<Especialidad[]>(`${API_URL}/especialidades`); }
  citas() { return this.http.get<Cita[]>(`${API_URL}/citas`); }
  historiales() { return this.http.get<Historial[]>(`${API_URL}/historiales`); }
  listar<T>(recurso: string) { return this.http.get<T[]>(`${API_URL}/${recurso}`); }
  crear<T>(recurso: string, datos: object) { return this.http.post<T>(`${API_URL}/${recurso}`, datos); }
  actualizar<T>(recurso: string, id: number, datos: object) { return this.http.put<T>(`${API_URL}/${recurso}/${id}`, datos); }
  eliminar(recurso: string, id: number) { return this.http.delete<void>(`${API_URL}/${recurso}/${id}`); }
  notificaciones() { return this.http.get<Notificacion[]>(`${API_URL}/notificaciones`); }
  marcarLeida(id: number) { return this.http.put<Notificacion>(`${API_URL}/notificaciones/${id}/leer`, {}); }
}
