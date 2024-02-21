import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ToastService } from './toast.service';
import { LoaderService } from './loader.service';
import { GuidService } from './guid.service';
import { TimestampService } from './timestamp.service';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';

import { IonicStorageModule } from '@ionic/storage-angular';

@NgModule({
    imports: [
        HttpClientModule,
        IonicStorageModule.forRoot()
    ],
    providers: [
        // TokenInterceptorProvider,
        ToastService,
        LoaderService,
        GuidService,
        TimestampService,
        SQLite,
        SQLitePorter

    ]
})
export class CoreModule { }
