import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from '../core/auth/auth-guard.service';

const routes: Routes = [{
  path: 'tabs',
  component: TabsPage,
  children: [{
    path: 'tab1',
    children: [{
      path: '',
      loadChildren: () => import('../pages/dashboard/dashboard.module').then(m => m.DashboardPageModule),
    }]
  }, {
    path: 'tab2',
    children: [{
      path: '',
      loadChildren: () => import('../pages/inspection/inspection.module').then(m => m.InspectionPageModule),
    }]
  }, {
    path: 'tab3',
    children: [{
      path: '',
      loadChildren: () => import('../pages/setting/setting.module').then(m => m.SettingPageModule),
    }]
  }, {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full'
  }]
}, {
  path: '',
  redirectTo: '/tabs/tab1',
  pathMatch: 'full',
 // canActivate: [AuthGuard]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule { }
