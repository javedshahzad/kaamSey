export class Inspection {
    Id: number;
    JobId: number;
    InspectorId: number;
    InspectionDate: string;
    Owner: string;
    PropertyLocation: string;
    Address: string;
    PhoneNumber: string;
    CellNumber: string;
    InspectorPhoneNumber: string;
    Status: number;
    IsDelete: boolean;
    Timestamp: string;
    InspectionGuid: string;
    InspectionTypeId: number;
    IsSync: string;
    StartTime: string;
    CompletedTime: string;
    WrongJobId: string;
    EmergencyDate: string;
    CurrentVersion:number;
    IsContactLogin: boolean;
}

export enum StatusTypes {
    Draft = 10,
    InProgress,
    Complete,
    Uploaded
}

export enum InspectionActionType{
    Sync,
    CheckIn,
    RMS,
    Camera,
    Image
}

export enum CheckoutActionType{
    Checkout,
    InspectionPdf,
    RentalPdf
}