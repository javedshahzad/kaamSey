import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { GlobalService } from 'src/app/core/auth/global.service';
import { JobList } from 'src/app/models/job-list-model';
import { ClientList } from 'src/app/models/client-model';
import { ShipmentTracking } from 'src/app/models/shipment-tracking-model';

@Injectable()

export class JobService {
  apiUrl: string;

  constructor(private http: HttpClient, private globalService: GlobalService) {
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
  }

  getJobAddress(jobId, empId) {
    //this.log.AddRequestLog('api/Job/GetJobAddress');
    return this.http.get<any>(`${environment.endPoint}Job/GetJobAddress?jobId=${jobId}&empId=${empId}`);
  }

  getJobList(empId, startIndex, lengthCount, search) {
    return this.http.get<any>(`${environment.endPoint}Job/GetAppJobList?empId=${empId}&startIndex=${startIndex}&lengthCount=${lengthCount}&searchAdd=${search}`);
  }

  getJobListAll(empId, startIndex, lengthCount) {
    return this.http.get<any>(`${environment.endPoint}Job/GetAppJobList?empId=${empId}&startIndex=${startIndex}&lengthCount=${lengthCount}&searchAdd=`);
  }

  saveJob(req: JobList, empId: number) {
    return this.http.post<JobList>(`${environment.endPoint}Job/SaveEditAppJob?empId=${empId}`, req);
  }

  // getClientList(startIndex,lengthCount,search) {
  //   return this.http.get<any>(`${environment.endPoint}Client/GetClientWithPagination?startIndex=${startIndex}&lengthCount=${lengthCount}&search=${search}`);
  // }
  getClientList(search) {
    return this.http.get<any>(`${environment.endPoint}Client/GetClientName?search=${search}`);
  }

  getJobDetail(jobId) {
    return this.http.get<any>(`${environment.endPoint}Job/GetAppJobDetail?jobId=${jobId}`);
  }

  addClient(req: ClientList){
    return this.http.post<ClientList>(`${environment.endPoint}Client/AddAppClient`, req);
  }

  updateShipment(req: ShipmentTracking){
    return this.http.post<ShipmentTracking>(`${environment.endPoint}Inspection/UpdateShipmentTracking`, req);
  }
}

export function getFileReader(): FileReader {
  const fileReader = new FileReader();
  const zoneOriginalInstance = (fileReader as any)["__zone_symbol__originalInstance"];
  return zoneOriginalInstance || fileReader;
}