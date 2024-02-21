import { Component, OnInit, ElementRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { LoaderService } from 'src/app/core/loader.service';
import { ClientList } from 'src/app/models/client-model';
import { Network } from '@ionic-native/network/ngx';
import { JobService } from '../../job.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/core/toast.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.scss'],
})
export class AddClientComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private router: Router,private jobService: JobService,private translateService: TranslateService,  private toastService: ToastService,private network: Network,private location: Location, private loaderService: LoaderService, private el: ElementRef) { }
  clientAddForm: any;
  ngOnInit() {
    this.FormInit();
  }
  async FormInit() {
    this.clientAddForm = this.formBuilder.group({
      clientName: ['', Validators.compose([Validators.required]),],
      phoneNo: [''],
      contactName: [''],
      contactEmail: [''],
    });
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
  async submit() {
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
          this.loaderService.dismiss();
          if (!!res && res.Success) {
              this.toastService.presentToast("Client added successfully.");
              this.router.navigate([`/tabs/tab2/addJob/${0}`]);
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
  }
}
