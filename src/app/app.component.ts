import { Component } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';
import { BackgroundColorOptions, StatusBar, Style } from '@capacitor/status-bar';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Market } from "@ionic-native/market/ngx";
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { Location } from '@angular/common';
import { GlobalService } from './core/auth/global.service';
import { LanguageService } from './core/language.service';
import { ToastService } from './core/toast.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  tempCount = 1;
  // @ViewChildren(IonRouterOutlet) routerOutlet: QueryList<IonRouterOutlet>;
  versionCode: string | number;
  backButtonPressedTimer: any;
  apiUrl: string;

  constructor(private platform: Platform,
    private languageService: LanguageService, private router: Router, private toastService: ToastService,
    private translateService: TranslateService, private market: Market, public alertController: AlertController,
    private storage: Storage,
    public http: HttpClient, public appVersion: AppVersion, private location: Location,private globalService:GlobalService) {
    this.initializeApp();
    this.backButtonEvent();
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      this.storage.create();
      await StatusBar.setStyle({ style: Style.Light });
      setTimeout(async () => {
        await SplashScreen.hide()
      }, 2000);
      this.languageService.setInitialAppLanguage();
      this.appVersion.getVersionCode().then(res => {
        this.versionCode = res;
        //this.checkAppVersion();
      })
    });
    this.platform.resume.subscribe(res => {
      //this.checkAppVersion()
    })


  }
  checkAppVersion() {
    this.appVersion.getVersionNumber().then((value) => {
      let type;
      (this.platform.is('ios')) ? type = 0 : type = 1;
      this.http.get(`${environment.endPoint}Account/GetCurrnetVersion?type=${type}`).subscribe(async (res: any) => {
        if (res.Success && res.Data > this.versionCode) {
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

  backButtonEvent() {
    this.platform.backButton.subscribeWithPriority(10, () => {
     

      if (this.router.url === "/tabs/tab1" || this.router.url === '/tabs/tab2') {
        if (this.tempCount === 2) {
          navigator['app'].exitApp();
        }
        this.toastService.presentToast(this.translateService.instant('General.exitApp'));
        this.tempCount++;
        if (this.backButtonPressedTimer) {
          clearTimeout(this.backButtonPressedTimer);
        }
        this.backButtonPressedTimer = setTimeout(() => {
          this.tempCount = 1;
        }, 3000);
      } else if (this.router.url.includes('/tabs/')) {
        if(this.router.url.includes('/type')){
          let isEdit:any = localStorage.getItem('isEdit');
          let inspectionDetailObj:any={};
          if(localStorage.getItem('inspectionDetailObj')){
            inspectionDetailObj = JSON.parse(localStorage.getItem('inspectionDetailObj'))
          }
         
          isEdit === 'true' ?  this.router.navigate([`/tabs/tab2/detail/${JSON.stringify(inspectionDetailObj)}`])   : this.router.navigate(['/tabs/tab2']);
          localStorage.removeItem('isEdit');
        }
        else if(this.router.url.includes('/detail')){
          var isDownloadInspection = localStorage.getItem('isDownloadInspection');
          if(isDownloadInspection=='true'){
            this.location.back();
          }
          else{
            this.router.navigate(["/tabs/tab2"]);
          }
        }
        else{
          this.location.back();
        }
        
      }
      // if (this.router.url === '/tabs/tab1' || this.router.url === '/tabs/tab2' || this.router.url === '/tabs/tab3') {
      //   if (this.tempCount === 2) {
      //     navigator['app'].exitApp();
      //   }
      //   this.toastService.presentToast(this.translateService.instant('General.exitApp'));
      //   this.tempCount++;
      //   if (this.backButtonPressedTimer) {
      //     clearTimeout(this.backButtonPressedTimer);
      //   }
      //   this.backButtonPressedTimer = setTimeout(() => {
      //     this.tempCount = 1;
      //   }, 3000);
      //   return
      // } else {
      //   this.routerOutlet.pop();
      // }

    });
  }
}
