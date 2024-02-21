import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AllDataRepsonse, Data } from 'src/app/models/all-data-model';
import { File } from '@ionic-native/File/ngx';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { GlobalService } from 'src/app/core/auth/global.service';

@Injectable()
export class PdfDownloadService {
  apiUrl: string;
  progressBar = false;

  constructor(private http: HttpClient, private transfer: FileTransfer, private file: File, private platform: Platform,
    private alertController: AlertController, private translateService: TranslateService,
    private androidPermissions: AndroidPermissions, private fileOpener: FileOpener, private globalService: GlobalService) {
      // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
     }

  getPdfName(guid: string, empId): Observable<AllDataRepsonse> {
    this.progressBar = true;
    return this.http.get<AllDataRepsonse>(`${environment.endPoint}Inspection/DownloadInspectionPdf?guid=` + guid + `&empId=` + empId);
  }

  getRentalPdfName(guid: string): Observable<AllDataRepsonse> {
    this.progressBar = true;
    return this.http.get<AllDataRepsonse>(`${environment.endPoint}Inspection/DownloadRentalPdf?guid=` + guid);
  }

  getWaterPdfName(guid: string, empId): Observable<AllDataRepsonse> {
    this.progressBar = true;
    return this.http.get<AllDataRepsonse>(`${environment.endPoint}Inspection/DownloadNoComplainPdf?guid=` + guid + `&empId=` + empId);
  }

  downloadPdf(name: Data) {
    const fileTransfer: FileTransferObject = this.transfer.create();
    const url = encodeURI(`${environment.endPoint}Inspection/DownloadFile?fileName=${name}`);

    const strFilePath = `${(this.platform.is('android') ? this.file.externalRootDirectory : this.file.dataDirectory)}Download/${name}`;
    fileTransfer.download(url, strFilePath, true).then(async (entry) => {
      await this.presentStoragePath(entry.toURL());
    }, (err) => {

      this.checkPermissions();
    });
  }

  checkPermissions() {
    this.progressBar = false;
    this.androidPermissions.requestPermissions([
      this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE,
      this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
    ]);
  }

  async presentStoragePath(msg: string) {
    const alert = await this.alertController.create({
      header: 'Storage directory',
      message: msg,
      buttons: [{
        text: this.translateService.instant('Sync.ok'),
        role: 'cancel',
        handler: () => {
          this.progressBar = false;
        }
      }, {
        text: this.translateService.instant('InspectionDetail.view'),
        handler: () => {
          this.progressBar = false;
          this.openDownloadFile(msg);
        }
      }]
    });
    await alert.present();
  }

  openDownloadFile(path: string) {
    this.fileOpener.open(path, 'application/pdf')
      .then(() => console.log('File is opened'))
      .catch(e => console.log('Error opening file', e));
  }
}
