import { Component } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Inspection } from 'src/app/models/db-models/inspection-model';
import { DatabaseService } from 'src/app/core/database.service';
import { InspectionDetail, Group } from 'src/app/models/inspection-detail-model';
import { QuestionTypeEnums, SubQuestionTypeEnums } from 'src/app/models/db-models/question-type-model';
import { TranslateService } from '@ngx-translate/core';
import { InspectionImage } from 'src/app/models/db-models/image-model';
import { GlobalService } from 'src/app/core/auth/global.service';
import { Location } from '@angular/common';
import { ArchiveEnum } from "src/app/models/all-data-model";

@Component({
  selector: 'app-inspection-detail',
  templateUrl: './inspection-detail.component.html',
  styleUrls: ['./inspection-detail.component.scss'],
})
export class InspectionDetailComponent {
  public isCreateJobCheckin: boolean = false;
  public archiveEnum = ArchiveEnum;
  public action: any = "";
  public arrInspecionType: any = [];
  arrInspectionDetail: InspectionDetail[] = [];
  arrGroups: Group[] = [];
  obj: Inspection;
  arrColCount: string[] = [];
  arrRowCount: number[] = [];
  answerGuid = '';
  isLoading = true;

  constructor(private route: ActivatedRoute, private databaseService: DatabaseService, private location: Location,
    private translateService: TranslateService, private router: Router, public globalService: GlobalService) {
    const objRoute = this.route.snapshot.params.obj;
    this.obj = JSON.parse(objRoute);
    if (!!this.obj) {
      this.obj.Address = decodeURIComponent(this.obj.Address);
    }
    this.getInspectionTypes();
    this.globalService.inspectionType = this.obj.InspectionTypeId;
    this.globalService.CurrentVersion = this.obj.CurrentVersion;

    this.route.queryParams.subscribe(params => {
      if (params.action) {
        this.action = params.action;
      }
    })

  }


  async ionViewDidEnter() {
    this.globalService.arrayEditGroup = [];
    this.isLoading = true;
    this.globalService.selectedQuestionGroupId = '';
    this.isCreateJobCheckin = !!localStorage.getItem('isCreateJobCheckin') && localStorage.getItem('isCreateJobCheckin') == 'true' ? true : false;

    setTimeout(async () => {
      if (this.action == this.archiveEnum.ArchiveInspection) {
        this.getArchiveInspectionData();
      }
      else {
        await this.getInspectionData();
      }

    }, 1000);
  }

  async getArchiveInspectionData() {
    const query = `select ArchiveString from ArchiveInspection where InspectionGuid='${this.obj.InspectionGuid}'`;
    await this.databaseService.db.executeSql(query, []).then(async data => {
      let jsonString;
      if (data.rows.length > 0) {
        jsonString = JSON.parse(data.rows.item(0).ArchiveString);
        this.arrInspectionDetail = jsonString.arrInspectionDetail;
        this.arrGroups = jsonString.arrGroups;
        this.isLoading = false;
      }
    }).catch((err) => {
      this.isLoading = false;
    });
  }



  goBack() {
    var isDownloadInspection = localStorage.getItem('isDownloadInspection');
    if (isDownloadInspection == 'true') {
      this.location.back();
    }
    else if (this.action == this.archiveEnum.ArchiveInspection) {
      this.router.navigate([`/tabs/tab2/archiveinspection`]);
    }
    else {
      this.router.navigate(["/tabs/tab2"]);
    }
  }

  async getInspectionData() {
    // const query = `select Qa.Answer, Qa.Comment, Qa.Selected, Qa.QuestionOptionId, Qa.QuestionAnswerGuid, Q.Question,
    // Q.QuestionTypeId, Q.SubQuestionTypeId, Q.NoOfRows, Qg.QuestionGroupName, Q.QuestionGroupId, Q.QuestionGuid, Q.IsMandatory
    // from Question as Q left join QuestionAnswer as Qa on Qa.QuestionId=Q.Id  and QA.QuestionInspectionGuid = Q.QuestionGuid and Qa.InspectionGuid='${this.obj.InspectionGuid}'
    // left join QuestionGroup as Qg on Qg.Id=Q.QuestionGroupId where Q.InspectionTypeId=${this.obj.InspectionTypeId} and (Qa.IsDelete = 'false' or Qa.IsDelete is null) and
    // Q.IsDelete='false' and ((Qa.Answer !='' and Q.IsDependent = 'true') or (Qa.Selected !='' and Q.IsDependent = 'true') or
    // (Qa.QuestionOptionId !='' and Q.IsDependent = 'true') or Q.IsDependent = 'false') order by Q.[Index]`;


    const query = `select distinct Qa.QuestionAnswerGuid, Qa.Answer, Qa.Comment, Qa.Selected, Qa.QuestionOptionId,  Q.Question,
      Q.QuestionTypeId, Q.SubQuestionTypeId, Q.NoOfRows, Qg.QuestionGroupName, Q.QuestionGroupId, Q.QuestionGuid, Q.IsMandatory
      from Question as Q 
	    left join QuestionAnswer as Qa on Qa.QuestionId=Q.Id  and QA.QuestionInspectionGuid = Q.QuestionGuid and Qa.InspectionGuid='${this.obj.InspectionGuid}'
      left join QuestionGroup as Qg on Qg.Id=Q.QuestionGroupId 
	    left join QuestionAnswerImage Qi on Qa.QuestionAnswerGuid = Qi.QuestionAnswerGuid and Qi.IsDelete = 'false'
	    left join QuestionTableAnswer Qt on Qa.QuestionAnswerGuid = Qt.QuestionAnswerGuid and Qt.IsDelete ='false'
	    where Q.InspectionTypeId=${this.obj.InspectionTypeId} and (Qa.IsDelete = 'false' or Qa.IsDelete is null) and
      Q.IsDelete='false' and 
	    ((Qa.Answer is not null and Q.IsDependent = 'true') or (Qa.Selected is not null and Q.IsDependent = 'true') or (Qa.QuestionOptionId is not null and Q.IsDependent = 'true') or 
	    (Qi.ImageName != '' and Q.IsDependent ='true') or (Qt.QuestionTableId > 0 and Q.IsDependent ='true') or Q.IsDependent = 'false') order by Q.[Index]`;

    await this.databaseService.db.executeSql(query, []).then(async data => {
      if (data.rows.length > 0) {
        this.arrInspectionDetail = [];
        this.arrGroups = [];

        for (let i = 0; i < data.rows.length; i++) {
          if (!(this.arrGroups.some(x => x.groupName === (data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName)))) {
            this.arrGroups.push({
              id: data.rows.item(i).QuestionGroupId,
              groupName: data.rows.item(i).QuestionGroupName === null ? 'Ungrouped' : data.rows.item(i).QuestionGroupName
            });

          }

          data.rows.item(i).Answer = !!data.rows.item(i).Answer ? data.rows.item(i).Answer.trim() : data.rows.item(i).Answer;
          data.rows.item(i).Comment = !!data.rows.item(i).Comment ? data.rows.item(i).Comment.trim() : data.rows.item(i).Comment;

          switch (data.rows.item(i).QuestionTypeId) {
            case QuestionTypeEnums.TextBox:
              this.answerGuid = '';
              this.arrInspectionDetail.push({
                Answer: `${!data.rows.item(i).Answer ? '' : data.rows.item(i).Answer}${!data.rows.item(i).Comment ? '' : ', ' + data.rows.item(i).Comment}`,
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
                        Answer: !!data.rows.item(i).Selected ? `${this.translateService.instant(data.rows.item(i).Selected.toString())}${!data.rows.item(i).Answer ? '' : ', ' + data.rows.item(i).Answer}${!data.rows.item(i).Comment ? '' : ', ' + data.rows.item(i).Comment}` : '',
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
                      Answer: `${dataDropDown.rows.item(d).Option === null ? '' : dataDropDown.rows.item(d).Option}${!data.rows.item(i).Comment ? '' : ', ' + data.rows.item(i).Comment}`,
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
                      Answer: `${dataCheckBox.rows.item(c).opt === null ? '' : dataCheckBox.rows.item(c).opt}${!data.rows.item(i).Comment ? '' : ', ' + data.rows.item(i).Comment}`,
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
                Answer: `${!data.rows.item(i).Answer ? '' : data.rows.item(i).Answer}${!data.rows.item(i).Comment ? '' : data.rows.item(i).Comment}`,
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
                Answer: `${!data.rows.item(i).Answer ? '' : data.rows.item(i).Answer}${!data.rows.item(i).Comment ? '' : data.rows.item(i).Comment}`,
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

              console.log(this.arrInspectionDetail);

              break;
          }
        }
        this.globalService.arrayEditGroup = this.arrGroups;
      }
      this.isLoading = false;
    }).catch((err) => {

      this.isLoading = false;
    });
  }

  loadStoredImages(): Promise<InspectionImage[]> {
    return new Promise(async resolve => {
      const query = `select Ii.*,Qai.Id as QuestionAnswerImageId from InspectionImage as Ii join QuestionAnswerImage as Qai on Ii.Name == Qai.ImageName
        join QuestionAnswer as Qa on Qai.QuestionAnswerGuid == Qa.QuestionAnswerGuid where Qa.InspectionGuid=? and
        Qa.QuestionAnswerGuid=? and Qai.IsDelete='false'`;

      await this.databaseService.db.executeSql(query, [this.obj.InspectionGuid, this.answerGuid]).then(data => {
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

  loadTableData(): Promise<string[]> {
    return new Promise(async resolve => {
      let questionId = 0;
      const query1 = `select Qta.*, Qa.QuestionId from QuestionTableAnswer as Qta join QuestionAnswer as Qa on
        Qta.QuestionAnswerGuid == Qa.QuestionAnswerGuid where Qa.InspectionGuid=? and Qa.QuestionAnswerGuid=? and
        Qta.IsDelete='false' order by [Index]`;

      await this.databaseService.db.executeSql(query1, [this.obj.InspectionGuid, this.answerGuid]).then(async data => {
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

  async doRefresh(event: any) {
    setTimeout(async () => {
      this.isLoading = true;

      setTimeout(async () => {
        if (this.action == this.archiveEnum.ArchiveInspection) {
          this.getArchiveInspectionData();
        }
        else {
          await this.getInspectionData();
        }
        //await this.getInspectionData();
      }, 2000);
      event.target.complete();
    }, 1000);
  }

  edit(guid: string, queGuid: string, group: Group) {
    this.globalService.answerGuid = guid == null ? '' : guid;
    this.globalService.isFromAddNew = false;
    this.globalService.isFromDetail = true;
    this.globalService.isFromGroupEdit = false;
    this.globalService.inspectionType = this.obj.InspectionTypeId;
    this.globalService.CurrentVersion = this.obj.CurrentVersion;
    this.globalService.questionGuid = queGuid;
    this.globalService.isEditAddress = true;
    localStorage.setItem('isEdit', 'true');

    this.globalService.selectedQuestionGroupId = group.id == null ? '' : group.id.toString();
    this.router.navigate([`/tabs/tab2/add/${this.obj.InspectionGuid}`]);
  }

  editGroup(group: Group) {
    this.globalService.isFromAddNew = false;
    this.globalService.isFromDetail = false;
    this.globalService.isFromGroupEdit = true;
    this.globalService.inspectionType = this.obj.InspectionTypeId;
    this.globalService.CurrentVersion = this.obj.CurrentVersion;
    this.globalService.questionGuid = '';
    this.globalService.isEditAddress = true;
    localStorage.setItem('isEdit', 'true');
    this.globalService.isAddress = false;
    this.globalService.selectedQuestionGroupId = group.id == null ? '' : group.id.toString();
    this.router.navigate([`/tabs/tab2/add/${this.obj.InspectionGuid}`]);
  }
  editJobNumber(obj) {
    localStorage.setItem("jobNumber", obj.JobId.toString());
    localStorage.setItem("jobType", obj.InspectionTypeId);
    this.globalService.isFromEdit = true;
    this.globalService.inspectionType = obj.InspectionTypeId;
    this.globalService.CurrentVersion = this.obj.CurrentVersion;
    this.globalService.inspectionDetailObj = this.obj;
    this.globalService.isFromDetail = true;
    this.globalService.isFromGroupEdit = false;

    let navigationExtras: NavigationExtras = {
      queryParams: {
        InspectionDetailobj: JSON.stringify(obj)
      },
    }
    this.router.navigate([`/tabs/tab2/joborder/${obj.InspectionGuid}`], navigationExtras);
  }
  editAddress(obj) {
    this.globalService.isFromAddNew = false;
    this.globalService.isFromDetail = true;
    this.globalService.isFromGroupEdit = false;
    this.globalService.isEditAddress = true
    this.globalService.inspectionType = this.obj.InspectionTypeId;
    this.globalService.CurrentVersion = this.obj.CurrentVersion;

    localStorage.setItem('inspectionDetailObj', JSON.stringify(this.obj));
    localStorage.setItem('isEdit', 'true');
    let navigationExtras: NavigationExtras = {
      queryParams: {
        InspectionDetailobj: JSON.stringify(this.obj)
      },
    }
    this.router.navigate([`/tabs/tab2/type/${this.obj.InspectionGuid}`], navigationExtras);
  }

  async getInspectionTypes() {
    const query = `select * from InspectionType  order by Id desc`;
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
                this.globalService.inspectionTypeName = element.Name;
              }, 500);
            }
          });
        }
      }
      this.isLoading = false;
    }).catch(() => {
      this.isLoading = false;
    });
  }
}
