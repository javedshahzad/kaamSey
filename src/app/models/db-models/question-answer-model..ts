export class QuestionAnswer {
    Id: number;
    InspectionGuid: string;
    QuestionId: number;
    QuestionOptionId: number;
    Answer: string;
    Selected: number;
    IsDelete: boolean;
    QuestionAnswerGuid: string;
    Timestamp: string;
    Comment: string;
    InspectorId: number;
    QuestionInspectionGuid:string
}

export class HasData {
    strGuid: string;
    strAnswer: number;
}
