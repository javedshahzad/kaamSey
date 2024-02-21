import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsPageRoutingModule } from './tabs.router.module';
import { TabsPage } from './tabs.page';
import { TranslateModule } from '@ngx-translate/core';
import { Device } from '@ionic-native/device/ngx';
import { LogoutService } from './logout.service';
import { AppdatabaselogService } from '../pages/inspection/appdatabaselog.service';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    TranslateModule,
  ],
  declarations: [TabsPage],
  providers: [
    Device,
    LogoutService,
    AppdatabaselogService
  ]
})
export class TabsPageModule { }
