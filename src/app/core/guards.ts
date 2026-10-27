import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado() ? true : router.createUrlTree(['/login']);
};
export const rolGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) return router.createUrlTree(['/login']);
  const rol = route.data['rol'] as string;
  return auth.rol === rol ? true : router.createUrlTree([auth.rutaPorRol(auth.rol) || '/login']);
};

export const moduloGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) return router.createUrlTree(['/login']);
  const permitidos = route.data['roles'] as string[] | undefined;
  return !permitidos || permitidos.includes(auth.rol) ? true : router.createUrlTree([auth.rutaPorRol(auth.rol) || '/login']);
};
