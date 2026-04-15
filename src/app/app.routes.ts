import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { InventoryManagementComponent } from './pages/inventory-management/inventory-management.component';
import { SalesManagementComponent } from './pages/sales-management/sales-management.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [authGuard],
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Dashboard',
      },
      {
        path: 'inventory-management',
        component: InventoryManagementComponent,
        title: 'Inventory Management',
      },
      {
        path: 'sales-management',
        component: SalesManagementComponent,
        title: 'Sales Management',
      },
      {
        path: 'user-management',
        component: UserManagementComponent,
        title: 'User Management',
      },
      {
        path: '**',
        redirectTo: '',
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Angular Sign In Dashboard | ERP - Angular Admin Dashboard Template'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Angular Sign Up Dashboard | ERP - Angular Admin Dashboard Template'
  },
  { path:'**', redirectTo:'signin' },
];
