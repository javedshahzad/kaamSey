import { Component, NgZone, ViewChild } from "@angular/core";
import { NavigationExtras, Router } from "@angular/router";
import {
  Inspection,
  InspectionActionType,
  StatusTypes,
} from "src/app/models/db-models/inspection-model";
import { DatabaseService } from "src/app/core/database.service";
import { GlobalService } from "src/app/core/auth/global.service";
import { AlertController, IonItemSliding } from "@ionic/angular";
import { SQLiteObject, SQLite } from "@ionic-native/sqlite/ngx";
import { ToastService } from "src/app/core/toast.service";
import { TranslateService } from "@ngx-translate/core";
import { InspectionImage } from "src/app/models/db-models/image-model";
import { SyncTypeEnum } from "src/app/models/all-data-model";
import { AppdatabaselogService } from "./appdatabaselog.service";
import { PopoverController } from '@ionic/angular';
import { InspectionActionListComponent } from "./inspection-action-list/inspection-action-list.component";
import { Network } from "@ionic-native/network/ngx";
import { Events } from "src/app/events/events";

@Component({
  selector: "app-inspection",
  templateUrl: "./inspection.page.html",
  styleUrls: ["./inspection.page.scss"],
})
export class InspectionPage {
  isCreateJobCheckin: boolean = false;
  actionTypeEnum = InspectionActionType;
  SyncType = SyncTypeEnum;
  arrInspection: Inspection[] = [];
  arrInspectionTemp: Inspection[] = [];
  objStatusType = StatusTypes;
  inspectionGuid = "";
  isLoading = true;
  @ViewChild(IonItemSliding) slidingItem: IonItemSliding;


  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    public globalService: GlobalService,
    private events: Events,
    private sqlite: SQLite,
    private toastService: ToastService,
    private translateService: TranslateService,
    public alertController: AlertController,
    private zone: NgZone,
    private appDatabaseLogService: AppdatabaselogService,
    private popOverCnt: PopoverController,
    private network: Network
  ) {
    this.events.subscribe("hideInspection", () => {
      this.arrInspection = [];
      this.arrInspectionTemp = [];

      this.zone.run(() => {
        this.getInspection();
      })

      // this.events.unsubscribe('hideInspection');
    });
  }

  async dismissActionEvent() {
    await this.popOverCnt.dismiss();
  }

  async ionViewWillEnter() {
    this.isLoading = true;
    this.arrInspection = [];
    this.arrInspectionTemp = [];
    localStorage.setItem('isDownloadInspection', 'false');
    this.isCreateJobCheckin = !!localStorage.getItem('isCreateJobCheckin') && localStorage.getItem('isCreateJobCheckin') == 'true' ? true : false;

    // this.events.subscribe("inspectionActionEvent", async (data, actionType) => {
    //   this.dismissActionEvent();
    //   if (actionType === this.actionTypeEnum.CheckIn) {
    //     this.syncOneInspection(data.InspectionGuid, data.InspectionTypeId, true, data);
    //   }
    //   else if (actionType === this.actionTypeEnum.Sync) {
    //     this.syncOneInspection(data.InspectionGuid, data.InspectionTypeId);
    //   }
    //   else if (actionType === this.actionTypeEnum.RMS) {
    //     this.samplelist(data);
    //   }
    // });
    if (this.network.type != this.network.Connection.NONE) {
      this.appDatabaseLogService.AppDatabaseLog();
    }
    // this.pdfDownloadService.progressBar = false;
  }

  async ionViewDidEnter() {
    setTimeout(async () => {

      await this.getInspection();
    }, 2000);
  }



  async getInspection() {
    await this.sqlite
      .create(this.databaseService.dbCreate)
      .then(async (db: SQLiteObject) => {
        this.databaseService.db = db;
        const query = `select * from Inspection where IsDelete='false' and IsCheckedIn = 'false' ORDER by InspectionDate desc`;

        await this.databaseService.db
          .executeSql(query, [])
          .then((data) => {
            if (data.rows.length > 0) {
              this.arrInspection = [];
              for (let i = 0; i < data.rows.length; i++) {
                this.arrInspection.push({
                  Id: data.rows.item(i).Id,
                  JobId: data.rows.item(i).JobId,
                  InspectorId: data.rows.item(i).InspectorId,
                  InspectionDate: data.rows.item(i).InspectionDate,
                  Owner: data.rows.item(i).Owner,
                  PropertyLocation: data.rows.item(i).PropertyLocation,
                  Address: data.rows.item(i).Address,
                  PhoneNumber: data.rows.item(i).PhoneNumber,
                  CellNumber: data.rows.item(i).CellNumber,
                  InspectorPhoneNumber: data.rows.item(i).InspectorPhoneNumber,
                  Status: data.rows.item(i).Status,
                  IsDelete: data.rows.item(i).IsDelete,
                  Timestamp: data.rows.item(i).Timestamp,
                  InspectionGuid: data.rows.item(i).InspectionGuid,
                  InspectionTypeId: data.rows.item(i).InspectionTypeId,
                  IsSync: data.rows.item(i).IsSync,
                  StartTime: data.rows.item(i).StartTime,
                  CompletedTime: data.rows.item(i).CompletedTime,
                  WrongJobId: data.rows.item(i).WrongJobId,
                  EmergencyDate: data.rows.item(i).EmergencyDate,
                  CurrentVersion: data.rows.item(i).CurrentVersion,
                  IsContactLogin: data.rows.item(i).IsContactLogin
                });
              }
              console.log(this.arrInspection)
              this.arrInspectionTemp = this.arrInspection;
            }
            this.isLoading = false;
          })
          .catch(() => {
            this.isLoading = false;
          });
      })
      .catch(() => {
        this.isLoading = false;
      });
  }

  onInput(event: any): boolean {
    this.initializeItems();

    const q = event.srcElement.value;

    if (!q) {
      return;
    }

    this.arrInspection = this.arrInspection.filter((v) => {
      if ((v.JobId && q) || (v.Status && q)) {
        if (
          v.JobId.toString().toLowerCase().indexOf(q.toLowerCase()) > -1 ||
          v.Status.valueOf().toString().toLowerCase().indexOf(q.toLowerCase()) >
          -1
        ) {
          return true;
        }
        return false;
      }
    });
  }

  // async syncOneInspection(guid: string, typeId: number, flag?, obj?) {
  //   this.globalService.objJsonString = obj;
  //   const isRemaining = await this.checkAllRequiredQue(guid, typeId);
  //   // if (isRemaining) {
  //   //   this.toastService.presentToast(this.translateService.instant('Inspection.syncMessage'));
  //   // } else {
  //   // }
  //   this.globalService.SyncTableType = this.SyncType.Sync;
  //   if (flag) {
  //     this.globalService.SyncTableType = this.SyncType.CheckIn;
  //     this.events.unsubscribe('deleteCheckoutData')
  //     this.events.publish("syncWithcheckout", true);
  //   }

  //   this.events.publish("syncData", [guid, isRemaining]);
  // }

  //commented
  // async syncOneInspection(guid: string, typeId: number, flag?, obj?) {
  //   this.globalService.objJsonString = obj;

  //   if (flag) {
  //     const isMandatoryPass = await this.checkAllRequiredQue(guid, typeId); //validation 1
  //     if (flag && isMandatoryPass) {
  //       const materialValidation = (await this.checkMaterialValidation(guid));

  //       const isMaterialSizePass = await this.checkMaterialSizeValidation(materialValidation[0]); //validation 2

  //       if (flag && isMaterialSizePass) {
  //         const isMaterialLocationPass = await this.checkMaterialLocationValidation(materialValidation[1]); //validation 3

  //         if (flag && isMaterialLocationPass) {
  //           const isSampleRemaining = await this.checkMinSampleValidation(guid); //validation 4

  //           if (flag && isSampleRemaining) {
  //             const alert = await this.alertController.create({
  //               header: "Confirm check-in",
  //               message:
  //                 "You have missed to add adqeuate samples for the materials. Do you want to check-in anyway?",
  //               backdropDismiss: false,
  //               buttons: [
  //                 {
  //                   text: "No",
  //                   role: "cancel",
  //                   handler: (blah) => { },
  //                 },
  //                 {
  //                   text: "Yes",
  //                   handler: async () => {
  //                     this.globalService.SyncTableType = this.SyncType.Sync;
  //                     if (flag) {
  //                       this.globalService.SyncTableType = this.SyncType.CheckIn;
  //                       this.events.unsubscribe('deleteCheckoutData')
  //                       this.events.publish("syncWithcheckout", true);
  //                     }
  //                     this.events.publish("syncData", [guid, isSampleRemaining]);
  //                   },
  //                 },
  //               ],
  //             });
  //             await alert.present();
  //           }
  //           else {
  //             this.globalService.SyncTableType = this.SyncType.Sync;
  //             if (flag) {
  //               this.globalService.SyncTableType = this.SyncType.CheckIn;
  //               this.events.unsubscribe('deleteCheckoutData')
  //               this.events.publish("syncWithcheckout", true);
  //             }
  //             this.events.publish("syncData", [guid, isMandatoryPass]);
  //           }
  //         }
  //       }
  //     }
  //   }
  //   else {
  //     this.globalService.SyncTableType = this.SyncType.Sync;
  //     if (flag) {
  //       this.globalService.SyncTableType = this.SyncType.CheckIn;
  //       this.events.unsubscribe('deleteCheckoutData')
  //       this.events.publish("syncWithcheckout", true);
  //     }
  //     this.events.publish("syncData", [guid, true]);
  //   }
  // }

  // checkAllRequiredQue(guid: string, typeId: number): Promise<boolean> { //validation 1
  //   return new Promise(async (resolve) => {
  //     const isRemaining = await this.checkAllParentRequiredQue(guid, typeId);
  //     const isChildRemaining = await this.checkAllChildRequiredQue(guid, typeId);
  //     if (isRemaining || isChildRemaining) {
  //       const alert = await this.alertController.create({
  //         header: "Confirm check-in",
  //         message:
  //           "You have missed answering some questions. Do you want to check-in anyway?",
  //         backdropDismiss: false,
  //         buttons: [
  //           {
  //             text: "No",
  //             role: "cancel",
  //             handler: async (blah) => { return await resolve(false); },
  //           },
  //           {
  //             text: "Yes",
  //             handler: async (blah) => { return await resolve(true); },
  //           },
  //         ],
  //       });
  //       await alert.present();
  //     }
  //     else {
  //       return await resolve(true);
  //     }
  //   });
  // }

  // checkMaterialSizeValidation(obj: object): Promise<boolean> { //validation 2
  //   return new Promise(async (resolve) => {
  //     if (obj) {
  //       const alert = await this.alertController.create({
  //         header: "Confirm check-in",
  //         message:
  //           "You have missed to add material size for asbestos bulk samples. Do you want to check-in anyway?",
  //         backdropDismiss: false,
  //         buttons: [
  //           {
  //             text: "No",
  //             role: "cancel",
  //             handler: async (blah) => { return await resolve(false); },
  //           },
  //           {
  //             text: "Yes",
  //             handler: async () => {
  //               return await resolve(true);
  //             },
  //           },
  //         ],
  //       });
  //       await alert.present();
  //     }
  //     else {
  //       return await resolve(true);
  //     }
  //   });
  // }

  // checkMaterialLocationValidation(obj: object): Promise<boolean> { //validation 2
  //   return new Promise(async (resolve) => {
  //     if (obj) {
  //       const alert = await this.alertController.create({
  //         header: "Confirm check-in",
  //         message:
  //           "You have missed to add material location for asbestos bulk samples. Do you want to check-in anyway?",
  //         backdropDismiss: false,
  //         buttons: [
  //           {
  //             text: "No",
  //             role: "cancel",
  //             handler: async (blah) => { return await resolve(false); },
  //           },
  //           {
  //             text: "Yes",
  //             handler: async () => {
  //               return await resolve(true);
  //             },
  //           },
  //         ],
  //       });
  //       await alert.present();
  //     }
  //     else {
  //       return await resolve(true);
  //     }
  //   });
  // }

  // checkMaterialValidation(guid: string): Promise<object> { //validation 2
  //   return new Promise(async (resolve) => {
  //     const query = `select m.Size,m.Material_Locations from InspectionSample s left join MaterialListModels m on s.job_id = m.job_id where s.IsDelete ='false' and m.IsDelete='false' and s.analysis_type='Asbestos' and s.sample_type ='Bulk' 
  //                    and s.client_material_id is not null and s.job_id = (select JobId from Inspection where IsDelete = 'false' and InspectionGuid = '${guid}')`;
  //     await this.databaseService.db
  //       .executeSql(query, [])
  //       .then(async (data) => {
  //         if (data.rows.length > 0) {
  //           let checkSizeArr = [];
  //           let checkMatArr = [];

  //           for (let i = 0; i < data.rows.length; i++) {
  //             if (!data.rows.item(i).Size) {
  //               checkSizeArr.push(true);
  //             } else {
  //               checkSizeArr.push(false);
  //             }

  //             if (!data.rows.item(i).Material_Locations) {
  //               checkMatArr.push(true);
  //             } else {
  //               checkMatArr.push(false);
  //             }
  //           }
  //           let isSizeRem = checkSizeArr.every(x => x == false);
  //           let isMatRem = checkMatArr.every(x => x == false);

  //           return resolve([!isSizeRem, !isMatRem]);
  //         }
  //         return resolve([]);
  //       })
  //       .catch((e) => { console.log(e); });
  //   });
  // }

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

  // checkMinSampleValidation(guid: string): Promise<boolean> {
  //   return new Promise(async (resolve) => {
  //     const query = `select 
  //     (select min_samples FROM MaterialConfig where material_id = (select material_id from MaterialDropDownList where Material_Type = 'Material' and Name = m.Material) 
  //      and SubMaterial = m.Material_Sub and Classification = (select material_id from MaterialDropDownList where Material_Type = 'Classification' and Name = m.Classification) 
  //      and Friable = (select material_id from MaterialDropDownList where Material_Type = 'Friable' and Name = m.Friable)  
  //      and Unit = (select material_id from MaterialDropDownList where Material_Type = 'Units' and Name = m.Units)) as min_samples,
  //     (select count(*) from InspectionSample where IsDelete ='false' and analysis_type = 'Asbestos' and sample_type = 'Bulk' and job_id = (select JobId from Inspection where InspectionGuid = '${guid}')
  //      and client_material_id = m.client_material_id) as samples 
  //     from MaterialListModels m where IsDelete ='false' and job_id = (select JobId from Inspection where InspectionGuid = '${guid}')`;

  //     await this.databaseService.db
  //       .executeSql(query, [])
  //       .then(async (data) => {
  //         if (data.rows.length > 0) {
  //           let checkArr = [];
  //           for (let i = 0; i < data.rows.length; i++) {
  //             if (data.rows.item(i).min_samples <= data.rows.item(i).samples) {
  //               checkArr.push(false); //validation pass
  //             } else {
  //               checkArr.push(true); //validation fail
  //             }
  //           }
  //           let isRem = checkArr.every(x => x == false);
  //           return resolve(!isRem);
  //         }
  //         return resolve(false);
  //       })
  //       .catch(() => { });
  //   });
  // }

  // checkAllRequiredQue(guid: string, typeId: number): Promise<boolean> {
  //   return new Promise(async (resolve) => {
  //     const query = `select count(*) as ctCount from Question as Qu where Qu.IsMandatory='true' and Qu.IsDelete='false' and
  //         Qu.IsDependent='false' and Qu.InspectionTypeId=${typeId} and Qu.Id not in (select QuestionId from QuestionAnswer as Qa
  //           where Qa.IsDelete='false' and Qa.InspectionGuid='${guid}')`;

  //     await this.databaseService.db
  //       .executeSql(query, [])
  //       .then((data) => {
  //         if (data.rows.length > 0) {
  //           for (let i = 0; i < data.rows.length; i++) {
  //             if (data.rows.item(i).ctCount === 0) {
  //               return resolve(false);
  //             } else {
  //               return resolve(true);
  //             }
  //           }
  //         }
  //       })
  //       .catch(() => { });
  //   });
  // }

  initializeItems() {
    this.arrInspection = this.arrInspectionTemp;
  }

  add() {
    this.globalService.isFromEdit = false;
    this.globalService.inspectionType = 0;
    this.globalService.CurrentVersion = 0;
    this.globalService.isEditAddress = false
    this.router.navigate([`/tabs/tab2/joborder/''`]);
  }

  detail(obj: Inspection) {
    obj.Address = encodeURIComponent(obj.Address);
    this.router.navigate([`/tabs/tab2/detail/${JSON.stringify(obj)}`]);
  }

  edit(obj: Inspection) {
    localStorage.setItem("jobNumber", obj.JobId.toString());
    this.globalService.isFromDetail = false;
    this.globalService.isFromGroupEdit = false;

    if (obj.WrongJobId === "true") {
      this.globalService.isFromEdit = true;
      let navigationExtras: NavigationExtras = {
        queryParams: {
          InspectionDetailobj: JSON.stringify(obj)
        },
      }
      this.router.navigate([`/tabs/tab2/joborder/${obj.InspectionGuid}`], navigationExtras);

    } else {
      this.globalService.isFromEdit = false;
      this.globalService.inspectionType = obj.InspectionTypeId;
      this.globalService.CurrentVersion = obj.CurrentVersion;

      this.router.navigate([`/tabs/tab2/add/${obj.InspectionGuid}`]);
    }
  }

  async doRefresh(event: any) {
    setTimeout(async () => {
      this.isLoading = true;

      this.arrInspection = [];
      this.arrInspectionTemp = [];
      // this.pdfDownloadService.progressBar = false;

      setTimeout(async () => {
        await this.getInspection();
      }, 2000);
      event.target.complete();
    }, 1000);
  }
  samplelist(obj) {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(obj),
      },
    };
    this.router.navigate([`/tabs/tab2/samplelist`], navigationExtras);
  }
  async removeItem(item) {
    this.globalService.SyncTableType = this.SyncType.DeleteBySlide;
    this.slidingItem.closeOpened();
    if (item.Status == StatusTypes.InProgress) {
      const alert = await this.alertController.create({
        cssClass: 'my-custom-class',
        header: 'Delete Alert',
        message: "This inspection is checked out to your tablet. You must check the inspection in.",
        buttons: ['Ok']
      });

      await alert.present();
    }
    else {
      const alert = await this.alertController.create({
        header: "Confirm Delete",
        message:
          "This inspection will be deleted from mobile. Do you want to continue?",
        backdropDismiss: false,
        buttons: [
          {
            text: "Cancel",
            role: "cancel",
            handler: (blah) => { },
          },
          {
            text: "Ok",
            handler: async () => {

              //this.databaseService.insertTableCheckOut("'" + item.InspectionGuid + "'");
              const inspectionImages: InspectionImage[] = await this.databaseService.selectAllInspectionImageData(
                ""
              );
              await this.databaseService.uploadSyncTableArchiveImage(inspectionImages);
              //  this.events.subscribe("syncTableSlideDeleteSuccess", (data) => {
              //     this.slideDeleteTables(item);                      
              // });
              this.slideDeleteTables(item);
            },
          },
        ],
      });
      await alert.present();
    }

  }

  async slideDeleteTables(item) {
    await this.databaseService.db.executeSql(
      `delete from MaterialListModels where Job_Id in (select JobId from Inspection where InspectionGuid='${item.InspectionGuid}')`,
      []
    );
    await this.databaseService.db.executeSql(
      `delete from MaterialRoom where job_id in (select JobId from Inspection where InspectionGuid='${item.InspectionGuid}')`,
      []
    );
    await this.databaseService.db.executeSql(
      `delete  from MaterialImage where Job_Id in(select JobId from Inspection where InspectionGuid='${item.InspectionGuid}')`,
      []
    );
    await this.databaseService.db.executeSql(
      `delete from Inspection where InspectionGuid=?`,
      [item.InspectionGuid]
    );
    await this.databaseService.db.executeSql(
      `delete from QuestionAnswerImage where InspectionGuid=?`,
      [item.InspectionGuid]
    );

    await this.databaseService.db.executeSql(
      `delete from QuestionAnswer where InspectionGuid=?`,
      [item.InspectionGuid]
    );
    await this.databaseService.db.executeSql(
      `delete from QuestionTableAnswer where InspectionGuid=?`,
      [item.InspectionGuid]
    );

    await this.databaseService.db.executeSql(
      `delete from InspectionImage where InspectionGuid=?`,
      [item.InspectionGuid]
    );
    await this.databaseService.db.executeSql(
      `delete from InspectionSample where InspectionGuid=?`,
      [item.InspectionGuid]
    );
    //this.events.unsubscribe('syncTableSlideDeleteSuccess')
    this.toastService.presentToast("Inspection Deleted Successfully");
    this.arrInspection = [];
    this.arrInspectionTemp = [];
    setTimeout(() => {
      this.zone.run(() => {
        this.getInspection();
      })
    }, 0);
  }

  async showInspActions(event: any, objInspection: any) {
    let popOverEvent = await this.popOverCnt.create({
      component: InspectionActionListComponent,
      event: event,
      componentProps: { inspectionObj: objInspection,fromSearchInsp:true },
      cssClass: 'inspActionDiv'
    });
    return await popOverEvent.present();
    
  }

  ionViewWillLeave() {
     this.events.unsubscribe('inspectionActionEvent');
  }
  // downloadAllQuestion(objData: Inspection) {
  //   this.inspectionGuid = objData.InspectionGuid;

  //   this.pdfDownloadService.getPdfName(objData.InspectionGuid).subscribe(data => {
  //     if (data.Success) {
  //       this.pdfDownloadService.downloadPdf(data.Data);
  //     }
  //   });
  // }

  // downloadRentalQuestion(objData: Inspection) {
  //   this.inspectionGuid = objData.InspectionGuid;

  //   this.pdfDownloadService.getWaterPdfName(objData.InspectionGuid).subscribe(data => {
  //     if (data.Success) {
  //       this.pdfDownloadService.downloadPdf(data.Data);
  //     }
  //   });
  // }

  // downloadWaterQuestion(objData: Inspection) {
  //   this.inspectionGuid = objData.InspectionGuid;

  //   this.pdfDownloadService.getRentalPdfName(objData.InspectionGuid).subscribe(data => {
  //     if (data.Success) {
  //       this.pdfDownloadService.downloadPdf(data.Data);
  //     }
  //   });
  // }
}
