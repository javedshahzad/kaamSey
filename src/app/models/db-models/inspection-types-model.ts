export class InspectionType {
    Id: number;
    Name: string;
    Description: string;
    IsDelete: boolean;
    InspectionTypeGuid: string;
    Timestamp: string;
    Selected: boolean;
    CurrentVersion:number
}

export enum InspectionTypes {
    WaterInspection = 1,
    RentalInspection
}
