import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { timeout, finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService, Estado, Rol } from '../core/auth.service';
import { Usuario } from '../core/models';
import { UiService } from '../core/ui.service';
@Component({
  selector: 'app-admin', standalone: true, imports: [FormsModule],
  template: `
    <div class="page-heading"><div><span class="eyebrow blue">ADMINISTRACIÓN</span><h1>Gestión de usuarios</h1><p>Aprueba cuentas, revisa permisos y controla los accesos del centro médico.</p></div>
      <button type="button" class="button button-outline" (click)="cargar()">↻ Actualizar</button></div>
    <section class="stats-grid" aria-label="Resumen de usuarios">
      <div class="metric"><span class="metric-icon">👥</span><span>Total de usuarios</span><strong>{{ usuarios.length }}</strong></div>
      <div class="metric"><span class="metric-icon">⏳</span><span>Pendientes</span><strong>{{ pendientes }}</strong></div>
      <div class="metric"><span class="metric-icon">✅</span><span>Aprobados</span><strong>{{ aprobados }}</strong></div>
      <div class="metric"><span class="metric-icon">🩺</span><span>Médicos</span><strong>{{ medicos }}</strong></div>
    </section>
    <section class="panel">
      <div class="panel-heading"><div><h2>Cuentas registradas</h2><p class="muted">Solo el administrador puede modificar roles o aprobar usuarios.</p></div>
        <div class="filters"><label class="sr-only" for="filtrar">Buscar usuario</label><input id="filtrar" type="search" [(ngModel)]="busqueda" placeholder="Buscar por nombre o correo" />
        <label class="sr-only" for="filtrarEstado">Filtrar estado</label><select id="filtrarEstado" [(ngModel)]="filtroEstado"><option value="">Todos los estados</option><option value="PENDIENTE">Pendientes</option><option value="APROBADA">Aprobados</option><option value="RECHAZADA">Rechazados</option><option value="BLOQUEADA">Bloqueados</option></select></div>
      </div>
      @if (cargando) { <p class="loading" role="status">Cargando usuarios...</p> }
      @if (error) { <p class="message error" role="alert">{{ error }}</p> }
      @if (exito) { <p class="message success" role="status">{{ exito }}</p> }
      <div class="table-wrap"><table><thead><tr><th scope="col">Usuario</th><th scope="col">Correo</th><th scope="col">Estado</th><th scope="col">Rol</th><th scope="col">Acciones</th></tr></thead><tbody>
        @for (u of filtrados; track u.id) {
          <tr><td><strong>{{ u.nombre }} {{ u.apellido }}</strong><small class="subcell">#{{u.id}}{{ esMiCuenta(u) ? ' · Tu cuenta' : '' }}</small></td>
          <td>{{ u.email }}</td><td><span class="status" [class.pending]="u.estado==='PENDIENTE'" [class.good]="u.estado==='APROBADA'" [class.bad]="u.estado==='BLOQUEADA'||u.estado==='RECHAZADA'">{{ u.estado }}</span></td>
          <td><select [attr.aria-label]="'Rol de ' + u.nombre" [ngModel]="seleccionRol[u.id]" (ngModelChange)="seleccionRol[u.id]=$event" [disabled]="esMiCuenta(u)||procesando"><option value="ROLE_ADMIN">Administrador</option><option value="ROLE_MEDICO">Médico</option><option value="ROLE_RECEPCION">Recepción</option><option value="ROLE_PACIENTE">Paciente</option></select></td>
          <td><div class="table-actions">
            @if(u.estado==='PENDIENTE' || u.estado==='RECHAZADA' || u.estado==='BLOQUEADA') {
              <button class="button button-small button-success" type="button" [disabled]="procesando||esMiCuenta(u)||!u.emailVerificado" (click)="estado(u,'APROBADA')" [title]="!u.emailVerificado ? 'Correo aún sin verificar' : 'Aprobar cuenta'">Aprobar</button>
            }
            @if(u.estado==='PENDIENTE') {<button class="button button-small button-danger" type="button" [disabled]="procesando||esMiCuenta(u)" (click)="estado(u,'RECHAZADA')">Rechazar</button>}
            @if(u.estado==='APROBADA') {<button class="button button-small button-warn" type="button" [disabled]="procesando||esMiCuenta(u)" (click)="estado(u,'BLOQUEADA')">Bloquear</button>}
            <button class="button button-small button-outline" type="button" [disabled]="procesando||esMiCuenta(u)||seleccionRol[u.id]===u.rol" (click)="rol(u)">Guardar rol</button>
          </div></td></tr>
        } @empty { <tr><td colspan="5" class="empty">No hay usuarios que coincidan con tu búsqueda.</td></tr> }
      </tbody></table></div>
    </section>
  `
})
export class AdminComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private refrescar() { if (!this.destroyRef.destroyed) this.cdr.detectChanges(); }
  private mensajeError(e: any) { return e?.name==='TimeoutError' ? 'La API tardó demasiado.' : (e?.error?.error || e?.error?.message || 'HTTP '+e?.status); }
  usuarios: Usuario[] = []; seleccionRol: Record<number,Rol> = {};
  busqueda=''; filtroEstado=''; cargando=false; procesando=false; error=''; exito='';
  ngOnInit() { this.cargar(); }
  get pendientes() { return this.usuarios.filter(u=>u.estado==='PENDIENTE').length; }
  get aprobados() { return this.usuarios.filter(u=>u.estado==='APROBADA').length; }
  get medicos() { return this.usuarios.filter(u=>u.rol==='ROLE_MEDICO').length; }
  get filtrados() {
    const q=this.busqueda.toLocaleLowerCase().trim();
    return this.usuarios.filter(u=>(!this.filtroEstado||u.estado===this.filtroEstado) && (u.nombre+' '+u.apellido+' '+u.email).toLocaleLowerCase().includes(q));
  }
  esMiCuenta(u: Usuario) { return u.id===this.auth.sesion?.id; }
  cargar() {
    this.cargando=true;this.error='';this.cdr.markForCheck();
    this.api.usuarios().pipe(
      timeout({first:25000}),
      finalize(()=>{this.cargando=false;this.refrescar();})
    ).subscribe({
      next:datos=>{
        this.usuarios=datos;
        this.seleccionRol=Object.fromEntries(datos.map(u=>[u.id,u.rol]));
        this.refrescar();
      },
      error:err=>{this.error='No pudimos cargar las cuentas: '+this.mensajeError(err);this.refrescar();}
    });
  }
  estado(u: Usuario, nuevoEstado: Estado) {
    if (this.esMiCuenta(u) || this.procesando) return;
    if (!confirm('¿Cambiar a '+nuevoEstado+' la cuenta de '+u.nombre+'?')) return;
    this.procesando=true;this.error='';this.exito='';this.refrescar();
    this.api.cambiarEstado(u.id,nuevoEstado).pipe(
      timeout({first:30000}),
      finalize(()=>{this.procesando=false;this.refrescar();})
    ).subscribe({
      next:()=>{this.exito='Estado actualizado correctamente.';this.ui.anunciar(this.exito);this.cargar();this.refrescar();},
      error:e=>{this.error='No se pudo confirmar el estado: '+this.mensajeError(e);this.cargar();this.refrescar();}
    });
  }
  rol(u: Usuario) {
    if(this.esMiCuenta(u)||this.procesando)return;
    const r=this.seleccionRol[u.id];if(!r||r===u.rol)return;
    if(!confirm('¿Asignar '+r+' a '+u.nombre+'?')){this.seleccionRol[u.id]=u.rol;return;}
    this.procesando=true;this.error='';this.exito='';this.refrescar();
    this.api.cambiarRol(u.id,r).pipe(
      timeout({first:30000}),
      finalize(()=>{this.procesando=false;this.refrescar();})
    ).subscribe({
      next:()=>{this.exito='Rol actualizado correctamente.';this.ui.anunciar(this.exito);this.cargar();this.refrescar();},
      error:e=>{this.error='No se pudo confirmar el rol: '+this.mensajeError(e);this.cargar();this.refrescar();}
    });
  }
}
