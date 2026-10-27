import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService, API_URL } from './auth.service';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token;
  const protegida = request.url.startsWith(API_URL + '/') && !request.url.startsWith(API_URL + '/auth/');
  return next(protegida && token ? request.clone({setHeaders: { Authorization: `Bearer ${token}` }}) : request);
};
