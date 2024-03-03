export class UserRequest {
    Email: string;
    Password: string;
    RememberMe: boolean;
    CompanyCode: String;
    UUID: string;
    Subscriber: Subscriber;
}

export class User {
    ApiToken: string;
    Success: boolean;
    Message: string;
    Data: Data;
}

export class Data {
    employee_id: number;
    contact_id: number;
    employee_name: string;
    employee_role: number;
    security_role: number;
    active: number;
    Active: number;
    login_name: string;
    contact_email: string;
    sign_path: string;
    is_active: boolean;
    Email?:any;
    Password?:any;
    Subscriber: Subscriber;
    tbl_employees: [{
        employee_id: number;
    }]
}

export class Subscriber{
    Id: number;
    Name: string;
    CRM: boolean;
    Job : boolean;
    Scheduling : boolean;
    Inspection : boolean;
    TimeTracking : boolean;
    AssetTracking : boolean;
    SampleCollection : boolean;
    CreateJobCheckin: boolean;
    allow_create_jobs_checkin: boolean;
    allow_job_creation_app: boolean;
    sample_collection_visible:boolean;
    room_collection_visible:boolean;
    material_collection_visible:boolean;
    property_image_visible:boolean;
    inspection_visible:boolean;
    job_visible:boolean;
    SubscriberLogo : string;
    LoginMethod : number;
    ApiUrl : string;
    CompanyCode : string;
    DB_IP_Address : string;
    DB_Catalogue_Name : string;
    Username : string;
    Password : string;
}

export class LogoutRequest {
    userName: string;
    uuid: string;
}

export class LogoutReponse {
    Success: boolean;
}
