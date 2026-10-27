import { Estado, Rol } from './auth.service';
export interface Usuario {
  id: number; nombre: string; apellido: string; email: string;
  rol: Rol; estado: Estado; emailVerificado: boolean;
}
export interface Paciente { id: number; nombre: string; apellido: string; cedula: string; telefono?: string; }
export interface Especialidad { id: number; nombre: string; descripcion?: string; }
export interface Medico { id: number; nombre: string; apellido: string; especialidad: Especialidad; }
export interface Cita {
  id: number; fechaHora: string; estado: string;
  paciente: Paciente; medico: Medico;
}
export interface Historial {
  id: number; diagnostico: string; recetaMedica?: string; cita: Cita;
}
export interface Notificacion {
  id: number; titulo: string; mensaje: string; leida: boolean; fechaCreacion: string;
}
