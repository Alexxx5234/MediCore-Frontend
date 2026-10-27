import { Routes } from '@angular/router';
import { authGuard, rolGuard, moduloGuard } from './core/guards';
import { PublicLayoutComponent } from './layouts/public-layout';
import { PrivateLayoutComponent } from './layouts/private-layout';
import { LoginComponent } from './pages/login';
import { InicioComponent } from './pages/inicio';
import { AdminComponent } from './pages/admin';
import { RecursosComponent } from './pages/recursos';
import { CitaPacienteComponent } from './pages/cita-paciente';
export const routes: Routes = [
  { path:'', pathMatch:'full', redirectTo:'login' },
  {path:'login', component:PublicLayoutComponent,children:[{path:'',component:LoginComponent}]},
  {path:'',component:PrivateLayoutComponent,canActivateChild:[authGuard],children:[
    {path:'admin',component:InicioComponent,canActivate:[rolGuard],data:{rol:'ROLE_ADMIN'}},
    {path:'medico',component:InicioComponent,canActivate:[rolGuard],data:{rol:'ROLE_MEDICO'}},
    {path:'recepcion',component:InicioComponent,canActivate:[rolGuard],data:{rol:'ROLE_RECEPCION'}},
    {path:'paciente',component:InicioComponent,canActivate:[rolGuard],data:{rol:'ROLE_PACIENTE'}},
    {path:'admin/usuarios',component:AdminComponent,canActivate:[rolGuard],data:{rol:'ROLE_ADMIN'}},
    {path:'datos/pacientes',component:RecursosComponent,canActivate:[moduloGuard],data:{tipo:'pacientes',roles:['ROLE_ADMIN','ROLE_RECEPCION','ROLE_MEDICO']}},
    {path:'datos/medicos',component:RecursosComponent,canActivate:[moduloGuard],data:{tipo:'medicos',roles:['ROLE_ADMIN','ROLE_RECEPCION','ROLE_MEDICO','ROLE_PACIENTE']}},
    {path:'datos/citas',component:RecursosComponent,canActivate:[moduloGuard],data:{tipo:'citas',roles:['ROLE_ADMIN','ROLE_RECEPCION','ROLE_MEDICO']}},
    {path:'datos/historiales',component:RecursosComponent,canActivate:[moduloGuard],data:{tipo:'historiales',roles:['ROLE_ADMIN','ROLE_MEDICO']}},
    {path:'datos/especialidades',component:RecursosComponent,canActivate:[moduloGuard],data:{tipo:'especialidades',roles:['ROLE_ADMIN','ROLE_RECEPCION','ROLE_MEDICO','ROLE_PACIENTE']}},
    {path:'paciente/nueva-cita',component:CitaPacienteComponent,canActivate:[rolGuard],data:{rol:'ROLE_PACIENTE'}}
  ]},
  {path:'**',redirectTo:'login'}
];
