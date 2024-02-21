import { Component, OnInit, ElementRef } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { TimestampService } from 'src/app/core/timestamp.service';
import { DatabaseService } from 'src/app/core/database.service';
import { SQLiteObject, SQLite } from '@ionic-native/sqlite/ngx';
import { ToastService } from 'src/app/core/toast.service';
import { Location } from '@angular/common';
import { ShipmentTracking, JobData } from 'src/app/models/shipment-tracking-model';
import { JobService } from '../job.service';
import { LoaderService } from 'src/app/core/loader.service';
import { Network } from '@ionic-native/network/ngx';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-shipment-tracking',
  templateUrl: './shipment-tracking.component.html',
  styleUrls: ['./shipment-tracking.component.scss'],
})
export class ShipmentTrackingComponent implements OnInit {

  constructor(private formBuilder: FormBuilder,
    private timestampService: TimestampService,
    private databaseService: DatabaseService,
    private jobService:JobService,
    private loaderService: LoaderService,
    private network: Network,
    private toastService: ToastService,
    private el: ElementRef,
    private location: Location,
    private translateService: TranslateService) { }
  jobList: JobData[] = [];
  submitAttempt: boolean = false;
  shipmentForm: any;
  isLoading = true;

  ngOnInit() {
    this.FormInit();
    this.getJobIds();
  }

  async FormInit() {
    this.shipmentForm = this.formBuilder.group({
      JobId: ["", Validators.compose([Validators.required])],
      ShipMethod: ["", Validators.compose([Validators.required])],
      Waybill: ["", Validators.compose([Validators.maxLength(50)])],
      ShipDate: [this.timestampService.generateLocalTimeStamp(), Validators.compose([Validators.required])]
    });
  }

  async getJobIds() {
    const query = `select JobId,IsCheckedIn from Inspection where IsDelete = 'false' and JobId in (select job_id from InspectionSample where IsDelete = 'false')
        union 
        select JobId,IsCheckedIn from ArchiveInspection where IsDelete = 'false' and JobId in (select job_id from InspectionSample where IsDelete = 'false')`;

    await this.databaseService.db
      .executeSql(query, [])
      .then((data) => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            this.jobList.push({
              JobId: data.rows.item(i).JobId,
              IsCheckedIn: data.rows.item(i).IsCheckedIn
            });
          }
        }
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }
  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement =
      this.el.nativeElement.querySelector("form .ng-invalid");
    firstInvalidControl.scrollIntoView();
  }
  async submit() {
    this.submitAttempt = true;
    if (this.shipmentForm.valid) {
      if (!!this.shipmentForm.get('JobId') && !!this.shipmentForm.get('JobId').value) {
        let archiveJobIds = this.jobList.filter((x) => { if (x.IsCheckedIn == 'true' && this.shipmentForm.get('JobId').value.includes(x.JobId)) { return x.JobId } }).map((x) => { return x.JobId });
        if (!!archiveJobIds) {
          let arrShipments: ShipmentTracking = {
            Job: archiveJobIds,
            ShipMethod: this.shipmentForm.get('ShipMethod').value,
            ShipDate: this.shipmentForm.get('ShipDate').value,
            Waybill: this.shipmentForm.get('Waybill').value
          };
         
          if (this.network.type != this.network.Connection.NONE) {
            await this.jobService.updateShipment(arrShipments).subscribe(async (res: any) => {
              if (!!res && res.Success) {
                this.loaderService.dismiss();
              }
              
            },
              (err) => {
                this.loaderService.dismiss();
              }
            );
          }
          // else {
          //   this.loaderService.dismiss();
          //   this.toastService.presentToast(this.translateService.instant('General.noInternet'));
          // }
        }

        var currJobIds = this.shipmentForm.get('JobId').value.filter(x => !archiveJobIds.includes(x));
        if (!!currJobIds) {
          const query = `update InspectionSample set ship_method=?,waybill=?,ship_date=? where job_id IN (${currJobIds}) and IsDelete='false'`;
          await this.databaseService.db
            .executeSql(query, [
              this.shipmentForm.value.ShipMethod,
              this.shipmentForm.value.Waybill,
              this.shipmentForm.value.ShipDate
            ])
            this.toastService.presentToast("Shipment tracked successfully.");

        }
        this.location.back();
        this.shipmentForm.reset()
          .then(() => { })
          .catch(() => { });
      }
    }
    else {
      this.scrollToFirstInvalidControl();
    }
  }
  goBack() {
    this.location.back();
    this.shipmentForm.reset();
  }
}
