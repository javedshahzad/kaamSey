import { Component, OnInit } from '@angular/core';
import { JobService } from '../job.service';
import { GlobalService } from 'src/app/core/auth/global.service';
import { NavigationExtras, Router } from '@angular/router';
import { ToastService } from 'src/app/core/toast.service';
import { LoaderService } from 'src/app/core/loader.service';
import { Network } from '@ionic-native/network/ngx';
import { TranslateService } from '@ngx-translate/core';
import { DatabaseService } from 'src/app/core/database.service';
@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss'],
})
export class JobListComponent implements OnInit {
  prevInternetStatus: any;
  checkInternetStatusId: any;
  isLoading = true;
  offlineArrJob = [];
  arrJob = [];
  public lengthCount: any = 10;
  searchValue: string;
  allow_job_creation_app: Boolean = false;
  fromSearch: Boolean = false;
  isOnline: Boolean = false;
  constructor(private jobService: JobService, private globalService: GlobalService, private router: Router,
    private toastService: ToastService, private loaderService: LoaderService, private network: Network, private translateService: TranslateService, private dbservice: DatabaseService) {

  }


  ngOnInit() {
    this.prevInternetStatus = this.network.type;
    // this.isLoading = true;
    // this.loaderService.present();
    this.allow_job_creation_app = !!localStorage.getItem('allow_job_creation_app') && localStorage.getItem('allow_job_creation_app') == 'true' ? true : false;

    if (this.network.type != this.network.Connection.NONE) {
      this.isOnline = true;
    }
  }

  ionViewDidLeave() {
    if (this.checkInternetStatusId) {
      clearInterval(this.checkInternetStatusId);
    }
  }

  async ionViewDidEnter() {
    this.checkInternetStatusId = setInterval(async () => {
      this.checkInternetStatus();
    }, 1);

    await this.LoadData();
  }

  clearSearch() {
    this.searchValue = "";
    this.fromSearch = false;
  }

  async LoadData() {
    this.isLoading = true;
    this.loaderService.present();
    setTimeout(async () => {
      this.arrJob = [];
      await this.getJob(0, '');
      this.isLoading = false;
      this.loaderService.dismiss();
    }, 0);
  }

  async checkInternetStatus() {
    if (this.network.type != this.prevInternetStatus) {
      this.prevInternetStatus = this.network.type;

      await this.LoadData();
    }
  }

  async doRefresh(event: any) {
    setTimeout(async () => {
      this.clearSearch();
      this.arrJob = [];
      setTimeout(async () => {
        await this.getJob(0, '');
        event.target.complete();
      }, 1000);
    }, 1000);
  }

  async getJob(startIndex, search) {
    this.isLoading = true;
    let empId = Number(!!localStorage.getItem('empId') ? localStorage.getItem('empId') : 0);

    if (this.network.type != this.network.Connection.NONE) {
      this.isOnline = true;
      await this.jobService.getJobList(empId, startIndex, this.lengthCount, search).subscribe(
        async (res) => {
          if (!!res && res.Success && !!res.Data && res.Data.length > 0) {
            for (let i = 0; i < res.Data.length; i++) {
              this.arrJob.push({
                Job_Id: res.Data[i].job_id,
                client_id: res.Data[i].client_id,
                StartDateTime: !!res.Data[i].StartDateTime ? res.Data[i].StartDateTime.replace('T', ' ') : '',
                EndDateTime: !!res.Data[i].EndDateTime ? res.Data[i].EndDateTime.replace('T', ' ') : '',
                facility_address: res.Data[i].facility_address,
                FacilityAddress: res.Data[i].FacilityAddress,
                FacilityCity: res.Data[i].FacilityCity,
                FacilityState: res.Data[i].FacilityState,
                FacilityZip: res.Data[i].FacilityZip,
                onsite_person: res.Data[i].onsite_person,
                onsite_phone: res.Data[i].onsite_phone,
                property_unit: res.Data[i].property_unit,
                technician: res.Data[i].technician,
                service_id: res.Data[i].service_id
              });
            }
            console.log("From online", this.arrJob);
          }
          this.isLoading = false;
          this.loaderService.dismiss();
        },
        (err) => {
          this.isLoading = false;
          this.loaderService.dismiss();
          this.toastService.presentToast(err);
        });
    }
    else {
      this.isOnline = false;
      this.isLoading = false;
      this.loaderService.dismiss();
      const query = `select * from JobList ${!!search ? " where FacilityAddress like '%" + search + "%'" : ""}`;
      await this.dbservice.db
        .executeSql(query, [])
        .then((res) => {
          if (res.rows.length > 0) {
            this.arrJob = [];
            for (let i = 0; i < res.rows.length; i++) {
              this.arrJob.push({
                Job_Id: res.rows.item(i).Job_Id,
                StartDateTime: !!res.rows.item(i).StartDateTime ? res.rows.item(i).StartDateTime.replace('T', ' ') : '',
                EndDateTime: !!res.rows.item(i).EndDateTime ? res.rows.item(i).EndDateTime.replace('T', ' ') : '',
                FacilityAddress: res.rows.item(i).FacilityAddress,
                FacilityCity: res.rows.item(i).FacilityCity,
                FacilityState: res.rows.item(i).FacilityState,
                FacilityZip: res.rows.item(i).FacilityZip,
                onsite_person: res.rows.item(i).onsite_person,
                onsite_phone: res.rows.item(i).onsite_phone,
                property_unit: res.rows.item(i).property_unit
              });

            }
            console.log("From offline", this.arrJob);
          }
          this.isLoading = false;
        })
        .catch(() => {
          this.isLoading = false;
        });
    }
  }

  async addJob(jobId, addr) {
    this.globalService.isFromEdit = false;
    this.globalService.isFromDetail = false;
    this.globalService.isFromGroupEdit = false;
    this.globalService.inspectionType = 0;
    this.globalService.CurrentVersion = 0;
    this.globalService.isEditAddress = false;
    let obj = {
      JobId: jobId,
      Address: addr,
    };

    localStorage.setItem('jobListDataJobId', obj.JobId);
    localStorage.setItem('jobListDataAddress', obj.Address);

    this.router.navigate([`/tabs/tab2/joborder/''`]);
  }

  async editJob(obj) {
    if (this.network.type != this.network.Connection.NONE) {
      if (!!obj) {
        this.router.navigate([`/tabs/tab2/addJob/${obj.Job_Id}`]);
      }
    }
    else {
      this.isOnline = false;
      this.isLoading = false;
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  async addChildJob(obj) {
    if (this.network.type != this.network.Connection.NONE) {
      if (!!obj) {
        let navigationExtras: NavigationExtras = {
          queryParams: {
            masterJobObj: JSON.stringify(obj)
          },
        }
        this.router.navigate([`/tabs/tab2/addJob/0`], navigationExtras);
      }
    }
    else {
      this.isOnline = false;
      this.isLoading = false;
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  async loadMoreData(event) {
    if (this.network.type != this.network.Connection.NONE) {
      this.isLoading = true;
      setTimeout(async () => {
        this.isLoading = true;
        let cnt = this.arrJob.length;
        if (!this.fromSearch) {
          await this.getJob(cnt, '');
        }
        else {
          await this.getJob(cnt, this.searchValue);
        }
        event.target.complete();
      }, 1000);
    }
    else {
      this.isOnline = false;
      this.isLoading = false;
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  async onInput(event: any) {
    if (this.network.type != this.network.Connection.NONE) {
      this.arrJob = [];
      this.isLoading = true;
      this.fromSearch = true;
    }
    else {
      this.isOnline = false;
      this.isLoading = false;
    }
    const q = event.srcElement.value;
    if (!q) {
      this.fromSearch = false;
    }
    await this.getJob(0, q);
  }

  OpenMapWithLocation(address) {
    if (this.network.type != this.network.Connection.NONE) {
      const url = encodeURI(`https://www.google.com/maps/search/${address}`);
      window.open(url);
    }
    else {
      this.isOnline = false;
      this.isLoading = false;
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  OpenPhone(phoneNumber) {
    window.open(`tel:${phoneNumber}`);
  }

  async DownloadJobData() {
    const query = `delete from JobList`;
    await this.dbservice.db
      .executeSql(query, [])
      .then(async (res) => {
        let empId = Number(!!localStorage.getItem('empId') ? localStorage.getItem('empId') : 0);
        if (this.network.type != this.network.Connection.NONE) {
          await this.jobService.getJobListAll(empId, 0, 0).subscribe(
            async (res) => {
              if (!!res && res.Success && !!res.Data && res.Data.length > 0) {
                this.offlineArrJob = [];
                for (let i = 0; i < res.Data.length; i++) {
                  this.offlineArrJob.push({
                    job_id: res.Data[i].job_id,
                    client_id: res.Data[i].client_id,
                    StartDateTime: !!res.Data[i].StartDateTime ? res.Data[i].StartDateTime.replace('T', ' ') : '',
                    EndDateTime: !!res.Data[i].EndDateTime ? res.Data[i].EndDateTime.replace('T', ' ') : '',
                    facility_address: res.Data[i].facility_address,
                    FacilityAddress: res.Data[i].FacilityAddress,
                    FacilityCity: res.Data[i].FacilityCity,
                    FacilityState: res.Data[i].FacilityState,
                    FacilityZip: res.Data[i].FacilityZip,
                    onsite_person: res.Data[i].onsite_person,
                    onsite_phone: res.Data[i].onsite_phone,
                    property_unit: res.Data[i].property_unit,
                    technician: res.Data[i].technician,
                    service_id: res.Data[i].service_id
                  });
                }

                this.insertJobList(this.offlineArrJob);
                console.log("this.offlineArrJob", this.offlineArrJob);
              }
              this.isLoading = false;
              this.loaderService.dismiss();
            },
            (err) => {
              this.isLoading = false;
              this.loaderService.dismiss();
              this.toastService.presentToast(err);
            });
        }
        else {
          this.isOnline = false;
          this.isLoading = false;
          this.loaderService.dismiss();
          this.toastService.presentToast(this.translateService.instant('General.noInternet'));
        }
      })
      .catch((err) => {
        console.log(err);
        this.toastService.presentToast("Something went wrong while downloading data. Please try again.");
      });
  }

  async insertJobList(offlineArrJob) {
    const arrInsertRows = [];
    for (const obj of offlineArrJob) {
      arrInsertRows.push([
        `insert into JobList(Job_Id,FacilityAddress, FacilityCity , FacilityState ,FacilityZip,
          onsite_person,onsite_phone, StartDateTime, EndDateTime, property_unit) values (?,?,?,?,?,?,?,?,?,?)`,
        [
          obj.job_id,
          obj.FacilityAddress,
          obj.FacilityCity,
          obj.FacilityState,
          obj.FacilityZip,
          obj.onsite_person,
          obj.onsite_phone,
          obj.StartDateTime,
          obj.EndDateTime,
          obj.property_unit
        ],
      ]);
    }
    if (arrInsertRows.length > 0) {
      this.dbservice.db
        .sqlBatch(arrInsertRows)
        .then(() => { })
        .catch(() => { });
    }
    this.toastService.presentToast("Jobs downloaded successfully.");
  }
}
