import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, timeout, finalize } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { AuthService, Rol } from '../core/auth.service';
import { UiService } from '../core/ui.service';

type Tipo = 'pacientes' | 'medicos' | 'citas' | 'historiales' | 'especialidades';
type InputType = 'text' | 'number' | 'dateTime' | 'textarea' | 'select';
interface Campo { key: string; label: string; tipo: InputType; requerido?: boolean; options?: string; }
interface Config {
  titulo: string; descripcion: string; columnas: {key:string; label:string}[];
  campos: Campo[]; crear: Rol[]; editar: Rol[]; eliminar: Rol[];
}
const ADMIN: Rol = 'ROLE_ADMIN', MEDICO: Rol = 'ROLE_MEDICO', RECEPCION: Rol = 'ROLE_RECEPCION';
const CONFIGS: Record<Tipo, Config> = {
  pacientes: {
    titulo: 'Pacientes', descripcion: 'Consulta y administra la información de pacientes.',
    columnas: [{key:'id',label:'ID'},{key:'nombre',label:'Nombre'},{key:'apellido',label:'Apellido'},{key:'cedula',label:'Cédula'},{key:'telefono',label:'Teléfono'}],
    campos: [{key:'nombre',label:'Nombre',tipo:'text',requerido:true},{key:'apellido',label:'Apellido',tipo:'text',requerido:true},{key:'cedula',label:'Cédula (10 dígitos)',tipo:'text',requerido:true},{key:'telefono',label:'Teléfono',tipo:'text'}],
    crear:[ADMIN,RECEPCION],editar:[ADMIN,RECEPCION],eliminar:[ADMIN]
  },
  medicos: {
    titulo:'Médicos', descripcion:'Directorio del personal médico y sus especialidades.',
    columnas:[{key:'id',label:'ID'},{key:'nombre',label:'Nombre'},{key:'apellido',label:'Apellido'},{key:'especialidad.nombre',label:'Especialidad'}],
    campos:[{key:'nombre',label:'Nombre',tipo:'text',requerido:true},{key:'apellido',label:'Apellido',tipo:'text',requerido:true},{key:'especialidadId',label:'Especialidad',tipo:'select',requerido:true,options:'especialidades'}],
    crear:[ADMIN,RECEPCION],editar:[ADMIN,MEDICO],eliminar:[ADMIN]
  },
  citas: {
    titulo:'Citas médicas',descripcion:'Calendario de citas y cambios de estado.',
    columnas:[{key:'id',label:'ID'},{key:'fechaHora',label:'Fecha y hora'},{key:'estado',label:'Estado'},{key:'paciente.nombre',label:'Paciente'},{key:'medico.nombre',label:'Médico'}],
    campos:[{key:'fechaHora',label:'Fecha y hora',tipo:'dateTime',requerido:true},{key:'estado',label:'Estado',tipo:'select',requerido:true,options:'estados'},
      {key:'pacienteId',label:'Paciente',tipo:'select',requerido:true,options:'pacientes'},{key:'medicoId',label:'Médico',tipo:'select',requerido:true,options:'medicos'}],
    crear:[ADMIN,RECEPCION],editar:[ADMIN,RECEPCION,MEDICO],eliminar:[ADMIN,RECEPCION]
  },
  historiales: {
    titulo:'Historiales clínicos',descripcion:'Diagnósticos y recetas médicas asociados a citas.',
    columnas:[{key:'id',label:'ID'},{key:'cita.id',label:'Cita'},{key:'diagnostico',label:'Diagnóstico'},{key:'recetaMedica',label:'Receta'}],
    campos:[{key:'citaId',label:'Cita médica',tipo:'select',requerido:true,options:'citas'},{key:'diagnostico',label:'Diagnóstico',tipo:'textarea',requerido:true},{key:'recetaMedica',label:'Receta médica',tipo:'textarea'}],
    crear:[ADMIN,MEDICO],editar:[ADMIN,MEDICO],eliminar:[ADMIN]
  },
  especialidades: {
    titulo:'Especialidades',descripcion:'Catálogo de áreas médicas del centro.',
    columnas:[{key:'id',label:'ID'},{key:'nombre',label:'Especialidad'},{key:'descripcion',label:'Descripción'}],
    campos:[{key:'nombre',label:'Nombre',tipo:'text',requerido:true},{key:'descripcion',label:'Descripción',tipo:'textarea'}],
    crear:[ADMIN],editar:[ADMIN],eliminar:[ADMIN]
  }
};
@Component({
  selector:'app-recursos',standalone:true,imports:[FormsModule],
  template:`
    <div class="page-heading"><div><span class="eyebrow blue">MÓDULOS MÉDICOS</span><h1>{{ config.titulo }}</h1><p>{{ config.descripcion }}</p></div>
      <div class="heading-actions"><button type="button" class="button button-outline" (click)="cargar()">↻ Actualizar</button>
        @if(puedeCrear){<button type="button" class="button button-primary" (click)="nuevo()">＋ Agregar {{ singular }}</button>}
      </div>
    </div>
    <section class="panel">
      <div class="panel-heading"><h2>Listado ({{ filtrados.length }})</h2><div class="filters"><label class="sr-only" for="filtroDatos">Buscar {{ config.titulo }}</label><input id="filtroDatos" type="search" [(ngModel)]="busqueda" placeholder="Buscar en la tabla..." /></div></div>
      @if (cargando) { <p class="loading" role="status">Cargando datos...</p> }
      @if (error) { <p class="message error" role="alert">{{ error }}</p> }
      @if (exito) { <p class="message success" role="status">{{ exito }}</p> }
      <div class="table-wrap"><table><thead><tr>@for (col of config.columnas; track col.key) { <th scope="col">{{ col.label }}</th> } @if(puedeEditar || puedeEliminar) {<th scope="col">Acciones</th>}</tr></thead>
        <tbody>@for (fila of filtrados; track fila['id']) {
          <tr>@for(col of config.columnas;track col.key) {<td>{{ verDato(fila, col.key) }}</td>}
            @if(puedeEditar || puedeEliminar) {<td><div class="table-actions">
              @if(puedeEditar) {<button type="button" class="button button-outline button-small" (click)="editar(fila)">Editar</button>}
              @if(puedeEliminar) {<button type="button" class="button button-danger button-small" (click)="eliminar(fila)">Eliminar</button>}
            </div></td>}
          </tr>
        } @empty {<tr><td class="empty" [attr.colspan]="config.columnas.length + (puedeEditar || puedeEliminar ? 1 : 0)">{{ cargando ? 'Consultando registros...' : 'Sin resultados. Verifica el filtro o registra el primer elemento.' }}</td></tr>}</tbody>
      </table></div>
    </section>
    @if(formAbierto){
      <div class="dialog-backdrop" role="presentation" (click)="cerrar()"></div>
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="form-recurso-title">
        <div class="dialog-head"><div><span class="eyebrow blue">MediCore</span><h2 id="form-recurso-title">{{ editandoId ? 'Editar' : 'Registrar' }} {{ singular }}</h2></div>
          <button type="button" class="icon-button" aria-label="Cerrar formulario" (click)="cerrar()">✕</button></div>
        <form #formRecurso="ngForm" class="form-stack" (ngSubmit)="guardar()">
          @for(campo of config.campos;track campo.key){
            <div class="field"><label [for]="campo.key">{{ campo.label }} {{ campo.requerido ? '*' : '' }}</label>
            @if(campo.tipo==='textarea') {<textarea [id]="campo.key" [name]="campo.key" [(ngModel)]="form[campo.key]" [required]="!!campo.requerido" rows="3"></textarea>}
            @else if(campo.tipo==='select'){
              <select [id]="campo.key" [name]="campo.key" [(ngModel)]="form[campo.key]" [required]="!!campo.requerido">
                <option value="">Selecciona una opción</option>
                @for(opcion of opciones(campo.options || '');track opcion.value){<option [value]="opcion.value">{{ opcion.label }}</option>}
              </select>
            } @else {
              <input [id]="campo.key" [name]="campo.key" [type]="campo.tipo==='dateTime'?'datetime-local':campo.tipo" [(ngModel)]="form[campo.key]" [required]="!!campo.requerido"
              [attr.min]="campo.tipo==='dateTime' ? fechaMinima : null" [attr.pattern]="campo.key==='cedula' ? '[0-9]{10}' : null" />
            }
            </div>
          }
          @if(errorFormulario){<p class="message error" role="alert">{{errorFormulario}}</p>}
          <div class="inline-actions right"><button type="button" class="button button-outline" (click)="cerrar()">Cancelar</button><button type="submit" class="button button-primary" [disabled]="guardando || formRecurso.invalid">{{guardando?'Guardando...':'Guardar cambios'}}</button></div>
        </form>
      </section>
    }
  `
})
export class RecursosComponent implements OnInit {
  private readonly api=inject(ApiService);
  private readonly auth=inject(AuthService);
  private readonly ruta=inject(ActivatedRoute);
  private readonly ui=inject(UiService);
  private readonly cdr=inject(ChangeDetectorRef);
  private readonly destroyRef=inject(DestroyRef);
  private refrescar() { if (!this.destroyRef.destroyed) this.cdr.detectChanges(); }
  private mensajeError(e: any): string {
    if (e?.name === 'TimeoutError') return 'El servidor tardó demasiado. Revisa el listado antes de repetir la operación.';
    const detalle = e?.error?.error || e?.error?.message;
    return typeof detalle === 'string' ? detalle : `Error HTTP ${e?.status ?? 'desconocido'}.`;
  }
  tipo: Tipo='pacientes';
  config: Config=CONFIGS.pacientes;
  datos: Record<string,unknown>[]=[];
  busqueda='';cargando=false;guardando=false;formAbierto=false;
  error='';exito='';errorFormulario='';editandoId: number|null=null;
  form: Record<string,string|number>={};
  listas: Record<string,Record<string,unknown>[]>={};
  get singular() {return ({pacientes:'paciente',medicos:'médico',citas:'cita',historiales:'historial',especialidades:'especialidad'} as Record<Tipo,string>)[this.tipo];}
  get puedeCrear(){return this.config.crear.includes(this.auth.rol as Rol);}
  get puedeEditar(){return this.config.editar.includes(this.auth.rol as Rol);}
  get puedeEliminar(){return this.config.eliminar.includes(this.auth.rol as Rol);}
  get filtrados() { const q=this.busqueda.toLowerCase().trim(); return this.datos.filter(x=>this.config.columnas.some(c=>this.verDato(x,c.key).toLowerCase().includes(q))); }
  get fechaMinima() { const d=new Date(Date.now()+60000);const n=new Date(d.getTime()-d.getTimezoneOffset()*60000);return n.toISOString().slice(0,16); }
  ngOnInit() {
    this.ruta.data.subscribe(d=>{this.tipo=(d['tipo'] as Tipo)||'pacientes';this.config=CONFIGS[this.tipo];this.formAbierto=false;this.busqueda='';this.cargar();this.cargarOpciones();});
  }
  cargar() {
    this.cargando=true;this.error='';
    this.refrescar();
    this.api.listar<Record<string,unknown>>(this.tipo).pipe(
      timeout({ first: 25000 }),
      finalize(()=>{this.cargando=false;this.refrescar();})
    ).subscribe({
      next:d=>{this.datos=d;this.refrescar();},
      error:e=>{this.error=`No se pudieron cargar los datos: ${this.mensajeError(e)}`;this.refrescar();}
    });
  }
  cargarOpciones() {
    const recursos=[...new Set(this.config.campos.map(c=>c.options).filter(o=>o && o!=='estados'))] as string[];
    for (const recurso of recursos) {
      this.api.listar<Record<string,unknown>>(recurso).pipe(
        timeout({first:25000}),catchError(()=>of([]))
      ).subscribe(datos=>{this.listas[recurso]=datos;this.refrescar();});
    }
  }
  verDato(fila:Record<string,unknown>,key:string):string {
    const valor=key.split('.').reduce<unknown>((ob,k)=>ob && typeof ob==='object' ? (ob as Record<string,unknown>)[k] : undefined,fila);
    if (valor==null)return '—';
    if(key==='fechaHora')return String(valor).replace('T',' ').slice(0,16);
    return String(valor);
  }
  opciones(tipo:string): {value:string;label:string}[] {
    if(tipo==='estados')return ['PROGRAMADA','CONFIRMADA','ATENDIDA','CANCELADA'].map(x=>({value:x,label:x}));
    return (this.listas[tipo]||[]).map(x=>({value:String(x['id']),label:tipo==='citas'?`Cita #${x['id']} · ${String(x['fechaHora']||'').slice(0,16)}`:`${x['nombre']||''} ${x['apellido']||''}`.trim()}));
  }
  nuevo(){this.editandoId=null;this.form=Object.fromEntries(this.config.campos.map(c=>[c.key,c.key==='estado'?'PROGRAMADA':'']));this.errorFormulario='';this.formAbierto=true;}
  editar(fila:Record<string,unknown>) {
    this.editandoId=Number(fila['id']);this.form={};this.errorFormulario='';
    for(const campo of this.config.campos){let valor:unknown=fila[campo.key];
      if(campo.key==='pacienteId')valor=(fila['paciente'] as Record<string,unknown>)?.['id'];
      if(campo.key==='medicoId')valor=(fila['medico'] as Record<string,unknown>)?.['id'];
      if(campo.key==='especialidadId')valor=(fila['especialidad'] as Record<string,unknown>)?.['id'];
      if(campo.key==='citaId')valor=(fila['cita'] as Record<string,unknown>)?.['id'];
      if(campo.tipo==='dateTime')valor=String(valor||'').slice(0,16);
      this.form[campo.key]=String(valor??'');
    }this.formAbierto=true;
  }
  cerrar(){if(!this.guardando)this.formAbierto=false;}
  guardar(){
    if(this.guardando)return;
    const dto:Record<string,unknown>={};
    for(const campo of this.config.campos){const valor=this.form[campo.key];dto[campo.key]=(['medicoId','pacienteId','especialidadId','citaId'].includes(campo.key))?Number(valor):(campo.tipo==='dateTime'?String(valor)+':00':String(valor??'').trim());}
    if(this.tipo==='pacientes'&&!/^\d{10}$/.test(String(dto['cedula']))) {this.errorFormulario='La cédula debe tener exactamente 10 dígitos.';return;}
    if(this.tipo==='citas' && new Date(String(dto['fechaHora'])).getTime()<=Date.now()){this.errorFormulario='Selecciona una fecha y hora futura.';return;}
    this.guardando=true;this.errorFormulario='';this.exito='';this.refrescar();
    const solicitud=this.editandoId?this.api.actualizar(this.tipo,this.editandoId,dto):this.api.crear(this.tipo,dto);
    solicitud.pipe(
      timeout({first:40000}),
      finalize(()=>{this.guardando=false;this.refrescar();})
    ).subscribe({
      next:()=>{
        this.formAbierto=false;
        this.exito='Datos guardados correctamente.';
        this.ui.anunciar(this.exito);
        this.refrescar();
        this.cargar();
        this.cargarOpciones();
      },
      error:e=>{
        this.errorFormulario=`${this.mensajeError(e)} Si el registro aparece en la lista, no lo vuelvas a crear.`;
        this.refrescar();
        this.cargar();
      }
    });
  }
  eliminar(fila:Record<string,unknown>){
    const id=Number(fila['id']);if(!confirm('¿Eliminar definitivamente el registro #'+id+'?'))return;
    this.api.eliminar(this.tipo,id).pipe(timeout({first:30000})).subscribe({
      next:()=>{this.exito='Registro eliminado correctamente.';this.ui.anunciar(this.exito);this.cargar();this.refrescar();},
      error:e=>{this.error=`No se pudo confirmar la eliminación: ${this.mensajeError(e)}`;this.cargar();this.refrescar();}
    });
  }
}
