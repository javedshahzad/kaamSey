import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/File/ngx';
import { Platform } from '@ionic/angular';
import { GlobalService } from 'src/app/core/auth/global.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class LogService {
  apiUrl: string;
  fileName: string;

  constructor(private file: File, private http: HttpClient, private platform: Platform, private globalService: GlobalService) {
    if (this.checkplatform()) {
      this.createRequestDir();
      this.createErrorDir();
      this.createTracelogDir();
      // this.apiUrl = !!localStorage.getItem("apiUrl") ? localStorage.getItem("apiUrl") : environment.endPoint;
    }
  }

  AddRequestLog(text) {
    return new Promise((resolve) => {
      if (this.checkplatform()) {
        this.http.get(`${environment.endPoint}Account/GetRequestLogStatus`).subscribe(async res => {
          if (res) {
            await this.createRequestDir();
            var date = new Date()
            this.fileName = date.getUTCFullYear() + '_' + (date.getUTCMonth() + 1) + '_' + date.getUTCDate() + '_' + date.getHours() + '_' + date.getMinutes() + '_' + date.getSeconds() + '.txt';

            this.file.createFile(this.file.externalApplicationStorageDirectory + 'RequestLog', this.fileName, false)
              .then(async () => {
                await this.writeToAccessLogFile('RequestLog', text);
                resolve(true)
              })
              .catch(err => {

                this.writeToAccessLogFile('RequestLog', text)
                resolve(true)
              });
            // });
          } else {
            resolve(true)
          }
        }, err => {
          resolve(true)
        })
      } else {
        resolve(true)
      }
    });

  }
  AddErroLog(text) {
    return new Promise(resolve => {
      if (this.checkplatform()) {
        this.http.get(`${environment.endPoint}Account/GetErrorLogStatus`).subscribe(async res => {
          if (res) {
            await this.createErrorDir();
            var date = new Date()
            this.fileName = date.getUTCFullYear() + '_' + (date.getUTCMonth() + 1) + '_' + date.getUTCDate() + '_' + date.getHours() + '_' + date.getMinutes() + '_' + date.getSeconds() + '.txt';
            this.file.createFile(this.file.externalApplicationStorageDirectory + 'ErrorLog', this.fileName, false)
              .then(async () => {
                await this.writeToAccessLogFile('ErrorLog', text)
                resolve(true);
              })
              .catch(err => {

                this.writeToAccessLogFile('ErrorLog', text)
                resolve(true);
              });
            // });
          } else {
            resolve(true)
          }
        }, err => {
          resolve(true)

        })
      } else {
        resolve(true)
      }
    })
  }

  AddTraceLog(text) {
    return new Promise(resolve => {
      if (this.checkplatform()) {
        this.http.get(`${environment.endPoint}Account/GetErrorLogStatus`).subscribe(async res => {
          if (res) {
            await this.createTracelogDir();
            var date = new Date()
            this.fileName = date.getUTCFullYear() + '_' + (date.getUTCMonth() + 1) + '_' + date.getUTCDate() + '_' + date.getHours() + '_' + date.getMinutes() + '.txt';
            await this.file.checkFile(this.file.externalApplicationStorageDirectory + 'TraceLog', this.fileName).then(async doesExist => {

              return await this.writeToAccessLogFile('TraceLog', text);
            }).catch((err) => {

              this.file.createFile(this.file.externalApplicationStorageDirectory + 'TraceLog', this.fileName, false)
                .then(async () => {
                  await this.writeToAccessLogFile('TraceLog', text)
                  resolve(true);
                })
                .catch(err => {

                  this.writeToAccessLogFile('TraceLog', text)
                  resolve(true);
                });
            });
          } else {
            resolve(true)
          }
        }, err => {
          resolve(true)

        })
      } else {
        resolve(true);
      }
    })
  }
  async writeToAccessLogFile(dirName, text) {
    text = new Date().toLocaleString() + ' - ' + text
    await this.file.writeFile(this.file.externalApplicationStorageDirectory + dirName, this.fileName, text + '\n', { append: true, replace: false });
  }

  createErrorDir() {
    return new Promise(resolve => {
      this.file.checkDir(this.file.externalApplicationStorageDirectory, 'ErrorLog').then(exists => {

        resolve(true)
      }, notExists => {
        this.file.createDir(this.file.externalApplicationStorageDirectory, 'ErrorLog', false).then(res => {

          resolve(true)
        }).catch(err => {
          resolve(true)

        })
      })
    })
  }

  createRequestDir() {
    return new Promise(resolve => {
      this.file.checkDir(this.file.externalApplicationStorageDirectory, 'RequestLog').then(exists => {

        resolve(true)
      }, notExists => {
        this.file.createDir(this.file.externalApplicationStorageDirectory, 'RequestLog', false).then(res => {

          resolve(true)
        }).catch(err => {
          resolve(true)

        })
      })
    })
  }

  createTracelogDir() {
    return new Promise(resolve => {
      this.file.checkDir(this.file.externalApplicationStorageDirectory, 'TraceLog').then(exists => {

        resolve(true)
      }, notExists => {
        this.file.createDir(this.file.externalApplicationStorageDirectory, 'TraceLog', false).then(res => {

          resolve(true)
        }).catch(err => {
          resolve(true)

        })
      })
    })
  }
  checkplatform() {
    if (this.platform.is('android')) {
      return true;
    } else {
      return false;
    }
  }
}

