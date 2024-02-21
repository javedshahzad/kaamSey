import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AllDataRequest, AllDataRepsonse, SyncTableRequest, ArchiveEmailRequest, SaveAppDatabaseRequest } from 'src/app/models/all-data-model';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { DatabaseService } from 'src/app/core/database.service';
import { GlobalService } from 'src/app/core/auth/global.service';
import { Network } from '@ionic-native/network/ngx';

@Injectable()
export class AppdatabaselogService {
  apiUrl: string;

  constructor(private network: Network, private http: HttpClient, private sqlitePorter: SQLitePorter, private databaseService: DatabaseService, private globalService: GlobalService) {
    // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
  }

  async AppDatabaseLog() {
    let userName = localStorage.getItem("username");
    if (this.network.type != this.network.Connection.NONE) {
      return new Promise((resolve) => {
        this.http.get(`${environment.endPoint}Account/AppDatabaseLog?userName=${userName}`).subscribe(async res => {
          console.log(res, "response");
          if (res) {
            await this.sendDataToApi();
            // });
          } else {
            resolve(true)
          }
        }, err => {
          resolve(true)
        })
      });
    }
  }

  public sendDataToApi() {
    this.sqlitePorter.exportDbToJson(this.databaseService.db).then((json) => {
      const saveReq: SaveAppDatabaseRequest = {
        "UserId": Number(localStorage.getItem("empId")),
        "UserName": localStorage.getItem("username"),
        "Keys": [
          "InspectionPropertyImage",
          "Inspection",
          "InspectionImage",
          "InspectionSample",
          "MaterialImage",
          "MaterialListModels",
          "MaterialRoom",
          "QuestionAnswer",
          "QuestionAnswerImage",
          "QuestionTableAnswer",
          "InspectionQuestionImage",
          "ArchiveInspection"
        ],
        "Data": [
          json.data.inserts.InpsectionPropertyImage,
          json.data.inserts.Inspection,
          json.data.inserts.InspectionImage,
          json.data.inserts.InspectionSample,
          json.data.inserts.MaterialImage,
          json.data.inserts.MaterialListModels,
          json.data.inserts.MaterialRoom,
          json.data.inserts.QuestionAnswer,
          json.data.inserts.QuestionAnswerImage,
          json.data.inserts.QuestionTableAnswer,
          json.data.inserts.InspectionQuestionImage,
          json.data.inserts.ArchiveInspection
        ]
      };

      const sendDataRequest = this.saveAppDatabaseLog(saveReq);
      sendDataRequest.subscribe(
        (res: any) => {
          if (res == true) {
          }
          else {
          }
        },
        (err) => {
        }
      );
    }).catch((e) => {
    })
  }

  saveAppDatabaseLog(req: SaveAppDatabaseRequest): Observable<AllDataRepsonse> {
    return this.http.post<AllDataRepsonse>(`${environment.endPoint}Inspection/SaveAppDatabaseLog`, req);
  }
}
