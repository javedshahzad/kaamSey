import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LogService } from './log.service';

@Injectable()
export class ImageUploadService {
  apiUrl: string;

  constructor(private http: HttpClient, private log: LogService) {
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
  }

  imageUpload(formData: FormData): Observable<string> {
    this.log.AddRequestLog('api/UploadQuestionAnswerImage')
    return this.http.post<string>(`${environment.endPoint + environment.imageEndPoint}UploadQuestionAnswerImage`, formData);
  }

  imageUploadBytes(formData: FormData): Observable<string> {
    this.log.AddRequestLog('api/UploadQuestionAnswerImage')
    return this.http.post<string>(`${environment.endPoint + environment.imageEndPoint}UploadQuestionAnswerImageBytes`, formData);
  }

  propertyImageUpload(formData: FormData): Observable<string> {
    this.log.AddRequestLog('api/InpsectionPropertyImage/UploadInspectionPropertyImage');
    return this.http.post<string>(`${environment.endPoint}InpsectionPropertyImage/UploadInspectionPropertyImage`, formData);
  }

  materialImageUpload(formData: FormData, MaterialImageGuid): Observable<string> {
    this.log.AddRequestLog('api/MaterialImage/UploadMaterialImage');
    return this.http.post<string>(`${environment.endPoint}MaterialImage/UploadMaterialImage`, formData);
  }

  uploadSyncTableImageData(formData: FormData): Observable<string> {
    //this.log.AddRequestLog('api/Inspection/SyncDetail')
    return this.http.post<string>(`${environment.endPoint}Inspection/SyncTableImage`, formData);
  }

  inspectionQuestionImageUpload(formData: FormData): Observable<string> {
    this.log.AddRequestLog('api/InspectionQuestionImage/UploadInspectionQuestionImage');
    return this.http.post<string>(`${environment.endPoint}InspectionQuestionImage/UploadInspectionQuestionImage`, formData);
  }
}
