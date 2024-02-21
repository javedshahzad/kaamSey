import { Component } from '@angular/core';
import { GlobalService } from '../core/auth/global.service';
import { AppdatabaselogService } from '../pages/inspection/appdatabaselog.service';


@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  public allow_inspection_visible:boolean=false;
  constructor(private appDatabaseLogService: AppdatabaselogService, public globalService: GlobalService) {
    this.allow_inspection_visible=!!localStorage.getItem('inspection_visible') && localStorage.getItem('inspection_visible') == 'true' ? true : false;
  }

  async appDatabaseLog() {
    await this.appDatabaseLogService.AppDatabaseLog();
  }
}
