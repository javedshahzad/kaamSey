import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserRequest, User } from 'src/app/models/user-model';
import { LogService } from '../dashboard/log.service';
import { GlobalService } from 'src/app/core/auth/global.service';

@Injectable()
export class LoginService {
  apiUrl: string;

  constructor(private http: HttpClient, private log: LogService, private globalService: GlobalService) {
  }

  getApiUrl(login: UserRequest): Observable<User> {
    return this.http.post<User>(`${environment.masterEndPoint}Account/GetApiUrlByCompanyCode`, login);
  }

  login(login: UserRequest): Observable<User> {
    this.log.AddRequestLog('api/Account/AppLogin');
    return this.http.post<User>(`${environment.endPoint}Account/AppLogin`, login);
  }
}
