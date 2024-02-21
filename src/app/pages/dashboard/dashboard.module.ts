import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DashboardPage } from './dashboard.page';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { AllDataService } from './all-data.service';
import { ImageUploadService } from './image-upload.service';
import { Device } from '@ionic-native/device/ngx';
import { LogoutService } from 'src/app/tabs/logout.service';
import { CheckoutInspectionPageComponent } from './checkout-inspection-page/checkout-inspection-page.component';
import { File } from '@ionic-native/File/ngx';


import { FileTransfer } from '@ionic-native/file-transfer/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { PdfDownloadService } from './pdf-download.service';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { LogService } from './log.service';
import { CheckoutActionListComponent } from './checkout-inspection-page/checkout-action-list/checkout-action-list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ReactiveFormsModule,
    DashboardRoutingModule,
  ],
  declarations: [
    DashboardPage,
    CheckoutInspectionPageComponent,
    CheckoutActionListComponent
  ],
  providers: [
    File,
    AllDataService,
    ImageUploadService,
    Device,
    LogoutService,
    FileTransfer,
    WebView,
    PdfDownloadService,
    AndroidPermissions,
    FileOpener,
    LogService
  ],
  entryComponents: [CheckoutActionListComponent]
})
export class DashboardPageModule { }
