import { Component, ViewChild, ChangeDetectorRef, ElementRef, ViewChildren, NgZone } from '@angular/core';
import { IonSlides, ActionSheetController, Platform, ModalController, AlertController, PopoverController } from '@ionic/angular';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ToastService } from 'src/app/core/toast.service';
import { LoaderService } from 'src/app/core/loader.service';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/Camera/ngx';
import { File } from '@ionic-native/File/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { Crop } from '@ionic-native/crop/ngx';
import { TranslateService } from '@ngx-translate/core';
import { QuestionTypeEnums, SubQuestionTypeEnums } from 'src/app/models/db-models/question-type-model';
import { DatabaseService } from 'src/app/core/database.service';
import { GlobalService } from 'src/app/core/auth/global.service';
import { Question } from 'src/app/models/db-models/questions-model';
import { Option } from 'src/app/models/db-models/options-model';
import { QuestionTable } from 'src/app/models/db-models/questions-table-model';
import { GuidService } from 'src/app/core/guid.service';
import { TimestampService } from 'src/app/core/timestamp.service';
import { InspectionImage } from 'src/app/models/db-models/image-model';
import { HasData } from 'src/app/models/db-models/question-answer-model.';
import { FormGroup, FormBuilder } from '@angular/forms';
import { DatePipe, Location } from '@angular/common';
import { SignatureComponent } from '../signature/signature.component';
import { EditImgNameComponent } from './edit-img-name/edit-img-name.component';
import { ImageResizer, ImageResizerOptions } from '@ionic-native/image-resizer/ngx';
import { InspectionQuestionImage } from 'src/app/models/db-models/inspection-question-image-model';
import { InspectionActionListComponent } from '../../../inspection-action-list/inspection-action-list.component';
import { InspectionActionType } from 'src/app/models/db-models/inspection-model';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss'],
})
export class AddComponent {
  newInsQueEntryImgGuid = "";
  isBlankChild = false;
  uploadImgMsg = "";
  public disablePrevButton: boolean = false;
  public disableButton: boolean = false;
  kbytes: any;
  public finalList: any = [];
  public inspectionDetailObj: any = {};
  arrQuestion: Question[] = [];
  intQuestionNumber = 0;
  @ViewChild('slides') slides: IonSlides;
  objQueType = QuestionTypeEnums;
  objSubQueType = SubQuestionTypeEnums;
  arrOption: Option[] = [];
  arrQuestionTable: QuestionTable[] = [];
  arrNoOfRows: number[] = [];
  arrCheckboxId: string[] = [];
  radioValue = 0;
  radioValueInput:any = 0;
  inspectionGuid = '';
  optionId = 0;
  selectedValue = '';
  arrRadio = [{ name: '1', value: 1, checked: false }, { name: '2', value: 2, checked: false }];
  arrRadioNA = [{ name: '1', value: 1, checked: false }, { name: '2', value: 2, checked: false }, { name: '3', value: 3, checked: false }];
  imgGuid = '';
  arrImage: InspectionImage[] = [];
  arrInsQueImage: InspectionQuestionImage[] = [];
  queTableGuid = '';
  arrQueTabId: number[] = [];
  arrTable: string[] = [];
  MasterArrTable: any;
  arrTableAnswerGuid: string[] = [];
  relationQuetion = '';
  isArrRelationFilled = false;
  myForm: FormGroup;
  isLastQuestion = false;
  obj: Question;
  lastRecordId = "";
  isChangeAnswer = false;
  questionGroup = '';
  questionGroupId = '';
  empId = Number(localStorage.getItem('empId'));
  signature: any
  tblWidth: number;
  @ViewChildren('myDiv') myDiv;
  jobid: any;
  questionAnsweImage: any = [];
  objRadioDynamicSelect: any = {};
  actionTypeEnum = InspectionActionType;
  DynamicVal: any=0;
  constructor(private camera: Camera, private webview: WebView, private actionSheetController: ActionSheetController,
    private toastService: ToastService, private platform: Platform, private loaderService: LoaderService,
    private ref: ChangeDetectorRef, private filePath: FilePath, private crop: Crop,
    private translateService: TranslateService, private databaseService: DatabaseService,
    public globalService: GlobalService, private guidService: GuidService,
    private timestampService: TimestampService, private route: ActivatedRoute, private file: File,
    private formBuilder: FormBuilder, private datepipe: DatePipe,
    private router: Router, private location: Location, public modalController: ModalController, private zone: NgZone, private imageResizer: ImageResizer,
     private alertController: AlertController, private popOverCnt: PopoverController) {
    this.loaderService.present();
    this.formInit();
    window.addEventListener("orientationchange", () => {
      this.tblWidth = screen.width / this.arrQuestionTable.length;
    });
  }

  ionViewWillEnter() {
    this.isBlankChild = false;
    this.intQuestionNumber = 0;
    this.inspectionGuid = this.route.snapshot.params.guid;
    this.databaseService.db.executeSql('select JobId from inspection where InspectionGuid=?', [this.inspectionGuid]).then(res => {
      if (res.rows.length != 0) {
        this.jobid = res.rows.item(0).JobId
      }
    })
    this.getInspectionData();
  }

  async getInspectionData() {
    this.databaseService.db.executeSql('select * from inspection where InspectionGuid=?', [this.inspectionGuid]).then(res => {
      if (res.rows.length != 0) {
        this.inspectionDetailObj = res.rows.item(0);
      }
    })

  }
  autogrow(index) {
    this.myDiv.toArray()[index].nativeElement.style.height = 'auto';
    if (this.myDiv.toArray()[index].nativeElement.scrollHeight <= 200) {
      this.myDiv.toArray()[index].nativeElement.style.height = `${this.myDiv.toArray()[index].nativeElement.scrollHeight}px`;
    } else if (this.myDiv.toArray()[index].nativeElement.scrollHeight > 200) {
      this.myDiv.toArray()[index].nativeElement.style.height = '200px'
    }
  }
  async ionViewDidEnter() {
    this.isChangeAnswer = false;
    this.slides.lockSwipes(true);

    // this.globalService.arrGuid = [];
    // const guids = localStorage.getItem('arrGuid');

    // if (guids !== null) {
    //   this.globalService.arrGuid = JSON.parse(localStorage.getItem('arrGuid'));

    //   if (!this.globalService.arrGuid.includes(this.inspectionGuid)) {
    //     await this.getQuestionNumber();
    //   }
    // } else {
    // }
    if (this.globalService.isFromInsQueImgList && this.globalService.inspectionQuestionNum != null) {
      if (this.arrQuestion != null && this.arrQuestion.length > 0) {
        this.obj = this.arrQuestion[this.globalService.inspectionQuestionNum];
      }
      this.intQuestionNumber = this.globalService.inspectionQuestionNum;
      this.globalService.inspectionQuestionNum = null;
      this.globalService.isFromInsQueImgList = false;
    }
    else {
      if (!this.globalService.isFromGroupEdit) {
        await this.getQuestionNumber();
      }
      await this.getInspectionTypeQuestion();
    }
    this.loaderService.dismiss();
  }

  formInit() {
    this.myForm = this.formBuilder.group({
      txtValue: [''],
      commentValue: ['']
    });
  }

  goBack() {
    this.location.back();
  }

  async getQuestionNumber() {
    this.questionGroupId = this.globalService.selectedQuestionGroupId === '' ? 'Is Null'
      : '=' + this.globalService.selectedQuestionGroupId;

    // : `select count(*) as ctCount from QuestionAnswer as Qa where Qa.IsDelete='false' and
    // Qa.InspectionGuid='${this.inspectionGuid}' and Qa.QuestionId not in (select QuestionsId from QuestionRelation where
    // IsDelete='false')`;
    if (this.globalService.isFromDetail && this.globalService.answerGuid !== '') {
      // const queryEdit = `select Qa.*, row_number() over(order by Qu.[Index]) as Rownumber, Qu.QuestionGroupId from QuestionAnswer
      // as Qa left join Question as Qu on Qa.QuestionId == Qu.Id and Qa.QuestionInspectionGuid == Qu.QuestionGuid where Qa.IsDelete='false' and
      // Qa.InspectionGuid='${this.inspectionGuid}'`;
      var queryEdit = `select distinct Qa.QuestionAnswerGuid, Qa.Answer, Qa.Comment, Qa.Selected, Qa.QuestionOptionId,  Q.Question, Q.[Index] as RowNumber,
      Q.QuestionTypeId, Q.SubQuestionTypeId, Q.NoOfRows, Qg.QuestionGroupName, Q.QuestionGroupId, Q.QuestionGuid, Q.IsMandatory
      from Question as Q 
	    left join QuestionAnswer as Qa on Qa.QuestionId=Q.Id  and QA.QuestionInspectionGuid = Q.QuestionGuid and Qa.InspectionGuid='${this.inspectionGuid}'
      left join QuestionGroup as Qg on Qg.Id=Q.QuestionGroupId 
	    left join QuestionAnswerImage Qi on Qa.QuestionAnswerGuid = Qi.QuestionAnswerGuid and Qi.IsDelete = 'false'
	    left join QuestionTableAnswer Qt on Qa.QuestionAnswerGuid = Qt.QuestionAnswerGuid and Qt.IsDelete ='false'
	    where Q.InspectionTypeId=${this.globalService.inspectionType} and (Qa.IsDelete = 'false' or Qa.IsDelete is null) and
      Q.IsDelete='false' and 
	    ((Qa.Answer is not null and Q.IsDependent = 'true') or (Qa.Selected is not null and Q.IsDependent = 'true') or (Qa.QuestionOptionId is not null and Q.IsDependent = 'true') or 
	    (Qi.ImageName != '' and Q.IsDependent ='true') or (Qt.QuestionTableId > 0 and Q.IsDependent ='true') or Q.IsDependent = 'false') order by Q.[Index]`;
      await this.databaseService.db.executeSql(queryEdit, []).then(data => {
        if (data.rows.length > 0) {
          let initalList: any = [];
          this.finalList = [];

          for (let i = 0; i < data.rows.length; i++) {
            initalList.push({
              RowNumber: data.rows.item(i).Rownumber,
              QuestionAnswerGuid: data.rows.item(i).QuestionAnswerGuid,
              QuestionGroupId: data.rows.item(i).QuestionGroupId
            });
            // if (this.globalService.isFromDetail && this.globalService.answerGuid !== '') {
            //   if (data.rows.item(i).QuestionAnswerGuid === this.globalService.answerGuid) {
            //     this.intQuestionNumber = data.rows.item(i).Rownumber;
            //   }
            // } else {
            //   this.intQuestionNumber = this.globalService.isFromAddNew ? 0 : i; // data.rows.item(i).ctCount;
            // }
          }

          if (this.globalService.arrayEditGroup.length > 0 && initalList.length > 0) {

            var list = [];
            for (let i = 0; i < this.globalService.arrayEditGroup.length; i++) {
              var groupValue = this.globalService.arrayEditGroup[i].id;

              list = initalList.filter(x => x.QuestionGroupId == groupValue);


              list.forEach(element => {
                this.finalList.push(element);
              });

            }

          }


          for (let i = 0; i < this.finalList.length; i++) {
            if (this.globalService.isFromDetail && this.globalService.answerGuid !== '') {
              if (this.finalList[i].QuestionAnswerGuid === this.globalService.answerGuid) {
                this.intQuestionNumber = i;
                // this.intQuestionNumber = this.finalList[i].RowNumber;
              }
            } else {
              this.intQuestionNumber = this.globalService.isFromAddNew ? 0 : i; // data.rows.item(i).ctCount;
            }
          }
        }
      }).catch(() => { });
    }
    else if (this.globalService.isFromDetail && this.globalService.answerGuid === '') {
      const queryEditBlank = `select Qu.*, Qg.QuestionGroupName from Question as Qu left join QuestionGroup as Qg on
      Qg.Id==Qu.QuestionGroupId where Qu.IsDelete='false' and Qu.InspectionTypeId=${this.globalService.inspectionType} and
      Qu.IsDependent='false' ORDER by [Index]`;
      await this.databaseService.db.executeSql(queryEditBlank, []).then(data => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            if (this.globalService.isFromDetail && this.globalService.answerGuid !== '') {
              if (data.rows.item(i).QuestionAnswerGuid === this.globalService.answerGuid) {
                this.intQuestionNumber = data.rows.item(i).Rownumber;
              }
            } else {
              this.intQuestionNumber = this.globalService.isFromAddNew ? 0 : i; // data.rows.item(i).ctCount;
            }
          }
        }
      }).catch(() => { });
    }
    else {
      const queryAdd = `select Qu.*, Qg.QuestionGroupName from Question as Qu left join QuestionGroup as Qg on
      Qg.Id==Qu.QuestionGroupId where Qu.IsDelete='false' and Qu.InspectionTypeId=${this.globalService.inspectionType} and
      Qu.IsDependent='false' and Qu.QuestionGroupId ${this.questionGroupId} ORDER by [Index]`;
      await this.databaseService.db.executeSql(queryAdd, []).then(data => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            if (this.globalService.isFromDetail && this.globalService.answerGuid !== '') {
              if (data.rows.item(i).QuestionAnswerGuid === this.globalService.answerGuid) {
                this.intQuestionNumber = data.rows.item(i).Rownumber;
              }
            } else {
              this.intQuestionNumber = this.globalService.isFromAddNew ? 0 : i; // data.rows.item(i).ctCount;
            }
          }
        }
      }).catch(() => { });
    }




    if (this.globalService.isFromAddNew) {
      this.globalService.questionGuid = '';
    }
  }

  async getInspectionTypeQuestion() {
    const inspectionTypeId = this.globalService.inspectionType;
    this.questionGroupId = this.globalService.selectedQuestionGroupId === '' ? 'Is Null'
      : '=' + this.globalService.selectedQuestionGroupId;
    if (this.globalService.selectedQuestionGroupId != '') {
      this.questionGroup = `and Qu.QuestionGroupId=${this.globalService.selectedQuestionGroupId}`;
    } else if (this.globalService.selectedQuestionGroupId === '' && this.globalService.isFromDetail) {
      this.questionGroup = `and Qu.QuestionGroupId Is Null`;
    }
    if (this.globalService.isAddress) {
      this.questionGroup = '';
    }
    if (this.globalService.isFromGroupEdit || (this.globalService.isFromDetail && this.globalService.answerGuid !== '')) {

      const queryEdit = `select *, row_number() over(ORDER BY Primary_Sort_Order ASC, (CASE WHEN Secondary_Sort_Order IS NULL THEN 0 ELSE 1
    END) ASC, Secondary_Sort_Order ASC) as Rownumber from (select distinct Q.*, Qg.QuestionGroupName, Q.[Index] as
    Primary_Sort_Order, NULL as Secondary_Sort_Order from Question Q left join QuestionAnswer QA on QA.QuestionId = Q.Id and QA.QuestionInspectionGuid = Q.QuestionGuid
    and QA.IsDelete = 'false' and Q.IsDelete = 'false' left join QuestionRelation QR on QR.QuestionsId = QA.QuestionId and QR.QuestionRelationGuid = Q.QuestionRelationGuid and
    QR.IsDelete = 'false' left join QuestionGroup as Qg on Qg.Id==Q.QuestionGroupId where Q.InspectionTypeId in (select
    InspectionTypeId from Inspection where InspectionGuid='${this.inspectionGuid}') and Q.IsDependent = 'false' and
    Q.IsDelete='false' UNION select distinct Q.*, Qg.QuestionGroupName, QO.[Index] as Primary_Sort_Order, Q.[Index] as
    Secondary_Sort_Order from Question Q left join QuestionAnswer QA on QA.QuestionId = Q.Id and QA.IsDelete = 'false' and QA.QuestionInspectionGuid = Q.QuestionGuid and Qa.InspectionGuid='${this.inspectionGuid}'
    and Q.IsDelete='false' left join QuestionRelation QR on QR.QuestionsId = QA.QuestionId and QR.QuestionRelationGuid = Q.QuestionRelationGuid and QR.IsDelete = 'false'
    left join Question QO on QO.Id = QR.ParentQuestionId and (QO.QuestionGroupId = Q.QuestionGroupId or QO.QuestionGroupId is Q.QuestionGroupId) and QO.IsDelete = 'false' left join QuestionGroup as Qg on
    Qg.Id==QO.QuestionGroupId where QO.InspectionTypeId in (select InspectionTypeId from Inspection where
    InspectionGuid='${this.inspectionGuid}') and Q.IsDependent = 'true' and Q.IsDelete='false' and QA.InspectionGuid = '${this.inspectionGuid}') X
    where  InspectionTypeId = ${inspectionTypeId}  ORDER by [Index]`;

      await this.databaseService.db.executeSql(queryEdit, []).then(async data => {
        if (data.rows.length > 0) {
          let initailArrQue = [];
          for (let i = 0; i < data.rows.length; i++) {
            initailArrQue.push({
              Id: data.rows.item(i).Id,
              Question: data.rows.item(i).Question,
              Description: data.rows.item(i).Description,
              QuestionTypeId: data.rows.item(i).QuestionTypeId,
              SubQuestionTypeId: data.rows.item(i).SubQuestionTypeId,
              NoOfRows: data.rows.item(i).NoOfRows,
              IsDelete: data.rows.item(i).IsDelete,
              InspectionTypeId: data.rows.item(i).InspectionTypeId,
              Index: data.rows.item(i).Index,
              AnswerSelected: false,
              QuestionGuid: data.rows.item(i).QuestionGuid,
              Timestamp: data.rows.item(i).Timestamp,
              IsMandatory: data.rows.item(i).IsMandatory,
              IsParent: data.rows.item(i).IsParent,
              IsDependent: data.rows.item(i).IsDependent,
              ShowComment: data.rows.item(i).ShowComment,
              QuestionGroupId: data.rows.item(i).QuestionGroupId,
              QuestionGroupName: data.rows.item(i).QuestionGroupName,
              QuestionRelationGuid: data.rows.item(i).QuestionRelationGuid,
              QuestionInspectionId: data.rows.item(i).QuestionInspectionId
            });
          }

          if (this.globalService.arrayEditGroup.length > 0 && initailArrQue.length > 0) {
            this.arrQuestion = [];
            var list = [];
            for (let i = 0; i < this.globalService.arrayEditGroup.length; i++) {
              list = initailArrQue.filter(x => x.QuestionGroupId == this.globalService.arrayEditGroup[i].id);


              list.forEach(element => {
                this.arrQuestion.push(element);
              });

            }

          }



          this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
          if (this.globalService.isFromDetail && this.globalService.answerGuid !== '' && this.globalService.selectedQuestionGroupId !== '') {
            //this.intQuestionNumber--;
          }
          else if (this.globalService.isFromGroupEdit) {

            let currGrp = null;
            if (this.globalService.selectedQuestionGroupId !== '') {
              currGrp = parseInt(this.globalService.selectedQuestionGroupId);
            }
            let grpQue = this.arrQuestion.filter(x => x.QuestionGroupId === currGrp);
            var arrObj = this.arrQuestion.findIndex(x => x == grpQue[0]);
            this.intQuestionNumber = arrObj;
          }
          else {
            for (let i = 0; i < this.arrQuestion.length; i++) {
              if (this.globalService.questionGuid === this.arrQuestion[i].QuestionGuid) {
                this.intQuestionNumber = i;
              } else if (!this.globalService.isFromDetail && this.globalService.selectedQuestionGroupId === '') {
                this.intQuestionNumber = 0;
              }
            }
          }
          this.obj = this.arrQuestion[this.intQuestionNumber];

          if (this.obj.SubQuestionTypeId === this.objSubQueType.Dynamic
            || this.obj.QuestionTypeId === this.objQueType.DropDown
            || this.obj.QuestionTypeId === this.objQueType.CheckBox) {
            await this.getOption(this.obj.Id);
          } else if (this.obj.QuestionTypeId === this.objQueType.Table) {
            this.arrNoOfRows = [];

            for (let index = 0; index < this.obj.NoOfRows; index++) {
              this.arrNoOfRows.push(index);
            }
            await this.getQuestionTable(this.obj.Id);
          }
          this.isLastQuestion = this.intQuestionNumber === this.arrQuestion.length - 1 ? true : false;
          await this.fillData(this.obj.Id, this.obj.QuestionTypeId, this.obj.SubQuestionTypeId, this.obj.QuestionGuid);
        }
      }).catch(() => { });
    }
    else if (this.globalService.isFromGroupEdit || (this.globalService.isFromDetail && this.globalService.answerGuid === '')) {

      const queryEditBlank = `select Qu.*, Qg.QuestionGroupName from Question as Qu left join QuestionGroup as Qg on
        Qg.Id==Qu.QuestionGroupId where Qu.IsDelete='false' and Qu.InspectionTypeId=${inspectionTypeId} and
        Qu.IsDependent='false' ORDER by [Index]`;

      await this.databaseService.db.executeSql(queryEditBlank, []).then(async data => {
        if (data.rows.length > 0) {
          this.arrQuestion = [];
          for (let i = 0; i < data.rows.length; i++) {
            this.arrQuestion.push({
              Id: data.rows.item(i).Id,
              Question: data.rows.item(i).Question,
              Description: data.rows.item(i).Description,
              QuestionTypeId: data.rows.item(i).QuestionTypeId,
              SubQuestionTypeId: data.rows.item(i).SubQuestionTypeId,
              NoOfRows: data.rows.item(i).NoOfRows,
              IsDelete: data.rows.item(i).IsDelete,
              InspectionTypeId: data.rows.item(i).InspectionTypeId,
              Index: data.rows.item(i).Index,
              AnswerSelected: false,
              QuestionGuid: data.rows.item(i).QuestionGuid,
              Timestamp: data.rows.item(i).Timestamp,
              IsMandatory: data.rows.item(i).IsMandatory,
              IsParent: data.rows.item(i).IsParent,
              IsDependent: data.rows.item(i).IsDependent,
              ShowComment: data.rows.item(i).ShowComment,
              QuestionGroupId: data.rows.item(i).QuestionGroupId,
              QuestionGroupName: data.rows.item(i).QuestionGroupName,
              QuestionRelationGuid: data.rows.item(i).QuestionRelationGuid,
              QuestionInspectionId: data.rows.item(i).QuestionInspectionId
            });
          }
          this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
          if (this.globalService.isFromDetail && this.globalService.answerGuid !== '' && this.globalService.selectedQuestionGroupId !== '') {
            this.intQuestionNumber--;
          } else {
            for (let i = 0; i < this.arrQuestion.length; i++) {
              if (this.globalService.questionGuid === this.arrQuestion[i].QuestionGuid) {
                this.intQuestionNumber = i;
              } else if (!this.globalService.isFromDetail && this.globalService.selectedQuestionGroupId === '') {
                this.intQuestionNumber = 0;
              }
            }
          }
          this.obj = this.arrQuestion[this.intQuestionNumber];

          if (this.obj.SubQuestionTypeId === this.objSubQueType.Dynamic
            || this.obj.QuestionTypeId === this.objQueType.DropDown
            || this.obj.QuestionTypeId === this.objQueType.CheckBox) {
            await this.getOption(this.obj.Id);
          } else if (this.obj.QuestionTypeId === this.objQueType.Table) {
            this.arrNoOfRows = [];

            for (let index = 0; index < this.obj.NoOfRows; index++) {
              this.arrNoOfRows.push(index);
            }
            await this.getQuestionTable(this.obj.Id);
          }
          this.isLastQuestion = this.intQuestionNumber === this.arrQuestion.length - 1 ? true : false;
          await this.fillData(this.obj.Id, this.obj.QuestionTypeId, this.obj.SubQuestionTypeId, this.obj.QuestionGuid);
        }
      }).catch(() => { });
    }
    else {


      const queryAdd = `select Qu.*, Qg.QuestionGroupName from Question as Qu left join QuestionGroup as Qg on
        Qg.Id==Qu.QuestionGroupId where Qu.IsDelete='false' and Qu.InspectionTypeId=${inspectionTypeId} and
        Qu.IsDependent='false' ${this.questionGroup} ORDER by [Index]`;

      await this.databaseService.db.executeSql(queryAdd, []).then(async data => {
        if (data.rows.length > 0) {
          this.arrQuestion = [];
          for (let i = 0; i < data.rows.length; i++) {
            this.arrQuestion.push({
              Id: data.rows.item(i).Id,
              Question: data.rows.item(i).Question,
              Description: data.rows.item(i).Description,
              QuestionTypeId: data.rows.item(i).QuestionTypeId,
              SubQuestionTypeId: data.rows.item(i).SubQuestionTypeId,
              NoOfRows: data.rows.item(i).NoOfRows,
              IsDelete: data.rows.item(i).IsDelete,
              InspectionTypeId: data.rows.item(i).InspectionTypeId,
              Index: data.rows.item(i).Index,
              AnswerSelected: false,
              QuestionGuid: data.rows.item(i).QuestionGuid,
              Timestamp: data.rows.item(i).Timestamp,
              IsMandatory: data.rows.item(i).IsMandatory,
              IsParent: data.rows.item(i).IsParent,
              IsDependent: data.rows.item(i).IsDependent,
              ShowComment: data.rows.item(i).ShowComment,
              QuestionGroupId: data.rows.item(i).QuestionGroupId,
              QuestionGroupName: data.rows.item(i).QuestionGroupName,
              QuestionRelationGuid: data.rows.item(i).QuestionRelationGuid,
              QuestionInspectionId: data.rows.item(i).QuestionInspectionId
            });
          }
          this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
          if (this.globalService.isFromDetail && this.globalService.answerGuid !== '' && this.globalService.selectedQuestionGroupId !== '') {
            this.intQuestionNumber--;
          } else {
            for (let i = 0; i < this.arrQuestion.length; i++) {
              if (this.globalService.questionGuid === this.arrQuestion[i].QuestionGuid) {
                this.intQuestionNumber = i;
              } else if (!this.globalService.isFromDetail && this.globalService.selectedQuestionGroupId === '') {
                this.intQuestionNumber = 0;
              }
            }
          }
          this.obj = this.arrQuestion[this.intQuestionNumber];

          if (this.obj.SubQuestionTypeId === this.objSubQueType.Dynamic
            || this.obj.QuestionTypeId === this.objQueType.DropDown
            || this.obj.QuestionTypeId === this.objQueType.CheckBox) {
            await this.getOption(this.obj.Id);
          } else if (this.obj.QuestionTypeId === this.objQueType.Table) {
            this.arrNoOfRows = [];

            for (let index = 0; index < this.obj.NoOfRows; index++) {
              this.arrNoOfRows.push(index);
            }
            await this.getQuestionTable(this.obj.Id);
          }
          this.isLastQuestion = this.intQuestionNumber === this.arrQuestion.length - 1 ? true : false;
          await this.fillData(this.obj.Id, this.obj.QuestionTypeId, this.obj.SubQuestionTypeId, this.obj.QuestionGuid);
        }
      }).catch(() => { });
    }
  }

  async radioSelect(event: any) {
    console.log(this.arrOption)
    console.log(this.arrRadio)
    console.log(event)
    this.isLastQuestion = false;
    this.radioValueInput = event.target.value;
    this.radioValue = parseInt(event.target.value);
    console.log(this.radioValue)
    this.obj.AnswerSelected = false;
    if (this.radioValue === 1) {
      this.obj.AnswerSelected = true;
    }
    if ((this.radioValue === 2 || this.radioValue === 3) && this.lastRecordId === this.obj.QuestionGuid) {

      this.isLastQuestion = true;
    }
    else if ((this.radioValue === 2 || this.radioValue === 3) && this.obj.IsParent === 'true') {

      var queryL1 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
      Qr.IsDelete='false' and Qr.ParentQuestionId=${this.obj.Id} and Qr.QuestionInspectionId=${this.obj.QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
      await this.databaseService.db.executeSql(queryL1, []).then(async data => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {

            // 1 level child
            var obj1: any = [];
            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
              obj1 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
              this.arrQuestion.splice(this.arrQuestion.indexOf(obj1[0]), 1);

              var queryL2 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
              Qr.IsDelete='false' and Qr.ParentQuestionId=${obj1[0].Id} and Qr.QuestionInspectionId=${obj1[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
              await this.databaseService.db.executeSql(queryL2, []).then(async data => {
                if (data.rows.length > 0) {
                  // 2 level child

                  for (let i = 0; i < data.rows.length; i++) {
                    var obj2: any = [];
                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                      obj2 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj2[0]), 1);

                      var queryL3 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                      Qr.IsDelete='false' and Qr.ParentQuestionId=${obj2[0].Id} and Qr.QuestionInspectionId=${obj2[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                      await this.databaseService.db.executeSql(queryL3, []).then(async data => {
                        if (data.rows.length > 0) {
                          // 3 level child

                          for (let i = 0; i < data.rows.length; i++) {
                            var obj3: any = [];
                            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                              obj3 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                              this.arrQuestion.splice(this.arrQuestion.indexOf(obj3[0]), 1);

                              var queryL4 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                              Qr.IsDelete='false' and Qr.ParentQuestionId=${obj3[0].Id} and Qr.QuestionInspectionId=${obj3[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                              await this.databaseService.db.executeSql(queryL4, []).then(async data => {
                                if (data.rows.length > 0) {
                                  // 4 level child

                                  for (let i = 0; i < data.rows.length; i++) {
                                    var obj4: any = [];
                                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                      obj4 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj4[0]), 1);

                                      var queryL5 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                                      Qr.IsDelete='false' and Qr.ParentQuestionId=${obj4[0].Id} and Qr.QuestionInspectionId=${obj4[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                                      await this.databaseService.db.executeSql(queryL5, []).then(async data => {
                                        if (data.rows.length > 0) {
                                          // 5 level child
                                          for (let i = 0; i < data.rows.length; i++) {
                                            var obj5: any = [];
                                            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                              obj5 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                              this.arrQuestion.splice(this.arrQuestion.indexOf(obj5[0]), 1);
                                            }
                                          }
                                        }
                                      }).catch(() => { });
                                    }
                                  }
                                }
                              }).catch(() => { });
                            }
                          }
                        }
                      }).catch(() => { });
                    }
                  }
                }
              }).catch(() => { });
            }

          }

          this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;

          if (this.lastRecordId === this.obj.QuestionGuid) {
            this.isLastQuestion = true;
          }
        }

      }).catch(() => { });

    }
    else {

      if (this.lastRecordId === this.obj.QuestionGuid) {
        if (this.obj.IsParent === 'true') {
          this.isLastQuestion = false;
        } else {
          this.isLastQuestion = true;
        }
      }
    }
  }

  async radioDynamicSelect_old(event: any) {
    var valuee = JSON.parse(event.target.value)
    let objOpts = this.arrOption.filter(data=> data.Id === valuee )
    this.objRadioDynamicSelect = objOpts[0];
    console.log(this.objRadioDynamicSelect)
    this.isLastQuestion = false;
    setTimeout(() => {
      this.objRadioDynamicSelect.Selected = true;
      this.optionId = this.objRadioDynamicSelect.Id;
      this.selectedValue = this.objRadioDynamicSelect.Option;
    }, 0);

    if (this.lastRecordId === this.obj.QuestionGuid) {
      if (this.objRadioDynamicSelect.IsParent === 'true') {
        this.isLastQuestion = false;
      } else {
        this.isLastQuestion = true;
      }
    }
    else if (this.objRadioDynamicSelect.IsParent === 'false') {

      var queryL1 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
      Qr.IsDelete='false' and Qr.ParentQuestionId=${this.objRadioDynamicSelect.QuestionId} and Qr.QuestionInspectionId=(select QuestionInspectionId from Question where QuestionId=${this.objRadioDynamicSelect.QuestionId}) and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
      await this.databaseService.db.executeSql(queryL1, []).then(async data => {
        if (data.rows.length > 0) {
          // 1 level child
          for (let i = 0; i < data.rows.length; i++) {
            var obj1: any = [];
            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
              obj1 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
              this.arrQuestion.splice(this.arrQuestion.indexOf(obj1[0]), 1);


              var queryL2 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
              Qr.IsDelete='false' and Qr.ParentQuestionId=${obj1[0].Id} and Qr.QuestionInspectionId=${obj1[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
              await this.databaseService.db.executeSql(queryL2, []).then(async data => {
                if (data.rows.length > 0) {
                  // 2 level child
                  for (let i = 0; i < data.rows.length; i++) {
                    var obj2: any = [];
                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                      obj2 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj2[0]), 1);

                      var queryL3 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                      Qr.IsDelete='false' and Qr.ParentQuestionId=${obj2[0].Id} and Qr.QuestionInspectionId=${obj2[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                      await this.databaseService.db.executeSql(queryL3, []).then(async data => {
                        if (data.rows.length > 0) {
                          // 3 level child
                          for (let i = 0; i < data.rows.length; i++) {
                            var obj3: any = [];
                            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                              obj3 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                              this.arrQuestion.splice(this.arrQuestion.indexOf(obj3[0]), 1);

                              var queryL4 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                              Qr.IsDelete='false' and Qr.ParentQuestionId=${obj3[0].Id} and Qr.QuestionInspectionId=${obj3[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                              await this.databaseService.db.executeSql(queryL4, []).then(async data => {
                                if (data.rows.length > 0) {
                                  // 4 level child
                                  for (let i = 0; i < data.rows.length; i++) {
                                    var obj4: any = [];
                                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                      obj4 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj4[0]), 1);

                                      var queryL5 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                                      Qr.IsDelete='false' and Qr.ParentQuestionId=${obj4[0].Id} and Qr.QuestionInspectionId=${obj4[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                                      await this.databaseService.db.executeSql(queryL5, []).then(async data => {
                                        if (data.rows.length > 0) {
                                          // 5 level child
                                          for (let i = 0; i < data.rows.length; i++) {
                                            var obj5: any = [];
                                            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                              obj5 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                              this.arrQuestion.splice(this.arrQuestion.indexOf(obj5[0]), 1);
                                            }
                                          }
                                        }
                                      }).catch(() => { });
                                    }
                                  }
                                }
                              }).catch(() => { });
                            }
                          }
                        }
                      }).catch(() => { });
                    }
                  }
                }
              }).catch(() => { });

            }
          }
        }
      }).catch(() => { });

      this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
      if (this.lastRecordId === this.obj.QuestionGuid) {
        this.isLastQuestion = true;
      }
    }
    else {
      this.isLastQuestion = false;
    }
  }

  public async radioDynamicSelect(event: any) {
    console.log(this.arrOption)
    console.log(this.arrRadio)
    console.log(event.target.value)
    this.DynamicVal = event.target.value
    var valuee = JSON.parse(event.target.value)
    console.log(valuee)
    let objOpts = this.arrOption.filter(data=> data.Id === valuee );
    if(objOpts.length === 0){
      return false
    }
    this.objRadioDynamicSelect = objOpts[0];
    console.log(this.objRadioDynamicSelect)
    this.isLastQuestion = false;

      setTimeout(async () => {
        this.objRadioDynamicSelect.Selected = true;
        this.optionId = this.objRadioDynamicSelect.Id;
        this.selectedValue = this.objRadioDynamicSelect.Option;
        this.DynamicVal = String(this.objRadioDynamicSelect.Id);
      }, 0);

    if (this.obj.IsParent == 'true') {
      var query = `select * from QuestionRelation Qr join Option Op on Qr.OptionsId = Op.Id where Qr.QuestionInspectionId = ${this.obj.QuestionInspectionId} and Qr.IsDelete = 'false'`;
      await this.databaseService.db.executeSql(query, []).then(async data => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            if (data.rows.item(i).Option == this.selectedValue) {
              this.isLastQuestion = false;
            }
            else {
              var queryL1 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
              Qr.IsDelete='false' and Qr.ParentQuestionId=${this.obj.Id} and Qr.QuestionInspectionId=${this.obj.QuestionInspectionId}) and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
              await this.databaseService.db.executeSql(queryL1, []).then(async data => {
                if (data.rows.length > 0) {
                  // 1 level child
                  for (let i = 0; i < data.rows.length; i++) {
                    var obj1: any = [];
                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                      obj1 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj1[0]), 1);


                      var queryL2 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                      Qr.IsDelete='false' and Qr.ParentQuestionId=${obj1[0].Id} and Qr.QuestionInspectionId=${obj1[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                      await this.databaseService.db.executeSql(queryL2, []).then(async data => {
                        if (data.rows.length > 0) {
                          // 2 level child
                          for (let i = 0; i < data.rows.length; i++) {
                            var obj2: any = [];
                            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                              obj2 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                              this.arrQuestion.splice(this.arrQuestion.indexOf(obj2[0]), 1);

                              var queryL3 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                              Qr.IsDelete='false' and Qr.ParentQuestionId=${obj2[0].Id} and Qr.QuestionInspectionId=${obj2[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                              await this.databaseService.db.executeSql(queryL3, []).then(async data => {
                                if (data.rows.length > 0) {
                                  // 3 level child
                                  for (let i = 0; i < data.rows.length; i++) {
                                    var obj3: any = [];
                                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                      obj3 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj3[0]), 1);

                                      var queryL4 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                                      Qr.IsDelete='false' and Qr.ParentQuestionId=${obj3[0].Id} and Qr.QuestionInspectionId=${obj3[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                                      await this.databaseService.db.executeSql(queryL4, []).then(async data => {
                                        if (data.rows.length > 0) {
                                          // 4 level child
                                          for (let i = 0; i < data.rows.length; i++) {
                                            var obj4: any = [];
                                            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                              obj4 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                              this.arrQuestion.splice(this.arrQuestion.indexOf(obj4[0]), 1);

                                              var queryL5 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                                              Qr.IsDelete='false' and Qr.ParentQuestionId=${obj4[0].Id} and Qr.QuestionInspectionId=${obj4[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                                              await this.databaseService.db.executeSql(queryL5, []).then(async data => {
                                                if (data.rows.length > 0) {
                                                  // 5 level child
                                                  for (let i = 0; i < data.rows.length; i++) {
                                                    var obj5: any = [];
                                                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                                      obj5 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj5[0]), 1);
                                                    }
                                                  }
                                                }
                                              }).catch(() => { });
                                            }
                                          }
                                        }
                                      }).catch(() => { });
                                    }
                                  }
                                }
                              }).catch(() => { });
                            }
                          }
                        }
                      }).catch(() => { });

                    }
                  }
                }
              }).catch(() => { });

              this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
              if (this.lastRecordId === this.obj.QuestionGuid) {
                this.isLastQuestion = true;
              }
            }
          }
        }
        else {
          this.isLastQuestion = false;
        }
      }).catch(() => { });
    }
    else if (this.obj.IsParent == 'false' && this.lastRecordId === this.obj.QuestionGuid) {
      this.isLastQuestion = true;
    }
    else {
      this.isLastQuestion = false;
    }
  }

  async dropDownSelect(event: any) {

    this.isLastQuestion = false;
    this.selectedValue = event.detail.value;
    const queryOption = `select * from Option where IsDelete='false' and QuestionId=${this.obj.Id} and Option='${this.selectedValue}'`;

    await this.databaseService.db.executeSql(queryOption, []).then(data => {
      if (data.rows.length > 0) {

        this.optionId = data.rows.item(0).Id;
      }
    }).catch(() => { });

    if (this.obj.IsParent == 'true') {
      var query = `select * from QuestionRelation Qr join Option Op on Qr.OptionsId = Op.Id where Qr.QuestionInspectionId = ${this.obj.QuestionInspectionId} and Qr.IsDelete = 'false' and Qr.OptionsId = ${this.optionId}`;
      await this.databaseService.db.executeSql(query, []).then(async data => {

        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            if (data.rows.item(i).Option == this.selectedValue) {
              this.isLastQuestion = false;
            }
            else {
              var queryL1 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
              Qr.IsDelete='false' and Qr.ParentQuestionId=${this.obj.Id} and Qr.QuestionInspectionId=${this.obj.QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
              await this.databaseService.db.executeSql(queryL1, []).then(async data => {
                if (data.rows.length > 0) {
                  // 1 level child
                  for (let i = 0; i < data.rows.length; i++) {
                    var obj1: any = [];
                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                      obj1 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj1[0]), 1);


                      var queryL2 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                      Qr.IsDelete='false' and Qr.ParentQuestionId=${obj1[0].Id} and Qr.QuestionInspectionId=${obj1[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                      await this.databaseService.db.executeSql(queryL2, []).then(async data => {
                        if (data.rows.length > 0) {
                          // 2 level child
                          for (let i = 0; i < data.rows.length; i++) {
                            var obj2: any = [];
                            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                              obj2 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                              this.arrQuestion.splice(this.arrQuestion.indexOf(obj2[0]), 1);

                              var queryL3 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                              Qr.IsDelete='false' and Qr.ParentQuestionId=${obj2[0].Id} and Qr.QuestionInspectionId=${obj2[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                              await this.databaseService.db.executeSql(queryL3, []).then(async data => {
                                if (data.rows.length > 0) {
                                  // 3 level child
                                  for (let i = 0; i < data.rows.length; i++) {
                                    var obj3: any = [];
                                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                      obj3 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj3[0]), 1);

                                      var queryL4 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                                      Qr.IsDelete='false' and Qr.ParentQuestionId=${obj3[0].Id} and Qr.QuestionInspectionId=${obj3[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                                      await this.databaseService.db.executeSql(queryL4, []).then(async data => {
                                        if (data.rows.length > 0) {
                                          // 4 level child
                                          for (let i = 0; i < data.rows.length; i++) {
                                            var obj4: any = [];
                                            if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                              obj4 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                              this.arrQuestion.splice(this.arrQuestion.indexOf(obj4[0]), 1);

                                              var queryL5 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                                              Qr.IsDelete='false' and Qr.ParentQuestionId=${obj4[0].Id} and Qr.QuestionInspectionId=${obj4[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                                              await this.databaseService.db.executeSql(queryL5, []).then(async data => {
                                                if (data.rows.length > 0) {
                                                  // 5 level child
                                                  for (let i = 0; i < data.rows.length; i++) {
                                                    var obj5: any = [];
                                                    if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                                      obj5 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                                      this.arrQuestion.splice(this.arrQuestion.indexOf(obj5[0]), 1);
                                                    }
                                                  }
                                                }
                                              }).catch(() => { });
                                            }
                                          }
                                        }
                                      }).catch(() => { });
                                    }
                                  }
                                }
                              }).catch(() => { });
                            }
                          }
                        }
                      }).catch(() => { });

                    }
                  }
                }
              }).catch(() => { });

              this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
              if (this.lastRecordId === this.obj.QuestionGuid) {
                this.isLastQuestion = true;
              }
            }
          }
        }

        else {
          var queryL1 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
          Qr.IsDelete='false' and Qr.ParentQuestionId=${this.obj.Id} and Qr.QuestionInspectionId=${this.obj.QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
          await this.databaseService.db.executeSql(queryL1, []).then(async data => {
            if (data.rows.length > 0) {
              // 1 level child
              for (let i = 0; i < data.rows.length; i++) {
                var obj1: any = [];
                if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                  obj1 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                  this.arrQuestion.splice(this.arrQuestion.indexOf(obj1[0]), 1);


                  var queryL2 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                  Qr.IsDelete='false' and Qr.ParentQuestionId=${obj1[0].Id} and Qr.QuestionInspectionId=${obj1[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                  await this.databaseService.db.executeSql(queryL2, []).then(async data => {
                    if (data.rows.length > 0) {
                      // 2 level child
                      for (let i = 0; i < data.rows.length; i++) {
                        var obj2: any = [];
                        if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                          obj2 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                          this.arrQuestion.splice(this.arrQuestion.indexOf(obj2[0]), 1);

                          var queryL3 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                          Qr.IsDelete='false' and Qr.ParentQuestionId=${obj2[0].Id} and Qr.QuestionInspectionId=${obj2[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                          await this.databaseService.db.executeSql(queryL3, []).then(async data => {
                            if (data.rows.length > 0) {
                              // 3 level child
                              for (let i = 0; i < data.rows.length; i++) {
                                var obj3: any = [];
                                if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                  obj3 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                  this.arrQuestion.splice(this.arrQuestion.indexOf(obj3[0]), 1);

                                  var queryL4 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                                  Qr.IsDelete='false' and Qr.ParentQuestionId=${obj3[0].Id} and Qr.QuestionInspectionId=${obj3[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                                  await this.databaseService.db.executeSql(queryL4, []).then(async data => {
                                    if (data.rows.length > 0) {
                                      // 4 level child
                                      for (let i = 0; i < data.rows.length; i++) {
                                        var obj4: any = [];
                                        if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                          obj4 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                          this.arrQuestion.splice(this.arrQuestion.indexOf(obj4[0]), 1);

                                          var queryL5 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
                                          Qr.IsDelete='false' and Qr.ParentQuestionId=${obj4[0].Id} and Qr.QuestionInspectionId=${obj4[0].QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                                          await this.databaseService.db.executeSql(queryL5, []).then(async data => {
                                            if (data.rows.length > 0) {
                                              // 5 level child
                                              for (let i = 0; i < data.rows.length; i++) {
                                                var obj5: any = [];
                                                if (this.arrQuestion.some(x => x.QuestionGuid === data.rows.item(i).QuestionGuid)) {
                                                  obj5 = this.arrQuestion.filter(x => x.QuestionGuid == data.rows.item(i).QuestionGuid);
                                                  this.arrQuestion.splice(this.arrQuestion.indexOf(obj5[0]), 1);
                                                }
                                              }
                                            }
                                          }).catch(() => { });
                                        }
                                      }
                                    }
                                  }).catch(() => { });
                                }
                              }
                            }
                          }).catch(() => { });
                        }
                      }
                    }
                  }).catch(() => { });

                }
              }
            }
          }).catch(() => { });
          this.isLastQuestion = false;

          this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
          if (this.lastRecordId === this.obj.QuestionGuid) {
            this.isLastQuestion = true;
          }


        }
      }).catch(() => { });
    }
    else if (this.obj.IsParent == 'false' && this.lastRecordId === this.obj.QuestionGuid) {
      this.isLastQuestion = true;
    }
    else {
      this.isLastQuestion = false;
    }
  }

  checkBoxSelect(ids: number) {
    if (this.arrCheckboxId.length > 0) {
      const index: number = this.arrCheckboxId.indexOf(ids.toString());
      index !== -1 ? this.arrCheckboxId.splice(index, 1) : this.arrCheckboxId.push(ids.toString());
    } else {
      this.arrCheckboxId.push(ids.toString());
    }
  }

  async previous() {
    if (this.arrQuestion != null && this.arrQuestion.length > 0 && this.intQuestionNumber > 0) {
      this.disablePrevButton = true;
      await this.insertUpdateOnPrevious();

      this.intQuestionNumber--;
      this.obj = this.arrQuestion[this.intQuestionNumber];
      let objPrevious = this.arrQuestion[this.intQuestionNumber];
      console.log(objPrevious)
      if (objPrevious.IsParent === 'true' && (objPrevious.SubQuestionTypeId === this.objSubQueType.YesNo
        || objPrevious.SubQuestionTypeId === this.objSubQueType.YesNoNA
        || objPrevious.SubQuestionTypeId === this.objSubQueType.YesNoNAWithComment
        || objPrevious.SubQuestionTypeId === this.objSubQueType.YesNoWithComment
        || objPrevious.SubQuestionTypeId === this.objSubQueType.Dynamic
        || objPrevious.QuestionTypeId === this.objQueType.DropDown)) {
        if (this.isArrRelationFilled === false) {
          const arr: HasData[] = await this.hasData(objPrevious.Id, objPrevious.SubQuestionTypeId, objPrevious.QuestionGuid);
          console.log(arr)
          if (arr[0].strGuid !== '') {
            this.optionId = Number(arr[0].strAnswer);
          }

          if ((objPrevious.SubQuestionTypeId === this.objSubQueType.YesNo
            || objPrevious.SubQuestionTypeId === this.objSubQueType.YesNoNA
            || objPrevious.SubQuestionTypeId === this.objSubQueType.YesNoNAWithComment
            || objPrevious.SubQuestionTypeId === this.objSubQueType.YesNoWithComment) && this.optionId === 2) {
            this.fillSubQuestionData(objPrevious, false);
          } else {

            const isParent = await this.checkOptionIsParent(this.optionId);

            if (isParent) {
              await this.getQuestionRelation(objPrevious.Id, this.intQuestionNumber, objPrevious.QuestionTypeId,
                objPrevious.SubQuestionTypeId, objPrevious.QuestionRelationGuid, objPrevious.QuestionGroupId, objPrevious.QuestionInspectionId);

              this.intQuestionNumber++;
              objPrevious = this.arrQuestion[this.intQuestionNumber];

              this.fillSubQuestionData(objPrevious, true);
            } else {
              this.fillSubQuestionData(objPrevious, false);
            }
          }
        } else {
          this.fillSubQuestionData(objPrevious, false);
        }
      } else {
        this.fillSubQuestionData(objPrevious, false);
      }
      this.isLastQuestion = this.intQuestionNumber === this.arrQuestion.length - 1 ? true : false;
      this.disablePrevButton = false;
    }
    else if (this.arrQuestion != null && this.arrQuestion.length > 0 && this.intQuestionNumber == 0) {
      this.disablePrevButton = false;
      await this.insertUpdateOnPrevious();
      await this.redirectToAddress();
    }
    else {
      this.disablePrevButton = false;
      await this.redirectToAddress();
      // this.router.navigate([`tabs/tab2/joborder/${this.inspectionGuid}`])
    }
  }

  async insertUpdateOnPrevious() {
    const obj = this.arrQuestion[this.intQuestionNumber];
    const arr: HasData[] = await this.hasData(obj.Id, obj.SubQuestionTypeId, obj.QuestionGuid);
    if (arr[0].strGuid !== '') {
      await this.updateChildSubChild(obj, arr[0].strGuid);
      await this.updateTable(obj, arr[0].strGuid);

      if ((obj.QuestionTypeId === this.objQueType.FileUpload || obj.QuestionTypeId === this.objQueType.Signature) && this.arrImage.length > 0) {
        this.arrImage.forEach(async (item, i) => {
          // if (!item.IsSync) {
          const correctPath = item.Filepath.substr(0, item.Filepath.lastIndexOf('/') + 1);
          const query1 = `update QuestionAnswerImage set IsDelete=? where QuestionAnswerImageGuid='${item.QuestionAnswerImageGuid}'`
          // `delete from QuestionAnswerImage where Id='${item.QuestionAnswerImageId}'`;
          await this.databaseService.db.executeSql(query1, [true]).then(() => { }).catch(() => { });
          const query2 = `delete from InspectionImage where QuestionAnswerImageGuid='${item.QuestionAnswerImageGuid}'`;
          await this.databaseService.db.executeSql(query2, []).then(() => { }).catch(() => { });

          item.QuestionAnswerImageGuid = this.guidService.generateGuid();
          await this.insertInspectionImage(item);
          await this.insertImage(item.Name, item.QuestionAnswerImageGuid);

          // }

        });
      }


    } else {
      await this.insertTable(obj);
      await this.updateCompletedTime();
      if ((obj.QuestionTypeId === this.objQueType.FileUpload || obj.QuestionTypeId === this.objQueType.Signature) && this.arrImage.length > 0) {
        this.arrImage.forEach(async item => {
          await this.insertInspectionImage(item);
          await this.insertImage(item.Name, item.QuestionAnswerImageGuid);
        });
      }


    }
    await this.insertBlankChild(obj);
  }

  async redirectToAddress() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        InspectionDetailobj: JSON.stringify(this.inspectionDetailObj)
      },
    }
    await this.router.navigate([`/tabs/tab2/type/${this.inspectionGuid}`], navigationExtras);
  }

  checkOptionIsParent(idNumber: number): Promise<boolean> {
    return new Promise(async resolve => {
      const query = `select IsParent from Option where IsDelete='false' and Id=${idNumber}`;

      await this.databaseService.db.executeSql(query, []).then(data => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            const value: boolean = data.rows.item(i).IsParent === true ? true : false;
            return resolve(value);
          }
        }
      }).catch(() => {
        return resolve(false);
      });
      return resolve(false);
    });
  }

  async fillSubQuestionData(obj: Question, isSubQuestion: boolean) {
    if (obj.SubQuestionTypeId === this.objSubQueType.Dynamic
      || obj.QuestionTypeId === this.objQueType.DropDown
      || obj.QuestionTypeId === this.objQueType.CheckBox) {
      await this.getOption(obj.Id);
    } else if (obj.QuestionTypeId === this.objQueType.Table) {
      this.arrNoOfRows = [];

      for (let index = 0; index < obj.NoOfRows; index++) {
        this.arrNoOfRows.push(index);
      }
      await this.getQuestionTable(obj.Id);
    }

    if (isSubQuestion === false) {
      this.slides.lockSwipes(false);
      this.slides.slidePrev();
      this.slides.lockSwipes(true);
    }
    await this.fillData(obj.Id, obj.QuestionTypeId, obj.SubQuestionTypeId, obj.QuestionGuid);
  }

  async fillData(questionId: number, queTypeId: number, subQueTypeId: number, questionGuid: string) {
    this.arrImage = [];
    this.arrTable = [];

    const query = `select QuestionOptionId, Answer, Selected, QuestionAnswerGuid, Comment from QuestionAnswer where
    IsDelete='false' and QuestionId=${questionId} and QuestionInspectionGuid='${questionGuid}' and InspectionGuid='${this.inspectionGuid}'`;

    await this.databaseService.db.executeSql(query, []).then(async data => {
      if (data.rows.length > 0) {

        for (let i = 0; i < data.rows.length; i++) {

          switch (queTypeId) {
            case this.objQueType.TextBox:
              this.myForm.controls.txtValue.setValue(!!data.rows.item(i).Answer ? data.rows.item(i).Answer.trim() : data.rows.item(i).Answer);
              this.myForm.controls.commentValue.setValue(!!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment);
              break;

            case this.objQueType.Radio:
              switch (subQueTypeId) {
                case this.objSubQueType.YesNo:
                case this.objSubQueType.YesNoWithComment:
                  this.arrRadio.forEach(objItem => {
                    objItem.checked = false;
                    if (objItem.value === data.rows.item(i).Selected) {
                      objItem.checked = true;
                      this.radioValue = objItem.value;
                      this.radioValueInput = String(objItem.value)
                      this.myForm.controls.txtValue.setValue(!!data.rows.item(i).Answer ? data.rows.item(i).Answer.trim() : data.rows.item(i).Answer);
                      this.myForm.controls.commentValue.setValue(!!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment);
                    }
                  });
                  break;

                case this.objSubQueType.YesNoNA:
                case this.objSubQueType.YesNoNAWithComment:
                  this.arrRadioNA.forEach(objItem => {
                    objItem.checked = false;
                    if (objItem.value === data.rows.item(i).Selected) {
                      objItem.checked = true;
                      this.radioValue = objItem.value;
                      this.radioValueInput = String(objItem.value)
                      this.myForm.controls.txtValue.setValue(!!data.rows.item(i).Answer.trim() ? data.rows.item(i).Answer.trim() : data.rows.item(i).Answer.trim());
                      this.myForm.controls.commentValue.setValue(!!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment);
                    }
                  });
                  break;

                case this.objSubQueType.Dynamic:
                  this.arrOption.forEach(objItem => {
                    objItem.Selected = false;
                    if (objItem.Id === data.rows.item(i).QuestionOptionId) {
                      setTimeout(() => {
                        this.zone.run(async () => {
                          objItem.Selected = true;
                          this.optionId = objItem.Id;
                          this.DynamicVal = objItem.Id;
                          this.selectedValue = objItem.Option;
                        })
                      }, 0);
                    }
                  });
                  console.log("hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
                  this.myForm.controls.commentValue.setValue(!!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment);
                  break;
              }
              break;

            case this.objQueType.DropDown:
              this.arrOption.forEach(objItem => {
                if (objItem.Id === data.rows.item(i).QuestionOptionId) {
                  this.optionId = objItem.Id;
                  this.selectedValue = objItem.Option;
                }
              });
              this.myForm.controls.commentValue.setValue(!!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment);
              break;

            case this.objQueType.CheckBox:
              this.arrCheckboxId = [];
              this.arrOption.map(objItem => {
                if (data.rows.item(i).Answer.includes(objItem.Id.toString())) {
                  objItem.IsChecked = true;
                  this.arrCheckboxId.push(objItem.Id.toString());
                }
              });
              this.myForm.controls.commentValue.setValue(!!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment);
              break;

            case this.objQueType.FileUpload:
            case this.objQueType.Signature:
              this.loadStoredImages(data.rows.item(i).QuestionAnswerGuid);
              this.myForm.controls.commentValue.setValue(!!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment);
              break;

            case this.objQueType.Table:
              this.loadTableData(data.rows.item(i).QuestionAnswerGuid);
              this.myForm.controls.commentValue.setValue(!!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment);
              break;
          }
        }
      }
    }).catch(() => { });
  }

  async next() {
    console.log(this.arrQuestion)
    
    this.disableButton = true;
    this.zone.run(async () => {
      const validate: boolean = await this.getValidation();
      if (validate) {
        if (this.intQuestionNumber < this.arrQuestion.length) {
          this.intQuestionNumber++;
          this.obj = this.arrQuestion[this.intQuestionNumber];
          const objNext = this.arrQuestion[this.intQuestionNumber];
          console.log(objNext,"hhhhhhh====")

          if (objNext.SubQuestionTypeId === this.objSubQueType.Dynamic
            || objNext.QuestionTypeId === this.objQueType.DropDown
            || objNext.QuestionTypeId === this.objQueType.CheckBox) {
            await this.getOption(objNext.Id);
          } else if (objNext.QuestionTypeId === this.objQueType.Table) {
            this.arrNoOfRows = [];

            for (let index = 0; index < objNext.NoOfRows; index++) {
              this.arrNoOfRows.push(index);
            }
            await this.getQuestionTable(objNext.Id);
          }
          let timeOut = 0;

          if (objNext.IsDependent === 'true') {
            timeOut = 500;
          }
          setTimeout(async () => {
            this.slides.lockSwipes(false);
            this.slides.slideNext();
            this.slides.lockSwipes(true);

            const arr: HasData[] = await this.hasData(objNext.Id, objNext.SubQuestionTypeId, objNext.QuestionGuid);
            console.log(arr,"hasss dataaaaa 4444")
            if (arr[0].strGuid !== '') {
              await this.fillData(objNext.Id, objNext.QuestionTypeId, objNext.SubQuestionTypeId, objNext.QuestionGuid);
            }
            if(arr[0].strGuid == ''){
              this.radioValueInput = 0;
            }
            this.isLastQuestion = this.intQuestionNumber === this.arrQuestion.length - 1 ? true : false;
            this.disableButton = false;
          }, timeOut);
        }
      }
    })

  }

  getValidation(): Promise<boolean> {

    return new Promise(async resolve => {
      const obj = this.arrQuestion[this.intQuestionNumber];

      if (obj.QuestionTypeId === this.objQueType.TextBox || (obj.SubQuestionTypeId === this.objSubQueType.YesNoWithComment
        || obj.SubQuestionTypeId === this.objSubQueType.YesNoNAWithComment)) {
        this.myForm.controls.txtValue.setValue(!!this.myForm.value.txtValue ? this.myForm.value.txtValue.trim() : this.myForm.value.txtValue);
      }

      if (obj.IsMandatory === 'true' &&
        (((obj.QuestionTypeId === this.objQueType.TextBox || (obj.AnswerSelected &&
          (obj.SubQuestionTypeId === this.objSubQueType.YesNoWithComment
            || obj.SubQuestionTypeId === this.objSubQueType.YesNoNAWithComment))) && this.myForm.value.txtValue.length === 0)
          || (obj.QuestionTypeId === this.objQueType.Radio &&
            (obj.SubQuestionTypeId === this.objSubQueType.Dynamic ? this.selectedValue === '' : this.radioValue === 0))
          || (obj.QuestionTypeId === this.objQueType.DropDown && this.selectedValue === '')
          || (obj.QuestionTypeId === this.objQueType.CheckBox && this.arrCheckboxId.length === 0)
          || (obj.QuestionTypeId === this.objQueType.FileUpload && this.arrImage.length === 0)
          || (obj.QuestionTypeId === this.objQueType.Signature && this.arrImage.length === 0)
          || (obj.QuestionTypeId === this.objQueType.Table && (this.arrTable.length === 0 || this.arrTable.every(x => x === null || x === ''))))) {

        this.toastService.presentToast(this.translateService.instant('InspectionAdd.errorMessage'));
        this.disableButton = false;
        return resolve(false);
      } else {
        const arr: HasData[] = await this.hasData(obj.Id, obj.SubQuestionTypeId, obj.QuestionGuid);
        if (arr[0].strGuid !== '') {
          await this.updateChildSubChild(obj, arr[0].strGuid);
          await this.updateTable(obj, arr[0].strGuid);

          if ((obj.QuestionTypeId === this.objQueType.FileUpload || obj.QuestionTypeId === this.objQueType.Signature) && this.arrImage.length > 0) {
            this.arrImage.forEach(async (item, i) => {
              // if (!item.IsSync) {
              const correctPath = item.Filepath.substr(0, item.Filepath.lastIndexOf('/') + 1);
              const query1 = `update QuestionAnswerImage set IsDelete='true' where QuestionAnswerImageGuid='${item.QuestionAnswerImageGuid}'`
              // `delete from QuestionAnswerImage where Id='${item.QuestionAnswerImageId}'`;
              await this.databaseService.db.executeSql(query1, []).then(() => { }).catch(() => { });
              const query2 = `delete from InspectionImage where QuestionAnswerImageGuid='${item.QuestionAnswerImageGuid}'`;
              await this.databaseService.db.executeSql(query2, []).then(() => { }).catch(() => { });

              item.QuestionAnswerImageGuid = this.guidService.generateGuid();
              await this.insertInspectionImage(item);
              await this.insertImage(item.Name, item.QuestionAnswerImageGuid);

              // }

            });
          }

          if (obj.IsParent === 'true' && (obj.SubQuestionTypeId === this.objSubQueType.YesNo
            || obj.SubQuestionTypeId === this.objSubQueType.YesNoNA || obj.SubQuestionTypeId === this.objSubQueType.YesNoNAWithComment
            || obj.SubQuestionTypeId === this.objSubQueType.YesNoWithComment)
            || (obj.SubQuestionTypeId === this.objSubQueType.Dynamic)
            || (obj.QuestionTypeId === this.objQueType.DropDown)) {
            if ((arr[0].strAnswer !== this.radioValue &&
              (obj.SubQuestionTypeId === this.objSubQueType.YesNo || obj.SubQuestionTypeId === this.objSubQueType.YesNoNA
                || obj.SubQuestionTypeId === this.objSubQueType.YesNoNAWithComment
                || obj.SubQuestionTypeId === this.objSubQueType.YesNoWithComment))
              || (arr[0].strAnswer !== this.optionId && obj.SubQuestionTypeId === this.objSubQueType.Dynamic)
              || (arr[0].strAnswer !== this.optionId && obj.QuestionTypeId === this.objQueType.DropDown)) {
              this.isChangeAnswer = true;
            } else {
              this.isChangeAnswer = false;
            }
            await this.getQuestionRelation(obj.Id, this.intQuestionNumber, obj.QuestionTypeId, obj.SubQuestionTypeId, obj.QuestionRelationGuid, obj.QuestionGroupId, obj.QuestionInspectionId);
          }
        } else {
          await this.insertTable(obj);
          await this.updateCompletedTime();

          if ((obj.QuestionTypeId === this.objQueType.FileUpload || obj.QuestionTypeId === this.objQueType.Signature) && this.arrImage.length > 0) {
            this.arrImage.forEach(async item => {
              await this.insertInspectionImage(item);
              await this.insertImage(item.Name, item.QuestionAnswerImageGuid);
            });
          }

          if (obj.IsParent === 'true' && (obj.SubQuestionTypeId === this.objSubQueType.YesNo
            || obj.SubQuestionTypeId === this.objSubQueType.YesNoNA
            || obj.SubQuestionTypeId === this.objSubQueType.YesNoWithComment
            || obj.SubQuestionTypeId === this.objSubQueType.YesNoNAWithComment
            || obj.SubQuestionTypeId === this.objSubQueType.Dynamic
            || obj.QuestionTypeId === this.objQueType.DropDown)) {

            await this.getQuestionRelation(obj.Id, this.intQuestionNumber, obj.QuestionTypeId, obj.SubQuestionTypeId, obj.QuestionRelationGuid, obj.QuestionGroupId, obj.QuestionInspectionId);
          }
        }

        await this.insertBlankChild(obj);
        this.myForm.reset();
        this.myForm.controls.txtValue.setValue('');
        this.myForm.controls.commentValue.setValue('');
        this.radioValue = 0;

        this.arrRadio.forEach(objItem => {
          objItem.checked = false;
        });

        this.arrRadioNA.forEach(objItem => {
          objItem.checked = false;
        });
        this.optionId = null;
        this.selectedValue = '';
        this.arrCheckboxId = [];
        this.arrImage = [];
        this.questionAnsweImage = [];
        this.arrTable = [];
        this.arrTableAnswerGuid = [];
        this.arrQueTabId = [];
        return resolve(true);
      }
    });
  }



  hasData(questionId: number, subTypeId: number, questionGuid: string): Promise<HasData[]> {
    return new Promise(async resolve => {
      const arrHasData: HasData[] = [];

      const query = `select QuestionAnswerGuid, QuestionOptionId, Selected from QuestionAnswer where
        QuestionId=${questionId} and QuestionInspectionGuid='${questionGuid}' and InspectionGuid='${this.inspectionGuid}' and IsDelete='false'`;

      await this.databaseService.db.executeSql(query, []).then(data => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            arrHasData.push({
              strGuid: data.rows.item(i).QuestionAnswerGuid,
              strAnswer: (subTypeId === this.objSubQueType.YesNo || subTypeId === this.objSubQueType.YesNoNA
                || subTypeId === this.objSubQueType.YesNoNAWithComment || subTypeId === this.objSubQueType.YesNoWithComment)
                ? data.rows.item(i).Selected
                : data.rows.item(i).QuestionOptionId
            });
            return resolve(arrHasData);
          }
        }
      }).catch(() => {
        arrHasData.push({
          strGuid: '',
          strAnswer: 0
        });
        return resolve(arrHasData);
      });
      arrHasData.push({
        strGuid: '',
        strAnswer: 0
      });
      return resolve(arrHasData);
    });
  }

  async getOption(questionId: number) {

    const query = `select * from Option where IsDelete='false' and QuestionId=${questionId}`;

    await this.databaseService.db.executeSql(query, []).then(data => {
      if (data.rows.length > 0) {
        this.arrOption = [];

        for (let i = 0; i < data.rows.length; i++) {
          this.arrOption.push({
            Id: data.rows.item(i).Id,
            QuestionId: data.rows.item(i).QuestionId,
            Option: data.rows.item(i).Option,
            IsDelete: data.rows.item(i).IsDelete,
            OptionsGuid: data.rows.item(i).OptionsGuid,
            Timestamp: data.rows.item(i).Timestamp,
            ImageName: data.rows.item(i).ImageName,
            IsParent: data.rows.item(i).IsParent,
            IsChecked: false,
            Selected: false
          });
        }
      }
    }).catch(() => { });
  }

  async getQuestionTable(questionId: number) {
    const query = `select * from QuestionTable where IsDelete='false' and QuestionId=${questionId}`;

    await this.databaseService.db.executeSql(query, []).then(data => {
      this.arrQuestionTable = [];
      this.arrQueTabId = [];
      this.arrTable = [];
      if (data.rows.length > 0) {


        for (let i = 0; i < data.rows.length; i++) {
          this.arrQuestionTable.push({
            Id: data.rows.item(i).Id,
            QuestionId: data.rows.item(i).QuestionId,
            ColumnName: data.rows.item(i).ColumnName,
            ColumnIndex: data.rows.item(i).ColumnIndex,
            IsDelete: data.rows.item(i).IsDelete,
            QuestionTableGuid: data.rows.item(i).QuestionTableGuid,
            Timestamp: data.rows.item(i).Timestamp,
          });
          this.arrQueTabId.push(data.rows.item(i).Id);
        }
        this.tblWidth = screen.width / this.arrQuestionTable.length;
      }
    }).catch(() => { });
  }

  async insertTable(obj: Question) {
    const query = `insert into QuestionAnswer(InspectionGuid, QuestionId, QuestionOptionId, Answer, Selected, IsDelete,
        QuestionAnswerGuid, Timestamp, Comment, InspectorId,QuestionInspectionGuid) values (?,?,?,?,?,?,?,?,?,?,?)`;

    switch (obj.QuestionTypeId) {
      case this.objQueType.TextBox:
        await this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, null,
        (this.isBlankChild ? " " : (obj.SubQuestionTypeId === this.objSubQueType.DateTime ? this.datepipe.transform(this.myForm.value.txtValue,
          'MMM d, y') : this.myForm.value.txtValue)), null, false, this.guidService.generateGuid(),
        this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
          : this.myForm.value.commentValue, this.empId, obj.QuestionGuid]).then(() => { }).catch((e) => { console.log(e); });
        break;

      case this.objQueType.Radio:
        switch (obj.SubQuestionTypeId) {
          case this.objSubQueType.YesNo:
          case this.objSubQueType.YesNoNA:
            await this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, null, (this.isBlankChild ? " " : null), this.radioValue, false,
            this.guidService.generateGuid(), this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
              : this.myForm.value.commentValue, this.empId, obj.QuestionGuid]).then(() => { }).catch((e) => { console.log(e); });
            break;

          case this.objSubQueType.YesNoWithComment:
          case this.objSubQueType.YesNoNAWithComment:
            await this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, null, (this.isBlankChild ? " " : this.myForm.value.txtValue),
            this.radioValue, false, this.guidService.generateGuid(), this.timestampService.generateLocalTimeStamp(),
              null, this.empId, obj.QuestionGuid]).then(() => { }).catch(() => { });
            break;

          case this.objSubQueType.Dynamic:
            await this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, this.optionId,
            (this.isBlankChild ? " " : null), null, false, this.guidService.generateGuid(), this.timestampService.generateLocalTimeStamp(),
            this.myForm.value.commentValue === '' ? null : this.myForm.value.commentValue, this.empId, obj.QuestionGuid]).then(() => { }).catch((e) => { console.log(e); });
            break;
        }
        break;

      case this.objQueType.DropDown:
        this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, this.optionId,
        (this.isBlankChild ? " " : null), null, false, this.guidService.generateGuid(), this.timestampService.generateLocalTimeStamp(),
        this.myForm.value.commentValue === '' ? null : this.myForm.value.commentValue, this.empId, obj.QuestionGuid]).then(() => { }).catch((e) => { console.log(e); });
        break;

      case this.objQueType.CheckBox:
        await this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, null,
        (this.isBlankChild ? " " : this.arrCheckboxId.slice(0, this.arrCheckboxId.length)), null, false, this.guidService.generateGuid(),
        this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
          : this.myForm.value.commentValue, this.empId, obj.QuestionGuid]).then(() => { }).catch((e) => { console.log(e); });
        break;

      case this.objQueType.FileUpload:
      case this.objQueType.Signature:
        this.imgGuid = this.guidService.generateGuid();
        await this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, null, (this.isBlankChild ? " " : null), null, false, this.imgGuid,
        this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
          : this.myForm.value.commentValue, this.empId, obj.QuestionGuid]).then(() => { }).catch((e) => { console.log(e); });
        break;

      case this.objQueType.Table:
        this.queTableGuid = this.guidService.generateGuid();
        await this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, null, (this.isBlankChild ? " " : null), null, false,
        this.queTableGuid, this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
          : this.myForm.value.commentValue, this.empId, obj.QuestionGuid]).then((s) => { console.log(s) }).catch((e) => { console.log(e) });
        if (this.arrTable != null && this.arrTable.length > 0) {
          for (let k = 0; k < this.arrNoOfRows.length; k++) {
            for (let l = 0; l < this.arrQueTabId.length; l++) {
              await this.insertTableAnswer(this.arrQueTabId[l], k, this.arrTable[(this.arrQueTabId.length * k) + l]);
            }
          }
        }
        break;
    }
  }

  async updateTable(obj: Question, queGuid: string): Promise<any> {
    const query = `update QuestionAnswer set QuestionOptionId=?, Answer=?, Selected=?, Timestamp=?, Comment=?, InspectorId=?
    where QuestionAnswerGuid=? and InspectionGuid='${this.inspectionGuid}'`;
    return new Promise(async resolve => {
      this.databaseService.db.executeSql('select * from QuestionAnswer where inspectionGuid=? and QuestionInspectionGuid=? and QuestionId=?', [this.inspectionGuid, obj.QuestionGuid, obj.Id]).then(async res => {
        let Olddata = res.rows.item(0);
        switch (obj.QuestionTypeId) {
          case this.objQueType.TextBox:
            if (this.myForm.value.txtValue == null) {
              this.myForm.value.txtValue = ' ';
            }
            // if (Olddata.Answer != this.myForm.value.txtValue) {
            await this.databaseService.db.executeSql(query, [null, obj.SubQuestionTypeId === this.objSubQueType.DateTime ? this.datepipe.transform(this.myForm.value.txtValue, 'MMM d, y') : this.myForm.value.txtValue,
              null, this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null :
                this.myForm.value.commentValue, this.empId, queGuid]).then(() => { }).catch(() => { });
            // }
            break;

          case this.objQueType.Radio:
            switch (obj.SubQuestionTypeId) {
              case this.objSubQueType.YesNo:
              case this.objSubQueType.YesNoNA:
                // if (Olddata.Selected != this.radioValue) {
                await this.databaseService.db.executeSql(query, [null, null, this.radioValue == null ? ' ' : this.radioValue,
                  this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
                    : this.myForm.value.commentValue, this.empId, queGuid]).then(() => { }).catch(() => { });
                // }
                break;
              case this.objSubQueType.YesNoWithComment:
              case this.objSubQueType.YesNoNAWithComment:

                if (this.myForm.value.txtValue == null) {
                  this.myForm.value.txtValue = ' ';
                }
                if (Olddata.Selected != this.radioValue || Olddata.Answer != this.myForm.value.txtValue) {
                  await this.databaseService.db.executeSql(query, [null, this.myForm.value.txtValue, this.radioValue == null ? ' ' : this.radioValue,
                    this.timestampService.generateLocalTimeStamp(), null, this.empId, queGuid]).then(() => { }).catch(() => { });
                }
                break;

              case this.objSubQueType.Dynamic:

                if (Olddata.QuestionOptionId != this.optionId || Olddata.Comment != this.myForm.value.commentValue) {
                  await this.databaseService.db.executeSql(query, [this.optionId == null ? ' ' : this.optionId, null, null,
                  this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
                    : this.myForm.value.commentValue, this.empId, queGuid]).then(() => { }).catch(() => { });
                }
                break;
            }
            break;

          case this.objQueType.DropDown:

            if (Olddata.QuestionOptionId != this.optionId || Olddata.Comment != this.myForm.value.commentValue) {
              this.databaseService.db.executeSql(query, [this.optionId == null ? ' ' : this.optionId, null, null, this.timestampService.generateLocalTimeStamp(),
              this.myForm.value.commentValue === '' ? null : this.myForm.value.commentValue, this.empId, queGuid]).then(() => { }).catch(() => { });
            }
            break;

          case this.objQueType.CheckBox:

            // if (Olddata.Answer != this.arrCheckboxId.toString()) {
            await this.databaseService.db.executeSql(query, [null, this.arrCheckboxId == null ? ' ' : this.arrCheckboxId.slice(0, this.arrCheckboxId.length), null,
              this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
                : this.myForm.value.commentValue, this.empId, queGuid]).then(() => { }).catch(() => { });
            // }
            break;

          case this.objQueType.FileUpload:
          case this.objQueType.Signature:
            this.imgGuid = queGuid;
            await this.databaseService.db.executeSql('select * from InspectionImage where IsSync=?', [false]).then(res => {
              if (res.rows.length != 0) {
                this.databaseService.db.executeSql(query, [null, null, null, this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
                  : this.myForm.value.commentValue, this.empId,
                  queGuid]).then(() => { }).catch(() => { });
              }
            })
            break;

          case this.objQueType.Table:
            this.queTableGuid = queGuid;
            ;
            //   if (this.MasterArrTable != this.arrTable.toString()) {
            await this.databaseService.db.executeSql(query, [null, null, null, this.timestampService.generateLocalTimeStamp(), this.myForm.value.commentValue === '' ? null
              : this.myForm.value.commentValue, this.empId,
              queGuid]).then(() => { }).catch(() => { });

            for (let k = 0; k < this.arrNoOfRows.length; k++) {
              for (let l = 0; l < this.arrQueTabId.length; l++) {
                await this.insertUpdateTableAnswer(this.arrQueTabId[l], k, this.arrTable[(this.arrQueTabId.length * k) + l],
                  ((this.arrQueTabId.length * k) + l));
              }
              //   }
            }
            break;
        }
        return resolve(true);
      });
    });




  }

  async insertBlankChild(obj: Question): Promise<any> {
    return new Promise(async resolve => {
      this.isBlankChild = false;

      var checkRel = `select * from QuestionRelation where IsDelete = 'false' and QuestionInspectionId = ${obj.QuestionInspectionId}`;
      await this.databaseService.db.executeSql(checkRel, []).then(async hasChild => {
        if (hasChild.rows.length > 0) {
          switch (obj.QuestionTypeId) {
            case this.objQueType.Radio:
              switch (obj.SubQuestionTypeId) {
                case this.objSubQueType.YesNo:
                case this.objSubQueType.YesNoNA:
                case this.objSubQueType.YesNoWithComment:
                case this.objSubQueType.YesNoNAWithComment:
                  if (this.radioValue == 1) {
                    this.isBlankChild = true;
                  }
                  break;
                case this.objSubQueType.Dynamic:
                  var checkAns = `select * from QuestionRelation where IsDelete = 'false' and QuestionInspectionId = ${obj.QuestionInspectionId}`;
                  await this.databaseService.db.executeSql(checkAns, []).then(async ansObj => {
                    if (ansObj.rows.length > 0 && ansObj.rows.item(0).OptionsId == this.optionId) {
                      this.isBlankChild = true;
                    }
                  });
                  break;
              }
              break;
            case this.objQueType.DropDown:
              var checkAns = `select * from QuestionRelation where IsDelete = 'false' and QuestionInspectionId = ${obj.QuestionInspectionId}`;
              await this.databaseService.db.executeSql(checkAns, []).then(async ansObj => {
                if (ansObj.rows.length > 0 && ansObj.rows.item(0).OptionsId == this.optionId) {
                  this.isBlankChild = true;
                }
              });
              break;
          }
        }
      });

      if (this.isBlankChild) {
        var queryL1 = `select * from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and 
                        Qr.ParentQuestionId=${obj.Id} and Qr.QuestionInspectionId=${obj.QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;

        await this.databaseService.db.executeSql(queryL1, []).then(async data1 => {
          if (data1.rows.length > 0) {
            for (let i = 0; i < data1.rows.length; i++) {
              const cQuery1 = `select * from QuestionAnswer where IsDelete='false' and QuestionInspectionGuid='${data1.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
              await this.databaseService.db.executeSql(cQuery1, []).then(async cData1 => {
                if (cData1.rows.length == 0) {
                  await this.insertBlankChildTable(data1.rows.item(i)); // 1 level child
                }
              }).catch((e) => { console.log(e); });

              var queryL2 = `select * from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and 
                                Qr.ParentQuestionId=${data1.rows.item(i).QuestionsId} and Qr.QuestionInspectionId=${data1.rows.item(i).QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;

              await this.databaseService.db.executeSql(queryL2, []).then(async data2 => {
                if (data2.rows.length > 0) {
                  for (let i = 0; i < data2.rows.length; i++) {
                    const cQuery2 = `select * from QuestionAnswer where QuestionInspectionGuid='${data2.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
                    await this.databaseService.db.executeSql(cQuery2, []).then(async cData2 => {
                      if (cData2.rows.length == 0) {
                        await this.insertBlankChildTable(data2.rows.item(i)); // 2 level child
                      }
                    }).catch((e) => { console.log(e); });

                    var queryL3 = `select * from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and 
                    Qr.ParentQuestionId=${data2.rows.item(i).QuestionsId} and Qr.QuestionInspectionId=${data2.rows.item(i).QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;

                    await this.databaseService.db.executeSql(queryL3, []).then(async data3 => {
                      if (data3.rows.length > 0) {
                        for (let i = 0; i < data3.rows.length; i++) {
                          const cQuery3 = `select * from QuestionAnswer where QuestionInspectionGuid='${data3.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
                          await this.databaseService.db.executeSql(cQuery3, []).then(async cData3 => {
                            if (cData3.rows.length == 0) {
                              await this.insertBlankChildTable(data3.rows.item(i)); // 3 level child
                            }
                          }).catch((e) => { console.log(e); });

                          var queryL4 = `select * from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and 
                          Qr.ParentQuestionId=${data3.rows.item(i).QuestionsId} and Qr.QuestionInspectionId=${data3.rows.item(i).QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;

                          await this.databaseService.db.executeSql(queryL4, []).then(async data4 => {
                            if (data4.rows.length > 0) {
                              for (let i = 0; i < data4.rows.length; i++) {
                                const cQuery4 = `select * from QuestionAnswer where QuestionInspectionGuid='${data4.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
                                await this.databaseService.db.executeSql(cQuery4, []).then(async cData4 => {
                                  if (cData4.rows.length == 0) {
                                    await this.insertBlankChildTable(data4.rows.item(i)); // 4 level child
                                  }
                                }).catch((e) => { console.log(e); });
                              }

                              var queryL5 = `select * from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and 
                          Qr.ParentQuestionId=${data4.rows.item(i).QuestionsId} and Qr.QuestionInspectionId=${data4.rows.item(i).QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;

                              await this.databaseService.db.executeSql(queryL5, []).then(async data5 => {
                                if (data5.rows.length > 0) {
                                  for (let i = 0; i < data5.rows.length; i++) {
                                    const cQuery5 = `select * from QuestionAnswer where QuestionInspectionGuid='${data5.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
                                    await this.databaseService.db.executeSql(cQuery5, []).then(async cData5 => {
                                      if (cData5.rows.length == 0) {
                                        await this.insertBlankChildTable(data5.rows.item(i)); // 5 level child
                                      }
                                    }).catch((e) => { console.log(e); });
                                  }
                                }
                              });
                            }
                          });
                        }
                      }
                    });
                  }
                }
              });

            }
          }
        });
      }
      return resolve(true);
    });
  }

  async insertBlankChildTable(obj: Question) {
    const query = `insert into QuestionAnswer(InspectionGuid, QuestionId, QuestionOptionId, Answer, Selected, IsDelete,
        QuestionAnswerGuid, Timestamp, Comment, InspectorId,QuestionInspectionGuid) values (?,?,?,?,?,?,?,?,?,?,?)`;

    await this.databaseService.db.executeSql(query, [this.inspectionGuid, obj.Id, ' ', ' ', ' ', false,
    this.guidService.generateGuid(), this.timestampService.generateLocalTimeStamp(), ' ', this.empId, obj.QuestionGuid]).then(() => { }).catch(() => { });
  }

  async updateChildSubChild(obj: Question, queGuid: string): Promise<any> {
    var updateChild = false;

    switch (obj.QuestionTypeId) {
      case this.objQueType.Radio:
        switch (obj.SubQuestionTypeId) {
          case this.objSubQueType.YesNo:
          case this.objSubQueType.YesNoNA:
          case this.objSubQueType.YesNoWithComment:
          case this.objSubQueType.YesNoNAWithComment:
            if (this.radioValue == 2 || this.radioValue == 3) {
              updateChild = true;
            }
            break;
          case this.objSubQueType.Dynamic:
            // if (this.isChangeAnswer) {
            //   updateChild = true;
            // }
            // if (this.objRadioDynamicSelect.IsParent === 'false') {
            //   updateChild = true;
            // }

            var checkAns = `select Op.Option from QuestionAnswer QA left join Option Op on QA.QuestionOptionId == Op.Id
            where QA.InspectionGuid ='${this.inspectionGuid}' and QA.IsDelete = 'false' and QA.QuestionInspectionGuid ='${obj.QuestionGuid}'`;

            await this.databaseService.db.executeSql(checkAns, []).then(async ansObj => {

              if (ansObj.rows.length > 0 && ansObj.rows.item(0).Option != this.selectedValue) {
                updateChild = true;
              }
            });
            break;
        }
        break;
      case this.objQueType.DropDown:

        var checkAns = `select Op.Option from QuestionAnswer QA left join Option Op on QA.QuestionOptionId == Op.Id
        where QA.InspectionGuid ='${this.inspectionGuid}' and QA.IsDelete = 'false' and QA.QuestionInspectionGuid ='${obj.QuestionGuid}'`;

        await this.databaseService.db.executeSql(checkAns, []).then(async ansObj => {

          if (ansObj.rows.length > 0 && ansObj.rows.item(0).Option != this.selectedValue) {
            updateChild = true;
          }
        });
        break;
    }

    if (updateChild) {

      var queryL1 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and Qr.ParentQuestionId=${obj.Id} and Qr.QuestionInspectionId=${obj.QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
      return new Promise(async resolve => {
        await this.databaseService.db.executeSql(queryL1, []).then(async data1 => {
          if (data1.rows.length > 0) {

            for (let i = 0; i < data1.rows.length; i++) {
              const query11 = `update QuestionAnswer set IsDelete="true" where QuestionInspectionGuid='${data1.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
              await this.databaseService.db.executeSql(query11, []).then(() => { }).catch(() => { });

              const queryAnsImg1 = `update QuestionAnswerImage set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data1.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
              await this.databaseService.db.executeSql(queryAnsImg1, []).then(() => { }).catch(() => { });

              const queryAnsTable1 = `update QuestionTableAnswer set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data1.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
              await this.databaseService.db.executeSql(queryAnsTable1, []).then(() => { }).catch(() => { });

              var queryL2 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and Qr.ParentQuestionId=${data1.rows.item(i).Id} and Qr.QuestionInspectionId=${data1.rows.item(i).QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
              await this.databaseService.db.executeSql(queryL2, []).then(async data2 => {
                if (data2.rows.length > 0) {
                  for (let i = 0; i < data2.rows.length; i++) {
                    const query21 = `update QuestionAnswer set IsDelete="true" where QuestionInspectionGuid='${data2.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
                    await this.databaseService.db.executeSql(query21, []).then(() => { }).catch(() => { });

                    const queryAnsImg2 = `update QuestionAnswerImage set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data2.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
                    await this.databaseService.db.executeSql(queryAnsImg2, []).then(() => { }).catch(() => { });

                    const queryAnsTable2 = `update QuestionTableAnswer set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data2.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
                    await this.databaseService.db.executeSql(queryAnsTable2, []).then(() => { }).catch(() => { });

                    var queryL3 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and Qr.ParentQuestionId=${data2.rows.item(i).Id} and Qr.QuestionInspectionId=${data2.rows.item(i).QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;

                    await this.databaseService.db.executeSql(queryL3, []).then(async data3 => {
                      if (data3.rows.length > 0) {
                        for (let i = 0; i < data3.rows.length; i++) {
                          const query31 = `update QuestionAnswer set IsDelete="true" where QuestionInspectionGuid='${data3.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
                          await this.databaseService.db.executeSql(query31, []).then(() => { }).catch(() => { });

                          const queryAnsImg3 = `update QuestionAnswerImage set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data3.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
                          await this.databaseService.db.executeSql(queryAnsImg3, []).then(() => { }).catch(() => { });

                          const queryAnsTable3 = `update QuestionTableAnswer set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data3.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
                          await this.databaseService.db.executeSql(queryAnsTable3, []).then(() => { }).catch(() => { });

                          var queryL4 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and Qr.ParentQuestionId=${data3.rows.item(i).Id} and Qr.QuestionInspectionId=${data3.rows.item(i).QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;
                          await this.databaseService.db.executeSql(queryL4, []).then(async data4 => {
                            if (data4.rows.length > 0) {
                              for (let i = 0; i < data4.rows.length; i++) {
                                const query41 = `update QuestionAnswer set IsDelete="true" where QuestionInspectionGuid='${data4.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
                                await this.databaseService.db.executeSql(query41, []).then(() => { }).catch(() => { });

                                const queryAnsImg4 = `update QuestionAnswerImage set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data4.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
                                await this.databaseService.db.executeSql(queryAnsImg4, []).then(() => { }).catch(() => { });

                                const queryAnsTable4 = `update QuestionTableAnswer set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data4.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
                                await this.databaseService.db.executeSql(queryAnsTable4, []).then(() => { }).catch(() => { });

                                var queryL5 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where Qr.IsDelete='false' and Qr.ParentQuestionId=${data4.rows.item(i).Id} and Qr.QuestionInspectionId=${data4.rows.item(i).QuestionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} order by Que.[Index]`;


                                await this.databaseService.db.executeSql(queryL5, []).then(async data5 => {
                                  if (data5.rows.length > 0) {
                                    for (let i = 0; i < data5.rows.length; i++) {
                                      const query51 = `update QuestionAnswer set IsDelete="true" where QuestionInspectionGuid='${data5.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}'`;
                                      await this.databaseService.db.executeSql(query51, []).then(() => { }).catch(() => { });

                                      const queryAnsImg5 = `update QuestionAnswerImage set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data5.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
                                      await this.databaseService.db.executeSql(queryAnsImg5, []).then(() => { }).catch(() => { });

                                      const queryAnsTable5 = `update QuestionTableAnswer set IsDelete="true" where QuestionAnswerGuid in (select QuestionAnswerGuid from QuestionAnswer where QuestionInspectionGuid='${data5.rows.item(i).QuestionGuid}' and InspectionGuid='${this.inspectionGuid}')`;
                                      await this.databaseService.db.executeSql(queryAnsTable5, []).then(() => { }).catch(() => { });
                                    }
                                  }
                                });
                              }
                            }
                          });
                        }
                      }
                    });
                  }
                }
              });
            }
          }
          return resolve(true);
        });
      });
    }
  }

  async getQuestionRelation(questionId: number, index: number, queTypeId: number, subQueTypeId: number, questionRelationGuid: string, questionGroupId: number, questionInspectionId: number) {

    let questionGroupIdValue = questionGroupId == null ? `and Que.QuestionGroupId is null` : `and Que.QuestionGroupId = ${questionGroupId} `;
    const query1 = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
      Qr.IsDelete='false' and Qr.ParentQuestionId=${questionId} and Qr.QuestionInspectionId=${questionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} ${questionGroupIdValue}  order by Que.[Index]`;

    await this.databaseService.db.executeSql(query1, []).then(async data1 => {

      if (data1.rows.length > 0) {

        for (let j = 0; j < data1.rows.length; j++) {
          if ((this.arrQuestion.some(x => x.QuestionGuid === data1.rows.item(j).QuestionGuid))) {
            if (data1.rows.item(j).IsParent === 'false') {
              const indexOfRecord = this.arrQuestion.indexOf(this.arrQuestion[index]);
              if (this.isChangeAnswer) {
                const obj = this.arrQuestion[indexOfRecord + 1];
                const querySelect = `select QuestionAnswerGuid from QuestionAnswer where QuestionId=${obj.Id} and QuestionInspectionGuid='${obj.QuestionGuid}' and InspectionGuid='${this.inspectionGuid}' and isDelete ='false'`;
                await this.databaseService.db.executeSql(querySelect, []).then(async dataSelect => {
                  if (dataSelect.rows.length > 0) {
                    for (let k = 0; k < dataSelect.rows.length; k++) {
                      const guid = dataSelect.rows.item(k).QuestionAnswerGuid;
                      const arrDelete = [];

                      // arrDelete.push([`delete from QuestionTableAnswer where QuestionAnswerGuid='${guid}'`, []]);
                      // arrDelete.push([`delete from QuestionAnswerImage where QuestionAnswerGuid='${guid}'`, []]);
                      // arrDelete.push([`delete from InspectionImage where QuestionAnswerGuid='${guid}'`, []]);
                      // arrDelete.push([`delete from QuestionAnswer where QuestionId=${obj.Id}`, []]);

                      await this.databaseService.db.sqlBatch(arrDelete).then(() => {

                        this.arrQuestion.splice(indexOfRecord + 1, 1);
                        this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
                      }).catch(() => {

                      });
                    }
                  } else {

                    this.arrQuestion.splice(indexOfRecord + 1, 1);
                    this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
                  }
                }).catch(() => {

                });
              }
            }
          }
        }
        const idOption = (this.objQueType.DropDown === queTypeId || this.objSubQueType.Dynamic === subQueTypeId) ?
          this.optionId : null;
        const query = `select Que.* from QuestionRelation as Qr join Question as Que on Qr.QuestionsId==Que.Id and Que.QuestionRelationGuid == QR.QuestionRelationGuid where
        Qr.IsDelete='false' and Qr.ParentQuestionId=${questionId} and Qr.QuestionInspectionId=${questionInspectionId} and Que.InspectionTypeId=${this.globalService.inspectionType} and Qr.OptionsId is ${idOption} order by Que.[Index] desc`;

        await this.databaseService.db.executeSql(query, []).then(async data => {
          if (data.rows.length > 0) {

            for (let i = 0; i < data.rows.length; i++) {
              if (((subQueTypeId === this.objSubQueType.YesNo || subQueTypeId === this.objSubQueType.YesNoNA
                || subQueTypeId === this.objSubQueType.YesNoNAWithComment || subQueTypeId === this.objSubQueType.YesNoWithComment)
                && this.radioValue === 1)
                || (this.objQueType.DropDown === queTypeId || this.objSubQueType.Dynamic === subQueTypeId)) {

                if (!(this.arrQuestion.some(x => x.QuestionRelationGuid === data.rows.item(i).QuestionRelationGuid))) {

                  this.isArrRelationFilled = true;
                  this.arrQuestion.splice(index + 1, 0, data.rows.item(i));
                }
              }
              else {
                this.isArrRelationFilled = false;

              }
            }

            this.lastRecordId = this.arrQuestion[this.arrQuestion.length - 1].QuestionGuid;
          } else {
            this.isArrRelationFilled = false;
          }
        }).catch(() => { });
      }
    }).catch(() => { });
  }

  async loadStoredImages(answerGuid: string) {
    const query = `select Ii.*,Qai.Id as QuestionAnswerImageId, Qai.QuestionAnswerImageGuid from InspectionImage as Ii join QuestionAnswerImage as Qai on Ii.Name == Qai.ImageName
    join QuestionAnswer as Qa on Qai.QuestionAnswerGuid == Qa.QuestionAnswerGuid where Qa.InspectionGuid=? and
    Qa.QuestionAnswerGuid=? and Qai.IsDelete='false' order by Qai.Timestamp`;

    await this.databaseService.db.executeSql(query, [this.inspectionGuid, answerGuid]).then(data => {
      if (data.rows.length > 0) {
        this.arrImage = [];
        this.questionAnsweImage = [];
        for (let i = 0; i < data.rows.length; i++) {
          this.arrImage.push({

            Id: data.rows.item(i).Id,
            Name: data.rows.item(i).Name,
            Path: data.rows.item(i).Path,
            Filepath: data.rows.item(i).Filepath,
            Timestamp: data.rows.item(i).Timestamp,
            InspectionGuid: data.rows.item(i).InspectionGuid,
            QuestionAnswerGuid: data.rows.item(i).QuestionAnswerGuid,
            IsSync: Boolean(JSON.parse(data.rows.item(i).IsSync)), //data.rows.item(i).IsSync    
            QuestionAnswerImageId: data.rows.item(i).QuestionAnswerImageId,
            QuestionAnswerImageGuid: data.rows.item(i).QuestionAnswerImageGuid
          });
          //this.questionAnsweImage.push({QuestionAnswerImageId: data.rows.item(i).QuestionAnswerImageId});
        }
      }
    }).catch(() => { });
  }

  pathForImage(img: string) {
    if (img === null) {
      return '';
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
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
      quality: 60,
      sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };

    this.camera.getPicture(options).then(imagePath => {
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

        let res = this.copyFileToLocalDir(filePath, imageName, this.createFileName());
        if (!res) {
          this.toastService.presentToast(this.uploadImgMsg);
        }
      // }, error => {
      //   this.loaderService.dismiss();
      //   alert('Error in showing image' + error);

      // });


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
      this.loaderService.present();
      let newPath = imagePath.split('?')[0]
      var copyPath = newPath;
      var splitPath = copyPath.split('/');
      var imageName = splitPath[splitPath.length - 1];
      var filePath = newPath.split(imageName)[0];


      //this.file.readAsDataURL(filePath, imageName).then(async base64 => {
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

        let res = await this.copyFileToLocalDir(filePath, imageName, this.createFileName());
        if (!res) {
          this.toastService.presentToast(this.uploadImgMsg);
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
                  this.takeCameraPicture();
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

  createFileName(): string {
    const d = new Date();
    const n = d.getTime();
    const newFileName = n + '.jpg';
    return newFileName;
  }

  copyFileToLocalDir(namePath: string, currentName: string, newFileName: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFileName).then(async () => {
        await this.updateStoredImages(newFileName);
        resolve(true);
      }, err => {
        this.uploadImgMsg = JSON.stringify(err);
        resolve(false);
      });
    });
  }

  async updateStoredImages(name: string) {
    const filePath = this.file.dataDirectory + name;
    const resPath = this.pathForImage(filePath);

    const newEntry: InspectionImage = {
      Id: 1,
      Name: name,
      Path: resPath,
      Filepath: filePath,
      Timestamp: '',
      InspectionGuid: this.inspectionGuid,
      QuestionAnswerGuid: this.imgGuid,
      IsSync: false,
      QuestionAnswerImageId: 1,
      QuestionAnswerImageGuid: this.guidService.generateGuid()
    };
    this.arrImage = [newEntry, ...this.arrImage];
    this.ref.detectChanges();
  }

  async insertInspectionImage(obj: InspectionImage) {
    const query = `insert into InspectionImage(Name, Path, Filepath, Timestamp, InspectionGuid, QuestionAnswerGuid, IsSync,QuestionAnswerImageGuid)
      values (?,?,?,?,?,?,?,?)`;

    await this.databaseService.db.executeSql(query, [obj.Name, obj.Path, obj.Filepath,
    this.timestampService.generateLocalTimeStamp(), this.inspectionGuid, this.imgGuid, false, obj.QuestionAnswerImageGuid]).then(() => { }).catch(() => { });
  }

  async insertImage(imgName: string, queAnsImgGuid: string) {
    const query = `insert into QuestionAnswerImage(ImageName, OriginalImageName, QuestionAnswerGuid, IsDelete,
      QuestionAnswerImageGuid, Timestamp, InspectionGuid, IsSync) values (?,?,?,?,?,?,?,?)`;

    await this.databaseService.db.executeSql(query, [imgName, imgName, this.imgGuid, false, queAnsImgGuid,
      this.timestampService.generateLocalTimeStamp(), this.inspectionGuid, false]).then(() => { }).catch(() => { });
  }

  deleteImage(imgEntry: InspectionImage, position: number) {
    this.zone.run(() => {
      setTimeout(() => {
        this.arrImage.splice(position, 1);
        this.questionAnsweImage.splice(position, 1);
        const correctPath = imgEntry.Filepath.substr(0, imgEntry.Filepath.lastIndexOf('/') + 1);

        this.file.removeFile(correctPath, imgEntry.Name).then(async () => {
          const query1 = `update QuestionAnswerImage set IsDelete=?, Timestamp=? where ImageName='${imgEntry.Name}'`;
          await this.databaseService.db.executeSql(query1, [true, this.timestampService.generateLocalTimeStamp()]).then(() => { }).catch(() => { });

          const query2 = `delete from InspectionImage where Name='${imgEntry.Name}'`;
          await this.databaseService.db.executeSql(query2, []).then(() => { }).catch(() => { });
        });
      }, 0);
    })
  }
  async editName(obj, index) {

    const modal = await this.modalController.create({
      component: EditImgNameComponent,
      cssClass: 'editImage-modal',
      backdropDismiss: false,
      componentProps: {
        data: JSON.stringify(obj),
        jobid: this.jobid,
        arrimg: this.arrImage
      }
    });
    modal.onWillDismiss().then(async res => {
      if (res.data) {
        res.data.Name = this.jobid + '_' + res.data.Name + '_' + (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace(/[^0-9]/g, ""));
        if (!res.data.Name.endsWith('.jpg')) {
          res.data.Name = res.data.Name + '.jpg';
        }
        let filepath = res.data.Filepath.substring(0, res.data.Filepath.lastIndexOf('/') + 1);
        let path = res.data.Path.substring(0, res.data.Path.lastIndexOf('/') + 1);
        this.file.copyFile(filepath, obj.Name, this.file.dataDirectory, res.data.Name).then(async (data) => {
          res.data.Filepath = filepath + res.data.Name;
          res.data.Path = path + res.data.Name;
          this.arrImage[index] = res.data;
          //await this.updateQuestionAnswerImage(res.data);
          this.ref.detectChanges()
        })
      }
    })
    await modal.present();

  }
  async loadTableData(answerGuid: string) {
    const query = `select Qta.* from QuestionTableAnswer as Qta join QuestionAnswer as Qa on
      Qta.QuestionAnswerGuid == Qa.QuestionAnswerGuid where Qa.InspectionGuid=? and Qa.QuestionAnswerGuid=? and
      Qta.IsDelete='false' order by [Index]`;

    await this.databaseService.db.executeSql(query, [this.inspectionGuid, answerGuid]).then(data => {
      if (data.rows.length > 0) {
        this.arrTable = [];
        this.arrTableAnswerGuid = [];

        for (let i = 0; i < data.rows.length; i++) {
          this.arrTable.push(data.rows.item(i).Answer);
          this.arrTableAnswerGuid.push(data.rows.item(i).QuestionTableAnswerGuid);
        }
        this.MasterArrTable = this.arrTable.toString();
      }
    }).catch(() => { });
  }

  async insertTableAnswer(queId: number, queIndex: number, answer: string) {
    const query = `insert into QuestionTableAnswer(QuestionTableId, [Index], IsDelete, QuestionTableAnswerGuid,
      Timestamp, QuestionAnswerGuid, Answer, InspectionGuid) values (?,?,?,?,?,?,?,?)`;

    await this.databaseService.db.executeSql(query, [queId, queIndex, false, this.guidService.generateGuid(),
      this.timestampService.generateLocalTimeStamp(), this.queTableGuid, answer, this.inspectionGuid]).then(() => { }).catch(() => { });
  }

  async insertUpdateTableAnswer(queId: number, queIndex: number, answer: string, indexGuid: number) {
    const guid = this.arrTableAnswerGuid[indexGuid];
    if (!!guid) {
      const query = `update QuestionTableAnswer set QuestionTableId=?, [Index]=?, Timestamp=?, Answer=? where
      QuestionTableAnswerGuid=?`;

      await this.databaseService.db.executeSql(query, [queId, queIndex, this.timestampService.generateLocalTimeStamp(), answer,
        guid]).then(() => { }).catch((e) => { console.log(e); });
    }
    else {
      const query = `insert into QuestionTableAnswer(QuestionTableId, [Index], IsDelete, QuestionTableAnswerGuid,
        Timestamp, QuestionAnswerGuid, Answer, InspectionGuid) values (?,?,?,?,?,?,?,?)`;

      await this.databaseService.db.executeSql(query, [queId, queIndex, false, this.guidService.generateGuid(),
        this.timestampService.generateLocalTimeStamp(), this.queTableGuid, answer, this.inspectionGuid]).then(() => { }).catch((e) => { console.log(e); });
    }
  }

  async submit() {
    this.loaderService.present();
    if (this.arrQuestion != null && this.arrQuestion.length > 0) {
      const validate: boolean = await this.getValidation();
      if (validate) {
        const query = `update Inspection set CompletedTime=? where InspectionGuid=?`;
        await this.databaseService.db.executeSql(query, [this.timestampService.generateLocalTimeStamp(), this.inspectionGuid]).then(async () => {
          this.clearFields();
        }).catch(() => { });
      } else {
        this.loaderService.dismiss();
      }
    }
    else { this.clearFields(); }
  }

  async updateCompletedTime() {
    const query = `update Inspection set CompletedTime=? where InspectionGuid=?`;
    await this.databaseService.db.executeSql(query, [this.timestampService.generateLocalTimeStamp(), this.inspectionGuid]).then(() => { });
  }

  clearFields() {
    // this.inspectionGuid = '';
    this.myForm.reset();
    this.myForm.controls.txtValue.setValue('');
    this.myForm.controls.commentValue.setValue('');
    this.radioValue = 0;
    this.optionId = null;
    this.selectedValue = '';
    this.arrCheckboxId = [];
    this.arrImage = [];
    this.questionAnsweImage = [];
    this.arrTable = [];
    this.arrTableAnswerGuid = [];
    this.arrQueTabId = [];

    localStorage.setItem('jobNumber', '');
    this.loaderService.dismiss();

    if (this.platform.is('android')) {
      Keyboard.show();
    }
    this.router.navigate(['/tabs/tab2']);
  }
  async sign() {
    const modal = await this.modalController.create({
      component: SignatureComponent,
      // cssClass: 'my-custom-class'
    });
    modal.onDidDismiss().then(async res => {

      if (res !== null) {
        if (res.data != undefined) {
          if (this.arrImage.length == 1) {

            await this.databaseService.db.executeSql(`update QuestionAnswer set QuestionOptionId=?, Answer=?, Selected=?, Timestamp=?, Comment=?, InspectorId=?
          where QuestionAnswerGuid='${this.arrImage[0].QuestionAnswerGuid}'`, [null, null, null, null, null, null]).then(async (data) => {
              let imgEntry = this.arrImage[0];
              this.arrImage.splice(0, 1);
              const correctPath = imgEntry.Filepath.substr(0, imgEntry.Filepath.lastIndexOf('/') + 1);

              this.file.removeFile(correctPath, imgEntry.Name).then(async () => {
                // const query1 = `delete from QuestionAnswerImage where ImageName='${imgEntry.Name}'`;
                const query1 = `update QuestionAnswerImage set IsDelete=?, Timestamp=? where ImageName='${imgEntry.Name}'`;
                await this.databaseService.db.executeSql(query1, [true, this.timestampService.generateLocalTimeStamp()]).then(() => {

                }).catch(() => { });

                const query2 = `delete from InspectionImage where Name='${imgEntry.Name}'`;
                await this.databaseService.db.executeSql(query2, []).then(() => {

                }).catch(() => { });
                // const query = `insert into InspectionImage(Name, Path, Filepath, Timestamp, InspectionGuid, QuestionAnswerGuid, IsSync)
                //   values (?,?,?,?,?,?,?)`;

                // await this.databaseService.db.executeSql(query, [res.data.name, null, null,
                //   null, null, null, false]).then(() => { }).catch(() => { });
                this.updateStoredImages(res.data.name);
              });
            })
          } else {
            this.updateStoredImages(res.data.name);
          }
        }
      }
    })
    return await modal.present();
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
      quality: 100,
      saveToPhotoAlbum: false,
      correctOrientation: true,
      sourceType: this.camera.PictureSourceType.CAMERA
    };

    this.camera.getPicture(options).then(imagePath => {
      this.loaderService.present();
      let newPath = imagePath.split('?')[0]
      var copyPath = newPath;
      var splitPath = copyPath.split('/');
      var imageName = splitPath[splitPath.length - 1];
      var filePath = newPath.split(imageName)[0];

      this.file.readAsDataURL(filePath, imageName).then(async base64 => {
        this.loaderService.dismiss();
        let imageSize = this.calculateImageSize(base64);
        if (imageSize > 1024) {
          let resizeOptions = {
            uri: imagePath,
            folderName: this.file.dataDirectory,
            quality: 70,
            height: 1000,
            width: 1500,
            fileName: imageName
          };
          let newPath = await this.resizeImage(resizeOptions);
          var splitPath = newPath.split('/');
          imageName = splitPath[splitPath.length - 1];
          filePath = newPath.split(imageName)[0];
        }

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
      }, error => {
        alert('Error in showing image' + error);
      });
    });
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
          InspectionGuid: this.inspectionGuid,
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

  showInsQueImages() {
    var currQuestionGuid = this.obj != null ? this.obj.QuestionGuid : '';
    this.globalService.inspectionQuestionNum = this.intQuestionNumber;
    this.router.navigate([`/tabs/tab2/inspectionQuestionImageList/${this.inspectionGuid}/${currQuestionGuid}`]);
  }
  async showInspActions(event: any) {
    let popOverEvent = await this.popOverCnt.create({
      component: InspectionActionListComponent,
      event: event,
      componentProps: { inspectionObj: this.inspectionDetailObj, show_Cam_Img: true, intQuestionNumber: this.intQuestionNumber, obj: this.obj },
      cssClass: 'inspActionDiv'
    });
    return await popOverEvent.present();
  }
}
