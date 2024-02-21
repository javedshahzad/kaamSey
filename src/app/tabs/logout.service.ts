import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LogoutRequest, LogoutReponse } from '../models/user-model';
import { LogService } from '../pages/dashboard/log.service';
import { GlobalService } from '../core/auth/global.service';

@Injectable()
export class LogoutService {
  apiUrl: string;

  constructor(private http: HttpClient, private log: LogService, private globalService: GlobalService) { 
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
  }

  logout(logout: LogoutRequest): Observable<LogoutReponse> {
    this.log.AddRequestLog('api/Account/Logout')
    return this.http.get<LogoutReponse>(`${environment.endPoint}Account/Logout?userName=${logout.userName}&uuid=${logout.uuid}`);
  }
}
