import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InspectionType } from 'src/app/models/db-models/inspection-types-model';
import { DatabaseService } from 'src/app/core/database.service';
import { GlobalService } from 'src/app/core/auth/global.service';
import { TimestampService } from 'src/app/core/timestamp.service';
import { ToastService } from 'src/app/core/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { SQLiteObject, SQLite } from '@ionic-native/sqlite/ngx';
import { QuestionGroup } from 'src/app/models/db-models/question-group';
import { GuidService } from 'src/app/core/guid.service';
import { AppdatabaselogService } from '../appdatabaselog.service';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { Market } from '@ionic-native/market/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { CheckVersionService } from './check-version.service';


@Component({
  selector: 'app-joborder',
  templateUrl: './joborder.component.html',
  styleUrls: ['./joborder.component.scss'],
})
export class JoborderComponent {
  public isCreateJobCheckin: boolean = false;
  public insectionDetailsObj: any;
  public inspectionType: any;
  myForm: FormGroup;
  arrInspecionType: InspectionType[] = [];
  arrQuestionGroup: QuestionGroup[] = [];
  inspectionGuid = '';
  grpDropdown = false;
  isLoading = true;
  public oldJobID: number;

  constructor(private router: Router, private formBuilder: FormBuilder, private databaseService: DatabaseService,
    public globalService: GlobalService, private timestampService: TimestampService, private sqlite: SQLite,
    private route: ActivatedRoute, private toastService: ToastService, private translateService: TranslateService, private guidService: GuidService,
    private appDatabaseLogService: AppdatabaselogService, private appVersion: AppVersion, private checkVersionService: CheckVersionService
  ) {
    this.formInit();
    this.inspectionGuid = this.route.snapshot.params.guid;
    this.route.queryParams.subscribe(params => {
      if (params.InspectionDetailobj) {
        this.insectionDetailsObj = JSON.parse(params.InspectionDetailobj);
      }
    })
  }

  formInit() {
    if (this.globalService.isFromEdit === false) {
      this.myForm = this.formBuilder.group({
        jobId: ['', Validators.compose([Validators.max(2147483647), Validators.required])],
        type: ['', [Validators.required]],
      });
    } else {
      this.myForm = this.formBuilder.group({
        jobId: [localStorage.getItem('jobNumber'), Validators.compose([Validators.max(2147483647), Validators.required])],
      });

    }
  }

  async ionViewWillEnter() {
    this.checkAppVersion();
    // if (!this.globalService.isFromBack && !this.globalService.isFromEdit) {
    //   this.myForm.reset();
    // }

    if (!this.globalService.isFromEdit) {
      this.myForm.reset();
    }
    this.globalService.isFromBack = false;
    this.grpDropdown = false;
    this.arrQuestionGroup = [];
    this.globalService.selectedQuestionGroupId = '';
    this.oldJobID = Number(localStorage.getItem('jobNumber'));
    this.isCreateJobCheckin = !!localStorage.getItem('isCreateJobCheckin') && localStorage.getItem('isCreateJobCheckin') == 'true' ? true : false;
  }

  ionViewDidEnter() {
    this.globalService.isFromEdit === false ? this.getInspectionTypes() : (this.inspectionGuid = this.route.snapshot.params.guid);
    if (!!localStorage.getItem('jobListDataJobId')) {
      let jobId = localStorage.getItem('jobListDataJobId');
      this.myForm.get("jobId").setValue(jobId);

      localStorage.removeItem('jobListDataJobId');
      this.globalService.isFromJobList = true;
    }
  }



  async getInspectionTypes() {
    await this.sqlite.create(this.databaseService.dbCreate).then(async (db: SQLiteObject) => {
      this.databaseService.db = db;
      const query = `select * from InspectionType where IsDelete='false' ORDER BY Name COLLATE NOCASE ASC`;

      this.databaseService.db.executeSql(query, []).then(data => {
        if (data.rows.length > 0) {
          this.arrInspecionType = [];

          for (let i = 0; i < data.rows.length; i++) {
            this.arrInspecionType.push({
              Id: data.rows.item(i).Id,
              Name: data.rows.item(i).Name,
              Description: data.rows.item(i).Description,
              IsDelete: data.rows.item(i).IsDelete,
              InspectionTypeGuid: data.rows.item(i).InspectionTypeGuid,
              Timestamp: data.rows.item(i).Timestamp,
              CurrentVersion: data.rows.item(i).CurrentVersion,
              Selected: false
            });
          }

          if (this.globalService.inspectionType !== 0) {
            this.arrInspecionType.forEach(element => {
              if (element.Id === this.globalService.inspectionType) {
                setTimeout(async () => {
                  element.Selected = true;
                }, 500);
              }
            });
          }
        }
        this.isLoading = false;
      }).catch(() => {
        this.isLoading = false;
      });
    }).catch(() => {
      this.isLoading = false;
    });
  }

  async next() {
    if (this.isCreateJobCheckin && !this.globalService.isFromJobList) {
      let jobIdVal = 1;
      let query = `select Max(JobId) as maxId from (select Max(JobId) as JobId  from Inspection where IsDelete='false' union  select Max(JobId) as JobId from ArchiveInspection where IsDelete='false')`;
      //let query = `select count(*) as insCount from Inspection where IsDelete = 'false'`;
      await this.databaseService.db.executeSql(query, []).then(async data => {
        if (data.rows.length > 0 && data.rows.item(0).maxId > 0) {
          jobIdVal = data.rows.item(0).maxId + 1;
        }
      });

      this.myForm.get("jobId").setValue(jobIdVal);
    }

    if (this.myForm.invalid) {
      Object.keys(this.myForm.controls).forEach(key => {
        if (this.myForm.controls[key].invalid) {
          this.myForm.controls[key].markAsTouched({ onlySelf: true });
        }
      });
      return;
    }
    const validate: boolean = await this.validationForJobNumber();
    if (validate) {
      localStorage.setItem('jobNumber', this.myForm.value.jobId);
      localStorage.setItem('jobType', this.myForm.value.type);

      this.globalService.isFromEdit === false ? await this.insertTable() : this.updateJobId();

    }
  }

  async insertTable() {
    const guid = this.guidService.generateGuid();
    const query = `insert into Inspection(JobId, InspectorId, InspectionDate, Owner, PropertyLocation, Address, PhoneNumber,
      CellNumber, InspectorPhoneNumber, Status, IsDelete, Timestamp, InspectionGuid, InspectionTypeId, IsSync, StartTime,
      CompletedTime, WrongJobId, EmergencyDate,CurrentVersion,ArchiveString,IsCheckedIn,IsContactLogin) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    await this.databaseService.db.executeSql(query, [localStorage.getItem('jobNumber'), Number(localStorage.getItem('empId')),
    this.timestampService.generateLocalTimeStamp(), '', this.myForm.value.location, (this.isCreateJobCheckin ? "N/A" : this.myForm.value.address),
    this.myForm.value.phone, this.myForm.value.cell, this.myForm.value.inspectorPhone, 0, false,
    this.timestampService.generateLocalTimeStamp(), guid, this.globalService.inspectionType, 'false',
    this.timestampService.generateLocalTimeStamp(), null, false, null, this.globalService.CurrentVersion, '', false, this.globalService.isContactLogin]).then(() => {
      this.globalService.isFromDetail = false;
      this.globalService.isFromGroupEdit = false;
      this.globalService.isFromAddNew = true;

      if (this.isCreateJobCheckin) {
        this.router.navigate([`/tabs/tab2/add/${guid}`]);
      }
      else {
        this.router.navigate([`tabs/tab2/type/${guid}`])
      }

    }).catch(() => { });
  }

  validationForJobNumber(): Promise<boolean> {
    return new Promise(async resolve => {
      const query = `select * from Inspection  where JobId=${this.myForm.value.jobId} and IsDelete='false'`;
      await this.databaseService.db.executeSql(query, []).then(async data => {
        if (data.rows.length > 0) {
          if (this.globalService.isFromEdit === true && data.rows.item(0).Id != this.insectionDetailsObj.Id) {
            this.toastService.presentToast(this.translateService.instant('JobOrder.alreadyExistJobNumber'));
            return resolve(false);
          }
          else if (this.globalService.isFromEdit === false) {
            this.toastService.presentToast(this.translateService.instant('JobOrder.alreadyExistJobNumber'));
            return resolve(false);
          }
        }
        return resolve(true);

      });
    });
  }



  async updateJobId() {
    if (this.myForm.value.jobId != this.oldJobID) {
      await this.updateInSamplesMaterialsRooms();
    }
    await this.databaseService.db.executeSql(`update Inspection set JobId=?, Timestamp=?, WrongJobId="false" where InspectionGuid=?`, [this.myForm.value.jobId,
    this.timestampService.generateLocalTimeStamp(), this.inspectionGuid]).then(async () => {
      this.toastService.presentToast(this.translateService.instant('JobOrder.jobNumChange'));
      this.insectionDetailsObj.JobId = this.myForm.value.jobId;
      if (this.insectionDetailsObj.WrongJobId == 'true') {
        this.router.navigate(['/tabs/tab2']);
      }
      else {
        this.router.navigate([`/tabs/tab2/detail/${JSON.stringify(this.insectionDetailsObj)}`]);
      }
    }).catch(() => { });
  }

  async updateInSamplesMaterialsRooms() {
    // await this.databaseService.db.executeSql(`select JobId from  Inspection  where InspectionGuid=?`, [this.inspectionGuid]).then(async (data) => {
    // if(data.rows.length > 0){



    await this.databaseService.db.executeSql(`update InspectionSample set job_id=? where job_id=?`, [this.myForm.value.jobId,
    this.oldJobID]).then(async () => {

    }).catch(() => { });

    await this.databaseService.db.executeSql(`update MaterialListModels set Job_Id=? where Job_Id=?`, [this.myForm.value.jobId,
    this.oldJobID]).then(async () => {

    }).catch(() => { });

    await this.databaseService.db.executeSql(`update MaterialImage set Job_Id=? where Job_Id=?`, [this.myForm.value.jobId,
    this.oldJobID]).then(async () => {

    }).catch(() => { });

    await this.databaseService.db.executeSql(`update MaterialRoom set job_id=? where job_id=?`, [this.myForm.value.jobId,
    this.oldJobID]).then(async () => {

    }).catch(() => { });

    // }
    //  }).catch(() => { });  

  }

  async radioSelect(event) {
    //objName: string, objId: number, CurrentVersion: number
    //objInspectionType.Name, objInspectionType.Id,objInspectionType.CurrentVersion
    console.log(event)
    let selected = this.arrInspecionType.filter(data => data.Id == event.target.value);
    var objId = selected[0].Id;
    var CurrentVersion =selected[0].CurrentVersion;
    var objName =selected[0].Name;
    this.arrInspecionType.forEach(element => {
      if (element.Id === objId) {
        setTimeout(() => {
          element.Selected = true;
        }, 500);
      }
    });
    this.globalService.inspectionType = objId;
    this.globalService.CurrentVersion = CurrentVersion;
    this.globalService.inspectionTypeName = objName;

    this.arrQuestionGroup = [];
    await this.getGroupNameByInspectionTypeId(objId);
    this.grpDropdown = this.arrQuestionGroup.length > 0 ? true : false;
  }

  async getGroupNameByInspectionTypeId(inspectionTypeId: number) {
    const query = `select distinct Qg.* from QuestionGroup as Qg join Question as Que on Qg.Id==Que.QuestionGroupId where
    Qg.IsDelete='false' and Qg.InspectionTypeId=${inspectionTypeId} and Que.IsDelete='false'`;

    await this.databaseService.db.executeSql(query, []).then(async data => {
      console.log(data)
      if (data.rows.length > 0) {
        this.arrQuestionGroup = [];

        for (let i = 0; i < data.rows.length; i++) {
          this.arrQuestionGroup.push({
            Id: data.rows.item(i).Id,
            QuestionGroupName: data.rows.item(i).QuestionGroupName,
            InspectionTypeId: data.rows.item(i).InspectionTypeId,
            IsDelete: data.rows.item(i).IsDelete,
            QuestionGroupGuid: data.rows.item(i).QuestionGroupGuid,
            Timestamp: data.rows.item(i).Timestamp
          });
        }
        console.log(this.arrQuestionGroup)
      }
    }).catch(error=>{
      console.log(error)
    });
  }

  dropDownSelect(event: any) {
    this.globalService.selectedQuestionGroupId = event.detail.value;
  }

  checkAppVersion() {
    this.appVersion.getVersionCode().then(res => {
      this.checkVersionService.checkAppVersion(res);
    })
  }
}
