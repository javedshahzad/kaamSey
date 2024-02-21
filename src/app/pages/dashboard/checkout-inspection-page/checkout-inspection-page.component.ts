import { Component, OnInit } from "@angular/core";
import {
  StatusTypes,
  Inspection,
  CheckoutActionType,
} from "src/app/models/db-models/inspection-model";
import { AllDataService } from "../all-data.service";
import { Router } from "@angular/router";
import { DatabaseService } from "src/app/core/database.service";
import { AllDataRepsonse } from "src/app/models/all-data-model";
import {
  FileTransfer,
  FileTransferObject,
} from "@ionic-native/file-transfer/ngx";
import { File } from "@ionic-native/File/ngx";
import { WebView } from "@ionic-native/ionic-webview/ngx";
import { LoaderService } from "src/app/core/loader.service";
import { ToastService } from "src/app/core/toast.service";
import { PdfDownloadService } from "../pdf-download.service";
import { AlertController, PopoverController } from "@ionic/angular";
import { LogService } from "../log.service";
import { TranslateService } from "@ngx-translate/core";
import { AppdatabaselogService } from "../../inspection/appdatabaselog.service";
import { CheckoutActionListComponent } from "./checkout-action-list/checkout-action-list.component";
import { GlobalService } from "src/app/core/auth/global.service";
import { Network } from "@ionic-native/network/ngx";
import { Events } from "src/app/events/events";
@Component({
  selector: "app-checkout-inspection-page",
  templateUrl: "./checkout-inspection-page.component.html",
  styleUrls: ["./checkout-inspection-page.component.scss"],
})
export class CheckoutInspectionPageComponent implements OnInit {
  objStatusType = StatusTypes;
  arrInspection: any;
  AllData: AllDataRepsonse;
  isLoading = false;
  errMessage: boolean;
  signatureImage: any;
  jobid: number;
  actionTypeEnum = CheckoutActionType;

  constructor(
    public sharedService: AllDataService,
    public loaderService: LoaderService,
    public router: Router,
    public dbService: DatabaseService,
    private file: File,
    private transfer: FileTransfer,
    public webview: WebView,
    public toastService: ToastService,
    public pdfDownloadService: PdfDownloadService,
    public alertController: AlertController,
    public log: LogService,
    private translateService: TranslateService,
    private appDatabaseLogService: AppdatabaselogService,
    private popOverCnt: PopoverController,
    private events: Events,
    private globalService: GlobalService,
    private network: Network
  ) {
    this.pdfDownloadService.progressBar = false;
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.events.subscribe("checkoutActionEvent", async (data:any) => {
      var actionType = data.actionType;
      var obj = data.inspectionObj;
      this.dismissActionEvent();
      if (actionType === this.actionTypeEnum.Checkout) {
        this.checkArchiveList(obj);
      }
      else if (actionType === this.actionTypeEnum.InspectionPdf) {
        this.downloadAllQuestion(obj);
      }
      else if (actionType === this.actionTypeEnum.RentalPdf) {
        this.downloadRentalQuestion(obj);
      }
    });
    if (this.network.type != this.network.Connection.NONE) {
      this.appDatabaseLogService.AppDatabaseLog();
    }
  }

  async dismissActionEvent() {
    await this.popOverCnt.dismiss();
  }

  Find(element) {
    let jobId = Number(element.value);
    if (jobId && typeof jobId == "number") {
      this.isLoading = true;
      this.errMessage = false;
      this.arrInspection = null;
      this.sharedService.findById(jobId).subscribe(
        (res) => {
          this.isLoading = false;
          if (res.Success && res.Data) {
            this.arrInspection = res.Data;
            // this.AllData = res;
            this.errMessage = false;
          } else {
            this.errMessage = true;
          }
        },
        (err) => {
          this.log.AddErroLog(
            "Page : checkout-inspection, Function : Find() -" +
            JSON.stringify(err)
          );
          this.isLoading = false;
          this.errMessage = true;
          this.arrInspection = null;
        }
      );
    }
  }
  clearInput(el) {
    if (el.value == "") {
      this.arrInspection = null;
      this.errMessage = true;
    }
  }


  async checkArchiveList(obj) {
    let arrList = [];
    const queryIns = `select * from Inspection where JobId = ${obj.JobId} and IsDelete='false'`;
    await this.dbService.db
      .executeSql(queryIns, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            arrList.push(data.rows.item(i));
          }
        }
      })
      .catch((e) => {
        console.log(e);
      });

    const queryArchIns = `select * from ArchiveInspection where JobId = ${obj.JobId} and IsDelete='false'`;
    await this.dbService.db
      .executeSql(queryArchIns, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            arrList.push(data.rows.item(i));
          }
        }
      })
      .catch((e) => {
        console.log(e);
      });

    if (arrList != null && arrList.length > 0) {
      if (arrList.filter(x => x.ArchiveDate != null).length > 0) {
        this.checkOutArchiveConfirmAlert(obj);
      }
      else {
        this.checkOutConfirmAlert(obj);
      }
    }
    else {
      this.downloadInspection(obj);
    }
    // const query = `select * from Inspection where JobId = ${obj.JobId} and  IsDelete='false'`;
    // await this.dbService.db
    //   .executeSql(query, [])
    //   .then(async (data) => {
    //     if (data.rows.length > 0) {
    //       let archiveList = [];
    //       for (let i = 0; i < data.rows.length; i++) {
    //         if (data.rows.item(i).IsCheckedIn == 'true') {
    //           archiveList.push(data.rows.item(i));
    //         }
    //       }
    //       archiveList != null && archiveList.length > 0 ? this.checkOutArchiveConfirmAlert(obj) : this.checkOutConfirmAlert(obj);
    //     }
    //     else {
    //       this.downloadInspection(obj)
    //     }
    //   })
    //   .catch(() => {

    //   });
  }

  async checkOutArchiveConfirmAlert(obj) {
    const alert = await this.alertController.create({
      header: "Confirm",
      message: this.translateService.instant("Checkout.confirmArchiveCheck"),
      buttons: [
        {
          text: "No",
          role: "cancel",
          cssClass: "secondary",
          handler: (blah) => {
            this.toastService.presentToast(
              this.translateService.instant("Checkout.archiveNoMessage",true)
            );
          },
        },
        {
          text: "Yes",
          handler: () => {
            this.downloadInspection(obj)
          },
        },
      ],
    });
    await alert.present();
  }

  async checkOutConfirmAlert(obj) {
    const alert = await this.alertController.create({
      header: "Confirm",
      message: this.translateService.instant("Checkout.confirmCheck"),
      buttons: [
        {
          text: "No",
          role: "cancel",
          cssClass: "secondary",
          handler: (blah) => {
            this.toastService.presentToast(
              this.translateService.instant("Checkout.noMessage",true)
            );
          },
        },
        {
          text: "Yes",
          handler: () => {
            this.deleteOldDownloadNewInspection(obj);
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteOldDownloadNewInspection(obj) {
    await this.dbService.db.executeSql(
      `delete from MaterialListModels where Job_Id = ${obj.JobId}`,
      []
    );
    await this.dbService.db.executeSql(
      `delete from MaterialRoom where job_id=${obj.JobId}`,
      []
    );
    await this.dbService.db.executeSql(
      `delete from MaterialImage where Job_Id = ${obj.JobId}`,
      []
    );
    await this.dbService.db
      .executeSql(`delete from Inspection where JobId=?`, [
        obj.JobId,
      ])
      .then(() => { });
    await this.dbService.db.executeSql(
      `delete from QuestionAnswerImage where InspectionGuid in (select InspectionGuid from Inspection where JobId=?)`,
      [obj.JobId]
    );

    await this.dbService.db.executeSql(
      `delete from QuestionAnswer where InspectionGuid  in (select InspectionGuid from Inspection where JobId=?)`,
      [obj.JobId]
    );
    await this.dbService.db.executeSql(
      `delete from QuestionTableAnswer where InspectionGuid  in (select InspectionGuid from Inspection where JobId=?)`,
      [obj.JobId]
    );
    await this.dbService.db.executeSql(
      `delete from InspectionImage where InspectionGuid in (select InspectionGuid from Inspection where JobId=?)`,
      [obj.JobId]
    );
    await this.dbService.db.executeSql(
      `delete from InspectionSample where InspectionGuid  in (select InspectionGuid from Inspection where JobId=?)`,
      [obj.JobId]
    );

    await this.dbService.db.executeSql(
      `delete from InspectionQuestionImage where InspectionGuid in (select InspectionGuid from Inspection where JobId=?)`,
      [obj.JobId]
    );

    this.downloadInspection(obj)
  }

  downloadInspection(obj) {

    this.loaderService.present();
    this.log.AddRequestLog(
      "page:checkout inspection, function:downloadinspection - get the specific inspection data by guid -" +
      obj.InspectionGuid
    );
    this.sharedService.getInspectionDetail(obj.InspectionGuid).subscribe(
      async (res) => {
        this.globalService.isActiveEmp = true;
        if (res.Success && res.Data.Inspections.length != 0) {
          res = res.Data;
          let count = 0;

          await this.dbService.db.executeSql(
            `delete from MaterialListModels where Job_Id = ${obj.JobId}`,
            []
          );
          await this.dbService.db.executeSql(
            `delete from MaterialRoom where job_id = ${obj.JobId}`,
            []
          );
          await this.dbService.db.executeSql(
            `delete from MaterialImage where Job_Id = ${obj.JobId}`,
            []
          );
          await this.dbService.db
            .executeSql(`delete from Inspection where InspectionGuid=?`, [
              obj.InspectionGuid,
            ])
            .then(() => { });
          await this.dbService.db.executeSql(
            `delete from QuestionAnswerImage where InspectionGuid=?`,
            [obj.InspectionGuid]
          );

          await this.dbService.db.executeSql(
            `delete from QuestionAnswer where InspectionGuid=?`,
            [obj.InspectionGuid]
          );
          await this.dbService.db.executeSql(
            `delete from QuestionTableAnswer where InspectionGuid=?`,
            [obj.InspectionGuid]
          );
          await this.dbService.db.executeSql(
            `delete from InspectionImage where InspectionGuid=?`,
            [obj.InspectionGuid]
          );
          await this.dbService.db.executeSql(
            `delete from InspectionSample where InspectionGuid=?`,
            [obj.InspectionGuid]
          );

          await this.dbService.db.executeSql(
            `delete from InspectionQuestionImage where InspectionGuid=?`,
            [obj.InspectionGuid]
          );

          await this.dbService.db.executeSql(
            `delete from ArchiveInspection where InspectionGuid=?`,
            [obj.InspectionGuid]
          );

          const InspectionQuery = `insert into Inspection(JobId, InspectorId, InspectionDate, Owner, PropertyLocation, Address, PhoneNumber, CellNumber, InspectorPhoneNumber, Status, IsDelete, Timestamp, InspectionGuid, InspectionTypeId, IsSync, StartTime, CompletedTime, WrongJobId, EmergencyDate,CurrentVersion,ArchiveString,IsCheckedIn) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
          await this.dbService.db.executeSql(InspectionQuery, [
            res.Inspections[0].JobId,
            res.Inspections[0].InspectorId,
            res.Inspections[0].InspectionDate,
            res.Inspections[0].Owner,
            res.Inspections[0].PropertyLocation,
            res.Inspections[0].Address,
            res.Inspections[0].PhoneNumber,
            res.Inspections[0].CellNumber,
            res.Inspections[0].InspectorPhoneNumber,
            res.Inspections[0].Status,
            res.Inspections[0].IsDelete,
            res.Inspections[0].Timestamp,
            res.Inspections[0].InspectionGuid,
            res.Inspections[0].InspectionTypeId,
            res.Inspections[0].IsSync,
            res.Inspections[0].StartTime,
            res.Inspections[0].CompletedTime,
            res.Inspections[0].WrongJobId,
            res.Inspections[0].EmergencyDate,
            res.Inspections[0].CurrentVersion,
            '',
            false
          ]);
          this.insertTableSample(res.Samples);
          this.insertmaterialtable(res.MaterialListModels);
          this.insertmaterialRoom(res.MaterialRoomListModels);

          for (const ans of res.QuestionAnswers) {
            count++;
            if (ans.Path != null) {
              res.QuestionAnswerImages.forEach(async (element) => {
                if (element.QuestionAnswerGuid == ans.QuestionAnswerGuid) {
                  await this.downloadImage(element.ImagePath, element);
                  //await this.downloadImage(ans.Path, element);
                }
              });
            }
            await this.dbService.db
              .executeSql(
                `insert into QuestionAnswer(InspectionGuid, QuestionId, QuestionOptionId, Answer, Selected,IsDelete, QuestionAnswerGuid, Timestamp, Comment,InspectorId,QuestionInspectionGuid) values (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                  ans.InspectionGuid,
                  ans.QuestionId,
                  ans.QuestionOptionId,
                  ans.Answer,
                  ans.Selected,
                  ans.IsDelete,
                  ans.QuestionAnswerGuid,
                  ans.Timestamp,
                  ans.Comment,
                  ans.InspectorId,
                  ans.QuestionInspectionGuid
                ]
              )
              .then((res) => { })
              .catch((err) => { });
          }

          for (const element of res.MaterialImageList) {
            count++;
            if (element.Path != null) {
              this.downloadMaterialImage(element.Path, element);
            }
            // await this.dbService.db
            //   .executeSql(
            //     `insert into QuestionAnswer(InspectionGuid, QuestionId, QuestionOptionId, Answer, Selected,IsDelete, QuestionAnswerGuid, Timestamp, Comment,InspectorId) values (?,?,?,?,?,?,?,?,?,?)`,
            //     [
            //       ans.InspectionGuid,
            //       ans.QuestionId,
            //       ans.QuestionOptionId,
            //       ans.Answer,
            //       ans.Selected,
            //       ans.IsDelete,
            //       ans.QuestionAnswerGuid,
            //       ans.Timestamp,
            //       ans.Comment,
            //       ans.InspectorId,
            //     ]
            //   )
            //   .then((res) => {})
            //   .catch((err) => {});
          }

          for (const obj of res.QuestionTableAnswers) {
            count++;
            await this.dbService.db.executeSql(
              `insert into QuestionTableAnswer(QuestionTableId, [Index], IsDelete, QuestionTableAnswerGuid,
            Timestamp, QuestionAnswerGuid, Answer, InspectionGuid) values (?,?,?,?,?,?,?,?)`,
              [
                obj.QuestionTableId,
                obj.Index,
                obj.IsDelete,
                obj.QuestionTableAnswerGuid,
                obj.Timestamp,
                obj.QuestionAnswerGuid,
                obj.Answer,
                obj.InspectionGuid,
              ]
            );
          }

          for (const element of res.InspectionQuestionImages) {
            count++;
            if (element.ImagePath != null) {
              this.downloadInspectionQuestionImages(element.ImagePath, element);
            }
          }

          if (count == res.QuestionAnswers.length + res.QuestionTableAnswers.length + res.MaterialImageList.length + res.InspectionQuestionImages.length) {
            // this.toastService.presentToast("Inspection save in local database successfully");
            const alert = await this.alertController.create({
              header: "Confirm",
              message: "Do you want to open this inspection ?",
              buttons: [
                {
                  text: "Cancel",
                  role: "cancel",
                  cssClass: "secondary",
                  handler: (blah) => {
                    this.toastService.presentToast(
                      "Inspection save in local database successfully",true
                    );
                  },
                },
                {
                  text: "Okay",
                  handler: () => {
                    localStorage.setItem('isDownloadInspection', 'true')
                    this.router.navigate([
                      `/tabs/tab2/detail/${JSON.stringify(obj)}`,
                    ]);
                  },
                },
              ],
            });

            await alert.present();
          }
        } else {
          if (!!res.Message && res.Message.includes(this.translateService.instant("Login.inActiveEmpMsg"))) {
            this.globalService.isActiveEmp = false;
          }
          this.toastService.presentToast(res.Message);
        }
        this.loaderService.dismiss();
      },
      (err) => {
        this.loaderService.dismiss();

        this.log.AddErroLog(
          "Page : checkout-inspection, Function : download Inspection() -" +
          JSON.stringify(err)
        );
      }
    );
  }
  async downloadImage(url, obj) {
    // const query1 = `delete from QuestionAnswerImage where ImageName='${obj.ImageName}'`;
    // await this.dbService.db.executeSql(query1, []).then(() => { }).catch(() => { });

    // const query2 = `delete from InspectionImage where Name='${obj.ImageName}'`;
    // await this.dbService.db.executeSql(query2, []).then(() => { }).catch(() => { });
    const fileTransfer: FileTransferObject = this.transfer.create();
    fileTransfer.download(url, this.file.dataDirectory + obj.ImageName).then(
      async (res) => {
        await this.insertInspectionImage(obj, res.nativeURL);
        await this.insertImage(obj);
      },
      (err) => {
        this.log.AddErroLog(
          "Page : checkout-inspection, Function : Find() -" +
          JSON.stringify(err)
        );

      }
    );
  }
  downloadMaterialImage(url, obj) {
    const fileTransfer: FileTransferObject = this.transfer.create();
    fileTransfer.download(url, this.file.dataDirectory + obj.Name).then(
      async (res) => {
        await this.insertMaterialImage(obj, res.nativeURL);
      },
      (err) => {
        this.log.AddErroLog(
          "Page : checkout-inspection, Function : Find() -" +
          JSON.stringify(err)
        );

      }
    );
  }

  // async insertMaterialImage(obj, filepath){

  //   const query = `insert into MaterialImage(Id, Name, Path, Filepath,MaterialImageGuid ,Client_Material_Id, Job_Id, IsSync, IsDelete)
  //   values (?,?,?,?,?,?,?,?)`;

  // await this.dbService.db
  //   .executeSql(query, [
  //     obj.Id,
  //     obj.Name,
  //     this.pathForImage(filepath),
  //     filepath,
  //     obj.MaterialImageGuid,
  //     obj.Client_Material_Id,
  //     obj.Job_Id,
  //     true,
  //     obj.IsDelete,
  //   ])
  //   .then(() => {})
  //   .catch(() => {});
  // }

  async insertMaterialImage(obj, filepath) {
    const timestampValue = localStorage.getItem("timestamp");
    if (timestampValue === null || timestampValue === "") {
      const query = `insert into MaterialImage(Id, Name, Path, Filepath,MaterialImageGuid ,Client_Material_Id, Job_Id, IsSync, IsDelete)
        values (?,?,?,?,?,?,?,?,?)`;
      await this.dbService.db
        .executeSql(query, [
          obj.Id,
          obj.Name,
          this.pathForImage(filepath),
          filepath,
          obj.MaterialImageGuid,
          obj.Client_Material_Id,
          obj.Job_Id,
          true,
          obj.IsDelete,
        ])
        .then(() => { })
        .catch(() => { });

    } else {
      await this.dbService.db
        .executeSql(
          "select 1 from MaterialImage where MaterialImageGuid=?",
          [obj.MaterialImageGuid]
        )
        .then(async (data) => {
          if (data.rows.length === 0) {
            const query = `insert into MaterialImage(Id, Name, Path, Filepath,MaterialImageGuid ,Client_Material_Id, Job_Id, IsSync, IsDelete)
              values (?,?,?,?,?,?,?,?,?)`;

            await this.dbService.db
              .executeSql(query, [
                obj.Id,
                obj.Name,
                this.pathForImage(filepath),
                filepath,
                obj.MaterialImageGuid,
                obj.Client_Material_Id,
                obj.Job_Id,
                true,
                obj.IsDelete,
              ])
              .then(() => { })
              .catch(() => { });
          } else {
            const query = `update MaterialImage set Id=?, Name=?,MaterialImageGuid=?,Client_Material_Id=?,Job_Id=?, IsSync=?,IsDelete=? where MaterialImageGuid=?`;
            await this.dbService.db
              .executeSql(query, [
                obj.Id,
                obj.Name,
                this.pathForImage(filepath),
                filepath,
                obj.MaterialImageGuid,
                obj.Client_Material_Id,
                obj.Job_Id,
                true,
                obj.IsDelete,
                obj.MaterialImageGuid
              ])
              .then(() => { })
              .catch(() => { });
          }
        })
        .catch(() => { });
    }
  }

  async insertInspectionImage(obj, filepath) {
    const query = `insert into InspectionImage(Name, Path, Filepath, Timestamp, InspectionGuid, QuestionAnswerGuid, IsSync,QuestionAnswerImageGuid)
      values (?,?,?,?,?,?,?,?)`;

    await this.dbService.db
      .executeSql(query, [
        obj.ImageName,
        this.pathForImage(filepath),
        filepath,
        obj.Timestamp,
        obj.InspectionGuid,
        obj.QuestionAnswerGuid,
        true,
        obj.QuestionAnswerImageGuid,
      ])
      .then(() => { })
      .catch((err) => { console.log(err) });
  }

  async insertImage(obj) {
    const query = `insert into QuestionAnswerImage(ImageName, OriginalImageName, QuestionAnswerGuid, IsDelete,
      QuestionAnswerImageGuid, Timestamp, InspectionGuid, IsSync) values (?,?,?,?,?,?,?,?)`;

    await this.dbService.db
      .executeSql(query, [
        obj.ImageName,
        obj.ImageName,
        obj.QuestionAnswerGuid,
        obj.IsDelete,
        obj.QuestionAnswerImageGuid,
        obj.Timestamp,
        obj.InspectionGuid,
        true,
      ])
      .then(() => { })
      .catch((e) => { console.log(e) });
  }
  pathForImage(img: string) {
    if (img === null) {
      return "";
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  downloadAllQuestion(objData: Inspection) {
    let empId = Number(localStorage.getItem('empId'));
    this.pdfDownloadService.getPdfName(objData.InspectionGuid, empId).subscribe(
      (data) => {
        if (data.Success) {
          this.globalService.isActiveEmp = true;
          this.pdfDownloadService.downloadPdf(data.Data);
        }
        else {
          this.pdfDownloadService.progressBar = false;
          this.globalService.isActiveEmp = false;
          this.toastService.presentToast(data.Data);
        }
      },
      (err) => {
        this.log.AddErroLog(
          "page: checkout inspection, function: downloadAll question - " +
          JSON.stringify(err)
        );
      }
    );
  }

  downloadRentalQuestion(objData: Inspection) {
    let empId = Number(localStorage.getItem('empId'));
    this.pdfDownloadService.getWaterPdfName(objData.InspectionGuid, empId).subscribe(
      (data) => {
        if (data.Success) {
          this.globalService.isActiveEmp = true;
          this.pdfDownloadService.downloadPdf(data.Data);
        }
        else {
          this.pdfDownloadService.progressBar = false;
          this.globalService.isActiveEmp = false;
          this.toastService.presentToast(data.Data);
        }
      },
      (err) => {
        this.log.AddErroLog(
          "page: checkout inspection, function: download Rental question -" +
          JSON.stringify(err)
        );
      }
    );
  }

  downloadWaterQuestion(objData: Inspection) {
    this.pdfDownloadService.getRentalPdfName(objData.InspectionGuid).subscribe(
      (data) => {
        if (data.Success) {
          this.pdfDownloadService.downloadPdf(data.Data);
        }
      },
      (err) => {
        this.log.AddErroLog(
          "page: checkout inspection, function: download water question -" +
          JSON.stringify(err)
        );
      }
    );
  }
  async insertTableSample(arrSamples) {
    const arrInsertRows = [];
    for (const obj of arrSamples) {
      arrInsertRows.push([
        `insert into InspectionSample(sample_id, job_id, InspectionGuid, SampleGuid, 
        analysis_type, sample_type, sample_vol, flow_rate, width, length, weight, comment, sample_desc, sample_loc, client_sample_id, date_collected,
        control_sample, fb_sample, sampling_start_time, sampling_end_time, sampling_duration , Include_Paint_chips, Surface_Smooth_Clean, turn_around,
        squarefeet, purpose, WSSN, IncludeCUAnalysis, volume,date_created,ship_method,waybill,ship_date, InspectorId,Other_metal_analysis,
        other_element_analysis,TimeCollected,BottleSizeId,material_id,Client_Material_Id,Lab_Id_Client,IsDelete,SortOrder) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          obj.sample_id,
          obj.job_id,
          obj.InspectionGuid,
          obj.SampleGuid,
          obj.analysis_type,
          obj.sample_type,
          obj.sample_vol,
          obj.flow_rate,
          obj.width,
          obj.length,
          obj.weight,
          obj.comment,
          obj.sample_desc,
          obj.sample_loc,
          obj.client_sample_id,
          obj.date_collected,
          obj.control_sample,
          obj.fb_sample,
          obj.sampling_start_time,
          obj.sampling_end_time,
          obj.sampling_duration,
          obj.Include_Paint_chips,
          obj.Surface_Smooth_Clean,
          obj.turn_around,
          obj.squarefeet,
          obj.purpose,
          obj.WSSN,
          obj.IncludeCUAnalysis,
          obj.volume,
          obj.date_created,
          obj.ship_method,
          obj.waybill,
          obj.ship_date,
          obj.InspectorId,
          obj.Metal_analysis,
          obj.other_element_analysis,
          obj.TimeCollected,
          obj.BottleSizeId,
          obj.material_id,
          obj.Client_Material_Id,
          obj.Lab_Id_Client,
          obj.IsDelete,
          obj.SortOrder
        ],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.dbService.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }
  }
  async insertmaterialtable(arrMaterial) {

    const arrInsertRows = [];
    for (const obj of arrMaterial) {
      arrInsertRows.push([
        `insert into MaterialListModels(Id, Job_Id,Client_Material_Id, Material, Material_Sub, 
        Classification,Friable, Size,Color, Material_Locations,  
        Note_1 , Note_2 ,Quantity ,Units , Assumed ,IsDelete) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          obj.Id,
          obj.Job_Id,
          obj.Client_Material_Id,
          obj.Material,
          obj.Material_Sub,
          obj.Classification,
          obj.Friable,
          obj.Size,
          obj.Color,
          obj.Material_Locations,
          obj.Note_1,
          obj.Note_2,
          obj.Quantity,
          obj.Units,
          obj.Assumed,
          obj.IsDelete
        ],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.dbService.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }
  }
  async insertmaterialRoom(arrRoom) {
    const arrInsertRows = [];
    for (const obj of arrRoom) {
      arrInsertRows.push([
        `insert into MaterialRoom( roomGuid ,record_id , job_id , client_material_id ,material_id,
          room_number,floor_number, sq_feet, linear_feet_0_4, linear_feet_5_7,
          linear_feet_8_12, linear_feet_12_up, Ends, Hangers,damage_puncture,
          damage_vibration, damage_water, damage_air, damage_delamination, damage_slow_deterioration,
         damage_use_wear, damage_extent, damage_feet, access, access_frequency, risk_vibration,
         risk_air_move, risk_dist_potential, acm_condition, acm_height,IsDelete) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          obj.MaterialRoomGuid,
          obj.Record_Id,
          obj.Job_Id,
          obj.Client_Material_id,
          obj.Material_id,
          obj.Room_Number,
          obj.Floor_Number,
          obj.Sq_Feet,
          obj.Linear_Feet_0_4,
          obj.Linear_Feet_5_7,
          obj.Linear_Feet_8_12,
          obj.Linear_Feet_12_up,
          obj.Ends,
          obj.Hangers,
          obj.Damage_Puncture,
          obj.Damage_Vibration,
          obj.Damage_Water,
          obj.Damage_Air,
          obj.Damage_Delamination,
          obj.Damage_Slow_Deterioration,
          obj.Damage_Use_Wear,
          obj.Damage_Extent,
          obj.Damage_Feet,
          obj.Access,
          obj.Access_Frequency,
          obj.Risk_Vibration,
          obj.Risk_Air_Move,
          obj.Risk_Dist_Potential,
          obj.Acm_Condition,
          obj.Acm_Height,
          obj.IsDelete
        ],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.dbService.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }
  }
  async doRefresh(event: any) {
    setTimeout(async () => {
      this.isLoading = true;
      this.errMessage = false;
      setTimeout(async () => {
        await this.Find({ value: this.jobid });
      }, 2000);
      event.target.complete();
    }, 1000);
  }

  downloadInspectionQuestionImages(url, obj) {
    const fileTransfer: FileTransferObject = this.transfer.create();
    fileTransfer.download(url, this.file.dataDirectory + obj.Name).then(
      async (res) => {
        await this.insertInspectionQuestionImages(obj, res.nativeURL);
      },
      (err) => {
        this.log.AddErroLog(
          "Page : checkout-inspection, Function : Find() -" +
          JSON.stringify(err)
        );

      }
    );
  }

  async insertInspectionQuestionImages(obj, filepath) {
    const timestampValue = localStorage.getItem("timestamp");
    if (timestampValue === null || timestampValue === "") {
      const query = `insert into InspectionQuestionImage(Id,Name,Path,Filepath,Timestamp,InspectionQuestionImageGuid,InspectionGuid,QuestionGuid,IsSync,IsDelete) values (?,?,?,?,?,?,?,?,?,?)`;
      await this.dbService.db
        .executeSql(query, [
          obj.Id,
          obj.Name,
          this.pathForImage(filepath),
          filepath,
          obj.Timestamp,
          obj.InspectionQuestionImageGuid,
          obj.InspectionGuid,
          obj.QuestionGuid,
          true,
          obj.IsDelete,
        ])
        .then(() => { })
        .catch(() => { });

    } else {
      await this.dbService.db
        .executeSql(
          "select 1 from InspectionQuestionImage where InspectionQuestionImageGuid=?",
          [obj.InspectionQuestionImageGuid]
        )
        .then(async (data) => {
          if (data.rows.length === 0) {
            const query = `insert into InspectionQuestionImage(Id,Name,Path,Filepath,Timestamp,InspectionQuestionImageGuid,InspectionGuid,QuestionGuid,IsSync,IsDelete) values (?,?,?,?,?,?,?,?,?,?)`;

            await this.dbService.db
              .executeSql(query, [
                obj.Id,
                obj.Name,
                this.pathForImage(filepath),
                filepath,
                obj.Timestamp,
                obj.InspectionQuestionImageGuid,
                obj.InspectionGuid,
                obj.QuestionGuid,
                true,
                obj.IsDelete,
              ])
              .then(() => { })
              .catch(() => { });
          } else {
            const query = `update InspectionQuestionImage set Id=?, Name=?,Path=?,Filepath=?,Timestamp=?,InspectionGuid=?,QuestionGuid=?,IsSync=?,IsDelete=? where InspectionQuestionImageGuid=?`;
            await this.dbService.db
              .executeSql(query, [
                obj.Id,
                obj.Name,
                this.pathForImage(filepath),
                filepath,
                obj.Timestamp,
                obj.InspectionGuid,
                obj.QuestionGuid,
                true,
                obj.IsDelete,
                obj.InspectionQuestionImageGuid
              ])
              .then(() => { })
              .catch(() => { });
          }
        })
        .catch(() => { });
    }
  }

  async showCheckoutActions(event: any, objInspection: any) {
    let popOverEvent = await this.popOverCnt.create({
      component: CheckoutActionListComponent,
      event: event,
      componentProps: { inspectionObj: objInspection },
      cssClass: 'checkoutActionDiv'
    });
    return await popOverEvent.present();
  }

  ionViewWillLeave() {
    this.events.unsubscribe('checkoutActionEvent');
  }
}
