import { Component, ChangeDetectorRef, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { GlobalService } from 'src/app/core/auth/global.service';
import { DatabaseService } from 'src/app/core/database.service';
import { TimestampService } from 'src/app/core/timestamp.service';
import { StatusTypes } from 'src/app/models/db-models/inspection-model';
import { GuidService } from 'src/app/core/guid.service';
import { FilePath } from '@ionic-native/file-path/ngx';
import { Crop } from '@ionic-native/crop/ngx';
import { File,FileEntry } from '@ionic-native/File/ngx';
import { ActionSheetController, AlertController, Platform, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/Camera/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { ToastService } from 'src/app/core/toast.service';
import { InpsectionPropertyImage } from 'src/app/models/db-models/property-image';
import { Location } from '@angular/common';
import { promise } from 'protractor';
import { resolve } from 'dns';
import { ImageResizer } from '@ionic-native/image-resizer/ngx';
import { LoaderService } from 'src/app/core/loader.service';
import { AllDataService } from 'src/app/pages/dashboard/all-data.service';
import { Network } from '@ionic-native/network/ngx';
import { JobService, getFileReader } from '../../job.service';
import { InspectionActionListComponent } from '../../inspection-action-list/inspection-action-list.component';

@Component({
  selector: 'app-inspection-type',
  templateUrl: './inspection-type.component.html',
  styleUrls: ['./inspection-type.component.scss'],
})
export class InspectionTypeComponent implements OnInit {
  isCreateJobCheckin: boolean = false;
  kbytes: any;
  uploadImgMsg = "";
  public insectionDetailsObj: any = {};
  public inspectionDetailObj: any = {};
  myForm: FormGroup;
  arrImage: InpsectionPropertyImage[] = [];
  inspectionGuid = '';
  public property_image_visible: boolean = false;
  storageDirectory: any;
  InsetId: any=0;
  constructor(private router: Router, private formBuilder: FormBuilder, public globalService: GlobalService,
    private zone:NgZone,
    private databaseService: DatabaseService, private timestampService: TimestampService,
    private guidService: GuidService, private filePath: FilePath, private crop: Crop, private file: File,
    private actionSheetController: ActionSheetController, private translateService: TranslateService,
    private camera: Camera, private platform: Platform, private webview: WebView, private toastService: ToastService,
    private ref: ChangeDetectorRef, private location: Location, private route: ActivatedRoute,
    private alertController: AlertController, private imageResizer: ImageResizer, private loaderService: LoaderService, private popOverCnt: PopoverController, private jobService: JobService, private network: Network) {
      this.property_image_visible = !!localStorage.getItem('property_image_visible') && localStorage.getItem('property_image_visible') == 'true' ? true : false;
    this.route.queryParams.subscribe(params => {
      if (params.InspectionDetailobj) {
        this.insectionDetailsObj = JSON.parse(params.InspectionDetailobj);
      }
    })
  }

  async ngOnInit() {
    this.platform.ready().then(() => {
      if (this.platform.is('ios')) {
        this.storageDirectory = this.file.dataDirectory;
      } else if (this.platform.is('android')) {
        this.storageDirectory = this.file.externalDataDirectory;
      } else {
        this.storageDirectory = this.file.cacheDirectory;
      }
    });
    await this.formInit();
  }

  ionViewWillEnter() {
    this.globalService.isAddress = true;
    this.isCreateJobCheckin = !!localStorage.getItem('isCreateJobCheckin') && localStorage.getItem('isCreateJobCheckin') == 'true' ? true : false;
    this.inspectionGuid = this.route.snapshot.params.guid;
    if (this.inspectionGuid != '0') {
      this.getAddressImageData();
    }
    this.getInspectionData();
  }
  async getInspectionData() {
    this.databaseService.db.executeSql('select * from inspection where InspectionGuid=?', [this.inspectionGuid]).then(res => {
      if (res.rows.length != 0) {
        this.inspectionDetailObj = res.rows.item(0);
      }
    })

  }
  getAddressImageData() {
    var query = `SELECT Address from Inspection where InspectionGuid = '${this.inspectionGuid}'`;
    this.databaseService.db.executeSql(query, []).then(
      (res) => {
        if (res.rows.length > 0) {
          this.myForm.controls.address.setValue(res.rows.item(0).Address);
          var query2 = `SELECT * from InpsectionPropertyImage where InspectionGuid = '${this.inspectionGuid}' and IsDelete='false' order by Timestamp`;
          this.databaseService.db.executeSql(query2, []).then(
            (res) => {

              if (res.rows.length > 0) {

                this.arrImage = [];
                for (var i = 0; i < res.rows.length; i++) {
                  if (res.rows.item(i).Name) {
                    this.arrImage.push({
                      Id: res.rows.item(i).Id,
                      Name: res.rows.item(i).Name,
                      Path: res.rows.item(i).Path,
                      Filepath: res.rows.item(i).Filepath,
                      Timestamp: res.rows.item(i).Timestamp,
                      InspectionGuid: res.rows.item(i).InspectionGuid,
                      IsDelete: res.rows.item(i).IsDelete,
                      IsSync: res.rows.item(i).IsSync,
                    });
                  }
                }
              }
            },
            (err) => {

            }
          );

        }
      },
      (err) => {

      }
    );
  }
  ionViewDidLeave() {
    this.myForm.reset();
  }

  async ionViewDidEnter() {
    let jobListObj: any = [];
    if (!!localStorage.getItem('jobListDataAddress')) {
      let address = localStorage.getItem('jobListDataAddress');
      this.myForm.controls.address.setValue(address);

      localStorage.removeItem('jobListDataAddress');
    }
  }

  goBack() {
    localStorage.removeItem('jobListDataAddress');
    this.globalService.isEditAddress === false ? this.router.navigate(['/tabs/tab2']) : this.router.navigate([`/tabs/tab2/detail/${JSON.stringify(this.insectionDetailsObj)}`]);
    this.globalService.isFromBack = true;
  }

  formInit() {
    this.myForm = this.formBuilder.group({
      address: ['', [Validators.required]]
    });
  }

  async next() {
    if (this.myForm.invalid) {
      Object.keys(this.myForm.controls).forEach(key => {
        if (this.myForm.controls[key].invalid) {
          this.myForm.controls[key].markAsTouched({ onlySelf: true });
        }
      });
      return;
    }
    this.updateTable();

  }

  async updateTable() {
    await this.databaseService.db.executeSql(`update Inspection set Address=? where InspectionGuid=?`, [this.myForm.value.address,
    this.inspectionGuid]).then(() => {
      this.globalService.isFromDetail = false;
      this.globalService.isFromGroupEdit = false;
      this.globalService.isFromAddNew = true;
      this.arrImage.forEach(async item => {
        item.InspectionGuid = this.inspectionGuid;
      
          await this.insertInspectionPropertyImage(item);
      
      });
      this.router.navigate([`/tabs/tab2/add/${this.inspectionGuid}`]);
    }).catch(() => { });
    console.log(this.arrImage)
  }

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: this.translateService.instant('InspectionAdd.imageTitle'),
      buttons: [{
        text: this.translateService.instant('InspectionAdd.library'),
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
        }
      }, {
        text: this.translateService.instant('InspectionAdd.camera'),
        handler: () => {
          this.takeCameraPicture();
        }
      }, {
        text: this.translateService.instant('Login.cancel'),
        role: 'cancel'
      }]
    });
    await actionSheet.present();
  }

  takePicture(sourceType: PictureSourceType) {
    const options: CameraOptions = {
      quality: 50,
      sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };
    this.camera.getPicture(options).then(imagePath => {
      console.log(imagePath)
      let newPath = imagePath.split('?')[0]
      var copyPath = newPath;
      var splitPath = copyPath.split('/');
      var imageName = splitPath[splitPath.length - 1];
      var filePath = newPath.split(imageName)[0];
      console.log(filePath,imageName)
      let res = this.copyFileToLocalDir(filePath, imageName, this.createFileName());
      if (!res) {
        this.toastService.presentToast(this.uploadImgMsg);
      }
    }).catch((error) => {
      console.log(error)
      });
  }

  takeCameraPicture() {
    const options: CameraOptions = {
      quality: 60,
      sourceType: this.camera.PictureSourceType.CAMERA,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };
    this.camera.getPicture(options).then(async imagePath => {
      console.log(imagePath)
      this.loaderService.present();
      let newPath = imagePath.split('?')[0]
      var copyPath = newPath;
      var splitPath = copyPath.split('/');
      var imageName = splitPath[splitPath.length - 1];
      var filePath = newPath.split(imageName)[0];
      console.log(filePath,imageName)
      this.file.resolveLocalFilesystemUrl(imagePath).then(async base64 => {
        (base64 as FileEntry).file(async (file) => {
          console.log(file)
          await this.readAsDataURL(file).then(async imageBase64=>{
            console.log(base64)
            let imageSize = this.calculateImageSize(imageBase64);
            console.log(imageSize)
            if (imageSize > 1024) {
              let resizeOptions = {
                uri: imagePath,
                folderName: this.file.dataDirectory,
                quality: 50,
                height: 1000,
                width: 1500,
                fileName: imageName
              };
              let newPath = await this.resizeImage(resizeOptions);
              var splitPath = newPath.split('/');
              imageName = splitPath[splitPath.length - 1];
              filePath = newPath.split(imageName)[0];
            }
    
            let res = await this.copyFileToLocalDir(filePath, imageName, this.createFileName());
            this.loaderService.dismiss();
            if (!res) {
              this.toastService.presentToast("Error acured");
            }
            else {
              const alert = await this.alertController.create({
                cssClass: "imgConfirmProcess",
                backdropDismiss: false,
                header: this.translateService.instant("Confirm Process"),
                message: this.translateService.instant("Please choose one option to proceed."),
                buttons: [
                  {
                    text: this.translateService.instant("Continue"),
                    handler: async () => {
                      this.selectImage();
                    },
                  },
                  {
                    text: this.translateService.instant("Done"),
                    role: "cancel",
                  },
                ],
              });
              alert.present();
            }
          })
        });
       
      }, error => {
        this.loaderService.dismiss();
        alert('Error in showing image' + error);
      });
    }).catch((error) => {
      console.log(error)
     });
  }
  readAsDataURL(file: any): Promise<any> {
    return new Promise((resolve,reject) => {
    this.zone.run(()=>{
    const reader = getFileReader();
    reader.onload = () => {
      console.log(reader.result)
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {
        type: file.type,
      });
      resolve(reader.result)
    };
    reader.onerror=(err)=>{
      reject(err)
    }
    reader.readAsDataURL(file);
  })
})
  }
  createFileName(): string {
    const d = new Date();
    const n = d.getTime();
    const newFileName = n + '.jpg';
    return newFileName;
  }

  resizeImage(resizeOptions): Promise<string> {
    return new Promise((resolve) => {
      this.imageResizer
        .resize(resizeOptions)
        .then((filePath: string) => {
          resolve(filePath);
        })
        .catch(e => {
          console.log(e); resolve("");
        });
    });
  }

  copyFileToLocalDir(namePath: string, currentName: string, newFileName: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(this.storageDirectory)
      this.file.copyFile(namePath, currentName,  this.file.dataDirectory, newFileName).then(async () => {
        await this.updateStoredImages(newFileName);
        resolve(true);
      }, err => {
        this.uploadImgMsg = JSON.stringify(err);
        resolve(false);
      });
    });
  }

  pathForImage(img) {
    if (img === null) {
      return '';
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  async updateStoredImages(name: string) {
    const filePath = this.file.dataDirectory + name;
    const resPath = this.pathForImage(filePath);
    this.InsetId +=1;
    const newEntry: InpsectionPropertyImage = {
      Id: this.InsetId,
      Name: name,
      Path: resPath,
      Filepath: filePath,
      Timestamp: '',
      InspectionGuid: '',
      IsSync: false,
      IsDelete: false
    };
    this.arrImage = [newEntry, ...this.arrImage];
    console.log(this.arrImage)
    this.ref.detectChanges();
  }

  async insertInspectionPropertyImage(obj: InpsectionPropertyImage) {
    console.log("insert - img")
    const query = `insert into InpsectionPropertyImage(Name,Path,Filepath,Timestamp,InspectionGuid,IsDelete,IsSync) values (?,?,?,?,?,?,?)`;
    await this.databaseService.db.executeSql(query, [obj.Name, obj.Path, obj.Filepath, this.timestampService.generateLocalTimeStamp(),
    obj.InspectionGuid, false, false]).then((data) => {
      console.log(data)
     }).catch((error) => {
      console.log(error)
     });
  }

  deleteImage(imgEntry: InpsectionPropertyImage, position: number) {
    this.arrImage.splice(position, 1);
    const correctPath = imgEntry.Filepath.substr(0, imgEntry.Filepath.lastIndexOf('/') + 1);
    this.file.removeFile(correctPath, imgEntry.Name).then(async () => {
      const query1 = `update InpsectionPropertyImage set IsDelete=?,IsSync=?,Timestamp=? where Name='${imgEntry.Name}'`;
      await this.databaseService.db.executeSql(query1, [true, false, this.timestampService.generateLocalTimeStamp()]).then(() => {

      }).catch(() => {

      });
    });
  }

  calculateImageSize(base64String) {
    let padding;
    let inBytes;
    let base64StringLength;
    if (base64String.endsWith('==')) { padding = 2; }
    else if (base64String.endsWith('=')) { padding = 1; }
    else { padding = 0; }

    base64StringLength = base64String.length;

    inBytes = (base64StringLength / 4) * 3 - padding;

    this.kbytes = inBytes / 1000;
    return this.kbytes;
  }

  getJobAddress() {
    this.loaderService.present();
    let jobId = !!this.inspectionDetailObj ? this.inspectionDetailObj.JobId : 0;
    let empId = Number(!!localStorage.getItem('empId') ? localStorage.getItem('empId') : 0);

    if (this.network.type != this.network.Connection.NONE) {
      this.jobService.getJobAddress(jobId, empId).subscribe(
        async (res) => {
          this.loaderService.dismiss();
          
          if (!!res && res.Success) {
            this.myForm.controls.address.setValue(res.Data.facility_address);
            this.toastService.presentToast(
              this.translateService.instant("InspectionType.fetchJobAddress")
            );
          }
          else if (!!res && !res.Success) {
            const alert = await this.alertController.create({
              backdropDismiss: false,
              header: this.translateService.instant("Address fetch alert"),
              message: this.translateService.instant(res.Message),
              buttons: [
                {
                  text: this.translateService.instant("Ok")
                }
              ],
            });
            alert.present();
            //this.toastService.presentToast(res.Message);
          }
        },
        (err) => {
          this.loaderService.dismiss();
          this.toastService.presentToast(this.translateService.instant('General.serverIssue'));
        });
    }
    else {
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  async showInspActions(event: any) {
    let popOverEvent = await this.popOverCnt.create({
      component: InspectionActionListComponent,
      event: event,
      componentProps: { inspectionObj: this.inspectionDetailObj, fromAddress: true },
      cssClass: 'inspActionDiv'
    });
    return await popOverEvent.present();
  }
}
