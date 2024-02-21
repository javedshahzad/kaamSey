import { Component, Input, OnInit } from '@angular/core';
import { NavParams, AlertController, ActionSheetController, Platform } from '@ionic/angular';
import { Inspection, InspectionActionType } from 'src/app/models/db-models/inspection-model';
import { InspectionPage } from '../inspection.page';
import { NavigationExtras, Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { GlobalService } from 'src/app/core/auth/global.service';
import { SyncTypeEnum } from 'src/app/models/all-data-model';
import { DatabaseService } from 'src/app/core/database.service';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/Camera/ngx';
import { LoaderService } from 'src/app/core/loader.service';
import { File } from '@ionic-native/File/ngx';
import { ImageResizer } from '@ionic-native/image-resizer/ngx';
import { ToastService } from 'src/app/core/toast.service';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { InspectionQuestionImage } from 'src/app/models/db-models/inspection-question-image-model';
import { TimestampService } from 'src/app/core/timestamp.service';
import { GuidService } from 'src/app/core/guid.service';
import { Question } from 'src/app/models/db-models/questions-model';
import { Events } from 'src/app/events/events';
@Component({
  selector: 'app-inspection-action-list',
  templateUrl: './inspection-action-list.component.html',
  styleUrls: ['./inspection-action-list.component.scss'],
})
export class InspectionActionListComponent implements OnInit {
  public sample_collection_visible: boolean = false;
  actionTypeEnum = InspectionActionType;
  actionType = InspectionActionType;
  @Input() inspectionObj: any;
  @Input() show_Cam_Img: any;
  @Input() intQuestionNumber: any;
  @Input() fromSampleList:any;
  @Input() fromSearchInsp:any;
  @Input() obj:any;
  @Input() fromAddress:any;
  Client_Material_Id:any;
  SyncType = SyncTypeEnum;
  kbytes: any;
  jobid: any;
  uploadImgMsg = "";
  newInsQueEntryImgGuid = "";
  arrInsQueImage: InspectionQuestionImage[] = [];
  constructor( private guidService: GuidService,private timestampService: TimestampService,private webview: WebView,private toastService: ToastService,private imageResizer: ImageResizer,private file: File,private loaderService: LoaderService,private camera: Camera,private translateService: TranslateService,   private databaseService: DatabaseService,private actionSheetController: ActionSheetController,
    private events: Events, public alertController: AlertController, public globalService: GlobalService,public navParams: NavParams, private router: Router, private popOverCnt: PopoverController,private platform : Platform) {
      this.sample_collection_visible = !!localStorage.getItem('sample_collection_visible') && localStorage.getItem('sample_collection_visible') == 'true' ? true : false;
    }

  ionViewWillEnter(){
    this.intQuestionNumber = 0;
    this.databaseService.db.executeSql('select JobId from inspection where InspectionGuid=?', [this.inspectionObj.InspectionGuid]).then(res => {
      if (res.rows.length != 0) {
        this.jobid = res.rows.item(0).JobId
      }
    });
  }
  ngOnInit() {
    console.log("show_Cam_Img", this.show_Cam_Img); 
    console.log("inspectionObj", this.inspectionObj);
    console.log("fromSampleList", this.fromSampleList);
  }

  inspectionActionEvent(actionType) {
    this.popOverCnt.dismiss();
    //this.events.publish("inspectionActionEvent", this.inspectionObj, actionType);
    if (actionType === this.actionTypeEnum.CheckIn) {
      this.syncOneInspection(this.inspectionObj.InspectionGuid, this.inspectionObj.InspectionTypeId, true, this.inspectionObj);
      //this.popOverCnt.dismiss();
    }
    else if (actionType === this.actionTypeEnum.Sync) {
      this.syncOneInspection(this.inspectionObj.InspectionGuid, this.inspectionObj.InspectionTypeId);
      //this.popOverCnt.dismiss();
    }
    else if (actionType === this.actionTypeEnum.RMS) {
      this.samplelist(this.inspectionObj);
      //this.popOverCnt.dismiss();
    }
    else if (actionType == this.actionTypeEnum.Camera) {
      this.openInsQueCamera();
      //this.popOverCnt.dismiss();
    }
    else if (actionType == this.actionTypeEnum.Image) {
      this.showInsQueImages();
      //this.popOverCnt.dismiss();
    }
  }
  async openInsQueCamera() {
    let actionSheetCnt = await this.actionSheetController.create({
      header: 'Please select one option to add image',
      buttons: [{
        text: 'Inspection',
        handler: () => {
          this.takeInsQuePicture();
        }
      }, {
        text: 'Question',
        handler: () => {
          this.takeInsQuePicture(true);
        }
      }, {
        text: this.translateService.instant('Login.cancel'),
        role: 'cancel'
      }]
    });
    await actionSheetCnt.present();
  }

  async takeInsQuePicture(isQue?) {
    let options: CameraOptions = {
      quality: 60,
      saveToPhotoAlbum: false,
      correctOrientation: true,
      sourceType: this.camera.PictureSourceType.CAMERA
    };

    this.camera.getPicture(options).then(async imagePath => {
      this.loaderService.present();
      let newPath = imagePath.split('?')[0]
      var copyPath = newPath;
      var splitPath = copyPath.split('/');
      var imageName = splitPath[splitPath.length - 1];
      var filePath = newPath.split(imageName)[0];

     // this.file.readAsDataURL(filePath, imageName).then(async base64 => {
        this.loaderService.dismiss();
        // let imageSize = this.calculateImageSize(base64);
        // if (imageSize > 1024) {
        //   let resizeOptions = {
        //     uri: imagePath,
        //     folderName: this.file.dataDirectory,
        //     quality: 70,
        //     height: 1000,
        //     width: 1500,
        //     fileName: imageName
        //   };
        //   let newPath = await this.resizeImage(resizeOptions);
        //   var splitPath = newPath.split('/');
        //   imageName = splitPath[splitPath.length - 1];
        //   filePath = newPath.split(imageName)[0];
        // }

        let fileName = this.jobid + "_" + this.createFileName();

        let res = await this.copyInsQueFileToLocalDir(filePath, imageName, fileName, isQue);
        if (!res) {
          this.toastService.presentToast(this.uploadImgMsg);
        }
        else {
          const alert = await this.alertController.create({
            cssClass: "imgConfirmProcess",
            header: this.translateService.instant("Confirm Process"),
            message: this.translateService.instant("Please choose one option to proceed."),
            buttons: [
              {
                text: this.translateService.instant("Continue"),
                handler: async () => {
                  this.takeInsQuePicture(isQue);
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
      // }, error => {
      //   alert('Error in showing image' + error);
      // });
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
  createFileName(): string {
    const d = new Date();
    const n = d.getTime();
    const newFileName = n + '.jpg';
    return newFileName;
  }
  copyInsQueFileToLocalDir(namePath: string, currentName: string, newFileName: string, isQue: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFileName).then(() => {
        const fileInsQuePath = this.file.dataDirectory + newFileName;
        const resInsQuePath = this.pathForImage(fileInsQuePath);

        let newInsQueEntry: InspectionQuestionImage = {
          Id: 0,
          Name: newFileName,
          Path: resInsQuePath,
          Filepath: fileInsQuePath,
          Timestamp: this.timestampService.generateLocalTimeStamp(),
          InspectionGuid: this.inspectionObj.InspectionGuid,
          InspectionQuestionImageGuid: this.guidService.generateGuid(),
          QuestionGuid: isQue ? this.obj.QuestionGuid : '',
          IsSync: false,
          IsDelete: false
        };
        this.newInsQueEntryImgGuid = newInsQueEntry.InspectionQuestionImageGuid;
        this.databaseService.insertInspectionQuestionImage(newInsQueEntry);
        this.uploadImgMsg = "Image uploaded successfully.";
        resolve(true);
      }, err => {
        this.uploadImgMsg = JSON.stringify(err);
        resolve(false);
      });
    });
  }
  pathForImage(img: string) {
    if (img === null) {
      return '';
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  showInsQueImages() {
    var currQuestionGuid = this.obj != null ? this.obj.QuestionGuid : '';
    this.globalService.inspectionQuestionNum = this.intQuestionNumber;
    this.router.navigate([`/tabs/tab2/inspectionQuestionImageList/${this.inspectionObj.InspectionGuid
      }/${currQuestionGuid}`]);
  }
  samplelist(obj) {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(obj),
      },
    };
    this.router.navigate([`/tabs/tab2/samplelist`], navigationExtras);
  }

  async syncOneInspection(guid: string, typeId: number, flag?, obj?) {
    this.globalService.objJsonString = obj;

    if (flag) {
      const isMandatoryPass = await this.checkAllRequiredQue(guid, typeId); //validation 1
      if (flag && isMandatoryPass) {
        const materialValidation = (await this.checkMaterialValidation(guid));

        const isMaterialSizePass = await this.checkMaterialSizeValidation(materialValidation[0],guid); //validation 2

        if (flag && isMaterialSizePass) {
          const isMaterialLocationPass = await this.checkMaterialLocationValidation(materialValidation[1]); //validation 3

          if (flag && isMaterialLocationPass) {
            const isSampleRemaining = await this.checkMinSampleValidation(guid); //validation 4

            if (flag && isSampleRemaining) {
              const alert = await this.alertController.create({
                header: "Confirm check-in",
                message:
                  "You have missed to add adqeuate samples for the materials. Do you want to check-in anyway?",
                backdropDismiss: false,
                buttons: [
                  {
                    text: "No",
                    role: "cancel",
                    handler: (blah) => { },
                  },
                  {
                    text: "Yes",
                    handler: async () => {
                      this.globalService.SyncTableType = this.SyncType.Sync;
                      if (flag) {
                        this.globalService.SyncTableType = this.SyncType.CheckIn;
                        this.events.unsubscribe('deleteCheckoutData')
                        this.events.publish("syncWithcheckout", true);
                      }
                      this.events.publish("syncData", [guid, isSampleRemaining]);
                    },
                  },
                ],
              });
              await alert.present();
            }
            else {
              this.globalService.SyncTableType = this.SyncType.Sync;
              if (flag) {
                this.globalService.SyncTableType = this.SyncType.CheckIn;
                this.events.unsubscribe('deleteCheckoutData')
                this.events.publish("syncWithcheckout", true);
              }
              this.events.publish("syncData", [guid, isMandatoryPass]);
            }
          }
        }
      }
    }
    else {
      this.globalService.SyncTableType = this.SyncType.Sync;
      if (flag) {
        this.globalService.SyncTableType = this.SyncType.CheckIn;
        this.events.unsubscribe('deleteCheckoutData')
        this.events.publish("syncWithcheckout", true);
      }
      this.events.publish("syncData", [guid, true]);
    }
  }
  checkAllRequiredQue(guid: string, typeId: number): Promise<boolean> { //validation 1
    return new Promise(async (resolve) => {
      const isRemaining = await this.checkAllParentRequiredQue(guid, typeId);
      const isChildRemaining = await this.checkAllChildRequiredQue(guid, typeId);
      if (isRemaining || isChildRemaining) {
        const alert = await this.alertController.create({
          header: "Confirm check-in",
          message:
            "You have missed answering some questions. Do you want to check-in anyway?",
          backdropDismiss: false,
          buttons: [
            {
              text: "No",
              role: "cancel",
              handler: async (blah) => { return await resolve(false); },
            },
            {
              text: "Yes",
              handler: async (blah) => { return await resolve(true); },
            },
          ],
        });
        await alert.present();
      }
      else {
        return await resolve(true);
      }
    });
  }
  checkAllParentRequiredQue(guid: string, typeId: number): Promise<boolean> {
    return new Promise(async (resolve) => {
      const query = `select count(*) as ctCount from Question as Qu where Qu.IsMandatory='true' and Qu.IsDelete='false' and
          Qu.IsDependent='false' and Qu.InspectionTypeId=${typeId} and Qu.QuestionGuid not in (select QuestionInspectionGuid from QuestionAnswer as Qa
            where Qa.IsDelete='false' and Qa.InspectionGuid='${guid}' and (nullif(Qa.QuestionOptionId,' ') is not null or 
            nullif(Qa.Answer,' ') is not null or (nullif(Qa.Selected,' ') is not null and Qa.Selected != 0)))
            and Qu.QuestionGuid  not in (select QuestionInspectionGuid from QuestionAnswer as Qa where Qa.IsDelete='false' and Qa.InspectionGuid='${guid}' and QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionTableAnswer qt where qt.QuestionAnswerGuid == Qa.QuestionAnswerGuid and qt.IsDelete = 'false'))
and Qu.QuestionGuid  not in (select QuestionInspectionGuid from QuestionAnswer as Qa where Qa.IsDelete='false' and Qa.InspectionGuid='${guid}' and QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswerImage qt where qt.QuestionAnswerGuid == Qa.QuestionAnswerGuid and qt.IsDelete = 'false'))`;

      await this.databaseService.db
        .executeSql(query, [])
        .then(async (data) => {
          if (data.rows.length > 0) {
            let checkArr = [];
            for (let i = 0; i < data.rows.length; i++) {
              if (data.rows.item(i).ctCount === 0) {
                checkArr.push(false);
              } else {
                checkArr.push(true);
              }
            }
            let isRem = checkArr.every(x => x == false);
            return resolve(!isRem);
          }
          return resolve(false);
        })
        .catch((e) => { console.log(e); });
    });
  }
  checkAllChildRequiredQue(guid: string, typeId: number): Promise<boolean> {
    return new Promise(async (resolve) => {
      const query = `
                select qr.ParentQuestionId as pQue, qr.QuestionsId as q, qr.OptionsId as opt , q.QuestionGuid as qGuid, 
(select count(*) from QuestionAnswer where QuestionId = qr.ParentQuestionId and IsDelete = 'false' and InspectionGuid = '${guid}' and QuestionOptionId is null and Selected = 1) as pRAns,
(select count(*) from QuestionAnswer where QuestionId = qr.ParentQuestionId and IsDelete = 'false' and InspectionGuid = '${guid}' and QuestionOptionId = qr.OptionsId) as pDAns
from Question q join QuestionRelation qr on q.QuestionRelationGuid == qr.QuestionRelationGuid 
where q.IsDelete = 'false' and qr.IsDelete = 'false' and q.InspectionTypeId = ${typeId} and q.IsMandatory = 'true' and q.IsDependent ='true'
and qGuid
not in (select QuestionInspectionGuid from QuestionAnswer as Qa
where Qa.IsDelete='false' and Qa.InspectionGuid='${guid}' and (nullif(Qa.QuestionOptionId,' ') is not null or nullif(Qa.Answer,' ') is not null or (nullif(Qa.Selected,' ') is not null and Qa.Selected != 0)))
and qGuid not in (select QuestionInspectionGuid from QuestionAnswer as Qa where Qa.IsDelete='false' and Qa.InspectionGuid='${guid}' and QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionTableAnswer qt where qt.QuestionAnswerGuid == Qa.QuestionAnswerGuid and qt.IsDelete = 'false'))
and qGuid not in (select QuestionInspectionGuid from QuestionAnswer as Qa where Qa.IsDelete='false' and Qa.InspectionGuid='${guid}' and QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswerImage qt where qt.QuestionAnswerGuid == Qa.QuestionAnswerGuid and qt.IsDelete = 'false'))
`;

      await this.databaseService.db
        .executeSql(query, [])
        .then(async (data) => {
          if (data.rows.length > 0) {
            let checkArr = [];
            for (let i = 0; i < data.rows.length; i++) {
              if (data.rows.item(i).pRAns === 0 && data.rows.item(i).pDAns === 0) {
                checkArr.push(false);
              } else {
                checkArr.push(true);
              }
            }
            let isRem = checkArr.every(x => x == false);
            return resolve(!isRem);
          }
          return resolve(false);
        })
        .catch(() => { });
    });
  }
  checkMaterialValidation(guid: string): Promise<object> { //validation 2
    return new Promise(async (resolve) => {
      const query = `select m.Quantity,m.Material_Locations from InspectionSample s left join MaterialListModels m on s.job_id = m.job_id where s.IsDelete ='false' and m.IsDelete='false' and s.analysis_type='Asbestos' and s.sample_type ='Bulk' 
                     and s.client_material_id is not null and s.job_id = (select JobId from Inspection where IsDelete = 'false' and InspectionGuid = '${guid}')`;
      await this.databaseService.db
        .executeSql(query, [])
        .then(async (data) => {
          if (data.rows.length > 0) {
            let checkQuantityArr = [];
            let checkMatArr = [];

            for (let i = 0; i < data.rows.length; i++) {
              if (!data.rows.item(i).Quantity) {
                checkQuantityArr.push(true);
              } else {
                checkQuantityArr.push(false);
              }

              if (!data.rows.item(i).Material_Locations) {
                checkMatArr.push(true);
              } else {
                checkMatArr.push(false);
              }
            }
            let isSizeRem = checkQuantityArr.every(x => x == false);
            let isMatRem = checkMatArr.every(x => x == false);

            return resolve([!isSizeRem, !isMatRem]);
          }
          return resolve([]);
        })
        .catch((e) => { console.log(e); });
    });
  }
  checkMaterialSizeValidation(obj: object, guid: string): Promise<boolean> { //validation 2
    return new Promise(async (resolve) => {
      // const query = `select DISTINCT m.client_material_id from InspectionSample s left join MaterialListModels m on  s.job_id = m.Job_id where 
      // s.job_id = (select JobId from Inspection where IsDelete = 'false' and InspectionGuid = '${guid}')
      // and TRIM(m.Quantity) is null or TRIM(m.Quantity) is ''`;
      const query = `select DISTINCT s.client_material_id  from InspectionSample s left join MaterialListModels m on  s.job_id = m.Job_id 
    where s.job_id = (select JobId from Inspection where IsDelete = 'false' and InspectionGuid = '${guid}')
    and m.job_id = (select JobId from Inspection where IsDelete = 'false' and InspectionGuid = '${guid}')
	  and s.IsDelete = 'false' and m.IsDelete = 'false'
	  and (TRIM(m.Quantity) is null or TRIM(m.Quantity) is '')`;
        await this.databaseService.db
          .executeSql(query, [])
          .then(async (data) => {
            if (data.rows.length > 0) {
              let MatIdArr = [];
              for (let i = 0; i < data.rows.length; i++) {
                MatIdArr.push({
                  Client_Material_Id: data.rows.item(i).Client_Material_Id
                });
              }
              this.Client_Material_Id=MatIdArr.map(item => item.Client_Material_Id).join(' , ').replace(/,\s*$/, "");
            }
          })
          .catch((e) => { console.log(e); });

      if (obj) {
        const alert = await this.alertController.create({
          header: "Confirm check-in",
          message:
            "You have missed to add material quantity for "+  this.Client_Material_Id + " materials. Do you want to check-in anyway?",
          backdropDismiss: false,
          buttons: [
            {
              text: "No",
              role: "cancel",
              handler: async (blah) => { return await resolve(false); },
            },
            {
              text: "Yes",
              handler: async () => {
                return await resolve(true);
              },
            },
          ],
        });
        await alert.present();
      }
      else {
        return await resolve(true);
      }
    });
  }
  checkMaterialLocationValidation(obj: object): Promise<boolean> { //validation 2
    return new Promise(async (resolve) => {
      if (obj) {
        const alert = await this.alertController.create({
          header: "Confirm check-in",
          message:
            "You have missed to add material location for asbestos bulk samples. Do you want to check-in anyway?",
          backdropDismiss: false,
          buttons: [
            {
              text: "No",
              role: "cancel",
              handler: async (blah) => { return await resolve(false); },
            },
            {
              text: "Yes",
              handler: async () => {
                return await resolve(true);
              },
            },
          ],
        });
        await alert.present();
      }
      else {
        return await resolve(true);
      }
    });
  }
  checkMinSampleValidation(guid: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const query = `select 
      (select min_samples FROM MaterialConfig where material_id = (select material_id from MaterialDropDownList where Material_Type = 'Material' and Name = m.Material) 
       and SubMaterial = m.Material_Sub and Classification = (select material_id from MaterialDropDownList where Material_Type = 'Classification' and Name = m.Classification) 
       and Friable = (select material_id from MaterialDropDownList where Material_Type = 'Friable' and Name = m.Friable)  
       and Unit = (select material_id from MaterialDropDownList where Material_Type = 'Units' and Name = m.Units)) as min_samples,
      (select count(*) from InspectionSample where IsDelete ='false' and analysis_type = 'Asbestos' and sample_type = 'Bulk' and job_id = (select JobId from Inspection where InspectionGuid = '${guid}')
       and client_material_id = m.client_material_id) as samples 
      from MaterialListModels m where IsDelete ='false' and job_id = (select JobId from Inspection where InspectionGuid = '${guid}')`;

      await this.databaseService.db
        .executeSql(query, [])
        .then(async (data) => {
          if (data.rows.length > 0) {
            let checkArr = [];
            for (let i = 0; i < data.rows.length; i++) {
              if (data.rows.item(i).min_samples <= data.rows.item(i).samples) {
                checkArr.push(false); //validation pass
              } else {
                checkArr.push(true); //validation fail
              }
            }
            let isRem = checkArr.every(x => x == false);
            return resolve(!isRem);
          }
          return resolve(false);
        })
        .catch(() => { });
    });
  }



}
