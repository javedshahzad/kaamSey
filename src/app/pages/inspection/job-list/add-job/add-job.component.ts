import { Location } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '../../job.service';
import { JobList } from 'src/app/models/job-list-model';
import { IonicSelectableComponent } from 'ionic-selectable';
import { LoaderService } from 'src/app/core/loader.service';
import { ToastService } from 'src/app/core/toast.service';
import { Network } from '@ionic-native/network/ngx';
import { TranslateService } from '@ngx-translate/core';
import { debug } from 'console';
import { ClientList } from 'src/app/models/client-model';

@Component({
  selector: 'app-add-job',
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.scss'],
})
export class AddJobComponent implements OnInit {
  clientAddForm: any;
  @ViewChild('mySelectable') mySelectable: IonicSelectableComponent;
  submitAttempt: boolean = false;
  canSearch: boolean = true;
  empId: number;
  jobId: number;
  public serviceList: any = [];
  public technicianList: any = [];
  public clientList: any = [];
  public type: any = "add";
  jobListObj: any = {
    job_id: 0,
    master_job_id: 0,
    client_id: null,
    service: null,
    FacilityAddress: null,
    FacilityState: null,
    FacilityCity: null,
    FacilityZip: null,
    technician: null,
    onsite_person: null,
    onsite_phone: null,
    date_scheduled: null,
    title: "add"
  };
  slideOneForm: any;
  masterJobObj: any;

  constructor(private route: ActivatedRoute, private formBuilder: FormBuilder, private location: Location, private router: Router,
    private el: ElementRef, private jobService: JobService, private loaderService: LoaderService, private toastService: ToastService,
    private network: Network, private translateService: TranslateService) {
    this.jobId = this.route.snapshot.params.jobid;
    this.empId = Number(!!localStorage.getItem('empId') ? localStorage.getItem('empId') : 0);
    this.route.queryParams.subscribe(params => {
      if (params.masterJobObj) {
        this.masterJobObj = JSON.parse(params.masterJobObj);
      }
    })
  }

  async ngOnInit() {
    this.loaderService.present();
    this.clientList=[];
    await this.getJobDetail(this.jobId);
    this.ClientFormInit();
    
  }

  async ClientFormInit() {
    this.clientAddForm = this.formBuilder.group({
      clientName: ['', Validators.compose([Validators.required]),],
      phoneNo: [''],
      contactName: [''],
      contactEmail: [''],
    });

  }

  async getJobDetail(jobId) {
    if (this.network.type != this.network.Connection.NONE) {
      await this.jobService.getJobDetail(jobId).subscribe(async (res: any) => {
        if (!!res && res.Success && !!res.Data) {
          let jobData: JobList = {
            job_id: res.Data.job_id,
            client_id: res.Data.client_id,
            date_scheduled: res.Data.StartDateTime,
            EndDateTime: res.Data.EndDateTime,
            facility_address: res.Data.facility_address,
            FacilityAddress: res.Data.FacilityAddress,
            FacilityCity: res.Data.FacilityCity,
            FacilityState: res.Data.FacilityState,
            FacilityZip: res.Data.FacilityZip,
            master_job_id: res.Data.master_job_id,
            onsite_person: res.Data.onsite_person,
            onsite_phone: res.Data.onsite_phone,
            property_unit: res.Data.property_unit,
            service_id: res.Data.service_id,
            StartDateTime: res.Data.StartDateTime,
            technician: res.Data.technician
          };

          this.jobListObj = jobData;
          if (jobData.job_id > 0) { this.jobListObj.title = "edit" } else { this.jobListObj.title = "add" }

          this.technicianList = res.Data.TechnicianList;
          this.serviceList = res.Data.ServiceList;
          await this.jobService.getClientList('').subscribe((res: any) => {
            if (!!res && res.Success && !!res.Data) {
              // this.clientList = [];
              for (let i = 0; i < res.Data.length; i++) {
                this.clientList.push({
                  "Id": res.Data[i].Id,
                  "Name": res.Data[i].Name
                });
              }
              this.loaderService.dismiss();
            }
          },
            (err) => {
              this.loaderService.dismiss();
            }
          );
          
          await this.FormInit();
          this.loaderService.dismiss();
        }
      },
        (err) => {
          this.loaderService.dismiss();
        }
      );
    }
    else {
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }
   
  async FormInit() {
    this.slideOneForm = this.formBuilder.group({
      job_id: [(!!this.masterJobObj) ? 0 : this.jobListObj.title == "edit" ? this.jobListObj.job_id : 0],
      master_job_id: [(!!this.masterJobObj) ? this.masterJobObj.job_id : this.jobListObj.title == "edit" ? this.jobListObj.master_job_id : 0],
      client_id: [(!!this.masterJobObj) ? this.masterJobObj.client_id : this.jobListObj.title == "edit" ? this.jobListObj.client_id : 0],
      technician: [(!!this.masterJobObj) ? this.masterJobObj.technician : this.jobListObj.title == "edit" ? this.jobListObj.technician : [this.empId]],
      service_id: [(!!this.masterJobObj) ? this.masterJobObj.service_id : this.jobListObj.title == "edit" ? this.jobListObj.service_id : []],
      property_unit: [this.jobListObj.title == "edit" ? this.jobListObj.property_unit : ''],
      FacilityAddress: [(!!this.masterJobObj) ? this.masterJobObj.FacilityAddress :
        this.jobListObj.title == "edit" ? this.jobListObj.FacilityAddress : '',
      Validators.compose([Validators.required,Validators.pattern('^(?!^\\s+$).*$')]),
      ],
      FacilityState: [(!!this.masterJobObj) ? this.masterJobObj.FacilityState :
        this.jobListObj.title == "edit" ? this.jobListObj.FacilityState : '',
      Validators.compose([Validators.required,Validators.pattern('^(?!^\\s+$).*$')]),
      ],
      FacilityCity: [(!!this.masterJobObj) ? this.masterJobObj.FacilityCity :
        this.jobListObj.title == "edit"
          ? this.jobListObj.FacilityCity
          : '',
      Validators.compose([Validators.required,Validators.pattern('^(?!^\\s+$).*$')]),
      ],
      FacilityZip: [(!!this.masterJobObj) ? this.masterJobObj.FacilityZip :
        this.jobListObj.title == "edit"
          ? this.jobListObj.FacilityZip
          : '',
      ],
      onsite_person: [(!!this.masterJobObj) ? this.masterJobObj.onsite_person :
        this.jobListObj.title == "edit"
          ? this.jobListObj.onsite_person
          : '',
      ],
      onsite_phone: [(!!this.masterJobObj) ? this.masterJobObj.onsite_phone :
        this.jobListObj.title == "edit"
          ? this.jobListObj.onsite_phone
          : '',
      ],
      date_scheduled: [(!!this.masterJobObj) ? this.masterJobObj.StartDateTime :
        this.jobListObj.title == "edit"
          ? this.jobListObj.StartDateTime
          : '',
      ]
    });
    if (!!this.slideOneForm.get('technician') && !!this.slideOneForm.get('technician').value.toString()) {
      let techValue = this.slideOneForm.get('technician').value.toString().split(",") ? this.slideOneForm.get('technician').value.toString().split(",").map(Number) : "";
      this.slideOneForm.get('technician').setValue(techValue);
    }
    if (!!this.slideOneForm.get('service_id') && !!this.slideOneForm.get('service_id').value.toString()) {
      let techValue = this.slideOneForm.get('service_id').value.toString().split(",") ? this.slideOneForm.get('service_id').value.toString().split(",").map(Number) : "";
      this.slideOneForm.get('service_id').setValue(techValue);
    }
    
    this.loaderService.dismiss();
  }

  goBack() {
    this.location.back();
  }
 
  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement =
      this.el.nativeElement.querySelector("form .ng-invalid");
    firstInvalidControl.scrollIntoView();
    this.loaderService.dismiss();
  }

  ionViewWillLeave() { }

  async submit(flag?) {
    this.loaderService.present();
    this.submitAttempt = true;

    if (!this.slideOneForm.valid) {
      this.scrollToFirstInvalidControl();
    }
    else if (!!this.masterJobObj && this.masterJobObj.job_id > 0 && this.jobListObj.title != "edit") {
      this.slideOneForm.get('master_job_id').setValue(this.slideOneForm.get('master_job_id').value);
      this.saveJobData(flag);
    }
    else if (this.slideOneForm.valid && this.jobListObj.title == "add") {
      this.slideOneForm.get('master_job_id').setValue(this.slideOneForm.get('job_id').value);
      this.saveJobData(flag);
    }
    else if (this.slideOneForm.valid && this.jobListObj.title == "edit") {
      this.saveJobData(flag);
    }
  }

  async saveJobData(flag?) {
    this.submitAttempt = true;

    let formValue = this.slideOneForm.getRawValue();
    const req: JobList = {
      job_id: formValue.job_id,
      master_job_id: formValue.master_job_id,
      facility_address: formValue.facility_address,
      onsite_person: formValue.onsite_person,
      onsite_phone: formValue.onsite_phone,
      property_unit: formValue.property_unit,
      client_id: formValue.client_id,
      FacilityAddress: formValue.FacilityAddress,
      FacilityCity: formValue.FacilityCity,
      FacilityState: formValue.FacilityState,
      FacilityZip: formValue.FacilityZip,
      date_scheduled: formValue.date_scheduled,
      EndDateTime: formValue.date_scheduled,
      StartDateTime: formValue.date_scheduled,
      technician: formValue.technician.toString(),
      service_id: formValue.service_id.toString()
    };


    if (this.network.type != this.network.Connection.NONE) {
      await this.jobService.saveJob(req, this.empId).subscribe((res: any) => {
        this.loaderService.dismiss();
        if (!!res && res.Success) {
          if (this.jobListObj.title == "add") {
            this.toastService.presentToast("Job add successfully.");
          } else {
            this.toastService.presentToast("Job updated successfully.");
          }

          if (flag == "SCA") {
            this.submitAttempt = false;
            this.slideOneForm.get('service_id').setValue('');
          }
          else if (flag == "SR") {
            this.location.back();
            this.slideOneForm.reset();
          }
        }
        else {
          console.error(res.Message);
        }
      },
        (err) => {
          this.loaderService.dismiss();
          console.error(err);
        }
      );
    }
    else {
      this.loaderService.dismiss();
      this.toastService.presentToast(this.translateService.instant('General.noInternet'));
    }
  }

  async clearSel(event: {
    component: IonicSelectableComponent,
    items: any[]
  }) {
  this.mySelectable.search('');
  }

  async closeSaveClient() {
    this.mySelectable.search('');
    this.mySelectable.hideAddItemTemplate();
  }
  async saveClient() {
    this.loaderService.present();

    if (!this.clientAddForm.valid) {
      this.scrollToFirstInvalidControl();
    }
    else {
      let formValue = this.clientAddForm.getRawValue();
      const req: ClientList = {
        client_name: formValue.clientName,
        main_phone: formValue.phoneNo,
        Primary_Contact_Name: formValue.contactName,
        Primary_Contact_Email: formValue.contactEmail
      };
      if (this.network.type != this.network.Connection.NONE) {
        await this.jobService.addClient(req).subscribe((res: any) => {

          if (!!res && res.Success) {
            this.toastService.presentToast("Client added successfully.");

            let port = { "Id": res.Data.client_id, "Name": res.Data.client_name };

            this.mySelectable.addItem(port).then(() => {
              this.mySelectable.search(port.Name);
            });

            this.mySelectable.hideAddItemTemplate();
            this.ClientFormInit();
            this.loaderService.dismiss();
          }
          else {
            this.loaderService.dismiss();
            this.toastService.presentToast(res.Message);
            console.error(res.Message);
          }
        },
          (err) => {
            this.loaderService.dismiss();
            console.error(err);
          }
        );
      }
      else {
        this.loaderService.dismiss();
        this.toastService.presentToast(this.translateService.instant('General.noInternet'));
      }
    }
  }

  

  onSearchFail(event: {
    component: IonicSelectableComponent,
    text: string
  }) {
    if (event.component.hasSearchText) {
      this.ClientFormInit;
      this.clientAddForm.get('clientName').setValue(event.component.searchText);
      event.component.showAddItemTemplate();
    }
  }
}
