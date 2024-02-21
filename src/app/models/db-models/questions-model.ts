export class Question {
    Id: number;
    Question: string;
    Description: string;
    QuestionTypeId: number;
    SubQuestionTypeId: number;
    NoOfRows: number;
    IsDelete: boolean;
    QuestionGuid: string;
    Timestamp: string;
    InspectionTypeId: number;
    Index: number;
    AnswerSelected: boolean;
    IsMandatory: string;
    IsParent: string;
    IsDependent: string;
    ShowComment: string;
    QuestionGroupId: number;
    QuestionGroupName: string;
    QuestionRelationGuid:string;
    QuestionInspectionId:number
}
