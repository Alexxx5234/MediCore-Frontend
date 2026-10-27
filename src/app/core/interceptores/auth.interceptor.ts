
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import {
  AutenticacionService,
  API_BASE_URL
} from '../servicios/autenticacion.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AutenticacionService);

  // Solo interceptar peticiones de nuestra API
  const esApi = req.url.startsWith(`${API_BASE_URL}/`);

  // Registro, verificación y login son públicos
  const esPublica = req.url.startsWith(`${API_BASE_URL}/auth/`);

  if (!esApi || esPublica) {
    return next(req);
  }

  // Obtener token de la pestaña actual
  const token = authService.obtenerToken();

  if (!token) {
    return next(req);
  }

  // Agregar JWT
  const peticion = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(peticion);
};
