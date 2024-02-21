import { Component } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { DatabaseService } from 'src/app/core/database.service';
import { StatusTypes } from 'src/app/models/db-models/inspection-model';
import { ToastService } from 'src/app/core/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { GlobalService } from 'src/app/core/auth/global.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage {

  arrOrder = [{
    name: 'Ascending',
    value: 'asc',
    checked: false
  }, {
    name: 'Descending',
    value: 'desc',
    checked: false
  }];
  boolIsInsProgress = false;

  constructor(private sqlite: SQLite, private databaseService: DatabaseService, private toastService: ToastService,
              private translateService: TranslateService, public globalService: GlobalService) {
    const queOrder = localStorage.getItem('order');

    this.arrOrder.forEach(item => {
      if (queOrder === item.value) {
        item.checked = true;
      }
    });
  }

  getInProgressInspection(value: string): Promise<boolean> {
    return new Promise(async resolve => {
      await this.sqlite.create(this.databaseService.dbCreate).then(async (db: SQLiteObject) => {
        this.databaseService.db = db;
        const query = `select count(*) as insCount, InspectionGuid from Inspection where IsDelete='false' and
        Status=${StatusTypes.InProgress}`;

        await this.databaseService.db.executeSql(query, []).then(data => {
          this.globalService.arrGuid = [];

          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              this.globalService.arrGuid.push(data.rows.item(i).InspectionGuid);
              localStorage.setItem('order', value);
              localStorage.setItem('arrGuid', JSON.stringify(this.globalService.arrGuid));

              const isInProgress = data.rows.item(i).insCount;

              if (isInProgress > 0) {
                return resolve(true);
              } else {
                return resolve(false);
              }
            }
          } else {
            localStorage.setItem('order', value);
          }
        }).catch(() => {
          return resolve(false);
        });
      }).catch(() => {
        return resolve(false);
      });
    });
  }

  async radioSelect(value: string) {
    this.boolIsInsProgress = await this.getInProgressInspection(value);

    if (this.boolIsInsProgress) {
      this.toastService.presentToast(this.translateService.instant('Setting.inProgressInsMessage'));
    }
  }
}
