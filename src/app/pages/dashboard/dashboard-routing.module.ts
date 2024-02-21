import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { DashboardPage } from './dashboard.page';
import { CheckoutInspectionPageComponent } from './checkout-inspection-page/checkout-inspection-page.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardPage
  },
  {
    path: 'checkoutInsp',
    component: CheckoutInspectionPageComponent
  },
]
  ;

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DashboardRoutingModule { }
