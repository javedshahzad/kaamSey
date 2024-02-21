import { Injectable } from "@angular/core";
import { SQLite, SQLiteObject } from "@ionic-native/sqlite/ngx";
import { Inspection, StatusTypes } from "../models/db-models/inspection-model";
import { InspectionType } from "../models/db-models/inspection-types-model";
import { Option } from "../models/db-models/options-model";
import { QuestionAnswer } from "../models/db-models/question-answer-model.";
import { QuestionRelation } from "../models/db-models/question-relations-model";
import { Question } from "../models/db-models/questions-model";
import { QuestionTableAnswer } from "../models/db-models/questions-table-answer-model";
import { QuestionTable } from "../models/db-models/questions-table-model";
import { AllDataRepsonse, SyncTableRequest } from "../models/all-data-model";
import { QuestionAnswerImage } from "../models/db-models/question-answer-image-model";
import { InspectionImage } from "../models/db-models/image-model";
import { QuestionGroup } from "../models/db-models/question-group";
import { InpsectionPropertyImage } from "../models/db-models/property-image";
import { MaterialImage } from "../models/db-models/material-image";
import { SyncTypeEnum } from "../models/all-data-model";
import { InspectionQuestionImage } from "../models/db-models/inspection-question-image-model";


import {
  FileTransferObject,
  FileTransfer,
} from "@ionic-native/file-transfer/ngx";
import { WebView } from "@ionic-native/ionic-webview/ngx";
import { File } from "@ionic-native/File/ngx";
import { TimestampService } from "./timestamp.service";
import { GlobalService } from "./auth/global.service";
import { TranslateService } from "@ngx-translate/core";
import { LoaderService } from "./loader.service";
import { Subject } from "rxjs";
import { Events } from "../events/events";
@Injectable({
  providedIn: "root",
})
export class DatabaseService {
  isDbInitialized: Boolean = false;
  SyncType = SyncTypeEnum;
  public maxId: number = 0;
  arrSyncTableArchiveModel: SyncTableRequest[] = [];
  arrInspection: Inspection[] = [];
  arrInspectionType: InspectionType[] = [];
  arrOption: Option[] = [];
  arrQuestionAnswer: QuestionAnswer[] = [];
  arrQuestionRelation: QuestionRelation[] = [];
  arrQuestion: Question[] = [];
  arrQuestionTableAnswer: QuestionTableAnswer[] = [];
  arrQuestionTable: QuestionTable[] = [];
  arrQuestionAnswerImage: QuestionAnswerImage[] = [];
  arrInspectionImage: InspectionImage[] = [];
  arrPropertyImage: InpsectionPropertyImage[] = [];
  arrMaterialImage: MaterialImage[] = [];
  arrQuestionGroup: QuestionGroup[] = [];
  arrInspectionPropertyImage: InpsectionPropertyImage[] = [];
  dbCreate = { name: "data.db", location: "default" };
  db: SQLiteObject;
  arrSample: any[];
  arrMaterialModel: any[];
  arrOtherMaterialLocationModel: any[];
  arrInspectionQuestionImage: InspectionQuestionImage[] = [];

  public sendArchiveEmail = new Subject<any>();

  constructor(
    private sqlite: SQLite,
    private transfer: FileTransfer,
    public webview: WebView,
    private file: File,
    private timestampService: TimestampService,
    public globalService: GlobalService,
    private events: Events,
    private translateService: TranslateService,
    private loaderService: LoaderService,
  ) {
    this.isDbInitialized = !!localStorage.getItem('isDbInitialized') && localStorage.getItem('isDbInitialized') == 'true' ? true : false;
  }

  async deleteAllTables() {



    const arrTables = [
      "Inspection",
      "InspectionType",
      "Option",
      "QuestionAnswer",
      "QuestionRelation",
      "Question",
      "QuestionTableAnswer",
      "QuestionTable",
      "QuestionAnswerImage",
      "InspectionImage",
      "QuestionGroup",
      "InpsectionPropertyImage",
      "MaterialImage",
      "InspectionSample",
      "SampleType",
      "AnalysisType",
      "TurnArroundType",
      "OtherMetalanalysis",
      "OtherElementanalysis",
      "WaterBottleSizeGroup",
      // "AsbestosMaterials",
      "MaterialDropDownList",
      "AsbMaterialMappingList",
      "SampleAssignedLabList",
      "MaterialListModels",
      "MaterialLocations",
      "MaterialRoom",
      "MaterialRoomDropDownList",
      "AsbMaterialMappingModel",
      "SyncTableArchive",
      "InspectionQuestionImage",
      "JobList"
    ];

    await this.sqlite
      .create(this.dbCreate)
      .then(async (db: SQLiteObject) => {
        this.db = db;

        for (const obj of arrTables) {

          const query = `drop table ${obj}`;
          await this.db
            .executeSql(query, [])
            .then(() => {

            })
            .catch(() => {

            });
        }
      })
      .catch(() => { });
  }

  createAllTables(res: AllDataRepsonse): Promise<boolean> {
    return new Promise(async (resolve) => {
      const timestampValue = localStorage.getItem("timestamp");

      if (timestampValue === null || timestampValue === "") {
        await this.db
          .executeSql("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='Inspection'", [])
          .then(async (data) => {
            // alert("createAllTables success db call" + data.rows.length + "data.rows.item(0)" + JSON.stringify(data.rows.item(0)));
            if (data.rows.length == 1 && data.rows.item(0).count == 0) {
              await this.createAllTablesDB();
              localStorage.setItem('isDbInitialized', 'true');

              await this.insertTableInspection(res.Data.Inspections);
              await this.insertTableInspectionType(res.Data.InspectionTypes);
              await this.insertTableOption(res.Data.Options);
              await this.insertTableQuestionAnswer(res.Data.QuestionAnswers);
              await this.insertTableInspectionImage(
                res.Data.QuestionAnswers,
                res.Data.QuestionAnswerImages
              );
              await this.insertTableMaterialImage(
                res.Data.MaterialImageList
              );

              await this.insertTableInspectionPropertyImage(
                res.Data.InspectionPropertyImage
              );

              if (res.Data.InspectionQuestionImages != null && res.Data.InspectionQuestionImages.length > 0) {
                await this.insertInspectionQuestionImageList(
                  res.Data.InspectionQuestionImages
                );
              }

              await this.insertTableQuestionRelation(res.Data.QuestionRelations);
              await this.insertTableQuestion(res.Data.Questions);
              await this.insertTableQuestionTableAnswer(res.Data.QuestionTableAnswers);
              await this.insertTableQuestionTable(res.Data.QuestionTables);
              await this.insertTableSample(res.Data.Samples);
              await this.insertTableSampleType(res.Data.Sample_Type);
              await this.insertTableAnalysisType(res.Data.Analysis_Type);
              await this.insertTableTurnArroundTime(res.Data.Turn_Arround_Time);
              await this.insertTableOthermetalanalysis(res.Data.Other_metal_analysis);
              await this.insertTableOtherelementanalysis(
                res.Data.OtherElementAnalysisList
              );
              // await this.insertTableQuestionAnswerImage(res.Data.QuestionAnswerImages);
              await this.insertTableQuestionGroup(res.Data.QuestionGroup);
              await this.insertTableWaterBottleSizeGroup(
                res.Data.WaterBottleGroupDefinitionList
              );
              await this.insertTablemateriallocation(res.Data.MaterialLocations);
              // await this.insertTableAsbestosMaterials(res.Data.AsbestosMaterials);
              await this.insertTableMaterialDropDownList(res.Data.MaterialDropDownList)
              await this.insertTableAsbMaterialMappingList(res.Data.AsbMaterialMappingList);
              await this.insertTableSampleAssignedLabList(res.Data.SampleAssignedLabList);
              await this.insertTableMaterial(res.Data.MaterialListModels);
              await this.insertTablematerilRoomDropdown(
                res.Data.MaterialRoomDropDownList
              );
              await this.insertMaterialRoom(res.Data.MaterialRoomListModels);
              await this.insertUpdateAppFieldSuggestions(res.Data.AppFieldSuggestions);

              await this.insertUpdateMaterialConfig(res.Data.MaterialConfig);

            }
          }).catch((err) => {
            console.error(err);
            alert("createAllTables error db call" + err);
          });

        return resolve(true);
      }
    });
  }

  async createAllTablesDB() {
    const arrCreateTable = [];

    arrCreateTable.push([
      `create table if not exists Inspection(Id integer primary key, JobId integer,
      InspectorId integer, InspectionDate nvarchar, Owner nvarchar, PropertyLocation nvarchar, Address nvarchar,
      PhoneNumber nvarchar, CellNumber nvarchar, InspectorPhoneNumber nvarchar, Status integer, IsDelete bit,
      Timestamp nvarchar, InspectionGuid nvarchar, InspectionTypeId integer, IsSync nvarchar, StartTime nvarchar,
      CompletedTime nvarchar, WrongJobId nvarchar, EmergencyDate nvarchar,CurrentVersion integer,ArchiveString nvarchar, IsCheckedIn nvarchar, IsContactLogin bit)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists SyncTableArchive(Id integer primary key, LoginId  integer,
      Data  nvarchar, TableName  nvarchar, Type  nvarchar, DateTime nvarchar,IsSync nvarchar)`,
      [],
    ]);




    arrCreateTable.push([
      `create table if not exists InspectionType(Id integer primary key, Name nvarchar,
      Description nvarchar, IsDelete bit, InspectionTypeGuid nvarchar, Timestamp nvarchar,CurrentVersion integer)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists Option(Id integer primary key, QuestionId integer,
      Option nvarchar, IsDelete bit, OptionsGuid nvarchar, Timestamp nvarchar, ImageName nvarchar, IsParent nvarchar)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists QuestionAnswer(Id integer primary key, InspectionGuid nvarchar,
      QuestionId integer, QuestionOptionId integer, Answer nvarchar, Selected integer, IsDelete bit,
      QuestionAnswerGuid nvarchar, Timestamp nvarchar, Comment nvarchar, InspectorId integer,QuestionInspectionGuid nvarchar)`,
      [],
    ]);



    arrCreateTable.push([
      `create table if not exists QuestionRelation(Id integer primary key,
      QuestionsId integer, ParentQuestionId integer, OptionsId integer, IsDelete bit, QuestionRelationGuid nvarchar,
      Timestamp nvarchar,QuestionInspectionId integer)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists Question(Id integer, Question nvarchar,
      Description nvarchar, QuestionTypeId integer, SubQuestionTypeId integer, NoOfRows integer, IsDelete bit,
      QuestionGuid nvarchar, Timestamp nvarchar, InspectionTypeId integer, [Index] integer, IsMandatory nvarchar,
      IsParent nvarchar, IsDependent nvarchar, ShowComment nvarchar, QuestionGroupId integer,QuestionRelationGuid nvarchar,QuestionInspectionId integer)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists QuestionTableAnswer(Id integer primary key, QuestionTableId integer,
      [Index] integer, IsDelete bit, QuestionTableAnswerGuid nvarchar, Timestamp nvarchar, QuestionAnswerGuid nvarchar,
      Answer nvarchar, InspectionGuid nvarchar)`,
      [],
    ]);



    arrCreateTable.push([
      `create table if not exists QuestionTable(Id integer primary key, QuestionId integer,
      ColumnName nvarchar, ColumnIndex integer, IsDelete bit, QuestionTableGuid nvarchar, Timestamp nvarchar)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists QuestionAnswerImage(Id integer primary key, ImageName nvarchar,
      OriginalImageName nvarchar, QuestionAnswerGuid nvarchar, IsDelete bit, QuestionAnswerImageGuid nvarchar,
      Timestamp nvarchar, InspectionGuid nvarchar,IsSync nvarchar)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists InspectionImage(Id integer primary key, Name nvarchar,
      Path nvarchar, Filepath nvarchar, Timestamp nvarchar, InspectionGuid nvarchar, QuestionAnswerGuid nvarchar,IsSync nvarchar,QuestionAnswerImageGuid nvarchar)`,
      [],
    ]);



    arrCreateTable.push([
      `create table if not exists QuestionGroup(Id integer primary key, QuestionGroupName nvarchar,
        InspectionTypeId integer, IsDelete bit, QuestionGroupGuid nvarchar, Timestamp nvarchar)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists InpsectionPropertyImage(Id nvarchar, Name nvarchar,
          Path nvarchar, Filepath nvarchar, Timestamp nvarchar, InspectionGuid nvarchar,IsDelete bit,IsSync nvarchar)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists MaterialImage(Id nvarchar, Name nvarchar,
          Path nvarchar, Filepath nvarchar, MaterialImageGuid nvarchar, Client_Material_Id nvarchar,Job_Id nvarchar,IsSync nvarchar,IsDelete bit)`,
      [],
    ]);




    arrCreateTable.push([
      `create table if not exists InspectionSample(
            sample_id  integer primary key,
            job_id integer,
            InspectionGuid nvarchar,
            SampleGuid nvarchar, 
            analysis_type nvarchar, 
            sample_type nvarchar, 
            sample_vol integer,
            flow_rate integer,
            width nvarchar(30),
            length nvarchar(20),
            weight nvarchar(20),
            comment nvarchar(100),
            sample_desc nvarchar,
            sample_loc nvarchar,
            client_sample_id nvarchar(50),
            date_collected nvarchar(22),
            control_sample nvarchar,
            fb_sample nvarchar,
            sampling_start_time nvarchar(50),
            sampling_end_time nvarchar(50),
            sampling_duration integer,
            Include_Paint_chips nvarchar,
            Surface_Smooth_Clean nvarchar,
            turn_around integer,
            squarefeet integer,
            purpose nvarchar(20),
            WSSN nvarchar,
            IncludeCUAnalysis nvarchar,
            volume integer,
            date_created nvarchar,
            ship_method nvarchar(50),
            waybill nvarchar(50),
            ship_date nvarchar(22),
            InspectorId integer,
            Other_metal_analysis nvarchar(50),
            other_element_analysis nvarchar(255),
            TimeCollected nvarchar(50),
            BottleSizeId nvarchar,
            material_id nvarchar,
            Client_Material_Id  nvarchar,
            Lab_Id_Client integer,
            IsDelete bit,
            SortOrder integer
            )`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists SampleType(Id integer, Name nvarchar, Description nvarchar)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists AnalysisType(Id integer, Name nvarchar)`,
      [],
    ]);
    arrCreateTable.push([
      `create table if not exists TurnArroundType(Id integer, Name nvarchar)`,
      [],
    ]);
    arrCreateTable.push([
      "create table if not exists OtherMetalanalysis(Id integer, Name nvarchar)",
      [],
    ]);
    arrCreateTable.push([
      "create table if not exists OtherElementanalysis(Id integer, Name nvarchar)",
      [],
    ]);
    arrCreateTable.push([
      "create table if not exists WaterBottleSizeGroup(Id integer, def_group nvarchar, def_id nvarchar, definition nvarchar,ordinal_position nvarchar,record_id nvarchar)",
      [],
    ]);
    // arrCreateTable.push([
    //   "create table if not exists AsbestosMaterials(Id integer,Description nvarchar, Type nvarchar)",
    //   [],
    // ]);
    arrCreateTable.push([
      "create table if not exists MaterialDropDownList(Material_Id integer,Name nvarchar, Material_Type nvarchar)",
      [],
    ]);

    arrCreateTable.push([
      "create table if not exists AsbMaterialMappingList(Material  nvarchar,Material_Sub  nvarchar,Clasification  nvarchar,Friable nvarchar,Units nvarchar)",
      [],
    ]);

    arrCreateTable.push([
      "create table if not exists SampleAssignedLabList(Id integer,Name nvarchar)",
      [],
    ]);

    arrCreateTable.push([
      "create table if not exists MaterialLocations(Id integer, Name nvarchar,IsSync bit)",
      [],
    ]);
    arrCreateTable.push([
      `create table if not exists MaterialListModels(
        Id nvarchar, 
        Job_Id nvarchar,
        Client_Material_Id  nvarchar(50), 
        Material nvarchar(255), 
        Material_Sub  nvarchar(255), 
        Classification  nvarchar(255), 
        Friable nvarchar(255), 
        Size nvarchar(255),
        Color nvarchar(255), 
        Material_Locations nvarchar(255),  
        Note_1 nvarchar(255), 
        Note_2 nvarchar(255),
        Quantity nvarchar,
        Units nvarchar(255), 
        Assumed nvarchar, 
        IsDelete bit)`,
      [],
    ]);



    arrCreateTable.push([
      `create table if not exists MaterialRoom(Id integer primary key,
        roomGuid nvarchar,
        record_id nvarchar,
        job_id nvarchar,
        client_material_id nvarchar,
        material_id nvarchar,
        room_number nvarchar(50),
        floor_number nvarchar(50),
        sq_feet integer,
        linear_feet_0_4 integer,
        linear_feet_5_7 integer,
        linear_feet_8_12 integer,
        linear_feet_12_up integer,
        Ends integer,
        Hangers integer,
        damage_puncture integer,
        damage_vibration integer,
        damage_water integer,
        damage_air integer,
        damage_delamination integer,
        damage_slow_deterioration integer,
        damage_use_wear integer,
        damage_extent integer,
        damage_feet integer,
        access integer,
        access_frequency integer,
        risk_vibration integer,
        risk_air_move integer,
        risk_dist_potential integer,
        acm_condition integer,
        acm_height nvarchar(50),
        IsDelete bit)`,
      [],
    ]);


    arrCreateTable.push([
      `create table if not exists MaterialRoomDropDownList(Id nvarchar, Name nvarchar, Description nvarchar)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists InspectionQuestionImage(Id integer primary key, InspectionQuestionImageGuid nvarchar, Name nvarchar, Path nvarchar, Filepath nvarchar, 
            Timestamp nvarchar, InspectionGuid nvarchar, QuestionGuid nvarchar,IsSync bit, IsDelete bit)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists AppFieldSuggestions(Id integer, InspectionId integer, FieldName nvarchar, SuggestedValue nvarchar, IsDelete bit)`,
      [],
    ]);

    arrCreateTable.push([
      `create table if not exists ArchiveInspection(Id integer primary key, JobId integer,
        InspectorId integer, InspectionDate nvarchar, Owner nvarchar, PropertyLocation nvarchar, Address nvarchar,
        PhoneNumber nvarchar, CellNumber nvarchar, InspectorPhoneNumber nvarchar, Status integer, IsDelete bit,
        Timestamp nvarchar, InspectionGuid nvarchar, InspectionTypeId integer, IsSync nvarchar, StartTime nvarchar,
        CompletedTime nvarchar, WrongJobId nvarchar, EmergencyDate nvarchar,CurrentVersion integer, IsCheckedIn nvarchar, ArchiveString nvarchar, ArchiveDate nvarchar)`, [],
    ]);

    arrCreateTable.push([
      `create table if not exists MaterialConfig(Record_Id integer, Material_Id integer, 
        SubMaterial nvarchar, Classification integer, Friable integer, Unit integer, Min_Samples integer)`, [],
    ]);

    arrCreateTable.push([
      `create table if not exists JobList(Job_Id integer, FacilityAddress nvarchar, 
        FacilityCity nvarchar, FacilityState nvarchar, FacilityZip integer, onsite_person nvarchar, onsite_phone nvarchar,StartDateTime nvarchar,EndDateTime nvarchar,property_unit integer)`, [],
    ]);



    await this.db
      .sqlBatch(arrCreateTable)
      .then(() => { })
      .catch((err) => {
        console.log(err);
      });
    this.db
      .executeSql(
        `SELECT  * FROM pragma_table_info('InspectionSample') WHERE name='Client_Material_Id'`,
        []
      )
      .then(
        (res) => {
          if (res.rows.length <= 0) {
            this.db.executeSql(
              "ALTER TABLE InspectionSample ADD Client_Material_Id nvarchar",
              []
            );
          }
        },
        (err) => {

        }
      );

  }

  async insertTableInspection(arr: Inspection[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {

      if (timestampValue === null || timestampValue === "") {

        arrInsertRows.push([
          `insert into Inspection(JobId, InspectorId, InspectionDate, Owner, PropertyLocation,
        Address, PhoneNumber, CellNumber, InspectorPhoneNumber, Status, IsDelete, Timestamp, InspectionGuid,
        InspectionTypeId, IsSync, StartTime, CompletedTime, WrongJobId, EmergencyDate,CurrentVersion,ArchiveString,IsCheckedIn,IsContactLogin)
        values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            obj.JobId,
            obj.InspectorId,
            obj.InspectionDate,
            obj.Owner,
            obj.PropertyLocation,
            obj.Address,
            obj.PhoneNumber,
            obj.CellNumber,
            obj.InspectorPhoneNumber,
            obj.Status,
            obj.IsDelete,
            obj.Timestamp,
            obj.InspectionGuid,
            obj.InspectionTypeId,
            obj.IsSync,
            obj.StartTime,
            obj.CompletedTime,
            obj.WrongJobId,
            obj.EmergencyDate,
            obj.CurrentVersion,
            '',
            false,
            obj.IsContactLogin
          ],
        ]);
      } else {
        await this.db
          .executeSql("select 1 from Inspection where InspectionGuid=?", [
            obj.InspectionGuid,
          ])
          .then((data) => {

            if (data.rows.length === 0) {

              arrInsertRows.push([
                `insert into Inspection(JobId, InspectorId, InspectionDate, Owner, PropertyLocation,
              Address, PhoneNumber, CellNumber, InspectorPhoneNumber, Status, IsDelete, Timestamp, InspectionGuid,
              InspectionTypeId, IsSync, StartTime, CompletedTime, WrongJobId, EmergencyDate,CurrentVersion,ArchiveString,IsCheckedIn,IsContactLogin)
              values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                  obj.JobId,
                  obj.InspectorId,
                  obj.InspectionDate,
                  obj.Owner,
                  obj.PropertyLocation,
                  obj.Address,
                  obj.PhoneNumber,
                  obj.CellNumber,
                  obj.InspectorPhoneNumber,
                  obj.Status,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.InspectionGuid,
                  obj.InspectionTypeId,
                  obj.IsSync,
                  obj.StartTime,
                  obj.CompletedTime,
                  obj.WrongJobId,
                  obj.EmergencyDate,
                  obj.CurrentVersion,
                  '',
                  false,
                  obj.IsContactLogin
                ],
              ]);
            } else {

              arrUpdateRows.push([
                `update Inspection set JobId=?, InspectorId=?, InspectionDate=?, Owner=?, PropertyLocation=?,
            Address=?, PhoneNumber=?, CellNumber=?, InspectorPhoneNumber=?, Status=?, IsDelete=?, Timestamp=?,
            InspectionTypeId=?, IsSync=?, StartTime=?, CompletedTime=?, WrongJobId=?, EmergencyDate=?,CurrentVersion=?,IsContactLogin=? where InspectionGuid=?`,
                [
                  obj.JobId,
                  obj.InspectorId,
                  obj.InspectionDate,
                  obj.Owner,
                  obj.PropertyLocation,
                  obj.Address,
                  obj.PhoneNumber,
                  obj.CellNumber,
                  obj.InspectorPhoneNumber,
                  obj.Status,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.InspectionTypeId,
                  obj.IsSync,
                  obj.StartTime,
                  obj.CompletedTime,
                  obj.WrongJobId,
                  obj.EmergencyDate,
                  obj.CurrentVersion,
                  obj.InspectionGuid,
                  obj.IsContactLogin
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((error) => {


        });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertTableInspectionType(arr: InspectionType[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into InspectionType(Id, Name, Description, IsDelete, InspectionTypeGuid, Timestamp,CurrentVersion)
        values (?,?,?,?,?,?,?)`,
          [
            obj.Id,
            obj.Name,
            obj.Description,
            obj.IsDelete,
            obj.InspectionTypeGuid,
            obj.Timestamp,
            obj.CurrentVersion
          ],
        ]);
      } else {
        await this.db
          .executeSql("select 1 from InspectionType where Id=?", [obj.Id])
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into InspectionType(Id, Name, Description, IsDelete, InspectionTypeGuid, Timestamp,CurrentVersion)
            values (?,?,?,?,?,?,?)`,
                [
                  obj.Id,
                  obj.Name,
                  obj.Description,
                  obj.IsDelete,
                  obj.InspectionTypeGuid,
                  obj.Timestamp,
                  obj.CurrentVersion
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update InspectionType set Id=?, Name=?, Description=?, IsDelete=?, Timestamp=?,CurrentVersion=? where
            InspectionTypeGuid=?`,
                [
                  obj.Id,
                  obj.Name,
                  obj.Description,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.CurrentVersion,
                  obj.InspectionTypeGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertTableOption(arr: Option[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into Option(Id, QuestionId, Option, IsDelete, OptionsGuid, Timestamp, ImageName,
          IsParent) values (?,?,?,?,?,?,?,?)`,
          [
            obj.Id,
            obj.QuestionId,
            obj.Option,
            obj.IsDelete,
            obj.OptionsGuid,
            obj.Timestamp,
            obj.ImageName,
            obj.IsParent,
          ],
        ]);
      } else {
        await this.db
          .executeSql("select 1 from Option where Id=?", [obj.Id])
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into Option(Id, QuestionId, Option, IsDelete, OptionsGuid, Timestamp, ImageName,
              IsParent) values (?,?,?,?,?,?,?,?)`,
                [
                  obj.Id,
                  obj.QuestionId,
                  obj.Option,
                  obj.IsDelete,
                  obj.OptionsGuid,
                  obj.Timestamp,
                  obj.ImageName,
                  obj.IsParent,
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update Option set Id=?, QuestionId=?, Option=?, IsDelete=?, Timestamp=?, ImageName=?,
            IsParent=? where OptionsGuid=?`,
                [
                  obj.Id,
                  obj.QuestionId,
                  obj.Option,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.ImageName,
                  obj.IsParent,
                  obj.OptionsGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertTableQuestionAnswer(arr: QuestionAnswer[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into QuestionAnswer(InspectionGuid, QuestionId, QuestionOptionId, Answer, Selected,
          IsDelete, QuestionAnswerGuid, Timestamp, Comment,InspectorId,QuestionInspectionGuid) values (?,?,?,?,?,?,?,?,?,?,?)`,
          [
            obj.InspectionGuid,
            obj.QuestionId,
            obj.QuestionOptionId,
            obj.Answer,
            obj.Selected,
            obj.IsDelete,
            obj.QuestionAnswerGuid,
            obj.Timestamp,
            obj.Comment,
            obj.InspectorId,
            obj.QuestionInspectionGuid
          ],
        ]);
      } else {
        await this.db
          .executeSql(
            "select 1 from QuestionAnswer where QuestionAnswerGuid=?",
            [obj.QuestionAnswerGuid]
          )
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into QuestionAnswer(InspectionGuid, QuestionId, QuestionOptionId, Answer, Selected,
                IsDelete, QuestionAnswerGuid, Timestamp, Comment,InspectorId,QuestionInspectionGuid) values (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                  obj.InspectionGuid,
                  obj.QuestionId,
                  obj.QuestionOptionId,
                  obj.Answer,
                  obj.Selected,
                  obj.IsDelete,
                  obj.QuestionAnswerGuid,
                  obj.Timestamp,
                  obj.Comment,
                  obj.InspectorId,
                  obj.QuestionInspectionGuid
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update QuestionAnswer set InspectionGuid=?, QuestionId=?, QuestionOptionId=?, Answer=?,
              Selected=?, IsDelete=?, Timestamp=?, Comment=?,InspectorId=?,QuestionInspectionGuid=? where QuestionAnswerGuid=?`,
                [
                  obj.InspectionGuid,
                  obj.QuestionId,
                  obj.QuestionOptionId,
                  obj.Answer,
                  obj.Selected,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.Comment,
                  obj.InspectorId,
                  obj.QuestionInspectionGuid,
                  obj.QuestionAnswerGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertTableQuestionRelation(arr: QuestionRelation[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into QuestionRelation(Id, QuestionsId, ParentQuestionId, OptionsId, IsDelete,
          QuestionRelationGuid, Timestamp,QuestionInspectionId) values (?,?,?,?,?,?,?,?)`,
          [
            obj.Id,
            obj.QuestionsId,
            obj.ParentQuestionId,
            obj.OptionsId,
            obj.IsDelete,
            obj.QuestionRelationGuid,
            obj.Timestamp,
            obj.QuestionInspectionId
          ],
        ]);
      } else {
        await this.db
          .executeSql("select 1 from QuestionRelation where Id=?", [obj.Id])
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into QuestionRelation(Id, QuestionsId, ParentQuestionId, OptionsId, IsDelete,
              QuestionRelationGuid, Timestamp,QuestionInspectionId) values (?,?,?,?,?,?,?,?)`,
                [
                  obj.Id,
                  obj.QuestionsId,
                  obj.ParentQuestionId,
                  obj.OptionsId,
                  obj.IsDelete,
                  obj.QuestionRelationGuid,
                  obj.Timestamp,
                  obj.QuestionInspectionId
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update QuestionRelation set Id=?, QuestionsId=?, ParentQuestionId=?, OptionsId=?,
            IsDelete=?, Timestamp=? ,QuestionInspectionId=? where QuestionRelationGuid=?`,
                [
                  obj.Id,
                  obj.QuestionsId,
                  obj.ParentQuestionId,
                  obj.OptionsId,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.QuestionInspectionId,
                  obj.QuestionRelationGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertTableQuestion(arr: Question[]) {

    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into Question(Id, Question, Description, QuestionTypeId, SubQuestionTypeId, NoOfRows,
          IsDelete, QuestionGuid, Timestamp, InspectionTypeId, [Index], IsMandatory, IsParent, IsDependent, ShowComment,
          QuestionGroupId,QuestionRelationGuid,QuestionInspectionId) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            obj.Id,
            obj.Question,
            obj.Description,
            obj.QuestionTypeId,
            obj.SubQuestionTypeId,
            obj.NoOfRows,
            obj.IsDelete,
            obj.QuestionGuid,
            obj.Timestamp,
            obj.InspectionTypeId,
            obj.Index,
            obj.IsMandatory,
            obj.IsParent,
            obj.IsDependent,
            obj.ShowComment,
            obj.QuestionGroupId,
            obj.QuestionRelationGuid,
            obj.QuestionInspectionId
          ],
        ]);
      } else {
        await this.db
          .executeSql("select 1 from Question where QuestionGuid=?", [
            obj.QuestionGuid,
          ])
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into Question(Id, Question, Description, QuestionTypeId, SubQuestionTypeId, NoOfRows,
              IsDelete, QuestionGuid, Timestamp, InspectionTypeId, [Index], IsMandatory, IsParent, IsDependent, ShowComment,
              QuestionGroupId,QuestionRelationGuid,QuestionInspectionId) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                  obj.Id,
                  obj.Question,
                  obj.Description,
                  obj.QuestionTypeId,
                  obj.SubQuestionTypeId,
                  obj.NoOfRows,
                  obj.IsDelete,
                  obj.QuestionGuid,
                  obj.Timestamp,
                  obj.InspectionTypeId,
                  obj.Index,
                  obj.IsMandatory,
                  obj.IsParent,
                  obj.IsDependent,
                  obj.ShowComment,
                  obj.QuestionGroupId,
                  obj.QuestionRelationGuid,
                  obj.QuestionInspectionId
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update Question set Id=?, Question=?, Description=?, QuestionTypeId=?, SubQuestionTypeId=?,
            NoOfRows=?, IsDelete=?, Timestamp=?, InspectionTypeId=?, [Index]=?, IsMandatory=?, IsParent=?, IsDependent=?,
            ShowComment=?, QuestionGroupId=?,QuestionRelationGuid=?,QuestionInspectionId=? where QuestionGuid=?`,
                [
                  obj.Id,
                  obj.Question,
                  obj.Description,
                  obj.QuestionTypeId,
                  obj.SubQuestionTypeId,
                  obj.NoOfRows,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.InspectionTypeId,
                  obj.Index,
                  obj.IsMandatory,
                  obj.IsParent,
                  obj.IsDependent,
                  obj.ShowComment,
                  obj.QuestionGroupId,
                  obj.QuestionRelationGuid,
                  obj.QuestionInspectionId,
                  obj.QuestionGuid
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertTableQuestionTableAnswer(arr: QuestionTableAnswer[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
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
          ],
        ]);
      } else {
        await this.db
          .executeSql(
            "select 1 from QuestionTableAnswer where QuestionTableAnswerGuid=?",
            [obj.QuestionTableAnswerGuid]
          )
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into QuestionTableAnswer(QuestionTableId, [Index], IsDelete,
                QuestionTableAnswerGuid, Timestamp, QuestionAnswerGuid, Answer, InspectionGuid) values (?,?,?,?,?,?,?,?)`,
                [
                  obj.QuestionTableId,
                  obj.Index,
                  obj.IsDelete,
                  obj.QuestionTableAnswerGuid,
                  obj.Timestamp,
                  obj.QuestionAnswerGuid,
                  obj.Answer,
                  obj.InspectionGuid,
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update QuestionTableAnswer set QuestionTableId=?, [Index]=?, IsDelete=?, Timestamp=?,
              QuestionAnswerGuid=?, Answer=?, InspectionGuid=? where QuestionTableAnswerGuid=?`,
                [
                  obj.QuestionTableId,
                  obj.Index,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.QuestionAnswerGuid,
                  obj.Answer,
                  obj.InspectionGuid,
                  obj.QuestionTableAnswerGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertTableQuestionTable(arr: QuestionTable[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into QuestionTable(Id, QuestionId, ColumnName, ColumnIndex, IsDelete, QuestionTableGuid,
          Timestamp) values (?,?,?,?,?,?,?)`,
          [
            obj.Id,
            obj.QuestionId,
            obj.ColumnName,
            obj.ColumnIndex,
            obj.IsDelete,
            obj.QuestionTableGuid,
            obj.Timestamp,
          ],
        ]);
      } else {
        await this.db
          .executeSql("select 1 from QuestionTable where Id=?", [obj.Id])
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into QuestionTable(Id, QuestionId, ColumnName, ColumnIndex, IsDelete,
              QuestionTableGuid, Timestamp) values (?,?,?,?,?,?,?)`,
                [
                  obj.Id,
                  obj.QuestionId,
                  obj.ColumnName,
                  obj.ColumnIndex,
                  obj.IsDelete,
                  obj.QuestionTableGuid,
                  obj.Timestamp,
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update QuestionTable set Id=?, QuestionId=?, ColumnName=?, ColumnIndex=?, IsDelete=?,
            Timestamp=? where QuestionTableGuid=?`,
                [
                  obj.Id,
                  obj.QuestionId,
                  obj.ColumnName,
                  obj.ColumnIndex,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.QuestionTableGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }
  async insertTableSample(arrSamples) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arrSamples) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into InspectionSample(sample_id, job_id, InspectionGuid, SampleGuid, 
            analysis_type, sample_type, sample_vol, flow_rate, width, length, weight, comment, sample_desc, sample_loc, client_sample_id, date_collected,
            control_sample, fb_sample, sampling_start_time, sampling_end_time, sampling_duration , Include_Paint_chips, Surface_Smooth_Clean, turn_around,
            squarefeet, purpose, WSSN, IncludeCUAnalysis, volume,date_created,ship_method,waybill,ship_date, InspectorId, Other_metal_analysis,other_element_analysis,TimeCollected,BottleSizeId,material_id,Client_Material_Id,Lab_Id_Client,IsDelete,SortOrder) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      } else {
        await this.db
          .executeSql("select 1 from InspectionSample where SampleGuid=?", [obj.SampleGuid])
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into InspectionSample(sample_id, job_id, InspectionGuid, SampleGuid, 
                  analysis_type, sample_type, sample_vol, flow_rate, width, length, weight, comment, sample_desc, sample_loc, client_sample_id, date_collected,
                  control_sample, fb_sample, sampling_start_time, sampling_end_time, sampling_duration , Include_Paint_chips, Surface_Smooth_Clean, turn_around,
                  squarefeet, purpose, WSSN, IncludeCUAnalysis, volume,date_created,ship_method,waybill,ship_date, InspectorId, Other_metal_analysis,other_element_analysis,TimeCollected,BottleSizeId,material_id,Client_Material_Id,Lab_Id_Client,IsDelete,SortOrder) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
            } else {
              arrUpdateRows.push([
                `update InspectionSample set sample_id=?, job_id=?, InspectionGuid=?, SampleGuid=?,analysis_type=?,
                sample_type=?,sample_vol=?,flow_rate=?,width=?,length=?,weight=?,comment=?,sample_desc=?,sample_loc=?,
                client_sample_id=?,date_collected=?,control_sample=?,fb_sample=?,sampling_start_time=?,sampling_end_time=?,sampling_duration=?,
                Include_Paint_chips=?,Surface_Smooth_Clean=?,turn_around=?,squarefeet=?,purpose=?,WSSN=?,IncludeCUAnalysis=?,
                volume=?,date_created=?,date_created=?,ship_method=?,ship_date=?,InspectorId=?,Metal_analysis=?,other_element_analysis=?,
                TimeCollected=?,BottleSizeId=?,material_id=?,Client_Material_Id=?,Lab_Id_Client=?,IsDelete=?,SortOrder=?
                 where SampleGuid=?`,
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
                  obj.SampleGuid,
                  obj.SortOrder
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }

  }
  async insertTableTurnArroundTime(arrTurnaroundType) {
    const arrInsertRows = [];

    for (const obj of arrTurnaroundType) {
      arrInsertRows.push([
        `insert into TurnArroundType(Id, Name) values (?,?)`,
        [obj.Id, obj.Name],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }
  async insertTableOthermetalanalysis(Other_metal_analysis) {
    const arrInsertRows = [];
    for (const obj of Other_metal_analysis) {
      arrInsertRows.push([
        `insert into OtherMetalanalysis(Id, Name) values (?,?)`,
        [obj.Id, obj.Name],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }
  async insertTableOtherelementanalysis(OtherElementanalysis) {
    const arrInsertRows = [];
    for (const obj of OtherElementanalysis) {
      arrInsertRows.push([
        `insert into OtherElementanalysis(Id, Name) values (?,?)`,
        [obj.Id, obj.Name],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }
  async insertTableWaterBottleSizeGroup(WaterBottleSizeGroup) {
    const arrInsertRows = [];
    for (const obj of WaterBottleSizeGroup) {
      arrInsertRows.push([
        `insert into WaterBottleSizeGroup(Id, def_group,def_id,definition,ordinal_position,record_id) values (?,?,?,?,?,?)`,
        [
          obj.Id,
          obj.def_group,
          obj.def_id,
          obj.definition,
          obj.ordinal_position,
          obj.record_id,
        ],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }
  async insertTableSampleType(arrSampleType) {
    const arrInsertRows = [];
    for (const obj of arrSampleType) {
      arrInsertRows.push([
        `insert into SampleType(Id, Name, Description) values (?,?,?)`,
        [obj.Id, obj.Name, obj.Description],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }
  async insertTableAnalysisType(arrAnalysisType) {
    const arrInsertRows = [];

    for (const obj of arrAnalysisType) {
      arrInsertRows.push([
        `insert into AnalysisType(Id, Name) values (?,?)`,
        [obj.Id, obj.Name],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }

  async insertTableMaterialDropDownList(materials) {
    const arrInsertRows = [];
    for (const obj of materials) {
      arrInsertRows.push([
        `insert into MaterialDropDownList(Material_Id,Material_Type,Name) values (?,?,?)`,
        [obj.Material_Id, obj.Material_Type, obj.Name],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }

  async insertUpdateMaterialDropDownList(arrList) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");
    if (!!arrList && arrList.length > 0) {
      for (const obj of arrList) {
        if (timestampValue === null || timestampValue === "") {
          arrInsertRows.push([
            `insert into MaterialDropDownList(Material_Id,Material_Type,Name) values (?,?,?)`,
            [
              obj.Material_Id,
              obj.Material_Type,
              obj.Name
            ],
          ]);
        } else {
          await this.db
            .executeSql("select 1 from MaterialDropDownList where Material_Id=?", [obj.Material_Id])
            .then((data) => {
              if (data.rows.length === 0) {
                arrInsertRows.push([
                  `insert into MaterialDropDownList(Material_Id,Material_Type,Name) values (?,?,?)`,
                  [
                    obj.Material_Id,
                    obj.Material_Type,
                    obj.Name
                  ]
                ]);
              } else {
                arrUpdateRows.push([
                  `update MaterialDropDownList set Material_Id=?,Material_Type=? where Name=? and Material_Type=?`,
                  [
                    obj.Material_Id,
                    obj.Material_Type,
                    obj.Name,
                    obj.Material_Type
                  ],
                ]);
              }
            })
            .catch(() => { });
        }
      }
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }
    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }
  async deleteOtherCategoryAfterSync() {
    await this.db
      .executeSql("delete from MaterialDropDownList where Material_Id is null")
      .then((data) => {
      })
      .catch(() => { });

    await this.db
      .executeSql("delete from MaterialLocations where IsSync='false'")
      .then((data) => {
      })
      .catch(() => { });
  }

  async insertTableAsbMaterialMappingList(materials) {
    const arrInsertRows = [];
    for (const obj of materials) {
      arrInsertRows.push([
        `insert into AsbMaterialMappingList(Material,Material_Sub,Clasification,Friable,Units) values (?,?,?,?,?)`,
        [obj.Material, obj.Material_Sub, obj.Clasification, obj.Friable, obj.Units],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }

  async insertTableSampleAssignedLabList(samples) {
    const arrInsertRows = [];
    for (const obj of samples) {
      arrInsertRows.push([
        `insert into SampleAssignedLabList(Id,Name) values (?,?)`,
        [obj.Id, obj.Name],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }
  async insertTablemateriallocation(materials) {
    const arrInsertRows = [];
    for (const obj of materials) {
      arrInsertRows.push([
        `insert into MaterialLocations(Id, Name,IsSync) values (?,?,?)`,
        [obj.Id, obj.Name, true],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }
  async insertTablematerilRoomDropdown(materials) {
    const arrInsertRows = [];
    for (const obj of materials) {
      arrInsertRows.push([
        `insert into MaterialRoomDropDownList(Id, Name, Description) values (?,?,?)`,
        [obj.Id, obj.Name, obj.Description],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((err) => {

        });
    }
  }
  async insertTableMaterial(materials) {


    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of materials) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into MaterialListModels(Id, Job_Id,Client_Material_Id, Material, Material_Sub,Classification,Friable, Size,Color, Material_Locations,  
          Note_1 , Note_2 ,Quantity ,Units , Assumed,IsDelete) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      } else {
        await this.db
          .executeSql("select 1 from MaterialListModels where Job_Id=? and Client_Material_Id=?", [obj.Job_Id, obj.Client_Material_Id])
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into MaterialListModels(Id, Job_Id,Client_Material_Id, Material, Material_Sub,Classification,Friable, Size,Color, Material_Locations,  
                  Note_1 , Note_2 ,Quantity ,Units , Assumed,IsDelete) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
            } else {
              arrUpdateRows.push([
                `update MaterialListModels set Id=? where Client_Material_Id=? and Job_Id=?`,
                [obj.Id, obj.Client_Material_Id, obj.Job_Id]
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }

  }

  async insertTableQuestionAnswerImage_old(arr: QuestionAnswerImage[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into QuestionAnswerImage(ImageName, OriginalImageName, QuestionAnswerGuid, IsDelete,
          QuestionAnswerImageGuid, Timestamp, InspectionGuid, IsSync) values (?,?,?,?,?,?,?,?)`,
          [
            obj.ImageName,
            obj.OriginalImageName,
            obj.QuestionAnswerGuid,
            obj.IsDelete,
            obj.QuestionAnswerImageGuid,
            obj.Timestamp,
            obj.InspectionGuid,
            true,
          ],
        ]);
      } else {
        await this.db
          .executeSql(
            "select 1 from QuestionAnswerImage where QuestionAnswerImageGuid=?",
            [obj.QuestionAnswerImageGuid]
          )
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into QuestionAnswerImage(ImageName, OriginalImageName, QuestionAnswerGuid,
                IsDelete, QuestionAnswerImageGuid, Timestamp, InspectionGuid, IsSync) values (?,?,?,?,?,?,?,?)`,
                [
                  obj.ImageName,
                  obj.OriginalImageName,
                  obj.QuestionAnswerGuid,
                  obj.IsDelete,
                  obj.QuestionAnswerImageGuid,
                  obj.Timestamp,
                  obj.InspectionGuid,
                  true,
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update QuestionAnswerImage set ImageName=?, OriginalImageName=?, QuestionAnswerGuid=?,
              IsDelete=?, Timestamp=?, InspectionGuid=?, IsSync=? where QuestionAnswerImageGuid=?`,
                [
                  obj.ImageName,
                  obj.OriginalImageName,
                  obj.QuestionAnswerGuid,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.InspectionGuid,
                  true,
                  obj.QuestionAnswerImageGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }


  async insertTableQuestionAnswerImage(arrQA: QuestionAnswer[], arrQAI) {

    const timestampValue = localStorage.getItem("timestamp");
    const fileTransfer: FileTransferObject = this.transfer.create();

    for (const obj of arrQA) {
      arrQAI.forEach(async (element) => {
        if (obj.QuestionAnswerGuid == element.QuestionAnswerGuid) {
          if (timestampValue === null || timestampValue === "") {
            fileTransfer
              .download(element["ImagePath"], this.file.dataDirectory + element.ImageName)
              .then(
                async (res) => {
                  let naiveurl = await this.pathForImage(res.nativeURL);
                  var query1 = `insert into InspectionImage(Name, Path, Filepath, Timestamp, InspectionGuid, QuestionAnswerGuid, IsSync,QuestionAnswerImageGuid) values (?,?,?,?,?,?,?,?)`;
                  await this.db
                    .executeSql(query1, [
                      element.ImageName,
                      naiveurl,
                      res.nativeURL,
                      element.Timestamp,
                      element.InspectionGuid,
                      element.QuestionAnswerGuid,
                      true,
                      element.QuestionAnswerImageGuid
                    ])
                    .then(() => { })
                    .catch(() => { });


                  var query2 =
                    `insert into QuestionAnswerImage(ImageName, OriginalImageName, QuestionAnswerGuid, IsDelete,
                  QuestionAnswerImageGuid, Timestamp, InspectionGuid, IsSync) values (?,?,?,?,?,?,?,?)`;
                  await this.db
                    .executeSql(query2, [
                      element.ImageName,
                      element.ImageName,
                      element.QuestionAnswerGuid,
                      element.IsDelete,
                      element.QuestionAnswerImageGuid,
                      element.Timestamp,
                      element.InspectionGuid,
                      true,
                    ])
                    .then(() => { })
                    .catch(() => { });
                },
                (err) => {

                }
              );
          }
          else {
            await this.db
              .executeSql(
                "select 1 from QuestionAnswerImage where QuestionAnswerImageGuid=?",
                [element.QuestionAnswerImageGuid]
              )
              .then(async (data) => {

                if (data.rows.length === 0) {
                  var query2 =
                    `insert into QuestionAnswerImage(ImageName, OriginalImageName, QuestionAnswerGuid, IsDelete,
                  QuestionAnswerImageGuid, Timestamp, InspectionGuid, IsSync) values (?,?,?,?,?,?,?,?)`;
                  await this.db
                    .executeSql(query2, [
                      element.ImageName,
                      element.ImageName,
                      element.QuestionAnswerGuid,
                      element.IsDelete,
                      element.QuestionAnswerImageGuid,
                      element.Timestamp,
                      element.InspectionGuid,
                      true,
                    ])
                    .then(() => { })
                    .catch(() => { });
                } else {

                  var query3 =
                    `update QuestionAnswerImage set ImageName=?, OriginalImageName=?, QuestionAnswerGuid=?,
                 IsDelete=?, Timestamp=?, InspectionGuid=?, IsSync=? where QuestionAnswerImageGuid=?`;
                  await this.db
                    .executeSql(query3, [
                      element.ImageName,
                      element.OriginalImageName,
                      element.QuestionAnswerGuid,
                      element.IsDelete,
                      element.Timestamp,
                      element.InspectionGuid,
                      true,
                      element.QuestionAnswerImageGuid,
                    ])
                    .then(() => { })
                    .catch(() => { });

                }
              })
              .catch(() => { });
            await this.db
              .executeSql(
                "select 1 from InspectionImage where QuestionAnswerImageGuid=?",
                [element.QuestionAnswerImageGuid]
              )
              .then(async (data) => {
                if (data.rows.length === 0) {
                  fileTransfer
                    .download(element["ImagePath"], this.file.dataDirectory + element.ImageName)
                    .then(
                      async (res) => {
                        let naiveurl = await this.pathForImage(res.nativeURL);
                        var query1 = `insert into InspectionImage(Name, Path, Filepath, Timestamp, InspectionGuid, QuestionAnswerGuid,QuestionAnswerImageGuid, IsSync) values (?,?,?,?,?,?,?,?)`;
                        await this.db
                          .executeSql(query1, [
                            element.ImageName,
                            naiveurl,
                            res.nativeURL,
                            element.Timestamp,
                            element.InspectionGuid,
                            element.QuestionAnswerGuid,
                            element.QuestionAnswerImageGuid,
                            true,
                          ])
                          .then(() => { })
                          .catch(() => { });


                      },
                      (err) => {
                      }
                    );
                } else {
                  var query1 = `update InspectionImage set Name=?, Timestamp=?, InspectionGuid=?,QuestionAnswerGuid=?, IsSync=? where QuestionAnswerImageGuid=?`;
                  await this.db
                    .executeSql(query1, [
                      element.ImageName,
                      element.Timestamp,
                      element.InspectionGuid,
                      element.QuestionAnswerGuid,
                      true,
                      element.QuestionAnswerImageGuid
                    ])
                    .then(() => { })
                    .catch(() => { });
                }
              })
              .catch(() => { });
          }
        }
      });
    }

  }


  async updateTablePropertyImage(arr: InpsectionPropertyImage[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into InpsectionPropertyImage(Name, Path, Filepath, Timestamp, InspectionGuid,IsDelete,IsSync) values (?,?,?,?,?,?,?)`,
          [
            obj.Name,
            obj.Path,
            obj.Filepath,
            obj.Timestamp,
            obj.InspectionGuid,
            true,
            obj.IsDelete
          ],
        ]);
      } else {
        await this.db
          .executeSql(
            "select 1 from InpsectionPropertyImage where Id=? OR Name =?",
            [obj.Id, obj.Name]
          )
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into InpsectionPropertyImage(Name, Path, Filepath, Timestamp, InspectionGuid,IsDelete,IsSync) values (?,?,?,?,?,?,?)`,
                [
                  obj.Name,
                  obj.Path,
                  obj.Filepath,
                  obj.Timestamp,
                  obj.InspectionGuid,
                  true,
                  obj.IsDelete
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update InpsectionPropertyImage set Id=?, Name=?,Timestamp=?,InspectionGuid=?,IsSync=?,IsDelete=? where Name =?`,
                [
                  obj.Id,
                  obj.Name,
                  obj.Timestamp,
                  obj.InspectionGuid,
                  true,
                  obj.IsDelete,
                  obj.Name,
                ],
              ]);
            }
          })
          .catch((e) => { console.log(e) });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch((e) => { console.log(e) });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch((e) => { console.log(e) });
    }
  }



  async updateTableMaterialImage(arr: MaterialImage[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into MaterialImage(Id,Name, Path, Filepath,MaterialImageGuid ,Client_Material_Id, Job_id, IsSync,IsDelete) values (?,?,?,?,?,?,?,?,?)`,
          [
            obj.Id,
            obj.Name,
            obj.Path,
            obj.Filepath,
            obj.MaterialImageGuid,
            obj.Client_Material_Id,
            obj.Job_Id,
            true,
            obj.IsDelete
          ],
        ]);
      } else {
        await this.db
          .executeSql(
            "select 1 from MaterialImage where MaterialImageGuid=?",
            [obj.MaterialImageGuid]
          )
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into MaterialImage(Id,Name, Path, Filepath,MaterialImageGuid ,Client_Material_Id, Job_id, IsSync,IsDelete) values (?,?,?,?,?,?,?,?,?)`,
                [
                  obj.Id,
                  obj.Name,
                  obj.Path,
                  obj.Filepath,
                  obj.MaterialImageGuid,
                  obj.Client_Material_Id,
                  obj.Job_Id,
                  true,
                  obj.IsDelete
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update MaterialImage set Id=?, Name=?,MaterialImageGuid=?,Client_Material_Id=?,Job_Id=?, IsSync=?,IsDelete=? where MaterialImageGuid=?`,
                [
                  obj.Id,
                  obj.Name,
                  obj.MaterialImageGuid,
                  obj.Client_Material_Id,
                  obj.Job_Id,
                  true,
                  obj.IsDelete,
                  obj.MaterialImageGuid
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertTableMaterialImage(arrQA: MaterialImage[]) {
    const arrInsertRows = [];
    const fileTransfer: FileTransferObject = this.transfer.create();
    for (const element of arrQA) {
      fileTransfer
        .download(element["Path"], this.file.dataDirectory + element.Name)
        .then(
          async (res) => {
            let naiveurl = await this.pathForImage(res.nativeURL);
            const query1 = `insert into MaterialImage(Id,Name, Path, Filepath,MaterialImageGuid ,Client_Material_Id, Job_id, IsSync,IsDelete) values (?,?,?,?,?,?,?,?,?)`;
            await this.db
              .executeSql(query1, [
                element.Id,
                element.Name,
                naiveurl,
                res.nativeURL,
                element.MaterialImageGuid,
                element.Client_Material_Id,
                element.Job_Id,
                true,
                element.IsDelete
              ])
              .then(() => { })
              .catch(() => { });
          },
          (err) => {

          }
        );
    }
  }

  async insertTableInspectionPropertyImage(arrQA: InpsectionPropertyImage[]) {
    const arrInsertRows = [];
    const fileTransfer: FileTransferObject = this.transfer.create();
    for (const element of arrQA) {
      fileTransfer
        .download(element["ImagePath"], this.file.dataDirectory + element.Name)
        .then(
          async (res) => {
            let naiveurl = await this.pathForImage(res.nativeURL);
            const query = `insert into InpsectionPropertyImage(Id,Name,Path,Filepath,Timestamp,InspectionGuid,IsDelete,IsSync) values (?,?,?,?,?,?,?,?)`;
            await this.db.executeSql(query, [element.Id, element.Name, naiveurl, res.nativeURL, element.Timestamp,
            element.InspectionGuid, element.IsDelete, true]).then(() => {

            }).catch(() => {

            });
          },
          (err) => {

          }
        );
    }
  }


  async insertTableQuestionGroup(arr: QuestionGroup[]) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into QuestionGroup(Id, QuestionGroupName, InspectionTypeId, IsDelete,
          QuestionGroupGuid, Timestamp) values (?,?,?,?,?,?)`,
          [
            obj.Id,
            obj.QuestionGroupName,
            obj.InspectionTypeId,
            obj.IsDelete,
            obj.QuestionGroupGuid,
            obj.Timestamp,
          ],
        ]);
      } else {
        await this.db
          .executeSql("select 1 from QuestionGroup where QuestionGroupGuid=?", [
            obj.QuestionGroupGuid,
          ])
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into QuestionGroup(Id, QuestionGroupName, InspectionTypeId, IsDelete,
              QuestionGroupGuid, Timestamp) values (?,?,?,?,?,?)`,
                [
                  obj.Id,
                  obj.QuestionGroupName,
                  obj.InspectionTypeId,
                  obj.IsDelete,
                  obj.QuestionGroupGuid,
                  obj.Timestamp,
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update QuestionGroup set Id=?, QuestionGroupName=?, InspectionTypeId=?,
              IsDelete=?, Timestamp=? where QuestionGroupGuid=?`,
                [
                  obj.Id,
                  obj.QuestionGroupName,
                  obj.InspectionTypeId,
                  obj.IsDelete,
                  obj.Timestamp,
                  obj.QuestionGroupGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }
  async insertTableInspectionImage(arrQA: QuestionAnswer[], arrQAI) {
    const arrInsertRows = [];
    const fileTransfer: FileTransferObject = this.transfer.create();
    for (const obj of arrQA) {
      arrQAI.forEach((element) => {
        if (obj.QuestionAnswerGuid == element.QuestionAnswerGuid) {
          fileTransfer
            .download(element["ImagePath"], this.file.dataDirectory + element.ImageName)
            .then(
              async (res) => {
                let naiveurl = await this.pathForImage(res.nativeURL);
                const query1 = `insert into InspectionImage(Name, Path, Filepath, Timestamp, InspectionGuid, QuestionAnswerGuid,QuestionAnswerImageGuid, IsSync)
          values (?,?,?,?,?,?,?,?)`;

                await this.db
                  .executeSql(query1, [
                    element.ImageName,
                    naiveurl,
                    res.nativeURL,
                    element.Timestamp,
                    element.InspectionGuid,
                    element.QuestionAnswerGuid,
                    element.QuestionAnswerImageGuid,
                    true,
                  ])
                  .then(() => { })
                  .catch((e) => { console.log(e) });
                const query2 = `insert into QuestionAnswerImage(ImageName, OriginalImageName, QuestionAnswerGuid, IsDelete,
              QuestionAnswerImageGuid, Timestamp, InspectionGuid, IsSync) values (?,?,?,?,?,?,?,?)`;

                await this.db
                  .executeSql(query2, [
                    element.ImageName,
                    element.ImageName,
                    element.QuestionAnswerGuid,
                    element.IsDelete,
                    element.QuestionAnswerImageGuid,
                    element.Timestamp,
                    element.InspectionGuid,
                    true,
                  ])
                  .then(() => { })
                  .catch((e) => { console.log(e) });
              },
              (err) => {

              }
            );
        }
      });
    }
  }



  async insertMaterialRoom(arrRoom) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arrRoom) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into MaterialRoom( roomGuid ,record_id , job_id , client_material_id ,material_id,
            room_number,floor_number, sq_feet, linear_feet_0_4, linear_feet_5_7,
            linear_feet_8_12, linear_feet_12_up, Ends, Hangers,damage_puncture,
            damage_vibration, damage_water, damage_air, damage_delamination, damage_slow_deterioration,
           damage_use_wear, damage_extent, damage_feet, access, access_frequency, risk_vibration,
           risk_air_move, risk_dist_potential, acm_condition, acm_height, IsDelete) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      } else {
        await this.db
          .executeSql("select 1 from MaterialRoom where roomGuid=?", [obj.MaterialRoomGuid])
          .then((data) => {
            if (data.rows.length === 0) {
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
            } else {
              arrUpdateRows.push([
                `update MaterialRoom set record_id=?,job_id=?,client_material_id=?, material_id=?, room_number=?,floor_number=?, sq_feet=?, linear_feet_0_4=?, 
                linear_feet_5_7=?,linear_feet_8_12=?, linear_feet_12_up=?,Ends=?, Hangers=?,damage_puncture=?,damage_vibration=?,damage_water=?,
                damage_air=? , damage_delamination=? ,damage_slow_deterioration=? ,damage_use_wear=? , damage_extent=?,damage_feet=?,access=?,access_frequency=?,risk_vibration=?,
                risk_air_move=?,risk_dist_potential=?,acm_condition=?,acm_height=? where roomGuid=?`,
                [
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
                  obj.MaterialRoomGuid,
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }
  pathForImage(img: string) {
    if (img === null) {
      return "";
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }
  selectAllInspectionData(guid: string): Promise<Inspection[]> {
    return new Promise(async (resolve) => {
      await this.sqlite
        .create(this.dbCreate)
        .then(async (db: SQLiteObject) => {
          this.db = db;
          let query = `select * from Inspection where IsDelete='false' and IsCheckedIn = 'false'`;

          if (guid !== "") {
            query = `select * from Inspection where IsDelete='false' and IsCheckedIn = 'false' and InspectionGuid='${guid}'`;
          }
          await this.db
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
                    InspectorPhoneNumber: data.rows.item(i)
                      .InspectorPhoneNumber,
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

                return resolve(this.arrInspection);
              }
            })
            .catch(() => {
              return resolve([]);
            });
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }
  selectAllInspectionSample(guid: string): Promise<any[]> {
    return new Promise(async (resolve) => {
      await this.sqlite
        .create(this.dbCreate)
        .then(async (db: SQLiteObject) => {
          this.db = db;
          let query = `select * from InspectionSample where InspectionGuid in (select InspectionGuid from Inspection where
          IsDelete='false' and IsCheckedIn = 'false')`;
          if (guid !== "") {
            query = `select * from InspectionSample where InspectionGuid='${guid}'`;
          }
          await this.db
            .executeSql(query, [])
            .then((data) => {
              if (data.rows.length > 0) {
                this.arrSample = [];

                for (let i = 0; i < data.rows.length; i++) {
                  this.arrSample.push({
                    sample_id: data.rows.item(i).sample_id,
                    job_id: data.rows.item(i).job_id,
                    InspectionGuid: data.rows.item(i).InspectionGuid,
                    SampleGuid: data.rows.item(i).SampleGuid,
                    analysis_type: data.rows.item(i).analysis_type,
                    sample_type: data.rows.item(i).sample_type,
                    sample_vol: data.rows.item(i).sample_vol,
                    flow_rate: data.rows.item(i).flow_rate,
                    width: data.rows.item(i).width,
                    length: data.rows.item(i).length,
                    weight: data.rows.item(i).weight,
                    comment: data.rows.item(i).comment,
                    sample_desc: data.rows.item(i).sample_desc,
                    sample_loc: data.rows.item(i).sample_loc,
                    client_sample_id: data.rows.item(i).client_sample_id,
                    date_collected: data.rows.item(i).date_collected,
                    control_sample:
                      data.rows.item(i).control_sample == "true" ? true : false,
                    fb_sample:
                      data.rows.item(i).fb_sample == "true" ? true : false,
                    sampling_start_time: data.rows.item(i).sampling_start_time,
                    sampling_end_time: data.rows.item(i).sampling_end_time,
                    sampling_duration: data.rows.item(i).sampling_duration,
                    Include_Paint_chips:
                      data.rows.item(i).Include_Paint_chips == "true"
                        ? true
                        : false,
                    Surface_Smooth_Clean:
                      data.rows.item(i).Surface_Smooth_Clean == "true"
                        ? true
                        : false,
                    turn_around: data.rows.item(i).turn_around,
                    squarefeet: data.rows.item(i).squarefeet,
                    purpose: data.rows.item(i).purpose,
                    WSSN: data.rows.item(i).WSSN == "true" ? true : false,
                    IncludeCUAnalysis:
                      data.rows.item(i).IncludeCUAnalysis == "true"
                        ? true
                        : false,
                    volume: data.rows.item(i).volume,
                    InspectorId: data.rows.item(i).InspectorId,
                    ship_method: data.rows.item(i).ship_method,
                    waybill: data.rows.item(i).waybill,
                    ship_date: data.rows.item(i).ship_date,
                    metal_analysis: data.rows.item(i).Other_metal_analysis,
                    other_element_analysis: data.rows.item(i)
                      .other_element_analysis,
                    TimeCollected: data.rows.item(i).TimeCollected,
                    BottleSizeId: data.rows.item(i).BottleSizeId,
                    material_id: data.rows.item(i).material_id,
                    Client_Material_Id: data.rows.item(i).Client_Material_Id,
                    Lab_Id_Client: data.rows.item(i).Lab_Id_Client,
                    IsDelete: data.rows.item(i).IsDelete,
                    SortOrder: data.rows.item(i).SortOrder
                  });
                }
                return resolve(this.arrSample);
              }
            })
            .catch(() => {
              return resolve([]);
            });
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }



  selectAllQuestionAnswerData(guid: string): Promise<QuestionAnswer[]> {
    return new Promise(async (resolve) => {
      let query = `select * from QuestionAnswer where InspectionGuid in (select InspectionGuid from
        Inspection where IsDelete='false' and IsCheckedIn = 'false')`;

      if (guid !== "") {
        query = `select * from QuestionAnswer where InspectionGuid='${guid}'`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrQuestionAnswer = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrQuestionAnswer.push({
                Id: data.rows.item(i).Id,
                InspectionGuid: data.rows.item(i).InspectionGuid,
                QuestionId: data.rows.item(i).QuestionId,
                QuestionOptionId: data.rows.item(i).QuestionOptionId,
                Answer: data.rows.item(i).Answer,
                Selected: data.rows.item(i).Selected,
                IsDelete: data.rows.item(i).IsDelete,
                QuestionAnswerGuid: data.rows.item(i).QuestionAnswerGuid,
                Timestamp: data.rows.item(i).Timestamp,
                Comment: data.rows.item(i).Comment,
                InspectorId: data.rows.item(i).InspectorId,
                QuestionInspectionGuid: data.rows.item(i).QuestionInspectionGuid,
              });
            }
            return resolve(this.arrQuestionAnswer);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }
  selectAllMaterialListModels(guid: string): Promise<QuestionAnswer[]> {
    return new Promise(async (resolve) => {
      // let query = `select * from MaterialListModels where Job_Id in (select JobId from Inspection where IsDelete = 'false')`;
      let query = `select m.*,om.material_id,om.Name as OtherMaterial,oc.Name as OtherColor from MaterialListModels m
      left join MaterialDropDownList om on om.Material_Type ='Material' and om.Name = m.Material and om.Material_Id is null
      left join MaterialDropDownList oc on oc.Material_Type ='Color' and oc.Name = m.Color and oc.Material_Id is null
      where m.Job_Id in 
      (select JobId from Inspection where IsDelete = 'false')`;

      //     let query = `select group_concat(ml.Name) as Other_Material_Locations,m.*,om.material_id,om.Name as OtherMaterial,oc.Name as OtherColor from MaterialListModels m
      //     left join MaterialDropDownList om on om.Material_Type ='Material' and om.Name = m.Material and om.Material_Id is null
      //     left join MaterialDropDownList oc on oc.Material_Type ='Color' and oc.Name = m.Color and oc.Material_Id is null
      //     left join MaterialLocations ml on  
      //       (m.Material_Locations LIKE ml.Id || ',%' OR m.Material_Locations LIKE  '%,' || ml.Id || ',%' OR m.Material_Locations LIKE '%,' || ml.Id OR m.Material_Locations = ml.Id)
      //       and ml.IsSync = 'false'
      //     where m.Job_Id in 
      //   (select JobId from Inspection where IsDelete = 'false')
      // group by m.job_id,m.client_material_id,m.Material_Locations`;

      if (guid !== "") {
        // query = `select * from MaterialListModels where Job_Id in (select JobId from
        //   Inspection where InspectionGuid='${guid}' and IsCheckedIn = 'false')`;
        query = `select m.*,om.material_id,om.Name as OtherMaterial,oc.Name as OtherColor from MaterialListModels m
        left join MaterialDropDownList om on om.Material_Type ='Material' and om.Name = m.Material and om.Material_Id is null
        left join MaterialDropDownList oc on oc.Material_Type ='Color' and oc.Name = m.Color and oc.Material_Id is null
        where m.Job_Id in 
        (select JobId from Inspection where InspectionGuid='${guid}' and IsCheckedIn = 'false')`;
        // query = `select group_concat(ml.Name) as Other_Material_Locations ,m.*,om.material_id,om.Name as OtherMaterial,oc.Name as OtherColor from MaterialListModels m
        // left join MaterialDropDownList om on om.Material_Type ='Material' and om.Name = m.Material and om.Material_Id is null
        // left join MaterialDropDownList oc on oc.Material_Type ='Color' and oc.Name = m.Color and oc.Material_Id is null
        // left join MaterialLocations ml on  
        //   (m.Material_Locations LIKE ml.Id || ',%' OR m.Material_Locations LIKE  '%,' || ml.Id || ',%' OR m.Material_Locations LIKE '%,' || ml.Id OR m.Material_Locations = ml.Id)
        //   and ml.IsSync = 'false'
        // where m.Job_Id in 
        // (select JobId from Inspection where InspectionGuid='${guid}' and IsCheckedIn = 'false')
        // group by m.Material_Locations`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrMaterialModel = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrMaterialModel.push({
                Id: data.rows.item(i).Id,
                Job_Id: data.rows.item(i).Job_Id,
                Client_Material_Id: data.rows.item(i).Client_Material_Id,
                Material: data.rows.item(i).Material,
                Material_Sub: data.rows.item(i).Material_Sub,
                Classification: data.rows.item(i).Classification,
                Friable: data.rows.item(i).Friable,
                Size: data.rows.item(i).Size,
                Color: data.rows.item(i).Color,
                Material_Locations: data.rows.item(i).Material_Locations,
                Note_1: data.rows.item(i).Note_1,
                Note_2: data.rows.item(i).Note_2,
                Quantity: data.rows.item(i).Quantity,
                Units: data.rows.item(i).Units,
                Assumed: data.rows.item(i).Assumed,
                IsDelete: data.rows.item(i).IsDelete,
                OtherMaterial: data.rows.item(i).OtherMaterial,
                OtherColor: data.rows.item(i).OtherColor,
                // Other_Material_Locations:data.rows.item(i).Other_Material_Locations
              });
            }
            return resolve(this.arrMaterialModel);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }
  selectAllOtherMaterialLocation(guid: string): Promise<QuestionAnswer[]> {
    return new Promise(async (resolve) => {
      let query = `select * from MaterialLocations where IsSync = 'false'`;
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrOtherMaterialLocationModel = [];
            for (let i = 0; i < data.rows.length; i++) {
              this.arrOtherMaterialLocationModel.push({
                Id: data.rows.item(i).Id,
                Name: data.rows.item(i).Name,
              });
            }
            return resolve(this.arrOtherMaterialLocationModel);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }
  selectMaterialRoom(guid): Promise<any> {
    return new Promise(async (resolve) => {
      let query = `select * from MaterialRoom where job_id in (select JobId from Inspection where IsDelete = 'false')`;

      if (guid !== "") {
        query = `select * from MaterialRoom where job_id in (select JobId from
          Inspection where InspectionGuid='${guid}' and IsCheckedIn = 'false')`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrMaterialModel = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrMaterialModel.push({
                MaterialRoomGuid: data.rows.item(i).roomGuid,
                Record_Id: data.rows.item(i).record_id,
                Job_Id: data.rows.item(i).job_id,
                Client_Material_id: data.rows.item(i).client_material_id,
                Material_id: data.rows.item(i).material_id,
                Room_Number: data.rows.item(i).room_number,
                Floor_Number: data.rows.item(i).floor_number,
                Sq_Feet: data.rows.item(i).sq_feet,
                Linear_Feet_0_4: data.rows.item(i).linear_feet_0_4,
                Linear_Feet_5_7: data.rows.item(i).linear_feet_5_7,
                Linear_Feet_8_12: data.rows.item(i).linear_feet_8_12,
                Linear_Feet_12_up: data.rows.item(i).linear_feet_12_up,
                Ends: data.rows.item(i).Ends,
                Hangers: data.rows.item(i).Hangers,
                Damage_Puncture: data.rows.item(i).damage_puncture,
                Damage_Vibration: data.rows.item(i).damage_vibration,
                Damage_Water: data.rows.item(i).damage_water,
                Damage_Air: data.rows.item(i).damage_air,
                Damage_Delamination: data.rows.item(i).damage_delamination,
                Damage_Slow_Deterioration: data.rows.item(i)
                  .damage_slow_deterioration,
                Damage_Use_Wear: data.rows.item(i).damage_use_wear,
                Damage_Extent: data.rows.item(i).damage_extent,
                Damage_Feet: data.rows.item(i).damage_feet,
                Access: data.rows.item(i).access,
                Access_Frequency: data.rows.item(i).access_frequency,
                Risk_Vibration: data.rows.item(i).risk_vibration,
                Risk_Air_Move: data.rows.item(i).risk_air_move,
                Risk_Dist_Potential: data.rows.item(i).risk_dist_potential,
                Acm_Condition: data.rows.item(i).acm_condition,
                Acm_Height: data.rows.item(i).acm_height,
                IsDelete: data.rows.item(i).IsDelete,
              });
            }
            return resolve(this.arrMaterialModel);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }
  selectAllQuestionAnswerImageData(
    guid: string
  ): Promise<QuestionAnswerImage[]> {
    return new Promise(async (resolve) => {
      let query = `select * from QuestionAnswerImage where IsDelete='false' and InspectionGuid in (select InspectionGuid from
        Inspection where IsDelete='false' and IsCheckedIn = 'false')`;

      if (guid !== "") {
        query = `select * from QuestionAnswerImage where InspectionGuid='${guid}'`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrQuestionAnswerImage = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrQuestionAnswerImage.push({
                Id: data.rows.item(i).Id,
                ImageName: data.rows.item(i).ImageName,
                OriginalImageName: data.rows.item(i).OriginalImageName,
                QuestionAnswerGuid: data.rows.item(i).QuestionAnswerGuid,
                IsDelete: data.rows.item(i).IsDelete,
                QuestionAnswerImageGuid: data.rows.item(i).QuestionAnswerImageGuid,
                Timestamp: data.rows.item(i).Timestamp,
                InspectionGuid: data.rows.item(i).InspectionGuid,
              });
            }
            return resolve(this.arrQuestionAnswerImage);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }

  selectAllInspectionImageData(guid: string): Promise<InspectionImage[]> {
    return new Promise(async (resolve) => {
      let query = `select * from InspectionImage where InspectionGuid in (select InspectionGuid from Inspection where
        IsSync='false' and IsDelete='false' and IsCheckedIn = 'false')`;

      if (guid !== "") {
        query = `select * from InspectionImage where IsSync='false'  and InspectionGuid='${guid}'`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrInspectionImage = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrInspectionImage.push({
                Id: data.rows.item(i).Id,
                Name: data.rows.item(i).Name,
                Path: data.rows.item(i).Path,
                Filepath: data.rows.item(i).Filepath,
                Timestamp: data.rows.item(i).Timestamp,
                InspectionGuid: data.rows.item(i).InspectionGuid,
                QuestionAnswerGuid: data.rows.item(i).QuestionAnswerGuid,
                IsSync: data.rows.item(i).QuestionAnswerGuid,
                QuestionAnswerImageId: 0,
                QuestionAnswerImageGuid: data.rows.item(i).QuestionAnswerImageGuid
              });
            }
            return resolve(this.arrInspectionImage);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }

  selectAllPropertyImageData(guid: string): Promise<InpsectionPropertyImage[]> {

    return new Promise(async (resolve) => {
      let query = `select * from InpsectionPropertyImage where InspectionGuid in (select InspectionGuid from Inspection where
        IsDelete='false' and IsCheckedIn = 'false') and IsSync='false'`;

      if (guid !== "") {
        query = `select * from InpsectionPropertyImage where IsSync='false' and InspectionGuid='${guid}'`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrPropertyImage = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrPropertyImage.push({
                Id: data.rows.item(i).Id,
                Name: data.rows.item(i).Name,
                Path: data.rows.item(i).Path,
                Filepath: data.rows.item(i).Filepath,
                Timestamp: data.rows.item(i).Timestamp,
                InspectionGuid: data.rows.item(i).InspectionGuid,
                IsDelete: data.rows.item(i).IsDelete,
                IsSync: data.rows.item(i).IsSync,
              });
            }
            return resolve(this.arrPropertyImage);
          }
        })
        .catch(() => {

          return resolve([]);
        });
      return resolve([]);
    });
  }

  selectAllMaterialImageData(guid: string): Promise<MaterialImage[]> {
    return new Promise(async (resolve) => {
      let query = `select * from MaterialImage where Job_Id in (select JobId from Inspection where
        IsDelete='false' and IsCheckedIn = 'false' and IsSync='false')`;

      if (guid !== "") {
        query = `select * from MaterialImage where  Job_Id in(select JobId from Inspection where InspectionGuid='${guid}' and IsCheckedIn = 'false')`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {

          if (data.rows.length > 0) {
            this.arrMaterialImage = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrMaterialImage.push({
                Id: data.rows.item(i).Id,
                Name: data.rows.item(i).Name,
                Path: data.rows.item(i).Path,
                Filepath: data.rows.item(i).Filepath,
                MaterialImageGuid: data.rows.item(i).MaterialImageGuid,
                Client_Material_Id: data.rows.item(i).Client_Material_Id,
                Job_Id: data.rows.item(i).Job_Id,
                IsDelete: data.rows.item(i).IsDelete,
                IsSync: data.rows.item(i).IsSync,
              });
            }
            return resolve(this.arrMaterialImage);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }

  selectAllQuestionTableAnswerData(
    guid: string
  ): Promise<QuestionTableAnswer[]> {
    return new Promise(async (resolve) => {
      let query = `select * from QuestionTableAnswer where IsDelete='false' and InspectionGuid in (select InspectionGuid from
        Inspection where IsDelete='false' and IsCheckedIn = 'false')`;

      if (guid !== "") {
        query = `select * from QuestionTableAnswer where InspectionGuid='${guid}' and IsDelete='false'`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrQuestionTableAnswer = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrQuestionTableAnswer.push({
                Id: data.rows.item(i).Id,
                QuestionTableId: data.rows.item(i).QuestionTableId,
                Index: data.rows.item(i).Index,
                IsDelete: data.rows.item(i).IsDelete,
                QuestionTableAnswerGuid: data.rows.item(i)
                  .QuestionTableAnswerGuid,
                Timestamp: data.rows.item(i).Timestamp,
                QuestionAnswerGuid: data.rows.item(i).QuestionAnswerGuid,
                Answer: data.rows.item(i).Answer,
                InspectionGuid: data.rows.item(i).InspectionGuid,
              });
            }
            return resolve(this.arrQuestionTableAnswer);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }

  updateAllTables(
    res: AllDataRepsonse,
    isFromSyncWithCheckout?
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (this.globalService.SyncTableType === this.SyncType.SyncQuestions && res.Data.Inspections.length > 0) {
        await this.insertTableInspection(res.Data.Inspections);
      }

      if (this.globalService.SyncTableType === this.SyncType.SyncQuestions && res.Data.Questions.length > 0) {
        if (!!res.Data.ModifiedInspectionTypes) {
          await this.db.executeSql(
            "delete from Question where InspectionTypeId=?",
            [res.Data.ModifiedInspectionTypes]
          );

        }
        await this.insertTableQuestion(res.Data.Questions);
      }

      if (this.globalService.SyncTableType === this.SyncType.SyncQuestions && res.Data.QuestionRelations.length > 0) {
        await this.insertTableQuestionRelation(res.Data.QuestionRelations);
      }

      if (this.globalService.SyncTableType === this.SyncType.SyncQuestions && res.Data.InspectionTypes.length > 0) {
        await this.insertTableInspectionType(res.Data.InspectionTypes);
        // if (this.globalService.SyncTableType === this.SyncType.SyncQuestions) {
          await this.updateCurrentVersion(res.Data.InspectionTypes)
        // }
      }

      if (this.globalService.SyncTableType === this.SyncType.SyncQuestions && res.Data.QuestionTables.length > 0) {
        await this.insertTableQuestionTable(res.Data.QuestionTables);
      }

      if (this.globalService.SyncTableType === this.SyncType.SyncQuestions &&  res.Data.Options.length > 0) {
        await this.insertTableOption(res.Data.Options);
      }

      if (res.Data.QuestionAnswers.length > 0) {
        await this.insertTableQuestionAnswer(res.Data.QuestionAnswers);
      }

      if (res.Data.QuestionTableAnswers.length > 0) {
        await this.insertTableQuestionTableAnswer(
          res.Data.QuestionTableAnswers
        );
      }

      if (res.Data.QuestionAnswerImages.length > 0) {
        await this.insertTableQuestionAnswerImage(
          res.Data.QuestionAnswers,
          res.Data.QuestionAnswerImages
        );
        // await this.insertTableInspectionImage(
        //   res.Data.QuestionAnswers,
        //   res.Data.QuestionAnswerImages
        // );
      }



      if (this.globalService.SyncTableType === this.SyncType.SyncQuestions && res.Data.QuestionGroup.length > 0) {
        await this.insertTableQuestionGroup(res.Data.QuestionGroup);
      }



      // if (!!res.Data.ModifiedInspectionTypes) {
      //   await this.deleteAllAnswerForInspectionType(
      //     res.Data.ModifiedInspectionTypes
      //   );
      // }
      if (res.Data.Samples.length > 0) {
        this.insertTableSample(res.Data.Samples)
      }
      if (res.Data.MaterialListModels.length != 0) {
        await this.insertTableMaterial(res.Data.MaterialListModels);
      }
      if (res.Data.MaterialRoomListModels.length != 0) {
        await this.insertMaterialRoom(res.Data.MaterialRoomListModels);
      }
      if (res.Data.MaterialImageList.length != 0) {
        await this.updateTableMaterialImage(
          res.Data.MaterialImageList
        );
      }
      if (res.Data.InspectionPropertyImage.length != 0) {
        await this.updateTablePropertyImage(
          res.Data.InspectionPropertyImage
        );
      }

      if (!!res.Data.InspectionQuestionImages && res.Data.InspectionQuestionImages.length > 0) {
        this.insertUpdateInsQueImages(res.Data.InspectionQuestionImages)
      }

      if (!!res.Data.AppFieldSuggestions && res.Data.AppFieldSuggestions.length > 0) {
        this.insertUpdateAppFieldSuggestions(res.Data.AppFieldSuggestions)
      }

      if (!!res.Data.MaterialConfig && res.Data.MaterialConfig.length > 0) {
        this.insertUpdateMaterialConfig(res.Data.MaterialConfig)
      }

      if (!!res.Data.SyncInspectionsGuid && isFromSyncWithCheckout) {
        await this.deleteAllCompletedData(res.Data.SyncInspectionsGuid);
      }

      //Delete newly added other material and other color after sync as new data will be fetched from api
      await this.deleteOtherCategoryAfterSync();

      if (!!res.Data.MaterialDropDownList && res.Data.MaterialDropDownList.length > 0) {
        this.insertUpdateMaterialDropDownList(res.Data.MaterialDropDownList)
      }

      if (!!res.Data.MaterialLocations && res.Data.MaterialLocations.length > 0) {
        this.insertUpdateMaterialLocations(res.Data.MaterialLocations)
      }

      if (!!res.Data.SyncInspectionsGuid && isFromSyncWithCheckout) {
        await this.deleteAllCompletedData(res.Data.SyncInspectionsGuid);

      }

      return resolve(true);
    });
  }


  async updateCurrentVersion(arr: InspectionType[]) {
    const arrUpdateRows = [];
    for (const obj of arr) {
      arrUpdateRows.push([
        `update Inspection set CurrentVersion=? where
          InspectionTypeId=? and  IsDelete='false'`,
        [
          obj.CurrentVersion,
          obj.Id,
        ],
      ]);

    }
    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }



  async insertTableCheckOut(arrCompleteInspectionGuid?) {
    const arrInsertRows = [];
    await this.db
      .executeSql(`select * from MaterialListModels where Job_Id in (select JobId from Inspection where 
      InspectionGuid=${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "MaterialListModels",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });


    await this.db
      .executeSql(`select * from  MaterialRoom where job_id in (select JobId from
        Inspection where InspectionGuid=${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "MaterialRoom",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });

    await this.db
      .executeSql(`select * from Inspection where InspectionGuid in (${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {

        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "Inspection",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });

    await this.db
      .executeSql(`select * from QuestionAnswer where InspectionGuid in (${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "QuestionAnswer",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });

    await this.db
      .executeSql(`select * from QuestionTableAnswer where InspectionGuid in (${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "QuestionTableAnswer",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });

    await this.db
      .executeSql(`select * from QuestionAnswerImage where InspectionGuid in (${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "QuestionAnswerImage",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });

    await this.db
      .executeSql(`select * from InspectionImage where InspectionGuid in (${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "InspectionImage",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });


    await this.db
      .executeSql(`select * from MaterialImage WHERE Job_Id in(SELECT JobId from Inspection WHERE InspectionGuid in (${arrCompleteInspectionGuid}))`, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "MaterialImage",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });


    await this.db
      .executeSql(`select * from InspectionSample where InspectionGuid in (${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {
        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "InspectionSample",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });

    await this.db
      .executeSql(`select * from ArchiveInspection where InspectionGuid in (${arrCompleteInspectionGuid})`, [])
      .then(async (data) => {

        if (data.rows.length > 0) {
          let syncTableList: any = [];
          for (var i = 0; i < data.rows.length; i++) {
            syncTableList.push(
              data.rows.item(i)
            );
          }
          var jsonString = JSON.stringify(syncTableList);
          let archiveDate: any = await this.NewDT();
          arrInsertRows.push([
            `insert into SyncTableArchive(LoginId,TableName,Type,Data,DateTime,IsSync) values (?,?,?,?,?,?)`,
            [
              Number(localStorage.getItem("empId")),
              "ArchiveInspection",
              this.globalService.SyncTableType,
              jsonString,
              archiveDate,
              false
            ],
          ]);
        }
      })
      .catch(() => {

      });

    if (arrInsertRows.length > 0) {

      this.db
        .sqlBatch(arrInsertRows)
        .then(() => {

          if (this.globalService.SyncTableType == this.SyncType.CheckIn) {
            this.syncTableCheckoutArchiveFunction(arrCompleteInspectionGuid);
          }
          else if (this.globalService.SyncTableType == this.SyncType.ArchiveSlideDelete) {

            this.syncTableSlideDeleteArchiveFunction(arrCompleteInspectionGuid);
          }

        })
        .catch((error) => {
          this.loaderService.dismiss();
          this.globalService.presentAlert(this.translateService.instant('Inspection.archiveError'));
          // this.events.publish('sendArchiveEmail');

          let obj = { "InspectionGuid": arrCompleteInspectionGuid };
          this.events.publish("sendArchiveEmail", obj);

        });
    }

  }

  async deleteAllCompletedData(arrCompleteInspectionGuid: string) {
    this.maxId = 0;

    var query = `SELECT max(id) as maxID FROM syncTableArchive;`
    this.db.executeSql(query, []).then(
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
    await this.insertTableCheckOut(arrCompleteInspectionGuid);


    this.events.subscribe("syncTableCheckoutSuccess", async (data) => {

      //stop delete code while checkin


      // const arrDelete = [];
      // arrDelete.push(
      //   `delete from MaterialListModels where Job_Id in (select JobId from
      //     Inspection where InspectionGuid=${arrCompleteInspectionGuid})`
      // );

      // arrDelete.push(
      //   `delete from MaterialRoom where job_id in (select JobId from
      //     Inspection where InspectionGuid=${arrCompleteInspectionGuid})`
      // );
      // arrDelete.push(
      //   `delete from MaterialImage WHERE Job_Id in(SELECT JobId from Inspection WHERE InspectionGuid in (${arrCompleteInspectionGuid}))`
      // );

      // arrDelete.push(
      //   `delete from Inspection where InspectionGuid in (${arrCompleteInspectionGuid})`
      // );

      // arrDelete.push(
      //   `delete from QuestionAnswer where InspectionGuid in (${arrCompleteInspectionGuid})`
      // );

      // arrDelete.push(
      //   `delete from QuestionTableAnswer where InspectionGuid in (${arrCompleteInspectionGuid})`
      // );

      // arrDelete.push(
      //   `delete from QuestionAnswerImage where InspectionGuid in (${arrCompleteInspectionGuid})`
      // );

      // arrDelete.push(
      //   `delete from InspectionImage where InspectionGuid in (${arrCompleteInspectionGuid})`
      // );



      // arrDelete.push(
      //   `delete from InspectionSample where InspectionGuid in (${arrCompleteInspectionGuid})`
      // );


      // await this.db
      //   .sqlBatch(arrDelete)
      //   .then((res) => {

      //   })
      //   .catch((err) => {

      //   });

      this.events.publish("deleteCheckoutData", true);
      setTimeout(() => {
        this.events.unsubscribe('syncTableCheckoutSuccess');
      }, 2500);

    });
  }

  async syncTableCheckoutArchiveFunction(arrCompleteInspectionGuid?) {
    let obj = { "InspectionGuid": arrCompleteInspectionGuid };
    this.events.publish("syncTableCheckoutArchiveRequest", obj);
  }

  syncTableSlideDeleteArchiveFunction(arrCompleteInspectionGuid?) {

    let obj = { "InspectionGuid": arrCompleteInspectionGuid };
    this.events.publish("syncTableSlideDeleteArchiveRequest", obj);
  }

  selectSyncTableArchive(): Promise<any> {
    return new Promise(async (resolve) => {
      let query = `select * from SyncTableArchive where Id > ${this.maxId}`;
      await this.db
        .executeSql(query, [])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrSyncTableArchiveModel = [];

            for (let i = 0; i < data.rows.length; i++) {
              this.arrSyncTableArchiveModel.push({
                Id: data.rows.item(i).Id,
                LoginId: data.rows.item(i).LoginId,
                TableName: data.rows.item(i).TableName,
                Data: data.rows.item(i).Data,
                Type: data.rows.item(i).Type,
                DateTime: data.rows.item(i).DateTime
              });
            }
            return resolve(this.arrSyncTableArchiveModel);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }


  async NewDT(): Promise<any> {
    return new Promise(async resolve => {
      const query = `select datetime('now') as Archive_Date`;
      await this.db.executeSql(query, []).then(async data => {
        if (data.rows.length > 0) {
          return resolve(data.rows.item(0).Archive_Date);
        }
      }).catch(() => {
      });
    });
  }


  uploadSyncTableArchiveImage(imagesList: any) {
    this.events.publish("SyncTableArchiveImageList", imagesList);
  }

  getAllActiveSample(): Promise<any[]> {
    return new Promise(async (resolve) => {
      await this.sqlite
        .create(this.dbCreate)
        .then(async (db: SQLiteObject) => {
          this.db = db;
          let query = `select * from InspectionSample where IsDelete='false' and InspectionGuid='${this.globalService.objJsonString.InspectionGuid}' ORDER by client_sample_id COLLATE NOCASE ASC`;
          await this.db
            .executeSql(query, [])
            .then((data) => {
              if (data.rows.length > 0) {
                let arrSample = [];
                for (let i = 0; i < data.rows.length; i++) {
                  arrSample.push({
                    job_id: data.rows.item(i).job_id,
                    InspectionGuid: data.rows.item(i).InspectionGuid,
                    SampleGuid: data.rows.item(i).SampleGuid,
                    analysis_type: data.rows.item(i).analysis_type,
                    sample_type: data.rows.item(i).sample_type,
                    sample_vol: data.rows.item(i).sample_vol,
                    flow_rate: data.rows.item(i).flow_rate,
                    width: data.rows.item(i).width,
                    length: data.rows.item(i).length,
                    weight: data.rows.item(i).weight,
                    comment: data.rows.item(i).comment,
                    sample_desc: data.rows.item(i).sample_desc,
                    sample_loc: data.rows.item(i).sample_loc,
                    date_collected: data.rows.item(i).date_collected,
                    control_sample: data.rows.item(i).control_sample,
                    fb_sample: data.rows.item(i).fb_sample,
                    sampling_start_time: data.rows.item(i).sampling_start_time,
                    sampling_end_time: data.rows.item(i).sampling_end_time,
                    sampling_duration: data.rows.item(i).sampling_duration,
                    IncludePaintchips: data.rows.item(i).Include_Paint_chips,
                    SurfaceSmoothClean: data.rows.item(i).Surface_Smooth_Clean,
                    turn_around: data.rows.item(i).turn_around,
                    squarefeet: data.rows.item(i).squarefeet,
                    purpose: data.rows.item(i).purpose,
                    WSSN: data.rows.item(i).WSSN,
                    IncludeCUAnalysis: data.rows.item(i).IncludeCUAnalysis,
                    volume: data.rows.item(i).volume,
                    client_sample_id: data.rows.item(i).client_sample_id,
                    ship_method: data.rows.item(i).ship_method,
                    waybill: data.rows.item(i).waybill,
                    ship_date: data.rows.item(i).ship_date,
                    Other_metal_analysis: data.rows.item(i).Other_metal_analysis,
                    other_element_analysis: data.rows.item(i).other_element_analysis,
                    TimeCollected: data.rows.item(i).TimeCollected,
                    BottleSizeId: data.rows.item(i).BottleSizeId,
                    material_id: data.rows.item(i).material_id,
                    Client_Material_Id: data.rows.item(i).Client_Material_Id,
                    Lab_Id_Client: data.rows.item(i).Lab_Id_Client,
                    SortOrder: data.rows.item(i).SortOrder
                  });
                }
                return resolve(arrSample);
              }
            })
            .catch(() => {
              return resolve([]);
            });
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }

  async deleteAllAnswerForInspectionType(arrInprogressInspectionType: string) {
    const arrDeleteAnswers = [];
    arrDeleteAnswers.push(`delete from Inspection where InspectionGuid in (select InspectionGuid from Inspection where
      InspectionTypeId in (${arrInprogressInspectionType}) and Status=${StatusTypes.InProgress})`);
    arrDeleteAnswers.push(`delete from QuestionAnswer where InspectionGuid in (select InspectionGuid from Inspection where
      InspectionTypeId in (${arrInprogressInspectionType}) and Status=${StatusTypes.InProgress})`);
    arrDeleteAnswers.push(`delete from QuestionTableAnswer where InspectionGuid in (select InspectionGuid from Inspection
      where InspectionTypeId in (${arrInprogressInspectionType}) and Status=${StatusTypes.InProgress})`);
    arrDeleteAnswers.push(`delete from QuestionAnswerImage where InspectionGuid in (select InspectionGuid from Inspection
      where InspectionTypeId in (${arrInprogressInspectionType}) and Status=${StatusTypes.InProgress})`);
    arrDeleteAnswers.push(`delete from InspectionImage where InspectionGuid in (select InspectionGuid from Inspection
      where InspectionTypeId in (${arrInprogressInspectionType}) and Status=${StatusTypes.InProgress})`);

    await this.db
      .sqlBatch(arrDeleteAnswers)
      .then(() => { })
      .catch(() => { });
  }

  async insertInspectionQuestionImageList(arrInsQueImg: InspectionQuestionImage[]) {
    const fileTransfer: FileTransferObject = this.transfer.create();
    for (const element of arrInsQueImg) {
      fileTransfer
        .download(element["ImagePath"], this.file.dataDirectory + element.Name)
        .then(
          async (res) => {
            let naiveurl = await this.pathForImage(res.nativeURL);
            const query = `insert into InspectionQuestionImage(Id,Name,Path,Filepath,Timestamp,InspectionQuestionImageGuid,InspectionGuid,QuestionGuid,IsSync,IsDelete) values (?,?,?,?,?,?,?,?,?,?)`;
            await this.db.executeSql(query, [element.Id, element.Name, naiveurl, res.nativeURL, element.Timestamp,
            element.InspectionQuestionImageGuid, element.InspectionGuid, element.QuestionGuid, true, element.IsDelete]).then((obj) => {
              console.log(obj);
            }).catch((err) => {
              console.log(err);
            });
          },
          (err) => {
            console.log(err);
          }
        );
    }
  }

  async insertInspectionQuestionImage(obj: InspectionQuestionImage) {
    const query = `insert into InspectionQuestionImage(Name, Path, Filepath, Timestamp, InspectionQuestionImageGuid, InspectionGuid, QuestionGuid, IsSync, IsDelete)
          values (?,?,?,?,?,?,?,?,?)`;
    await this.db.executeSql(query, [obj.Name, obj.Path, obj.Filepath, obj.Timestamp,
    obj.InspectionQuestionImageGuid, obj.InspectionGuid, obj.QuestionGuid, false, false]).then(() => { }).catch(() => { });
  }

  async removeInspectionQuestionImage(guid: string) {
    const query = `delete from InspectionQuestionImage where InspectionQuestionImageGuid=?`;
    await this.db.executeSql(query, [guid]).then(() => { }).catch(() => { });
  }

  selectAllInspectionQuestionImageData(guid: string): Promise<InspectionQuestionImage[]> {
    return new Promise(async (resolve) => {
      let query = `select * from InspectionQuestionImage where InspectionGuid in (select InspectionGuid from Inspection where
        IsDelete='false' and IsCheckedIn = 'false') and IsSync='false'`;

      if (guid !== "") {
        query = `select * from InspectionQuestionImage where IsSync='false' and InspectionGuid='${guid}'`;
      }
      await this.db
        .executeSql(query, [])
        .then((data) => {
          this.arrInspectionQuestionImage = [];
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              this.arrInspectionQuestionImage.push({
                Id: data.rows.item(i).Id,
                InspectionQuestionImageGuid: data.rows.item(i).InspectionQuestionImageGuid,
                Name: data.rows.item(i).Name,
                Path: data.rows.item(i).Path,
                Filepath: data.rows.item(i).Filepath,
                Timestamp: data.rows.item(i).Timestamp,
                InspectionGuid: data.rows.item(i).InspectionGuid,
                QuestionGuid: data.rows.item(i).QuestionGuid,
                IsSync: data.rows.item(i).IsSync,
                IsDelete: data.rows.item(i).IsDelete
              });
            }
            return resolve(this.arrInspectionQuestionImage);
          }
        })
        .catch(() => {
          return resolve([]);
        });
      return resolve([]);
    });
  }

  async updateInspectionQuestionImageName(obj: InspectionQuestionImage) {
    var query1 = `update InspectionQuestionImage set Name=?, Path=?,FilePath=?, Timestamp=?, IsSync=? where InspectionQuestionImageGuid=?`;
    await this.db
      .executeSql(query1, [
        obj.Name,
        obj.Path,
        obj.Filepath,
        obj.Timestamp,
        false,
        obj.InspectionQuestionImageGuid
      ])
      .then(() => { })
      .catch(() => { });
  }

  async insertUpdateInsQueImages(arr: InspectionQuestionImage[]) {

    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    for (const obj of arr) {
      if (timestampValue === null || timestampValue === "") {
        arrInsertRows.push([
          `insert into InspectionQuestionImage(Name, Path, Filepath, Timestamp, InspectionQuestionImageGuid, InspectionGuid, QuestionGuid, IsSync, IsDelete)
          values (?,?,?,?,?,?,?,?,?)`,
          [
            obj.Name,
            obj.Path,
            obj.Filepath,
            obj.Timestamp,
            obj.InspectionQuestionImageGuid,
            obj.InspectionGuid,
            obj.QuestionGuid,
            true,
            obj.IsDelete
          ],
        ]);
      } else {
        await this.db
          .executeSql(
            "select 1 from InspectionQuestionImage where Id=? OR Name =?",
            [obj.Id, obj.Name]
          )
          .then((data) => {
            if (data.rows.length === 0) {
              arrInsertRows.push([
                `insert into InspectionQuestionImage(Name, Path, Filepath, Timestamp, InspectionQuestionImageGuid, InspectionGuid, QuestionGuid, IsSync, IsDelete)
                values (?,?,?,?,?,?,?,?,?)`,
                [
                  obj.Name,
                  obj.Path,
                  obj.Filepath,
                  obj.Timestamp,
                  obj.InspectionQuestionImageGuid,
                  obj.InspectionGuid,
                  obj.QuestionGuid,
                  true,
                  obj.IsDelete
                ],
              ]);
            } else {
              arrUpdateRows.push([
                `update InspectionQuestionImage set Id=?, Name=?,Timestamp=?,InspectionQuestionImageGuid=?,InspectionGuid=?,QuestionGuid=?,IsSync=?,IsDelete=? where Name =?`,
                [
                  obj.Id,
                  obj.Name,
                  obj.Timestamp,
                  obj.InspectionQuestionImageGuid,
                  obj.InspectionGuid,
                  obj.QuestionGuid,
                  true,
                  obj.IsDelete,
                  obj.Name
                ],
              ]);
            }
          })
          .catch(() => { });
      }
    }

    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertUpdateAppFieldSuggestions(arrList) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");

    if (!!arrList && arrList.length > 0) {
      for (const obj of arrList) {
        if (timestampValue === null || timestampValue === "") {
          arrInsertRows.push([
            `insert into AppFieldSuggestions(Id, InspectionId, FieldName, SuggestedValue, IsDelete) values (?,?,?,?,?)`,
            [
              obj.Id,
              obj.InspectionId,
              obj.FieldName,
              obj.SuggestedValue,
              obj.IsDelete
            ],
          ]);
        } else {
          await this.db
            .executeSql("select 1 from AppFieldSuggestions where Id=?", [obj.Id])
            .then((data) => {
              if (data.rows.length === 0) {
                arrInsertRows.push([
                  `insert into AppFieldSuggestions(Id, InspectionId, FieldName, SuggestedValue, IsDelete) values (?,?,?,?,?)`,
                  [
                    obj.Id,
                    obj.InspectionId,
                    obj.FieldName,
                    obj.SuggestedValue,
                    obj.IsDelete
                  ],
                ]);
              } else {
                arrUpdateRows.push([
                  `update AppFieldSuggestions set InspectionId=?,FieldName=?,SuggestedValue=?, IsDelete=? where Id=?`,
                  [
                    obj.InspectionId,
                    obj.FieldName,
                    obj.SuggestedValue,
                    obj.IsDelete,
                    obj.Id
                  ],
                ]);
              }
            })
            .catch(() => { });
        }
      }

    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertUpdateMaterialConfig(arrList) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");
    if (!!arrList && arrList.length > 0) {
      for (const obj of arrList) {
        if (timestampValue === null || timestampValue === "") {
          arrInsertRows.push([
            `insert into MaterialConfig(Record_Id, Material_Id, SubMaterial, Classification, Friable, Unit, Min_Samples) values (?,?,?,?,?,?,?)`,
            [
              obj.Record_Id,
              obj.Material_Id,
              obj.SubMaterial,
              obj.Classification,
              obj.Friable,
              obj.Unit,
              obj.Min_Samples
            ],
          ]);
        } else {
          await this.db
            .executeSql("select 1 from MaterialConfig where Record_Id=?", [obj.Record_Id])
            .then((data) => {
              if (data.rows.length === 0) {
                arrInsertRows.push([
                  `insert into MaterialConfig(Record_Id, Material_Id, SubMaterial, Classification, Friable, Unit, Min_Samples) values (?,?,?,?,?,?,?)`,
                  [
                    obj.Record_Id,
                    obj.Material_Id,
                    obj.SubMaterial,
                    obj.Classification,
                    obj.Friable,
                    obj.Unit,
                    obj.Min_Samples
                  ],
                ]);
              } else {
                arrUpdateRows.push([
                  `update MaterialConfig set Material_Id=?,SubMaterial=?, Classification=?, Friable=?, Unit=?, Min_Samples=? where Record_Id=?`,
                  [
                    obj.Material_Id,
                    obj.SubMaterial,
                    obj.Classification,
                    obj.Friable,
                    obj.Unit,
                    obj.Min_Samples,
                    obj.Record_Id
                  ],
                ]);
              }
            })
            .catch(() => { });
        }
      }

    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }

  async insertUpdateMaterialLocations(arrList) {
    const arrInsertRows = [];
    const arrUpdateRows = [];
    const timestampValue = localStorage.getItem("timestamp");
    if (!!arrList && arrList.length > 0) {
      for (const obj of arrList) {
        if (timestampValue === null || timestampValue === "") {
          arrInsertRows.push([
            `insert into MaterialLocations(Id,Name,IsSync) values (?,?,?)`,
            [
              obj.Id,
              obj.Name,
              true
            ],
          ]);
        } else {
          await this.db
            .executeSql("select 1 from MaterialLocations where Id=?", [obj.Id])
            .then((data) => {
              if (data.rows.length === 0) {
                arrInsertRows.push([
                  `insert into MaterialLocations(Id,Name,IsSync) values (?,?,?)`,
                  [
                    obj.Id,
                    obj.Name,
                    true
                  ]
                ]);
              } else {
                arrUpdateRows.push([
                  `update MaterialLocations set Id=?,Name=?,IsSync=? where Id=?`,
                  [
                    obj.Id,
                    obj.Name,
                    true,
                    obj.Id
                  ],
                ]);
              }
            })
            .catch(() => { });
        }
      }

    }
    if (arrInsertRows.length > 0) {
      this.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }

    if (arrUpdateRows.length > 0) {
      this.db
        .sqlBatch(arrUpdateRows)
        .then(() => { })
        .catch(() => { });
    }
  }
  // async insertTableMaterialConfig(materialConfig) {
  // //check and remove
  //   const arrInsertRows = [];
  //   for (const obj of materialConfig) {
  //     arrInsertRows.push([
  //       `insert into MaterialConfig(Record_Id, Material_Id, SubMaterial, Classification, Friable, Unit, Min_Samples) values (?,?,?,?,?,?,?)`,
  //       [
  //         obj.Record_Id,
  //         obj.Material_Id,
  //         obj.SubMaterial,
  //         obj.Classification,
  //         obj.Friable,
  //         obj.Unit,
  //         obj.Min_Samples
  //       ],
  //     ]);
  //   }
  //   if (arrInsertRows.length > 0) {
  //     this.db
  //       .sqlBatch(arrInsertRows)
  //       .then(() => { })
  //       .catch((err) => {

  //       });
  //   }
  // }

  async removeOldArchiveInspection() {
    const query = `delete from ArchiveInspection where date(ArchiveDate) <= date('now','-60 day')`;
    await this.db.executeSql(query, []).then((s) => { console.log(s); }).catch((e) => { console.log(e); });
  }
}
