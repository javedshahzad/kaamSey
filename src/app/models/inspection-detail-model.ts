import { InspectionImage } from './db-models/image-model';

export class InspectionDetail {
    Question: string;
    Answer: string;
    Image: InspectionImage[];
    Table: string[];
    Column: string[];
    Row: number[];
    Guid: string;
    GroupName: string;
    QuestionGuid: string;
    IsMandatory: string;
}

export class Group {
    id: number;
    groupName: string;
}
