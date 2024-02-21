import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { LoginPage } from './login.page';
import { LoginService } from './login.service';
import { TranslateModule } from '@ngx-translate/core';
import { Device } from '@ionic-native/device/ngx';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { LogService } from '../dashboard/log.service';
import { File } from "@ionic-native/File/ngx";
const routes: Routes = [{
  path: '',
  component: LoginPage
}];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    TranslateModule
  ],
  declarations: [LoginPage],
  providers: [
    File,
    LogService,
    LoginService,
    Device,
    AppVersion
  ]
})
export class LoginPageModule { }
