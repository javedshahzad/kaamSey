import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { Market } from '@ionic-native/market/ngx';
import { Network } from '@ionic-native/network/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class CheckVersionService {
  apiUrl: string;

  constructor(private appVersion: AppVersion, private platform: Platform, private http: HttpClient,
    private alertController: AlertController, private market: Market, private network: Network) {
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
  }

  checkAppVersion(versionCode) {
    if (this.network.type != this.network.Connection.NONE) {
      this.appVersion.getVersionNumber().then((value) => {
        let type;
        if (this.platform.is('android')) {
          
          type = 1
        }
        else {
          versionCode = versionCode.replace(/\./g,""); 
          type = 0; }
        this.http.get(`${environment.endPoint}Account/GetCurrnetVersion?type=${type}`).subscribe(async (res: any) => {
          if (res.Success && res.Data > versionCode) {
            let alert;
            if (this.platform.is('android')) {
              alert = await this.alertController.create({
                header: 'Update Available',
                subHeader: `current version : ${value}`,
                message: `A newer version of this app is available for download.Please update it from PlayStore`,
                backdropDismiss: false,
                buttons: [
                  {
                    text: 'Exit',
                    role: 'exit',
                    handler: (blah) => {
                      navigator['app'].exitApp();
                    }
                  }, {
                    text: 'Update',
                    handler: () => {
                      this.market.open('com.kaamsey.inspection');
                    }
                  }
                ]
              });
            } else {
              alert = await this.alertController.create({
                header: 'Update Available',
                subHeader: `current version : ${value}`,
                message: `A newer version of this app is available for download.Please update it from Appstore`,
                backdropDismiss: false,
                buttons: [
                  {
                    text: 'Update',
                    handler: () => {
                      this.market.open('com.kaamsey.inspection');
                    }
                  }
                ]
              });

            }
            await alert.present();
          }
        }, err => {

        })
      })
    }
  }
}
