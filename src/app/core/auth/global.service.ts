import { Injectable } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { environment } from "src/environments/environment";
import { Question } from "src/app/models/db-models/questions-model";

@Injectable({
  providedIn: "root",
})
export class GlobalService {
  public isFromJobList: boolean = false;
  public arngState: string;
  public arngCity: string;
  // public allow_job_creation_app: boolean = false;
  // public allow_create_jobs_checkin: boolean = false;
  public isContactLogin: boolean = false;
  public isActiveEmp: boolean = true;
  public objJsonString: any = {};
  public isAddress: boolean = false;
  public arrayEditGroup: any = [];
  public syncTableSuccess: number = 0;
  public SyncTableType: string;
  public inspectionDetailObj: any = {};
  public inspectionType = 0;
  public inspectionTypeName = "";
  public isFromEdit = false;
  public arrGuid: string[] = [];
  public isFromDetail = false;
  public answerGuid = "";
  public selectedQuestionGroupId = "";
  public isFromGroupEdit = false;
  public questionGuid = "";
  public isFromAddNew = false;
  public isFromBack = false;
  public isEditAddress = false;
  public CurrentVersion: number = 0;
  public inspectionQuestionNum: number = null;
  public isFromInsQueImgList: boolean = false;

  Projectenv: any = "";
  apiUrl: string;
  constructor(private alertController: AlertController) {
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
    // if (environment.endPoint.includes("etcapi") || environment.endPoint.includes("waterinspectionapi") || environment.endPoint.includes("api.kaamsey")) {
    //   this.Projectenv = "Test";
    // } 
    // else if (environment.endPoint.includes("waterinspectionapi")) {
    //   this.Projectenv = "WiTest";
    // }
    // else if (environment.endPoint.includes("kaamsey")) {
    //   this.Projectenv = "KaamSeyTest";
    // }
  }

  async presentAlert(message) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Archive Error',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
