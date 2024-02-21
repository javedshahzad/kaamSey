

import { Component, NgZone, ViewChild } from "@angular/core";
import { NavigationExtras, Router } from "@angular/router";
import {
  Inspection,
  StatusTypes,
} from "src/app/models/db-models/inspection-model";
import { DatabaseService } from "src/app/core/database.service";
import { GlobalService } from "src/app/core/auth/global.service";
import { AlertController, IonItemSliding } from "@ionic/angular";
import { SQLiteObject, SQLite } from "@ionic-native/sqlite/ngx";
import { ToastService } from "src/app/core/toast.service";
import { TranslateService } from "@ngx-translate/core";
import { InspectionImage } from "src/app/models/db-models/image-model";
import { SyncTypeEnum, ArchiveEnum, SaveAppDatabaseRequest } from "src/app/models/all-data-model";
import { HttpClient } from "@angular/common/http";
import { environment } from 'src/environments/environment';
import { TimestampService } from "src/app/core/timestamp.service";
import { LoaderService } from "src/app/core/loader.service";
import { AppdatabaselogService } from "../appdatabaselog.service";
import { Network } from "@ionic-native/network/ngx";
import { Events } from "src/app/events/events";



@Component({
  selector: 'app-archiveinspections',
  templateUrl: './archiveinspections.component.html',
  styleUrls: ['./archiveinspections.component.scss'],
})
export class ArchiveinspectionsComponent {
  public sample_collection_visible: boolean = false;
  public maxId: any;
  SyncType = SyncTypeEnum;
  archiveEnum = ArchiveEnum;
  arrInspection: Inspection[] = [];
  arrInspectionTemp: Inspection[] = [];
  objStatusType = StatusTypes;
  inspectionGuid = "";
  isLoading = true;
  apiUrl: string;
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
    private http: HttpClient,
    private timestampService: TimestampService, private loaderService: LoaderService,
    private appDatabaseLogService: AppdatabaselogService,
    private network: Network
  ) {
    this.sample_collection_visible = !!localStorage.getItem('sample_collection_visible') && localStorage.getItem('sample_collection_visible') == 'true' ? true : false;
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
  }

  async ionViewWillEnter() {
    await this.checkInspectionGuid();
    //await this.getInspection();
    this.isLoading = true;
    this.arrInspection = [];
    this.arrInspectionTemp = [];
    localStorage.setItem('isDownloadInspection', 'false')
    // this.pdfDownloadService.progressBar = false;
  }




  async checkInspectionGuid() {
    if (this.network.type != this.network.Connection.NONE) {
      return new Promise((resolve) => {
        let userName = localStorage.getItem("username");
        this.http.get(`${environment.endPoint}Account/AppDatabaseLog?userName=${userName}`).subscribe(async res => {
          console.log(res, "response");
          if (res) {
            await this.appDatabaseLogService.sendDataToApi();
            //await this.updateInspection();
            // });
          } else {
            resolve(true)
          }
        }, err => {
          resolve(true)
        })
      });
    }
  }



  async updateInspection() {
    // await this.loaderService.present();
    let query = `select * from QuestionAnswer where InspectionGuid = 0 or InspectionGuid is null`;

    await this.databaseService.db
      .executeSql(query, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let q1 = `select * from Inspection where InspectionTypeId in(select distinct InspectionTypeId from Question where QuestionGuid in (select QuestionInspectionGuid from QuestionAnswer where InspectionGuid = 0 or InspectionGuid is null))`;
          await this.databaseService.db
            .executeSql(q1, [])
            .then(async (data1) => {
              if (data1.rows.length > 0) {

                for (let j = 0; j < data1.rows.length; j++) {
                  let updateQuery = `update Inspection set IsCheckedIn ='false',CompletedTime= '${this.timestampService.generateLocalTimeStamp()}' where InspectionGuid = '${data1.rows.item(0).InspectionGuid}'`;

                  await this.databaseService.db
                    .executeSql(updateQuery, [])
                    .then(async (updateResponse) => {
                      let updIns = `update QuestionAnswer set InspectionGuid = '${data1.rows.item(0).InspectionGuid}' where QuestionInspectionGuid in (select QuestionGuid from Question where InspectionTypeId = ${data1.rows.item(0).InspectionTypeId})`;

                      await this.databaseService.db
                        .executeSql(updIns, [])
                        .then(async (updInsResponse) => {
                          let u2 = `update InspectionImage set InspectionGuid = '${data1.rows.item(0).InspectionGuid}' where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid in (select QuestionGuid from Question where InspectionTypeId = ${data1.rows.item(0).InspectionTypeId}))`;

                          await this.databaseService.db
                            .executeSql(u2, [])
                            .then(async (u2Res) => {
                              let u3 = `update QuestionAnswerImage set InspectionGuid = '${data1.rows.item(0).InspectionGuid}' where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid in (select QuestionGuid from Question where InspectionTypeId = ${data1.rows.item(0).InspectionTypeId}))`;
                              await this.databaseService.db
                                .executeSql(u3, [])
                                .then(async (u3Res) => {
                                  let u4 = `update QuestionTableAnswer set InspectionGuid = '${data1.rows.item(0).InspectionGuid}' where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid in (select QuestionGuid from Question where InspectionTypeId = ${data1.rows.item(0).InspectionTypeId}))`;
                                  await this.databaseService.db
                                    .executeSql(u4, [])
                                    .then(async (u4Res) => {

                                    }).catch(() => {
                                    });
                                }).catch(() => {
                                });
                            }).catch(() => {
                            });
                        }).catch(() => {
                        });

                    }).catch(() => {
                    });
                }
              }

            }).catch(() => {

            });
          this.zone.run(async () => {
            await this.getInspection();
          })

        }
      }).catch(() => {

      });
    // this.loaderService.dismiss();
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
        const query = `select * from ArchiveInspection where IsDelete='false' ORDER by ArchiveDate desc`;

        await this.databaseService.db
          .executeSql(query, [])
          .then(async (data) => {
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
                  Status: this.objStatusType.Uploaded,
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
              this.arrInspectionTemp = this.arrInspection;


            }
            this.isLoading = false;
          })
          .catch(async (err) => {
            const queryIns = `select * from Inspection where IsDelete='false' ORDER by InspectionDate desc`;
            await this.databaseService.db
              .executeSql(queryIns, [])
              .then((data1) => {
                if (data1.rows.length > 0) {
                  this.arrInspection = [];
                  for (let i = 0; i < data1.rows.length; i++) {
                    this.arrInspection.push({
                      Id: data1.rows.item(i).Id,
                      JobId: data1.rows.item(i).JobId,
                      InspectorId: data1.rows.item(i).InspectorId,
                      InspectionDate: data1.rows.item(i).InspectionDate,
                      Owner: data1.rows.item(i).Owner,
                      PropertyLocation: data1.rows.item(i).PropertyLocation,
                      Address: data1.rows.item(i).Address,
                      PhoneNumber: data1.rows.item(i).PhoneNumber,
                      CellNumber: data1.rows.item(i).CellNumber,
                      InspectorPhoneNumber: data1.rows.item(i).InspectorPhoneNumber,
                      Status: this.objStatusType.Uploaded,
                      IsDelete: data1.rows.item(i).IsDelete,
                      Timestamp: data1.rows.item(i).Timestamp,
                      InspectionGuid: data1.rows.item(i).InspectionGuid,
                      InspectionTypeId: data1.rows.item(i).InspectionTypeId,
                      IsSync: data1.rows.item(i).IsSync,
                      StartTime: data1.rows.item(i).StartTime,
                      CompletedTime: data1.rows.item(i).CompletedTime,
                      WrongJobId: data1.rows.item(i).WrongJobId,
                      EmergencyDate: data1.rows.item(i).EmergencyDate,
                      CurrentVersion: data1.rows.item(i).CurrentVersion,
                      IsContactLogin: data1.rows.item(i).IsContactLogin
                    });
                  }
                  this.arrInspectionTemp = this.arrInspection;
                }
                this.isLoading = false;
              })
              .catch(() => {
                this.isLoading = false;
              });
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
    let navigationExtras: NavigationExtras = {
      queryParams: {
        action: this.archiveEnum.ArchiveInspection
      },
    }
    this.router.navigate([`/tabs/tab2/detail/${JSON.stringify(obj)}`], navigationExtras);
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
        action: this.archiveEnum.ArchiveInspection
      },
    };
    this.router.navigate([`/tabs/tab2/samplelist`], navigationExtras);
  }
  async removeItem(item) {
    this.globalService.SyncTableType = this.SyncType.ArchiveSlideDelete;
    this.slidingItem.closeOpened();
    if (item.Status == StatusTypes.InProgress) {
      const alert = await this.alertController.create({
        cssClass: 'my-custom-class',
        header: 'Delete Alert',
        message: "This archived  inspection is checked out to your tablet. You must check the inspection in.",
        buttons: ['Ok']
      });

      await alert.present();
    }
    else {
      const alert = await this.alertController.create({
        header: "Confirm Delete",
        message:
          "This archived  inspection will be deleted from mobile. Do you want to continue?",
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
    this.maxId = 0;
    var query = `SELECT max(id) as maxID FROM syncTableArchive;`
    this.databaseService.db.executeSql(query, []).then(
      (res) => {
        if (res.rows.length > 0) {
          if (!!res.rows.item(0).maxID) {
            this.maxId = res.rows.item(0).maxID;
          }
        }
      },
      (err) => {
      }
    );
    await this.databaseService.insertTableCheckOut("'" + item.InspectionGuid + "'");
    this.events.subscribe("syncTableArchiveSuccess", async (data) => {
      await this.databaseService.db.executeSql(
        `delete from MaterialListModels where Job_Id = ${item.JobId}`,
        []
      );
      await this.databaseService.db.executeSql(
        `delete from MaterialRoom where job_id = ${item.JobId}`,
        []
      );
      await this.databaseService.db.executeSql(
        `delete  from MaterialImage where Job_Id = ${item.JobId}`,
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
      await this.databaseService.db.executeSql(
        `delete from ArchiveInspection where InspectionGuid=?`,
        [item.InspectionGuid]
      );

      //this.events.unsubscribe('syncTableSlideDeleteSuccess')
      this.toastService.presentToast("Archive Inspection Deleted Successfully",true);
      this.arrInspection = [];
      this.arrInspectionTemp = [];
      setTimeout(() => {
        this.zone.run(() => {
          this.getInspection();
        })
      }, 0);
    });

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


