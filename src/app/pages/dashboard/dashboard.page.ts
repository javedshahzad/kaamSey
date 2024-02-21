import { Component, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { AuthGuard } from "src/app/core/auth/auth-guard.service";
import { AlertController, Platform } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";
import { AllDataRequest, AllDataRepsonse, SyncTableRequest, ArchiveEmailRequest, SyncTypeEnum, Data } from "src/app/models/all-data-model";
import { LoaderService } from "src/app/core/loader.service";
import { DatabaseService } from "src/app/core/database.service";
import { TimestampService } from "src/app/core/timestamp.service";
import { ToastService } from "src/app/core/toast.service";
import {
  Inspection,
  StatusTypes,
} from "src/app/models/db-models/inspection-model";
import { AllDataService } from "./all-data.service";
import { QuestionAnswer } from "src/app/models/db-models/question-answer-model.";
import { QuestionAnswerImage } from "src/app/models/db-models/question-answer-image-model";
import { ImageUploadService } from "./image-upload.service";
import { File, FileEntry } from "@ionic-native/File/ngx";
import { InspectionImage } from "src/app/models/db-models/image-model";
import { QuestionTableAnswer } from "src/app/models/db-models/questions-table-answer-model";
import { GlobalService } from "src/app/core/auth/global.service";
import { LogoutService } from "src/app/tabs/logout.service";
import { Device } from "@ionic-native/device/ngx";
import { LogoutRequest } from "src/app/models/user-model";
import { SQLite, SQLiteObject } from "@ionic-native/sqlite/ngx";
import { InpsectionPropertyImage } from "src/app/models/db-models/property-image";
import { MaterialImage } from "src/app/models/db-models/material-image";
import { LogService } from "./log.service";
import { AppVersion } from "@ionic-native/app-version/ngx";
import { QuestionTypeEnums, SubQuestionTypeEnums } from 'src/app/models/db-models/question-type-model';
import { InspectionQuestionImage } from "src/app/models/db-models/inspection-question-image-model";
import { Network } from "@ionic-native/network/ngx";
import { environment } from 'src/environments/environment';
import { Events } from "src/app/events/events";
import { getFileReader } from "../inspection/job.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"],
})
export class DashboardPage {
  public sample_collection_visible: boolean = true;
  public allow_create_jobs_checkin: boolean = false;
  public allow_job_creation_app: boolean = false;
  public allow_myJob_visible: boolean = false;
  public allow_inspection_visible: boolean = false;
  public isCreateJobCheckin: boolean = false;
  public arrSampleTemp: any = [];
  public arrSample: any = [];
  SyncType = SyncTypeEnum;
  arrInspection: Inspection[] = [];
  lat = 0;
  long = 0;
  loggedInUserName = "";
  isFromSyncWithCheckout: boolean = false;
  req: AllDataRequest = {
    EmployeeId: Number(localStorage.getItem("empId")),
    Timestamp: "",
    Inspections: [],
    Questions: [],
    QuestionRelations: [],
    InspectionTypes: [],
    QuestionTables: [],
    Options: [],
    QuestionAnswers: [],
    QuestionTableAnswers: [],
    QuestionAnswerImages: [],
    QuestionGroup: [],
    SyncInspectionsGuid: "",
    Latitude: "",
    Longitude: "",
    ModifiedInspectionTypes: "",
    InspectionPropertyImage: [],
    MaterialImageList: [],
    Samples: [],
    isLogin: true,
    MaterialListModels: [],
    OtherMaterialLocationModels: [],
    MaterialRoomListModels: [],
    InspectionQuestionImages: [],
    CurrentAppVersion: null,
    CompanyCode: localStorage.getItem("companyCode"),
    IsContactLogin: this.globalService.isContactLogin,
    allow_create_jobs_checkin: !!localStorage.getItem('allow_create_jobs_checkin') && localStorage.getItem('allow_create_jobs_checkin') == 'true' ? true : false,
    createJobAfterAllow: false,
    isFromJobList: this.globalService.isFromJobList
  };
  appVersionInfo: string;
  arrInspectionDetail: any = [];
  arrGroups: any = [];
  answerGuid = '';
  arrRowCount: any = [];
  isLoading = true;
  arrColCount: string[] = [];
  constructor(
    private router: Router,
    private authGuard: AuthGuard,
    private alertController: AlertController,
    private translateService: TranslateService,
    private timestampService: TimestampService,
    private allDataService: AllDataService,
    private toastService: ToastService,
    private databaseService: DatabaseService,
    private loaderService: LoaderService,
    private imageUploadService: ImageUploadService,
    private file: File,
    public globalService: GlobalService,
    private events: Events,
    private logoutService: LogoutService,
    private device: Device,
    private sqlite: SQLite,
    private logService: LogService,
    private appVersion: AppVersion,
    private network: Network,
    private platform: Platform,
    private zone : NgZone
  ) {
    this.allow_create_jobs_checkin = !!localStorage.getItem('allow_create_jobs_checkin') && localStorage.getItem('allow_create_jobs_checkin') == 'true' ? true : false;
    this.allow_job_creation_app = !!localStorage.getItem('allow_job_creation_app') && localStorage.getItem('allow_job_creation_app') == 'true' ? true : false;
    this.allow_myJob_visible = !!localStorage.getItem('job_visible') && localStorage.getItem('job_visible') == 'true' ? true : false;
    this.allow_inspection_visible = !!localStorage.getItem('inspection_visible') && localStorage.getItem('inspection_visible') == 'true' ? true : false;
    this.sample_collection_visible = !!localStorage.getItem('sample_collection_visible') && localStorage.getItem('sample_collection_visible') == 'true' ? true : false;

    this.events.subscribe("syncData", async (data) => {
      await this.sync(data[0], data[1]);
    });
    this.events.subscribe("syncWithcheckout", (res) => {
      this.isFromSyncWithCheckout = res;
    });
    this.appVersion.getVersionNumber().then((value) => {
      this.appVersionInfo = value;
    });

    this.events.subscribe("syncTableCheckoutArchiveRequest", async (data) => {
      await this.saveArchiveData();

      let arrSyncTableList = await this.databaseService.selectSyncTableArchive();
      const syncTableRequest = this.allDataService.getAllSyncTableDetails(arrSyncTableList);
      syncTableRequest.subscribe(
        (res: any) => {
          //this.events.unsubscribe('syncTableCheckoutArchiveRequest')
          if (res == true) {

            this.events.publish('syncTableCheckoutSuccess', true);
            this.databaseService.db.executeSql(
              'update SyncTableArchive set IsSync="true"'
            ).then((data) => {

            })
              .catch((err) => {

              });
            this.removeOldSyncTableData();
          }
          else {
            this.loaderService.dismiss();
            this.globalService.presentAlert(this.translateService.instant('Inspection.archiveError'));

            this.sendEmailArchive(data.InspectionGuid);

          }
        },
        (err) => {

          this.loaderService.dismiss();
          this.globalService.presentAlert(this.translateService.instant('Inspection.archiveError'));
          this.removeOldSyncTableData()
          this.sendEmailArchive(data.InspectionGuid);

        }
      );
      console.log("syncTableCheckoutArchiveRequest done");
    });



    this.events.subscribe("syncTableSlideDeleteArchiveRequest", async (data) => {

      let arrSyncTableList = await this.databaseService.selectSyncTableArchive();
      const syncTableRequest = this.allDataService.getAllSyncTableDetails(arrSyncTableList);
      syncTableRequest.subscribe(
        (res: any) => {
          //this.events.unsubscribe('syncTableSlideDeleteArchiveRequest')
          if (res == true) {
            //this.events.publish('syncTableSlideDeleteSuccess',true);
            this.events.publish('syncTableArchiveSuccess', true);
            this.databaseService.db.executeSql(
              'update SyncTableArchive set IsSync="true"'
            ).then((data) => {

            })
              .catch((err) => {

              });
            this.removeOldSyncTableData();

          }
          else {
            this.loaderService.dismiss();
            this.globalService.presentAlert(this.translateService.instant('Inspection.archiveError'));

            this.sendEmailArchive(data.InspectionGuid);

          }
        },
        (err) => {

          this.loaderService.dismiss();
          this.globalService.presentAlert(this.translateService.instant('Inspection.archiveError'));
          this.removeOldSyncTableData()
          this.sendEmailArchive(data.InspectionGuid);

        }
      );
    });


    this.events.subscribe("SyncTableArchiveImageList", async (imagesList: any) => {
      const arrSyncTableImagePromise = [];
      if (imagesList.length > 0) {
        imagesList.forEach((objImg: any) => {
          arrSyncTableImagePromise.push(this.startSyncTableImageUpload(objImg));

        });
      }
      await Promise.all(arrSyncTableImagePromise);
    });


    this.events.subscribe("sendArchiveEmail", async (data) => {
      if (data.InspectionGuid) {
        this.sendEmailArchive(data.InspectionGuid);
      }
      // this.events.unsubscribe('sendArchiveEmail');
    });

    const timestampsValue = localStorage.getItem("timestamp");
    if (timestampsValue) {
      this.sqlite.create(this.databaseService.dbCreate).then(async (res) => {
        this.databaseService.db = res;
        await this.databaseService.createAllTablesDB();
        console.log("constructor loaded successfully");
        await this.logService.AddRequestLog(
          "App start constructor load -" + JSON.stringify(this.req)
        );
        this.allDataService.getAllDetails(this.req).subscribe(
          async (data) => {
            if (data.Success) {
              // const arrDelete = [];
              // arrDelete.push("delete from SampleType");
              // arrDelete.push("delete from AnalysisType");
              // arrDelete.push("delete from TurnArroundType");
              // arrDelete.push("delete from OtherMetalanalysis");
              // arrDelete.push("delete from OtherElementanalysis");
              // // arrDelete.push("delete from AsbestosMaterials");
              // arrDelete.push("delete from MaterialLocations");
              // arrDelete.push("delete from MaterialDropDownList");
              // arrDelete.push("delete from AsbMaterialMappingList");
              // arrDelete.push("delete from SampleAssignedLabList");
              // await this.databaseService.db
              //   .sqlBatch(arrDelete)
              //   .then(() => { })
              //   .catch(() => { });
              // await this.databaseService.insertTableSampleType(
              //   data.Data.Sample_Type
              // );
              // await this.databaseService.insertTableAnalysisType(
              //   data.Data.Analysis_Type
              // );
              // await this.databaseService.insertTableTurnArroundTime(
              //   data.Data.Turn_Arround_Time
              // );
              // await this.databaseService.insertTableOthermetalanalysis(
              //   data.Data.Other_metal_analysis
              // );
              // await this.databaseService.insertTableOtherelementanalysis(
              //   data.Data.OtherElementAnalysisList
              // );
              // await this.databaseService.insertTableAsbestosMaterials(
              //   data.Data.AsbestosMaterials
              // );already commented code
              // await this.databaseService.insertTableMaterialDropDownList(
              //   data.Data.MaterialDropDownList
              // );
              // await this.databaseService.insertTableAsbMaterialMappingList(
              //   data.Data.AsbMaterialMappingList
              // );

              // await this.databaseService.insertTableSampleAssignedLabList(
              //   data.Data.SampleAssignedLabList
              // );

              // await this.databaseService.insertTablemateriallocation(
              //   data.Data.MaterialLocations
              // );

              //check and remove
              // await this.databaseService.insertTableMaterialConfig(
              //   data.Data.MaterialConfig
              // );already commited code
            }
          },
          (err) => {
            this.toastService.presentToast(this.translateService.instant('General.serverIssue'));
            this.logService.AddErroLog(
              "page:dashboard page, function:constructor - " +
              JSON.stringify(err)
            );
          }
        );
      }
      );
    }
  }

  async ionViewDidEnter() {
    if (!!localStorage.getItem("ApiUrl") && localStorage.getItem("ApiUrl") != environment.endPoint) {
      environment.endPoint = localStorage.getItem("ApiUrl");
    }

    this.req.CurrentAppVersion = this.appVersionInfo;

    this.loggedInUserName = localStorage.getItem("username");
    const timestampValue = localStorage.getItem("timestamp");
    this.isCreateJobCheckin = !!localStorage.getItem('isCreateJobCheckin') && localStorage.getItem('isCreateJobCheckin') == 'true' ? true : false;

    this.sqlite.create(this.databaseService.dbCreate).then(async (res) => {
      this.databaseService.db = res;
      console.log("ionViewDidEnter db loaded successfully");
    }
    );
    if (timestampValue === null || timestampValue === "") {
      this.globalService.SyncTableType = this.SyncType.Login;
     // this.loaderService.present();
      await this.getAllData();
      console.log("Getalldata loaded on ionViewDidEnter")
    }
    this.databaseService.removeOldArchiveInspection();
  }


  sendEmailArchive(guid?) {

    let query = `select JobId from Inspection where InspectionGuid=${guid}`;
    this.databaseService.db.executeSql(query, []).then(
      (data) => {
        if (data.rows.length > 0) {

          let req: ArchiveEmailRequest = {
            UserId: Number(localStorage.getItem("empId")),
            JobId: data.rows.item(0).JobId,
          };
          const syncTableRequest = this.allDataService.sendEmailArchive(req);
          syncTableRequest.subscribe(
            (res) => {

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



  async removeOldSyncTableData() {
    var query = `
    delete FROM SyncTableArchive WHERE DateTime <= datetime('now','-7 day')`;
    this.databaseService.db.executeSql(query, []).then(
      (res) => {

      },
      (err) => {
        console.error(err);
      }
    );

  }


  async getAllData() {
    if (this.network.type != this.network.Connection.NONE) {
      await this.logService.AddRequestLog(JSON.stringify(this.req));
      // await this.databaseService.deleteAllTables();
      const request = this.allDataService.getAllDetails(this.req);
      request.subscribe(
        async (res) => {
          this.loaderService.dismiss();
          this.createAllTables(res);
          this.removeOldSyncTableData();
        },
        (err) => {
          this.loaderService.dismiss();
          this.logService.AddErroLog(
            "page:dashboard page, function:getalldata -" + JSON.stringify(err)
          );
          this.toastService.presentToast(this.translateService.instant('General.serverIssue'));
        }

      );
    }
    else {
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  async createAllTables(response: AllDataRepsonse) {
    if (response.Success) {
      await this.databaseService.createAllTables(response);
      localStorage.setItem("timestamp", response.Data.Timestamp);
    } else {
      this.toastService.presentToast(response.Message);
    }
    this.loaderService.dismiss();
  }

  async search(flag?) {
    if (flag) {
      this.router.navigate(["/tabs/tab1/checkoutInsp"]);
    } else {
      this.router.navigate(["/tabs/tab2"]);
    }
  }

  viewArchive() {
    this.router.navigate([`/tabs/tab2/archiveinspection`]);
  }

  add() {
    this.globalService.isFromEdit = false;
    this.globalService.isFromDetail = false;
    this.globalService.isFromGroupEdit = false;
    this.globalService.inspectionType = 0;
    this.globalService.CurrentVersion = 0;
    this.globalService.isEditAddress = false;
    this.router.navigate([`/tabs/tab2/joborder/''`]);
  }

  logout() {
    this.presentAlertConfirm();
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: this.translateService.instant("Logout.header"),
      message: this.translateService.instant("Logout.message"),
      buttons: [
        // {
        //   text: this.translateService.instant("Logout.synclogout"),
        //   handler: async () => {
        //     this.logoutSync();
        //   },
        // },
        {
          text: this.translateService.instant("Logout.logout"),
          handler: async () => {
            // this.logoutApi();
            this.logOutReq();
          },
        },
        {
          text: this.translateService.instant("Logout.cancel"),
          role: "cancel",
        },
      ],
    });
    await alert.present();
  }

  async logoutApi() {
    const alert = await this.alertController.create({
      header: this.translateService.instant("Sync.header"),
      message: this.translateService.instant("Logout.message1"),
      buttons: [
        {
          text: this.translateService.instant("Logout.cancel"),
          role: "cancel",
        },
        {
          text: this.translateService.instant("Logout.logout"),
          handler: async () => {
            this.logOutReq();
          },
        },
      ],
    });
    await alert.present();
  }

  async sync(guid: string, isAllValid?) {
    if (this.network.type != this.network.Connection.NONE) {
      if (!guid && !isAllValid) {
        this.globalService.SyncTableType = this.SyncType.SyncQuestions;

      }

      this
      await this.logService.AddTraceLog(
        "step1 - Sync() function call with guid-" +
        guid +
        " and isAllvalid status-" +
        isAllValid
      );
      if (guid === "") {
        await this.sqlite
          .create(this.databaseService.dbCreate)
          .then(async (db: SQLiteObject) => {
            this.databaseService.db = db;

            const query = `select count(*) as insCount from Inspection where IsDelete = 'false' and IsCheckedIn = 'false'`;

            await this.databaseService.db
              .executeSql(query, [])
              .then(async (data) => {
                if (data.rows.length > 0) {
                  for (let i = 0; i < data.rows.length; i++) {
                    const count = data.rows.item(i).insCount;

                    if (count == 0) {
                      const alert = await this.alertController.create({
                        header: this.translateService.instant("Sync.header"),
                        message: this.translateService.instant("Sync.message"),
                        buttons: [
                          {
                            text: this.translateService.instant("Login.cancel"),
                            role: "cancel",
                          },
                          {
                            text: this.translateService.instant("Sync.ok"),
                            handler: async () => {
                              await this.syncCall(guid);
                            },
                          },
                        ],
                      });
                      await alert.present();
                    } else {

                      this.toastService.presentToast(
                        "Please check-in all the inspection before sync. You can check-out inspection back after sync process get over"
                      );
                    }
                  }
                } else {

                  this.toastService.presentToast(
                    "Please check-in all the inspection before sync. You can check-out inspection back after sync process get over"
                  );
                }
              })
              .catch(async () => {
                await this.syncCall(guid);
              });
          })
          .catch(() => { });
      } else {
        await this.syncCall(guid, isAllValid);
      }
    }
    else {
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
    // add for global sync archive 


  }

  async syncCall(guid: string, isAllValid?) {

    await this.logService.AddTraceLog(
      "step2 - syncCall() function call with guid-" +
      guid +
      " and isAllvalid status-" +
      isAllValid
    );
    this.loaderService.present();
    await this.syncCallNew(guid, isAllValid);
    //const gotLocation = await this.getLocation(); // location code for future purpose
    //await this.logService.AddTraceLog("step3 - Location status-" + gotLocation);
    // if (gotLocation) {
    //   await this.syncCallNew(guid, isAllValid);
    // } else {
    //   this.lat = 0;
    //   this.long = 0;
    //   await this.syncCallNew(guid, isAllValid);
    //   // this.loaderService.dismiss();
    //   // this.toastService.presentToast(
    //   //   this.translateService.instant("General.location")
    //   // );
    // }
  }

  async syncCallNew(guid: string, isAllValid?, createJobAfterAllow?) {
    let timestampValue = localStorage.getItem("timestamp");
    timestampValue =
      timestampValue === null || timestampValue === "" ? "" : timestampValue;

    if (guid !== "") {
      this.arrInspection = await this.databaseService.selectAllInspectionData(
        guid
      );
      await this.logService.AddTraceLog(
        "step4 - Inspection get based on guid-" + guid
      );
      if (this.arrInspection.length > 0) {
        const arrPropertyImage: InpsectionPropertyImage[] = await this.databaseService.selectAllPropertyImageData(
          guid
        );
        const arrMaterialImage: MaterialImage[] = await this.databaseService.selectAllMaterialImageData(
          guid
        );
        const arrImage: InspectionImage[] = await this.databaseService.selectAllInspectionImageData(
          guid
        );

        const arrInspectionQuestionImage: InspectionQuestionImage[] = await this.databaseService.selectAllInspectionQuestionImageData(
          guid
        );

        const arrPromise = [];
        await this.logService.AddTraceLog(
          "step5 - Inspection images based on guid-" + guid
        );
        if (arrPropertyImage.length > 0) {
          arrPropertyImage.forEach((objPropImg: any) => {
            if (objPropImg.IsDelete == 'false' && objPropImg.IsSync == 'false') {
              arrPromise.push(this.startPropertyImageUpload(objPropImg));
            }
          });
        }

        if (arrMaterialImage.length > 0) {
          arrMaterialImage.forEach((objMaterialImg: any) => {
            if (objMaterialImg.IsDelete == 'false' && objMaterialImg.IsSync == 'false') {
              arrPromise.push(this.startMaterialImageUpload(objMaterialImg));
            }
          });
        }

        if (arrImage.length > 0) {
          arrImage.forEach((objImg: any) => {
            arrPromise.push(this.startUpload(objImg));
          });
          //arrPromise.push(this.startUpload(arrImage));
        }

        if (arrInspectionQuestionImage.length > 0) {
          arrInspectionQuestionImage.forEach((objImg: any) => {
            arrPromise.push(this.startInspectionQuestionImageUpload(objImg));
          });
        }

        await Promise.all(arrPromise);
      }
    }
    await this.sendAllData(timestampValue, guid, isAllValid, createJobAfterAllow);
  }

  // getLocation(): Promise<boolean> { //location code for future purpose
  //   return new Promise(async (resolve) => {
  //     await this.logService.AddRequestLog(
  //       "Get Current location plugin execute"
  //     );
  //     this.geolocation
  //       .getCurrentPosition({ timeout: 3000, enableHighAccuracy: true })
  //       .then((resp) => {
  //         this.lat = resp.coords.latitude;
  //         this.long = resp.coords.longitude;

  //         return resolve(true);
  //       })
  //       .catch((err) => {

  //         err.message
  //           ? this.logService.AddErroLog(
  //             "page:dashboard page, function:getlocation" +
  //             JSON.stringify(err.message)
  //           )
  //           : "";

  //         return resolve(false);
  //       });

  //   });
  // }



  getUploadImage(imgEntry): Promise<boolean> {


    return new Promise(async resolve => {
      await imgEntry.forEach((element, index, array) => {
        this.file
          .resolveLocalFilesystemUrl(element.Filepath)
          .then((entry) => {
            (entry as FileEntry).file((file) => {


              this.firstFileToBase64(file).then((result: string) => {

                var bytes = atob(
                  result.replace(
                    /^data:image\/(png|jpeg|jpg);base64,/,
                    ""
                  )
                );
                const byteNumbers = new Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) {
                  byteNumbers[i] = bytes.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const cover_blob = new Blob([byteArray], { type: "image/jpeg" });
                element.blob = cover_blob;
              });
            })
          })
          .catch((err) => {
            this.toastService.presentToast(JSON.stringify(err));
          });
      });

      return resolve(true);
    });



  }

  async uploadQueImage(imgEntry) {
    let formData = new FormData();
    let arr = [];
    let i = 0;
    let index = 0;

    while (i <= imgEntry.length - 1) {
      for (index = i; index < i + 10; index++) {
        if (index < imgEntry.length) {

          formData.append(
            "file[" + [index] + "]",
            imgEntry[index].blob,
            imgEntry[index].Name
          );
        }
      }
      this.uploadImageData(formData);
      formData = new FormData();
      i = index;
    }
  }

  private uploadImageArr(arr: any[]) {
    const formData = new FormData();

    if (arr.length > 0) {
      for (let i = 0; i < arr.length; i++) {
        const element = arr[i];

        formData.append(
          "file[" + [i] + "]",
          arr[i].blob,
          arr[i].Name
        );
      }

      this.uploadImageData(formData);
    }

  }

  private firstFileToBase64(fileImage): Promise<{}> {
    return new Promise((resolve, reject) => {

      let fileReader = new FileReader();
      if (fileReader && fileImage != null) {
        fileReader.readAsDataURL(fileImage);

        fileReader.onload = () => {

          resolve(fileReader.result);
        };
        fileReader.onerror = (error) => {
          reject(error);
        };
      } else {
        reject(new Error("No file found"));
      }
    });
  }

  startUpload(imgEntry: InspectionImage) {

    this.file
      .resolveLocalFilesystemUrl(imgEntry.Filepath)
      .then((entry) => {
        (entry as FileEntry).file((file) => this.readFile(file, imgEntry));
      })
      .catch((err) => {
        this.toastService.presentToast(JSON.stringify(err));
      });
  }

  startPropertyImageUpload(propertyImgEntry: InpsectionPropertyImage) {
    this.file
      .resolveLocalFilesystemUrl(propertyImgEntry.Filepath)
      .then((entry) => {
        (entry as FileEntry).file((file) =>
          this.readPropertyFile(file, propertyImgEntry)
        );
      })
      .catch((err) => {
        this.toastService.presentToast(JSON.stringify(err));
      });
  }

  startMaterialImageUpload(materialImgEntry: MaterialImage) {

    this.file
      .resolveLocalFilesystemUrl(materialImgEntry.Filepath)
      .then((entry) => {
        (entry as FileEntry).file((file) =>
          this.readMaterialFile(file, materialImgEntry)
        );
      })
      .catch((err) => {
        this.toastService.presentToast(JSON.stringify(err));
      });
  }

  startSyncTableImageUpload(imgEntry: InspectionImage) {
    this.file
      .resolveLocalFilesystemUrl(imgEntry.Filepath)
      .then((entry) => {
        (entry as FileEntry).file((file) => this.readSyncTableImageFile(file, imgEntry));
      })
      .catch((err) => {
        this.toastService.presentToast(JSON.stringify(err));
      });
  }

  readFile(file: any, obj?) {
    this.zone.run(()=>{
    const reader = getFileReader();
    reader.onload = () => {
      console.log(reader.result)
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {
        type: file.type,
      });
      formData.append("file", imgBlob, file.name);
      this.uploadImageData(formData, obj);
    };
    reader.readAsArrayBuffer(file);
  })
  }
  //  readFile(file:any,obj:any){
  //    this.readFileblob(file,obj).then((imgBlob)=>{

  //      const formData = new FormData();
  //      formData.append("file", imgBlob, file.name);
  //      this.uploadImageData(formData, obj);
  //    })
  //  }

  readPropertyFile(file: any, obj?) {
    this.zone.run(()=>{
        const reader = getFileReader();
    reader.onload = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {
        type: file.type,
      });
      formData.append("file", imgBlob, file.name);
      this.uploadPropertyImageData(formData, obj);
    };
    reader.readAsArrayBuffer(file);
  })
  }

  readMaterialFile(file: any, obj?) {
    this.zone.run(()=>{
        const reader = getFileReader();

    reader.onload = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {
        type: file.type,
      });
      formData.append("file", imgBlob, file.name);
      this.uploadMaterialData(formData, obj);
    };
    reader.readAsArrayBuffer(file);
  })
  }

  readSyncTableImageFile(file: any, obj?) {
    this.zone.run(()=>{
        const reader = getFileReader();

    reader.onload = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {
        type: file.type,
      });
      formData.append("file", imgBlob, file.name);
      this.uploadSyncTableImageData(formData, obj);
    };
    reader.readAsArrayBuffer(file);
  })
  }




  uploadImageData(formData: FormData, obj?) {

    this.logService.AddRequestLog(JSON.stringify(formData));
    this.imageUploadService.imageUpload(formData).subscribe(
      () => {

      },
      (err) => {
        this.logService.AddErroLog(
          "page:dashboard page, function:uploadimagedata-" + JSON.stringify(err)
        );
      }
    );
  }

  uploadPropertyImageData(formData: FormData, obj?) {

    //this.logService.AddRequestLog(JSON.stringify(formData));
    this.imageUploadService.propertyImageUpload(formData).subscribe(
      () => {
      },
      (err) => {
        this.logService.AddErroLog(
          "page:dashboard page, function:uploadpropertyimage-" +
          JSON.stringify(err)
        );
      }
    );
  }

  uploadMaterialData(formData: FormData, obj?) {


    this.logService.AddRequestLog(JSON.stringify(formData));
    this.imageUploadService.materialImageUpload(formData, obj.MaterialImageGuid).subscribe(
      () => {

      },
      (err) => {
        this.logService.AddErroLog(
          "page:dashboard page, function:uploadmaterialimage-" +
          JSON.stringify(err)
        );
      }
    );
  }

  uploadSyncTableImageData(formData: FormData, obj?) {
    this.logService.AddRequestLog(JSON.stringify(formData));
    this.imageUploadService.uploadSyncTableImageData(formData).subscribe(
      () => {

      },
      (err) => {
        this.logService.AddErroLog(
          "page:dashboard page, function:uploadsynctableimage-" +
          JSON.stringify(err)
        );
      }
    );
  }


  async sendAllData(timestampValue: string, guid: string, isAllValid?, createJobAfterAllow?) {
    await this.logService.AddTraceLog(
      "step6 - SendAllData function call with timestamp-" +
      timestampValue +
      ",guid-" +
      guid +
      " & valid status-" +
      isAllValid
    );
    this.arrInspection = [];
    let arrQuestionAnswer: QuestionAnswer[] = [];
    let arrQuestionAnswerImage: QuestionAnswerImage[] = [];
    let arrQuestionTableAnswer: QuestionTableAnswer[] = [];
    let arrInspectionPropertyImage: InpsectionPropertyImage[] = [];
    let arrMaterialImage: MaterialImage[] = [];
    let arrInspectionSample = [];
    let arrMaterialListModels = [];
    let arrOtherMaterialLocationModels = [];
    let arrMaterialRoomList = [];
    let arrSyncTableList = [];
    let arrInspectionQuestionImage: InspectionQuestionImage[] = [];

    if (guid !== "") {
      this.arrInspection = await this.databaseService.selectAllInspectionData(
        guid
      );
      this.arrInspection.length == 1
        ? this.isFromSyncWithCheckout
          ? (this.arrInspection[0]["IsCheckedIn"] = true)
          : (this.arrInspection[0]["IsCheckedIn"] = false)
        : null;



      !isAllValid && this.arrInspection.length == 1
        ? (this.arrInspection[0].IsSync = "true")
        : null;
      if (this.arrInspection.length > 0) {
        arrQuestionAnswer = await this.databaseService.selectAllQuestionAnswerData(
          guid
        );
        arrQuestionAnswerImage = await this.databaseService.selectAllQuestionAnswerImageData(
          guid
        );
        arrQuestionTableAnswer = await this.databaseService.selectAllQuestionTableAnswerData(
          guid
        );
        arrInspectionPropertyImage = await this.databaseService.selectAllPropertyImageData(
          guid
        );
        arrMaterialImage = await this.databaseService.selectAllMaterialImageData(
          guid
        );
        arrInspectionSample = await this.databaseService.selectAllInspectionSample(
          guid
        );
        arrMaterialListModels = await this.databaseService.selectAllMaterialListModels(
          guid
        );
        arrOtherMaterialLocationModels = await this.databaseService.selectAllOtherMaterialLocation(
          guid
        );
        arrMaterialRoomList = await this.databaseService.selectMaterialRoom(
          guid
        );
        arrInspectionQuestionImage = await this.databaseService.selectAllInspectionQuestionImageData(
          guid
        );
        await this.logService.AddTraceLog(
          "step7 - All data get of inspection related"
        );
      }
    }

    const req: AllDataRequest = {
      EmployeeId: Number(localStorage.getItem("empId")),
      Timestamp: timestampValue,
      Inspections: this.arrInspection,
      Questions: [],
      QuestionRelations: [],
      InspectionTypes: [],
      QuestionTables: [],
      Options: [],
      QuestionAnswers: arrQuestionAnswer,
      QuestionTableAnswers: arrQuestionTableAnswer,
      QuestionAnswerImages: arrQuestionAnswerImage,
      QuestionGroup: [],
      SyncInspectionsGuid: "",
      Latitude: this.lat.toString(),
      Longitude: this.long.toString(),
      ModifiedInspectionTypes: "",
      InspectionPropertyImage: arrInspectionPropertyImage,
      MaterialImageList: arrMaterialImage,
      Samples: arrInspectionSample,
      MaterialListModels: arrMaterialListModels,
      OtherMaterialLocationModels: arrOtherMaterialLocationModels,
      MaterialRoomListModels: arrMaterialRoomList,
      isLogin: true,
      InspectionQuestionImages: arrInspectionQuestionImage,
      CurrentAppVersion: this.appVersionInfo,
      CompanyCode: localStorage.getItem("companyCode"),
      IsContactLogin: this.globalService.isContactLogin,
      createJobAfterAllow: createJobAfterAllow,
      allow_create_jobs_checkin: this.allow_create_jobs_checkin,
      isFromJobList: this.globalService.isFromJobList
    };
    await this.logService.AddTraceLog(
      "step8 - create req object and send to api"
    );



    await this.logService.AddRequestLog(JSON.stringify(req));
    const request = this.allDataService.getAllDetails(req);
    request.subscribe(
      (res) => this.updateData(res, guid),
      // (res) => {
      //   this.globalService.isActiveEmp = true;
      //   if (res.Success) {
      //     this.updateData(res, guid);
      //   }
      //   else {
      //     this.loaderService.dismiss();
      //     if (!!res.Message && res.Message.includes(this.translateService.instant("Login.inActiveEmpMsg"))) {
      //       this.globalService.isActiveEmp = false;
      //     }
      //     this.toastService.presentToast(res.Message);
      //   }
      // },
      (err) => {
        this.logService.AddErroLog(
          "page:dashboard page, function:Sendall data" + JSON.stringify(err)
        );
        this.loaderService.dismiss();
        this.toastService.presentToast(this.translateService.instant('General.serverIssue'));
      }
    );
  }

  async updateCheckIn(value, guid) {
    await this.databaseService.db.executeSql(
      'update Inspection set IsCheckedIn = ? where InspectionGuid=?',
      [value, guid]
    );
    //await this.saveArchiveData();
  }


  async saveArchiveData() {
    this.arrInspectionDetail = [];
    this.arrGroups = [];
    let sampleList = [];

    const query = `select distinct Qa.QuestionAnswerGuid, Qa.Answer, Qa.Comment, Qa.Selected, Qa.QuestionOptionId,  Q.Question,
    Q.QuestionTypeId, Q.SubQuestionTypeId, Q.NoOfRows, Qg.QuestionGroupName, Q.QuestionGroupId, Q.QuestionGuid, Q.IsMandatory
    from Question as Q 
    left join QuestionAnswer as Qa on Qa.QuestionId=Q.Id  and QA.QuestionInspectionGuid = Q.QuestionGuid and Qa.InspectionGuid='${this.globalService.objJsonString.InspectionGuid}'
    left join QuestionGroup as Qg on Qg.Id=Q.QuestionGroupId 
    left join QuestionAnswerImage Qi on Qa.QuestionAnswerGuid = Qi.QuestionAnswerGuid and Qi.IsDelete = 'false'
    left join QuestionTableAnswer Qt on Qa.QuestionAnswerGuid = Qt.QuestionAnswerGuid and Qt.IsDelete ='false'
    where Q.InspectionTypeId=${this.globalService.objJsonString.InspectionTypeId} and (Qa.IsDelete = 'false' or Qa.IsDelete is null) and
    Q.IsDelete='false' and 
    ((Qa.Answer is not null and Q.IsDependent = 'true') or (Qa.Selected is not null and Q.IsDependent = 'true') or (Qa.QuestionOptionId is not null and Q.IsDependent = 'true') or 
    (Qi.ImageName != '' and Q.IsDependent ='true') or (Qt.QuestionTableId > 0 and Q.IsDependent ='true') or Q.IsDependent = 'false') order by Q.[Index]`;

    await this.databaseService.db.executeSql(query, []).then(async data => {
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          if (!(this.arrGroups.some(x => x.groupName === (data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName)))) {
            this.arrGroups.push({
              id: data.rows.item(i).QuestionGroupId,
              groupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName
            });

          }
          switch (data.rows.item(i).QuestionTypeId) {
            case QuestionTypeEnums.TextBox:
              this.answerGuid = '';
              this.arrInspectionDetail.push({
                Answer: `${data.rows.item(i).Answer === null ? '' : data.rows.item(i).Answer}${data.rows.item(i).Comment === null ? '' : ', ' + data.rows.item(i).Comment}`,
                Question: data.rows.item(i).Question,
                Image: [],
                Table: [],
                Column: [],
                Row: [],
                Guid: data.rows.item(i).QuestionAnswerGuid,
                GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                QuestionGuid: data.rows.item(i).QuestionGuid,
                IsMandatory: data.rows.item(i).IsMandatory
              });
              break;

            case QuestionTypeEnums.Radio:
              this.answerGuid = '';
              switch (data.rows.item(i).SubQuestionTypeId) {
                case SubQuestionTypeEnums.Dynamic:
                  const dynamicQuery = `select Opt.Option from Option as Opt where Opt.IsDelete='false' and Opt.Id in
              (${data.rows.item(i).QuestionOptionId})`;

                  await this.databaseService.db.executeSql(dynamicQuery, []).then(dataDynamic => {
                    if (dataDynamic.rows.length > 0) {
                      for (let d = 0; d < dataDynamic.rows.length; d++) {
                        this.arrInspectionDetail.push({
                          Answer: `${dataDynamic.rows.item(d).Option === '' ? '' : dataDynamic.rows.item(d).Option}${data.rows.item(i).Comment === null ? '' : ', ' + data.rows.item(i).Comment}`,
                          Question: data.rows.item(i).Question,
                          Image: [],
                          Table: [],
                          Column: [],
                          Row: [],
                          Guid: data.rows.item(i).QuestionAnswerGuid,
                          GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                          QuestionGuid: data.rows.item(i).QuestionGuid,
                          IsMandatory: data.rows.item(i).IsMandatory
                        });
                      }
                    } else {
                      this.arrInspectionDetail.push({
                        Answer: '',
                        Question: data.rows.item(i).Question,
                        Image: [],
                        Table: [],
                        Column: [],
                        Row: [],
                        Guid: data.rows.item(i).QuestionAnswerGuid,
                        GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                        QuestionGuid: data.rows.item(i).QuestionGuid,
                        IsMandatory: data.rows.item(i).IsMandatory
                      });
                    }
                  }).catch((error) => {

                  });
                  break;

                default:
                  switch (data.rows.item(i).Selected) {
                    case 1:
                      this.arrInspectionDetail.push({
                        Answer: !!data.rows.item(i).Selected ? `${this.translateService.instant(data.rows.item(i).Selected.toString())}${data.rows.item(i).Answer === null ? '' : ', ' + data.rows.item(i).Answer}${data.rows.item(i).Comment === null ? '' : ', ' + data.rows.item(i).Comment}` : '',
                        Question: data.rows.item(i).Question,
                        Image: [],
                        Table: [],
                        Column: [],
                        Row: [],
                        Guid: data.rows.item(i).QuestionAnswerGuid,
                        GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                        QuestionGuid: data.rows.item(i).QuestionGuid,
                        IsMandatory: data.rows.item(i).IsMandatory
                      });
                      break;

                    default:
                      this.arrInspectionDetail.push({
                        Answer: !!data.rows.item(i).Selected ? this.translateService.instant(data.rows.item(i).Selected.toString()) : '',
                        Question: data.rows.item(i).Question,
                        Image: [],
                        Table: [],
                        Column: [],
                        Row: [],
                        Guid: data.rows.item(i).QuestionAnswerGuid,
                        GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                        QuestionGuid: data.rows.item(i).QuestionGuid,
                        IsMandatory: data.rows.item(i).IsMandatory
                      });
                      break;
                  }
                  break;
              }
              break;

            case QuestionTypeEnums.DropDown:
              this.answerGuid = '';
              const dropDownQuery = `select Opt.Option from Option as Opt where Opt.IsDelete='false' and Opt.Id in
            (${data.rows.item(i).QuestionOptionId})`;

              await this.databaseService.db.executeSql(dropDownQuery, []).then(dataDropDown => {
                if (dataDropDown.rows.length > 0) {
                  for (let d = 0; d < dataDropDown.rows.length; d++) {
                    this.arrInspectionDetail.push({
                      Answer: `${dataDropDown.rows.item(d).Option === null ? '' : dataDropDown.rows.item(d).Option}${data.rows.item(i).Comment === null ? '' : ', ' + data.rows.item(i).Comment}`,
                      Question: data.rows.item(i).Question,
                      Image: [],
                      Table: [],
                      Column: [],
                      Row: [],
                      Guid: data.rows.item(i).QuestionAnswerGuid,
                      GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                      QuestionGuid: data.rows.item(i).QuestionGuid,
                      IsMandatory: data.rows.item(i).IsMandatory
                    });
                  }
                } else {
                  this.arrInspectionDetail.push({
                    Answer: '',
                    Question: data.rows.item(i).Question,
                    Image: [],
                    Table: [],
                    Column: [],
                    Row: [],
                    Guid: data.rows.item(i).QuestionAnswerGuid,
                    GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                    QuestionGuid: data.rows.item(i).QuestionGuid,
                    IsMandatory: data.rows.item(i).IsMandatory
                  });
                }
              }).catch(() => { });
              break;

            case QuestionTypeEnums.CheckBox:
              this.answerGuid = '';
              const checkBoxQuery = `select group_concat(Option, ', ') as opt from Option where IsDelete='false' and Id in
            (${data.rows.item(i).Answer})`;

              await this.databaseService.db.executeSql(checkBoxQuery, []).then(dataCheckBox => {
                if (dataCheckBox.rows.length > 0) {
                  for (let c = 0; c < dataCheckBox.rows.length; c++) {
                    this.arrInspectionDetail.push({
                      Answer: `${dataCheckBox.rows.item(c).opt === null ? '' : dataCheckBox.rows.item(c).opt}${data.rows.item(i).Comment === null ? '' : ', ' + data.rows.item(i).Comment}`,
                      Question: data.rows.item(i).Question,
                      Image: [],
                      Table: [],
                      Column: [],
                      Row: [],
                      Guid: data.rows.item(i).QuestionAnswerGuid,
                      GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                      QuestionGuid: data.rows.item(i).QuestionGuid,
                      IsMandatory: data.rows.item(i).IsMandatory
                    });
                  }
                }
              }).catch(() => { });
              break;

            case QuestionTypeEnums.FileUpload:
            case QuestionTypeEnums.Signature:
              this.answerGuid = data.rows.item(i).QuestionAnswerGuid;


              this.arrInspectionDetail.push({
                Answer: `${data.rows.item(i).Answer === null ? '' : data.rows.item(i).Answer}${data.rows.item(i).Comment === null ? '' : data.rows.item(i).Comment}`,
                Question: data.rows.item(i).Question,
                Image: await this.loadStoredImages(),
                Table: [],
                Column: [],
                Row: [],
                Guid: data.rows.item(i).QuestionAnswerGuid,
                GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                QuestionGuid: data.rows.item(i).QuestionGuid,
                IsMandatory: data.rows.item(i).IsMandatory
              });
              break;

            case QuestionTypeEnums.Table:
              this.answerGuid = data.rows.item(i).QuestionAnswerGuid;
              this.arrRowCount = [];

              for (let index = 0; index < data.rows.item(i).NoOfRows; index++) {
                this.arrRowCount.push(index);
              }

              this.arrInspectionDetail.push({
                Answer: `${data.rows.item(i).Answer === null ? '' : data.rows.item(i).Answer}${data.rows.item(i).Comment === null ? '' : data.rows.item(i).Comment}`,
                Question: data.rows.item(i).Question,
                Image: [],
                Table: await this.loadTableData(),
                Column: this.arrColCount,
                Row: this.arrRowCount,
                Guid: data.rows.item(i).QuestionAnswerGuid,
                GroupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName,
                QuestionGuid: data.rows.item(i).QuestionGuid,
                IsMandatory: data.rows.item(i).IsMandatory
              });



              break;
          }
        }

        this.globalService.arrayEditGroup = this.arrGroups;
        console.log(this.arrInspectionDetail);
      }
      this.isLoading = false;
    }).catch((err) => {

      this.isLoading = false;
    });

    sampleList = await this.databaseService.getAllActiveSample();
    let json = { arrGroups: this.arrGroups, arrInspectionDetail: this.arrInspectionDetail, sampleList: sampleList };
    let jsonString = JSON.stringify(json)

    await this.databaseService.db.executeSql(
      'update Inspection set ArchiveString=? where InspectionGuid=?',
      [jsonString, this.globalService.objJsonString.InspectionGuid]
    );

    this.insertArchiveInspection(jsonString);
  }

  async insertArchiveInspection(jsonString) {
    await this.databaseService.db.executeSql(
      `insert into ArchiveInspection(JobId, InspectorId, InspectionDate, Owner, PropertyLocation, Address, PhoneNumber,
        CellNumber, InspectorPhoneNumber, Status, IsDelete, Timestamp, InspectionGuid, InspectionTypeId, IsSync, StartTime,
        CompletedTime, WrongJobId, EmergencyDate,CurrentVersion,IsCheckedIn,ArchiveString,ArchiveDate) 
      select JobId, InspectorId, InspectionDate, Owner, PropertyLocation, Address, PhoneNumber,
        CellNumber, InspectorPhoneNumber, Status, IsDelete, Timestamp, InspectionGuid, InspectionTypeId, 'true', StartTime,
        CompletedTime, WrongJobId, EmergencyDate,CurrentVersion,'true',?,? from Inspection where InspectionGuid = ?`,
      [jsonString, this.timestampService.generateLocalTimeStamp(), this.globalService.objJsonString.InspectionGuid]
    );

    await this.databaseService.db.executeSql(
      `select * from ArchiveInspection where InspectionGuid = ?`,
      [this.globalService.objJsonString.InspectionGuid]
    ).then(async data => {
      if (data.rows.length > 0) {
        await this.databaseService.db.executeSql(
          `delete from Inspection where InspectionGuid = ?`,
          [this.globalService.objJsonString.InspectionGuid]
        );
      }
    });


  }



  loadTableData(): Promise<string[]> {
    return new Promise(async resolve => {
      let questionId = 0;
      const query1 = `select Qta.*, Qa.QuestionId from QuestionTableAnswer as Qta join QuestionAnswer as Qa on
      Qta.QuestionAnswerGuid == Qa.QuestionAnswerGuid where Qa.InspectionGuid=? and Qa.QuestionAnswerGuid=? and
      Qta.IsDelete='false' order by [Index]`;

      await this.databaseService.db.executeSql(query1, [this.globalService.objJsonString.InspectionGuid, this.answerGuid]).then(async data => {
        const arrTable = [];

        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            arrTable.push(data.rows.item(i).Answer);
          }
          questionId = data.rows.item(0).QuestionId;

          const query2 = `select * from QuestionTable where IsDelete='false' and QuestionId=${questionId}`;

          await this.databaseService.db.executeSql(query2, []).then(dataColumn => {
            if (dataColumn.rows.length > 0) {
              this.arrColCount = [];

              for (let i = 0; i < dataColumn.rows.length; i++) {
                this.arrColCount.push(dataColumn.rows.item(i).ColumnName);
              }
            }
          }).catch(() => {
            return resolve([]);
          });

          return resolve(arrTable);
        }
      }).catch(() => {
        return resolve([]);
      });

      return resolve([]);
    });
  }

  loadStoredImages(): Promise<InspectionImage[]> {
    return new Promise(async resolve => {
      const query = `select Ii.*,Qai.Id as QuestionAnswerImageId from InspectionImage as Ii join QuestionAnswerImage as Qai on Ii.Name == Qai.ImageName
      join QuestionAnswer as Qa on Qai.QuestionAnswerGuid == Qa.QuestionAnswerGuid where Qa.InspectionGuid=? and
      Qa.QuestionAnswerGuid=? and Qai.IsDelete='false'`;

      await this.databaseService.db.executeSql(query, [this.globalService.objJsonString.InspectionGuid, this.answerGuid]).then(data => {
        if (data.rows.length > 0) {
          const arrImage: InspectionImage[] = [];

          for (let i = 0; i < data.rows.length; i++) {
            arrImage.push({
              Id: data.rows.item(i).Id,
              Name: data.rows.item(i).Name,
              Path: data.rows.item(i).Path,
              Filepath: data.rows.item(i).Filepath,
              Timestamp: data.rows.item(i).Timestamp,
              InspectionGuid: data.rows.item(i).InspectionGuid,
              QuestionAnswerGuid: data.rows.item(i).QuestionAnswerGuid,
              IsSync: data.rows.item(i).IsSync,
              QuestionAnswerImageId: data.rows.item(i).QuestionAnswerImageId,
              QuestionAnswerImageGuid: data.rows.item(i).QuestionAnswerImageGuid
            });
          }
          return resolve(arrImage);
        }
      }).catch(() => {
        return resolve([]);
      });
      return resolve([]);
    });
  }





  async updateData(response: AllDataRepsonse, guid: string) {
    if (response.Success) {
      if (this.isCreateJobCheckin || this.allow_create_jobs_checkin) {
        await this.updateJobForSubscriberSync(response.Data);
      }
      if (this.isFromSyncWithCheckout) {
        await this.arrInspection[0]["IsCheckedIn"] == true ? this.updateCheckIn(true, guid) : this.updateCheckIn(false, guid)
      }

      await this.databaseService.updateAllTables(
        response,
        this.isFromSyncWithCheckout
      );
      if (this.globalService.SyncTableType != this.SyncType.CheckIn) {
        this.updateSyncData(response, guid);
      }
      this.events.subscribe("deleteCheckoutData", async (data) => {
        // this.events.unsubscribe('deleteCheckoutData')


        this.isFromSyncWithCheckout = false;
        this.databaseService.db.executeSql(
          'update Inspection set WrongJobId="false",IsSync="true",Status = 11  where InspectionGuid=?',
          [guid]
        );
        guid === ""
          ? localStorage.setItem("timestamp", response.Data.Timestamp)
          : this.events.publish("hideInspection");
        this.databaseService.db.executeSql(
          'update InpsectionPropertyImage set IsSync="true" where InspectionGuid=?',
          [guid]
        );
        this.databaseService.db.executeSql(
          'update  MaterialImage  set IsSync="true" where Job_Id in (select JobId from Inspection where InspectionGuid = ?)',
          [guid]
        );
        this.databaseService.db.executeSql(
          'update InspectionImage set IsSync="true" where InspectionGuid=?',
          [guid]
        );
        this.databaseService.db.executeSql(
          'update QuestionAnswerImage set IsSync="true" where InspectionGuid=? ',
          [guid]
        );
        this.databaseService.db.executeSql(
          'update InpsectionQuestionImage set IsSync="true" where InspectionGuid=?',
          [guid]
        );

        await this.logService.AddTraceLog("step9 - Sync Done");
        this.toastService.presentToast(
          this.translateService.instant("InspectionAdd.syncDone"), true
        );
        this.router.navigate(["/tabs/tab2"]);

        this.loaderService.dismiss();
        this.events.unsubscribe('deleteCheckoutData')


      });
    } else {
      // this.isFromSyncWithCheckout = false;

      if (response.Message.includes("Job does not exist, do you want to create a new one?")) {
        const alertJobCreate = await this.alertController.create({
          header: this.translateService.instant("Job create confirmation"),
          message: this.translateService.instant(response.Message),
          buttons: [
            {
              text: this.translateService.instant("Login.cancel"),
              role: "cancel",
            },
            {
              text: this.translateService.instant("Sync.ok"),
              handler: async () => {
                this.loaderService.present();
                await this.syncCallNew(guid, true, true);
              },
            },
          ],
        });
        await alertJobCreate.present();
      }
      else {
        this.toastService.presentToast(response.Message);
        if (!!response.Message && !!response.Data && !response.Data.IsActiveEmployee) {
          this.globalService.isActiveEmp = false;
        }
        if (response.Message.includes("Invalid Job ID") ||
          response.Message.includes("Inspection already exist for jobId")) {

          this.databaseService.db
            .executeSql(
              'update Inspection set WrongJobId="true" where InspectionGuid=?',
              [guid]
            )
            .then((res) => {
              this.events.publish("hideInspection");
            });
        }
      }

      // this.events.unsubscribe('deleteCheckoutData')
      this.loaderService.dismiss();
    }

  }

  async updateSyncData(response, guid) {
    this.isFromSyncWithCheckout = false;
    this.databaseService.db.executeSql(
      'update Inspection set WrongJobId="false",IsSync="true",Status = 11  where InspectionGuid=?',
      [guid]
    );
    guid === ""
      ? localStorage.setItem("timestamp", response.Data.Timestamp)
      : this.events.publish("hideInspection");
    this.databaseService.db.executeSql(
      'update InpsectionPropertyImage set IsSync="true" where InspectionGuid=?',
      [guid]
    );
    this.databaseService.db.executeSql(
      'update  MaterialImage  set IsSync="true" where Job_Id in (select JobId from Inspection where InspectionGuid = ?)',
      [guid]
    );
    this.databaseService.db.executeSql(
      'update InspectionImage set IsSync="true" where InspectionGuid=?',
      [guid]
    );
    this.databaseService.db.executeSql(
      'update QuestionAnswerImage set IsSync="true" where InspectionGuid=? ',
      [guid]
    );
    this.databaseService.db.executeSql(
      'update InspectionQuestionImage set IsSync="true" where InspectionGuid=? ',
      [guid]
    );

    await this.logService.AddTraceLog("step9 - Sync Done");
    this.toastService.presentToast(
      this.translateService.instant("InspectionAdd.syncDone"), true
    );
    this.loaderService.dismiss();
  }

  async updateJobForSubscriberSync(response: Data) {
    if (!!response && response.Inspections.length > 0) {
      let insList = response.Inspections;
      for (const obj of response.Inspections) {
        await this.databaseService.db.executeSql(`select * from Inspection where InspectionGuid=? and IsSync='false'`, [obj.InspectionGuid]).then(async data => {
          if (data.rows.length > 0) {
            let oldJobId = data.rows.item(0).JobId;

            await this.databaseService.db.executeSql(
              'update Inspection set JobId=? where InspectionGuid=?',
              [obj.JobId, obj.InspectionGuid]
            );

            await this.databaseService.db.executeSql(
              'update InspectionSample set job_id=? where job_id=?',
              [obj.JobId, oldJobId]
            );

            await this.databaseService.db.executeSql(
              'update MaterialListModels set Job_Id=? where Job_Id=?',
              [obj.JobId, oldJobId]
            );

            await this.databaseService.db.executeSql(
              'update MaterialImage set Job_Id=? where Job_Id=?',
              [obj.JobId, oldJobId]
            );

            await this.databaseService.db.executeSql(
              'update MaterialRoom set job_id=? where job_id=?',
              [obj.JobId, oldJobId]
            );
          }
        });
      }
    }
  }

  async logoutSync() {
    if (this.network.type != this.network.Connection.NONE) {
      this.loaderService.present();
      this.globalService.SyncTableType = this.SyncType.SyncLogOut;
      await this.logoutAndSync();
      // const gotLocation = await this.getLocation(); //location-code for future purpose
      // if (gotLocation) {
      //   await this.logoutAndSync();
      // } else {
      //   // this.loaderService.dismiss();
      //   // this.toastService.presentToast(
      //   //   this.translateService.instant("General.location")
      //   // );
      //   this.lat = 0;
      //   this.long = 0;
      //   await this.logoutAndSync();
      // }
    }
    else {
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }


  async logoutAndSync() {
    this.arrInspection = [];
    let arrQuestionAnswer: QuestionAnswer[] = [];
    let arrQuestionAnswerImage: QuestionAnswerImage[] = [];
    let arrQuestionTableAnswer: QuestionTableAnswer[] = [];
    let arrInspectionPropertyImage: InpsectionPropertyImage[] = [];
    let arrInspectionMaterialImage: MaterialImage[] = [];
    let arrInspectionSample = [];
    let arrMaterialListModels = [];
    let arrOtherMaterialLocationModels=[];
    let arrMaterialRoomList = [];
    let arrInspectionQuestionImages = [];

    this.arrInspection = await this.databaseService.selectAllInspectionData(
      ""
    );
    if (this.arrInspection.length > 0) {
      this.arrInspection.forEach((element) => {
        element["IsCheckedIn"] = false;
      });
      const arrPropertyImage: InpsectionPropertyImage[] = await this.databaseService.selectAllPropertyImageData(
        ""
      );
      const arrMaterialImage: MaterialImage[] = await this.databaseService.selectAllMaterialImageData(
        ""
      );
      const arrImage: InspectionImage[] = await this.databaseService.selectAllInspectionImageData(
        ""
      );
      const arrInspectionQuestionImage: InspectionQuestionImage[] = await this.databaseService.selectAllInspectionQuestionImageData(
        ""
      );

      if (arrImage.length > 0 || arrPropertyImage.length > 0 || arrMaterialImage.length > 0 || arrInspectionQuestionImage.length > 0) {
        const arrPromise = [];

        if (arrPropertyImage.length > 0) {
          arrPropertyImage.forEach((objPropImg: any) => {
            if (objPropImg.IsDelete == 'false' && objPropImg.IsSync == 'false') {
              arrPromise.push(this.startPropertyImageUpload(objPropImg));
            }
          });
        }

        if (arrMaterialImage.length > 0) {
          arrMaterialImage.forEach((objMaterialImg: any) => {
            if (objMaterialImg.IsDelete == 'false' && objMaterialImg.IsSync == 'false') {
              arrPromise.push(this.startMaterialImageUpload(objMaterialImg));
            }

          });
        }

        if (arrImage.length > 0) {
          arrImage.forEach((objImg: any) => {

            arrPromise.push(this.startUpload(objImg));

          });
          //arrPromise.push(this.startUpload(arrImage));
        }
        if (arrInspectionQuestionImage.length > 0) {
          arrInspectionQuestionImage.forEach((objMaterialImg: any) => {
            arrPromise.push(this.startInspectionQuestionImageUpload(objMaterialImg));
          });
        }

        await Promise.all(arrPromise);
      }

      arrQuestionAnswer = await this.databaseService.selectAllQuestionAnswerData(
        ""
      );
      arrQuestionAnswerImage = await this.databaseService.selectAllQuestionAnswerImageData(
        ""
      );
      arrQuestionTableAnswer = await this.databaseService.selectAllQuestionTableAnswerData(
        ""
      );
      arrInspectionPropertyImage = await this.databaseService.selectAllPropertyImageData(
        ""
      );
      arrInspectionMaterialImage = await this.databaseService.selectAllMaterialImageData(
        ""
      );

      arrInspectionSample = await this.databaseService.selectAllInspectionSample(
        ""
      );
      arrMaterialListModels = await this.databaseService.selectAllMaterialListModels(
        ""
      );
      arrOtherMaterialLocationModels=await this.databaseService.selectAllOtherMaterialLocation(
        ""
      );
      arrMaterialRoomList = await this.databaseService.selectMaterialRoom("");
      arrInspectionQuestionImages = await this.databaseService.selectAllInspectionQuestionImageData("");

      const req: AllDataRequest = {
        EmployeeId: Number(localStorage.getItem("empId")),
        Timestamp: localStorage.getItem("timestamp"),
        Inspections: this.arrInspection,
        Questions: [],
        QuestionRelations: [],
        InspectionTypes: [],
        QuestionTables: [],
        Options: [],
        QuestionAnswers: arrQuestionAnswer,
        QuestionTableAnswers: arrQuestionTableAnswer,
        QuestionAnswerImages: arrQuestionAnswerImage,
        QuestionGroup: [],
        SyncInspectionsGuid: "",
        Latitude: this.lat.toString(),
        Longitude: this.long.toString(),
        ModifiedInspectionTypes: "",
        InspectionPropertyImage: arrInspectionPropertyImage,
        MaterialImageList: arrInspectionMaterialImage,
        Samples: arrInspectionSample,
        MaterialListModels: arrMaterialListModels,
        OtherMaterialLocationModels:arrOtherMaterialLocationModels,
        MaterialRoomListModels: arrMaterialRoomList,
        InspectionQuestionImages: arrInspectionQuestionImages,
        CurrentAppVersion: this.appVersionInfo,
        CompanyCode: localStorage.getItem("companyCode"),
        IsContactLogin: this.globalService.isContactLogin,
        allow_create_jobs_checkin: this.allow_create_jobs_checkin,
        createJobAfterAllow: false,
        isFromJobList: this.globalService.isFromJobList
      };
      this.logService.AddRequestLog(
        "logout call and sync - " + JSON.stringify(this.req)
      );
      this.allDataService.getAllDetails(req).subscribe(
        (resData) => {
          this.globalService.isActiveEmp = true;
          this.loaderService.dismiss();
          if (resData.Success) {
            this.logOutReq();
          } else {
            if (!!resData["Message"] && resData["Message"].includes(this.translateService.instant("Login.inActiveEmpMsg"))) {
              this.globalService.isActiveEmp = false;
            }
            if (
              resData["Message"].includes("Invalid Job ID") ||
              resData["Message"].includes(
                "Inspection already exist for jobId"
              )
            ) {
              let query = `select InspectionGuid from Inspection where JobId in (${resData[
                "Message"
              ]
                .split(":")[1]
                .trim()}) ORDER BY Timestamp DESC LIMIT 1`

              this.databaseService.db
                .executeSql(
                  query,
                  []
                )
                .then((res) => {
                  if (res.rows.length > 0) {

                    this.updateData(resData, res.rows.item(0).InspectionGuid);
                  }
                });
            } else {
              this.toastService.presentToast(resData["Message"]);
            }
          }
        },
        (err) => {
          this.logService.AddErroLog(
            "page:dashboard page, function:logout sync-" + JSON.stringify(err)
          );
          this.loaderService.dismiss();
          this.toastService.presentToast(this.translateService.instant('General.serverIssue'));
        }
      );
    } else {
      this.logOutReq();
    }
  }

  async logOutReq() {
    this.authGuard.logout();
    // if (this.network.type != this.network.Connection.NONE) {
    //   const req: LogoutRequest = {
    //     userName: localStorage.getItem("username"),
    //     uuid: this.device.uuid,
    //   };
    //   await this.logService.AddRequestLog(JSON.stringify(req));
    //   await this.loaderService.present();
    //   const request = this.logoutService.logout(req);

    //   request.subscribe(
    //     (res) => {
    //       console.log(res);
    //       this.loaderService.dismiss();
    //       if (res.Success) {
    //         this.authGuard.logout();
    //       }
    //     },
    //     (err) => {
    //       console.log(err);
    //       this.loaderService.dismiss();
    //       this.toastService.presentToast(this.translateService.instant('General.serverIssue'));
    //     }
    //   );
    // }
    // else {
    //   this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    // }
  }

  startInspectionQuestionImageUpload(imgEntry: InspectionQuestionImage) {

    this.file
      .resolveLocalFilesystemUrl(imgEntry.Filepath)
      .then((entry) => {
        (entry as FileEntry).file((file) => this.readInspectionQuestionFile(file, imgEntry));
      })
      .catch((err) => {
        this.toastService.presentToast(JSON.stringify(err));
      });
  }

  readInspectionQuestionFile(file: any, obj?) {
    this.zone.run(()=>{
        const reader = getFileReader();

    reader.onload = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {
        type: file.type,
      });
      formData.append("file", imgBlob, file.name);
      this.uploadInspectionQuestionImageData(formData, obj);
    };
    reader.readAsArrayBuffer(file);
  })
  }

  uploadInspectionQuestionImageData(formData: FormData, obj?) {
    this.logService.AddRequestLog(JSON.stringify(formData));
    this.imageUploadService.inspectionQuestionImageUpload(formData).subscribe(
      () => {

      },
      (err) => {
        this.logService.AddErroLog(
          "page:dashboard page, function:uploadmaterialimage-" +
          JSON.stringify(err)
        );
      }
    );
  }

  checkIsActiveEmp() {
    var empId = Number(localStorage.getItem("empId"));
    this.logService.AddRequestLog("Check is active employee with id" + empId);
    this.allDataService.checkIsActiveEmp(empId).subscribe(
      async (res) => {
        if (!!res && res.Success) {
          this.globalService.isActiveEmp = Boolean(res.Data);
        }
        if (!res.Data) {
          this.toastService.presentToast(res.Message);
        }
      });
  }

  checkDbVersion() {
    this.appVersion.getVersionCode().then((value) => {
      this.allDataService.getCurrentVersion((this.platform.is('ios')) ? 0 : 1).subscribe(async (res: any) => {
        if (res.Success && !!res.Data) {
          if (value == res.Data) {
            this.toastService.presentToast(this.translateService.instant('AppVersion.latestVersionMessage'));
          }
          else if (value > res.Data) {
            this.toastService.presentToast(this.translateService.instant('AppVersion.nonMandatoryMessage'));
          }
          else if (value < res.Data) {
            this.toastService.presentToast(this.translateService.instant('AppVersion.outdatedVersionMessage'));
          }
        }
      })
    });
  }

  addJob() {
    if (this.network.type != this.network.Connection.NONE) {
      this.router.navigate([`/tabs/tab2/addJob/${0}`]);
    }
    else {
      this.isLoading = false;
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  viewJobs() {
    // if (this.network.type != this.network.Connection.NONE) {
    //   this.router.navigate([`/tabs/tab2/joblist`]);
    // }
    // else {
    //   this.isLoading = false;
    //   this.loaderService.dismiss();
    //   this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    // }
    this.router.navigate([`/tabs/tab2/joblist`]);
  }
  shipmentTracking() {
    if (this.network.type != this.network.Connection.NONE) {
      this.router.navigate([`/tabs/tab2/shipmentTracking`]);
    }
    else {
      this.isLoading = false;
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe('syncTableCheckoutSuccess');
    this.events.unsubscribe('syncTableCheckoutArchiveRequest')
    this.events.unsubscribe('hideInspection');
    this.events.unsubscribe('deleteCheckoutData');
    this.events.unsubscribe('syncTableSlideDeleteArchiveRequest');
  }
}
