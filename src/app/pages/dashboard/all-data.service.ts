import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AllDataRequest, AllDataRepsonse, SyncTableRequest, ArchiveEmailRequest, SaveAppDatabaseRequest } from 'src/app/models/all-data-model';
import { LogService } from './log.service';
import { GlobalService } from 'src/app/core/auth/global.service';

@Injectable()
export class AllDataService {
  apiUrl: string;
  constructor(private http: HttpClient, private log: LogService, private globalService: GlobalService) { 
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl").toString() : environment.endPoint;
  }

  getAllDetails(req: AllDataRequest): Observable<AllDataRepsonse> {
    this.log.AddRequestLog('api/Inspection/SyncDetail')
    return this.http.post<AllDataRepsonse>(`${environment.endPoint}Inspection/SyncDetail?syncType=${this.globalService.SyncTableType}`, req);
  }
  findById(id) {
    this.log.AddRequestLog('api/Inspection/GetInspectionByJobId')
    return this.http.get<AllDataRepsonse>(`${environment.endPoint}Inspection/GetInspectionByJobId?jobId=${id}`)
  }
  getInspectionDetail(id) {
    let empId = Number(localStorage.getItem('empId'));
    this.log.AddRequestLog('api/Inspection/GetQuestionAnswerByGuid')
    return this.http.get<any>(`${environment.endPoint}Inspection/GetQuestionAnswerByGuid?guid=${id}&inspectorId=${empId}`)
  }

  getAllSyncTableDetails(req: SyncTableRequest[]): Observable<AllDataRepsonse> {
    this.log.AddRequestLog('api/Inspection/SyncTable')
    return this.http.post<AllDataRepsonse>(`${environment.endPoint}Inspection/ArchiveTable`, req);
  }

  sendEmailArchive(req: ArchiveEmailRequest): Observable<AllDataRepsonse> {
    this.log.AddRequestLog('api/Inspection/SyncTableMail')
    return this.http.post<AllDataRepsonse>(`${environment.endPoint}Inspection/ArchiveTableMail`, req);
  }

  saveAppDatabaseLog(req: SaveAppDatabaseRequest): Observable<AllDataRepsonse> {
    //this.log.AddRequestLog('api/Inspection/SaveAppDatabaseLog')
    return this.http.post<AllDataRepsonse>(`${environment.endPoint}Inspection/SaveAppDatabaseLog`, req);
  }

  checkIsActiveEmp(empId): Observable<any> {
    this.log.AddRequestLog('api/Employee/CheckIsActive');
    return this.http.get<any>(`${environment.endPoint}Employee/CheckIsActive?empId=${empId}`);
  }

  getCurrentVersion(type): Observable<any> {
    this.log.AddRequestLog('api/Dashboard/checkDbVersion');
    return this.http.get<any>(`${environment.endPoint}Account/GetCurrnetVersion?type=${type}`);
  }
}
