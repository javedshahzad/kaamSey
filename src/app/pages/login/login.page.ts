import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from 'src/app/core/toast.service';
import { LoaderService } from 'src/app/core/loader.service';
import { LoginService } from './login.service';
import { User } from 'src/app/models/user-model';
import { Device } from '@ionic-native/device/ngx';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { GlobalService } from 'src/app/core/auth/global.service';
import { environment } from 'src/environments/environment';
import { Network } from '@ionic-native/network/ngx';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  myForm: FormGroup;
  appVersionInfo = '';
  show = false;
  companyCode = "";

  constructor(private toastService: ToastService, private loaderService: LoaderService, private router: Router,
    private formBuilder: FormBuilder, private loginService: LoginService, private device: Device,
    private appVersion: AppVersion, private globalService: GlobalService, private network: Network,private translateService: TranslateService
    ) {
    this.formInit();

    this.appVersion.getVersionNumber().then((value) => {
      this.appVersionInfo = value;
    });
    //this.geolocation.getCurrentPosition().then(() => { }).catch(() => { });
    this.companyCode = localStorage.getItem('companyCode');
  }

  ionViewDidLeave() {
    this.myForm.reset();
  }

  formInit() {
    this.myForm = this.formBuilder.group({
      Email: ['', [Validators.required]],
      Password: ['', [Validators.required, Validators.minLength(6)]],
      CompanyCode: !this.companyCode ? ['', [Validators.required]] : [''],
      Subscriber: [],
      UUID: this.device.uuid
    });
  }

  showPassword() {
    this.show = this.show === false ? true : false;
  }

  async login() {
    if (!!this.companyCode) {
      this.myForm.controls.CompanyCode.setValue(localStorage.getItem('companyCode'));
    }

    if (this.myForm.invalid) {
      Object.keys(this.myForm.controls).forEach(key => {
        if (this.myForm.controls[key].invalid) {
          this.myForm.controls[key].markAsTouched({ onlySelf: true });
        }
      });
      return;
    }
    await this.loaderService.present();

    if (this.network.type != this.network.Connection.NONE){
    await this.loginService.getApiUrl(this.myForm.value).subscribe(res => {
      console.log(res,"data res======")
      if (res.Success) {
        this.myForm.controls.Subscriber.setValue(res.Data.Subscriber);
        if (!!res.Data.Subscriber.ApiUrl) {
          environment.endPoint = res.Data.Subscriber.ApiUrl;
          localStorage.setItem("ApiUrl", res.Data.Subscriber.ApiUrl);

          this.globalService.Projectenv = res.Data.Subscriber.ApiUrl.includes("etcapi") ? "Etc" : res.Data.Subscriber.ApiUrl.includes("waterinspectionapi") ? "Wi" : "";
        }
        if (!!res.Data.Subscriber.CompanyCode) {
          localStorage.setItem("companyCode", res.Data.Subscriber.CompanyCode);
        }

        const request = this.loginService.login(this.myForm.value);
        request.subscribe(
          res => this.goToTabs(res),
          err => {
            console.log(err,"hereee")
            this.loaderService.dismiss();
            this.toastService.presentToast(JSON.stringify(err));
          }
        );
      }
      else {
        console.log(res,"mmmmmmm")
        this.loaderService.dismiss();
        this.toastService.presentToast(res.Message);
      }
    });
  }else {
    this.toastService.presentToast(this.translateService.instant('General.noInternet'));
  }
  this.loaderService.dismiss();
    // const request = this.loginService.login(this.myForm.value);
    // request.subscribe(
    //   res => this.goToTabs(res),
    //   err => {
    //     this.loaderService.dismiss();
    //     this.toastService.presentToast(JSON.stringify(err));
    //   }
    // );
    
  }

  goToTabs(response: User) {
    this.loaderService.dismiss();
    if (!!response && response.Success) {
      localStorage.setItem('token', response.ApiToken);
      if (!!response.Data) {
        localStorage.setItem('username', (!!(response.Data.login_name || response.Data.contact_email) ? (response.Data.login_name || response.Data.contact_email) : ""));
        localStorage.setItem('empId', (!!response.Data.employee_id ? response.Data.employee_id.toString() : (!!response.Data.tbl_employees[0].employee_id ? response.Data.tbl_employees[0].employee_id.toString() : "")));
        localStorage.setItem('isCreateJobCheckin', !!response.Data.Subscriber && !!response.Data.Subscriber.CreateJobCheckin ? response.Data.Subscriber.CreateJobCheckin.toString() : 'false');
        localStorage.setItem('allow_create_jobs_checkin', !!response.Data.Subscriber && !!response.Data.Subscriber.allow_create_jobs_checkin ? response.Data.Subscriber.allow_create_jobs_checkin.toString() : 'false');
        localStorage.setItem('allow_job_creation_app', !!response.Data.Subscriber && !!response.Data.Subscriber.allow_job_creation_app ? response.Data.Subscriber.allow_job_creation_app.toString() : 'false');
        localStorage.setItem('sample_collection_visible', !!response.Data.Subscriber && !!response.Data.Subscriber.sample_collection_visible ? response.Data.Subscriber.sample_collection_visible.toString() : 'false');
        localStorage.setItem('room_collection_visible', !!response.Data.Subscriber && !!response.Data.Subscriber.room_collection_visible ? response.Data.Subscriber.room_collection_visible.toString() : 'false');
        localStorage.setItem('material_collection_visible', !!response.Data.Subscriber && !!response.Data.Subscriber.material_collection_visible ? response.Data.Subscriber.material_collection_visible.toString() : 'false');
        localStorage.setItem('property_image_visible', !!response.Data.Subscriber && !!response.Data.Subscriber.property_image_visible ? response.Data.Subscriber.property_image_visible.toString() : 'false');
        localStorage.setItem('job_visible',!!response.Data.Subscriber && !!response.Data.Subscriber.property_image_visible ? response.Data.Subscriber.property_image_visible.toString() : 'false');
        localStorage.setItem('inspection_visible',!!response.Data.Subscriber && !!response.Data.Subscriber.inspection_visible ? response.Data.Subscriber.inspection_visible.toString() : 'false');
        localStorage.setItem('job_visible',!!response.Data.Subscriber && !!response.Data.Subscriber.job_visible ? response.Data.Subscriber.job_visible.toString() : 'false');
        this.globalService.isContactLogin = Boolean(!!response.Data.contact_id);
        this.globalService.isActiveEmp = (!!(response.Data.active || response.Data.Active) ? Boolean((response.Data.active || response.Data.Active)) : false);
        // this.globalService.allow_create_jobs_checkin = (!!(response.Data.Subscriber && !!response.Data.Subscriber.allow_create_jobs_checkin) ? response.Data.Subscriber.allow_create_jobs_checkin : false);
        // this.globalService.allow_job_creation_app = (!!(response.Data.Subscriber && !!response.Data.Subscriber.allow_job_creation_app) ? response.Data.Subscriber.allow_job_creation_app : false);
      }
      this.router.navigate(['/tabs']);
    } else {
      console.log("========= here",response)
      this.toastService.presentToast(response.Message);
    }
  }

  clearCompanyCode() {
    this.loaderService.present();
    this.companyCode = "";
    this.myForm.controls.CompanyCode.setValue('');
    localStorage.removeItem("companyCode");
    localStorage.removeItem("ApiUrl");
    this.loaderService.dismiss();
  }

}