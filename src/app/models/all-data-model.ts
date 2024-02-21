import { Inspection } from "./db-models/inspection-model";
import { Question } from "./db-models/questions-model";
import { QuestionRelation } from "./db-models/question-relations-model";
import { InspectionType } from "./db-models/inspection-types-model";
import { QuestionTable } from "./db-models/questions-table-model";
import { Option } from "./db-models/options-model";
import { QuestionAnswer } from "./db-models/question-answer-model.";
import { QuestionTableAnswer } from "./db-models/questions-table-answer-model";
import { QuestionAnswerImage } from "./db-models/question-answer-image-model";
import { QuestionGroup } from "./db-models/question-group";
import { InpsectionPropertyImage } from "./db-models/property-image";
import { MaterialImage } from "./db-models/material-image";
import { InspectionQuestionImage } from "./db-models/inspection-question-image-model";
import { AppFieldSuggestions } from "./db-models/app-field-suggestions-model";
import { MaterialConfig } from "./db-models/material-config-model";

export class AllDataRequest {
  EmployeeId: number;
  Timestamp: string;
  Inspections: Inspection[];
  Questions: Question[];
  QuestionRelations: QuestionRelation[];
  InspectionTypes: InspectionType[];
  QuestionTables: QuestionTable[];
  Options: Option[];
  QuestionAnswers: QuestionAnswer[];
  QuestionTableAnswers: QuestionTableAnswer[];
  QuestionAnswerImages: QuestionAnswerImage[];
  QuestionGroup: QuestionGroup[];
  SyncInspectionsGuid: string;
  Latitude: string;
  Longitude: string;
  ModifiedInspectionTypes: string;
  InspectionPropertyImage: InpsectionPropertyImage[];
  MaterialImageList: MaterialImage[];
  Samples: any[];
  isLogin?: boolean;
  MaterialListModels: any;
  OtherMaterialLocationModels:any;
  MaterialRoomListModels: any;
  InspectionQuestionImages: InspectionQuestionImage[];
  CurrentAppVersion: string;
  IsContactLogin: boolean;
  CompanyCode: string;
  createJobAfterAllow: boolean;
  allow_create_jobs_checkin : boolean;
  isFromJobList : boolean;
}

export class AllDataRepsonse {
  Success: boolean;
  Message: string;
  Data: Data;
}

export class Data {
  Timestamp: string;
  Inspections: Inspection[];
  Questions: Question[];
  QuestionRelations: QuestionRelation[];
  InspectionTypes: InspectionType[];
  QuestionTables: QuestionTable[];
  Options: Option[];
  QuestionAnswers: QuestionAnswer[];
  QuestionTableAnswers: QuestionTableAnswer[];
  QuestionAnswerImages: QuestionAnswerImage[];
  QuestionGroup: QuestionGroup[];
  SyncInspectionsGuid: string;
  ModifiedInspectionTypes: string;
  Samples: [];
  Sample_Type: [];
  SampleAssignedLabList: [];
  Analysis_Type: [];
  Turn_Arround_Time: [];
  Other_metal_analysis: [];
  OtherElementAnalysisList: [];
  WaterBottleGroupDefinitionList: [];
  MaterialLocations: [];
  MaterialListModels: [];
  // AsbestosMaterials: [];
  MaterialDropDownList: [];
  AsbMaterialMappingList: [];
  MaterialRoomDropDownList: [];
  MaterialRoomListModels: [];
  MaterialImageList: [];
  InspectionPropertyImage: [];
  InspectionQuestionImages: InspectionQuestionImage[];
  AppFieldSuggestions: AppFieldSuggestions[];
  MaterialConfig: MaterialConfig[];
  IsActiveEmployee: Boolean;
}

export class SyncTableRequest {
  Id: number
  LoginId: number;
  Data: string;
  TableName: string;
  Type: string;
  DateTime: string;
}

export class SaveAppDatabaseRequest {
  UserId: number;
  UserName: string;
  Keys: any[];
  Data: any[]
}

export class ArchiveEmailRequest {
  UserId: number;
  JobId: number;
}

export enum SyncTypeEnum {
  CheckOut = "CheckOut",
  CheckIn = "CheckIn",
  Sync = "Sync",
  SyncQuestions = "SyncQuestions",
  Login = "Login",
  DeleteBySlide = "DeleteBySlide",
  ArchiveSlideDelete = "ArchiveSlideDelete",
  SyncLogOut = "SyncLogOut"
}

export enum ArchiveEnum {
  ArchiveInspection = 'ArchiveInspection'
}
