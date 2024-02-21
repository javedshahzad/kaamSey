import { Location } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Router, ActivatedRoute, NavigationExtras } from "@angular/router";
import { DatabaseService } from "src/app/core/database.service";
import { StatusTypes } from "src/app/models/db-models/inspection-model";
import { ArchiveEnum } from "src/app/models/all-data-model";
import { AlertController, IonItemSliding, PopoverController } from "@ionic/angular";
import { ToastService } from "src/app/core/toast.service";
import { InspectionActionListComponent } from '../inspection-action-list/inspection-action-list.component';
interface ItemReorderEventDetail {
  from: number;
  to: number;
  complete: (data?: boolean | any[]) => any;
}
@Component({
  selector: "app-sample-list",
  templateUrl: "./sample-list.component.html",
  styleUrls: ["./sample-list.component.scss"],
})
export class SampleListComponent implements OnInit {
  isArchiveData: boolean = false;
  public from: any;
  public jobId: any;
  action: string;
  materialList = [];
  inspectionObj: any;
  arrSample = [];
  isLoading = true;
  arrSampleTemp: any[];
  objStatusType = StatusTypes;
  archiveEnum = ArchiveEnum;
  selectedMaterial: any;
  public sample_collection_visible: boolean = false;
  public room_collection_visible: boolean = false;
  public material_collection_visible: boolean = false;
    @ViewChild(IonItemSliding) slidingItem: IonItemSliding;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private location: Location,
    private zone: NgZone,
    private alertController: AlertController,
    private toastService: ToastService,
    private ref: ChangeDetectorRef,
    private popOverCnt: PopoverController
  ) {
    this.sample_collection_visible = !!localStorage.getItem('sample_collection_visible') && localStorage.getItem('sample_collection_visible') == 'true' ? true : false;
    this.room_collection_visible = !!localStorage.getItem('room_collection_visible') && localStorage.getItem('room_collection_visible') == 'true' ? true : false;
    this.material_collection_visible = !!localStorage.getItem('material_collection_visible') && localStorage.getItem('material_collection_visible') == 'true' ? true : false;

  }

  ngOnInit() {
    // const objRoute = this.route.snapshot.params.obj;

    this.route.queryParams.subscribe((params) => {
      if (params && params.inspectionObj) {
        this.inspectionObj = JSON.parse(params.inspectionObj);
        this.jobId = this.inspectionObj.job_id
          ? this.inspectionObj.job_id
          : this.inspectionObj.JobId;
        this.action = params.action;
      }
      this.from = params.from;
      if (!params.from) {
        localStorage.removeItem("lastState");
      }
      if (params.from) {
        this.getmaterial();
        this.selectedMaterial = this.inspectionObj.Client_Material_Id;
      }
    });
  }
  ionViewWillEnter() {
    this.zone.run(() => {
      this.isLoading = true;
      this.arrSample = [];
      this.arrSampleTemp = [];
      if (this.action === this.archiveEnum.ArchiveInspection) {
        this.isArchiveData = true;
        this.getAllArchiveSample();
      } else {
        this.getAllSample();
      }
    });
  }
  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    // The `from` and `to` properties contain the index of the item
    // when the drag started and ended, respectively
    console.log("Dragged from index", ev.detail.from, "to", ev.detail.to);

    this.arrSampleTemp.splice(ev.detail.to, 0, this.arrSampleTemp.splice(ev.detail.from, 1)[0]);
    // Finish the reorder and position the item in the DOM based on
    // where the gesture ended. This method can also be called directly
    // by the reorder group
    ev.detail.complete();
  }
  async getAllArchiveSample() {
    const query = `select ArchiveString from ArchiveInspection where InspectionGuid='${this.inspectionObj.InspectionGuid}'`;
    await this.databaseService.db
      .executeSql(query, [])
      .then(async (data) => {
        let jsonString;
        if (data.rows.length > 0) {
          jsonString = JSON.parse(data.rows.item(0).ArchiveString);
          this.arrSample = jsonString.sampleList;
          this.arrSampleTemp = this.arrSample;
          this.isLoading = false;
        }
      })
      .catch((err) => {
        this.isLoading = false;
      });
  }

  async getAllSample() {
    let query;
    if (this.selectedMaterial) {
      query = `select * from InspectionSample where job_id=${this.jobId} and Client_Material_Id=${this.inspectionObj.Client_Material_Id} and IsDelete='false'`;
      await this.databaseService.db
        .executeSql(`select * from Inspection where JobId=${this.jobId}`, [])
        .then((res) => {
          if (res.rows.length != 0) {
            let rowData = [];
            for (let i = 0; i < res.rows.length; i++) {
              rowData.push({
                Status: res.rows.item(i).Status,
                InspectionDate: res.rows.item(i).InspectionDate,
                JobId: res.rows.item(i).JobId,
              });
            }

            this.inspectionObj = { ...this.inspectionObj, ...rowData[0] };
          }
        });
    } else {
      query = `select * from InspectionSample where InspectionGuid='${this.inspectionObj.InspectionGuid}'and IsDelete='false' ORDER by SortOrder COLLATE NOCASE ASC`;
    }
    await this.databaseService.db
      .executeSql(query, [])
      .then((res) => {
        this.arrSample = [];
        if (res.rows.length != 0) {
          for (let i = 0; i < res.rows.length; i++) {
            this.arrSample.push({
              job_id: res.rows.item(i).job_id,
              InspectionGuid: res.rows.item(i).InspectionGuid,
              SampleGuid: res.rows.item(i).SampleGuid,
              analysis_type: res.rows.item(i).analysis_type,
              sample_type: res.rows.item(i).sample_type,
              sample_vol: res.rows.item(i).sample_vol,
              flow_rate: res.rows.item(i).flow_rate,
              width: res.rows.item(i).width,
              length: res.rows.item(i).length,
              weight: res.rows.item(i).weight,
              comment: res.rows.item(i).comment,
              sample_desc: res.rows.item(i).sample_desc,
              sample_loc: res.rows.item(i).sample_loc,
              date_collected: res.rows.item(i).date_collected,
              control_sample: res.rows.item(i).control_sample,
              fb_sample: res.rows.item(i).fb_sample,
              sampling_start_time: res.rows.item(i).sampling_start_time,
              sampling_end_time: res.rows.item(i).sampling_end_time,
              sampling_duration: res.rows.item(i).sampling_duration,
              IncludePaintchips: res.rows.item(i).Include_Paint_chips,
              SurfaceSmoothClean: res.rows.item(i).Surface_Smooth_Clean,
              turn_around: res.rows.item(i).turn_around,
              squarefeet: res.rows.item(i).squarefeet,
              purpose: res.rows.item(i).purpose,
              WSSN: res.rows.item(i).WSSN,
              IncludeCUAnalysis: res.rows.item(i).IncludeCUAnalysis,
              volume: res.rows.item(i).volume,
              client_sample_id: res.rows.item(i).client_sample_id,
              ship_method: res.rows.item(i).ship_method,
              waybill: res.rows.item(i).waybill,
              ship_date: res.rows.item(i).ship_date,
              Other_metal_analysis: res.rows.item(i).Other_metal_analysis,
              other_element_analysis: res.rows.item(i).other_element_analysis,
              TimeCollected: res.rows.item(i).TimeCollected,
              BottleSizeId: res.rows.item(i).BottleSizeId,
              material_id: res.rows.item(i).material_id,
              Client_Material_Id: res.rows.item(i).Client_Material_Id,
              Lab_Id_Client: res.rows.item(i).Lab_Id_Client,
              SortOrder: res.rows.item(i).SortOrder,
            });
          }

          this.arrSampleTemp = this.arrSample;
        }
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }
  onInput(event: any): boolean {
    this.initializeItems();

    const q = event.srcElement.value;

    if (!q) {
      return;
    }

    this.arrSample = this.arrSample.filter((v) => {
      if (
        (v.analysis_type && q) ||
        (v.sample_type && q) ||
        (v.client_sample_id && q)
      ) {
        if (
          v.analysis_type.toString().toLowerCase().indexOf(q.toLowerCase()) >
          -1 ||
          v.sample_type
            .valueOf()
            .toString()
            .toLowerCase()
            .indexOf(q.toLowerCase()) > -1 ||
          v.client_sample_id.toString().toLowerCase().indexOf(q.toLowerCase()) >
          -1
        ) {
          return true;
        }
        return false;
      }
    });
  }
  initializeItems() {
    this.arrSample = this.arrSampleTemp;
  }

  goback() {
    this.location.back();
  }

  getmaterial() {
    this.databaseService.db
      .executeSql(
        `select * from MaterialListModels where Job_Id=? and IsDelete='false' ORDER BY CAST(Client_Material_Id AS INTEGER)`,
        [this.jobId]
      )
      .then(
        (res) => {
          if (res.rows.length > 0) {
            this.materialList = [];
            for (var i = 0; i < res.rows.length; i++) {
              this.materialList.push({
                Id: res.rows.item(i).Id,
                Job_Id: res.rows.item(i).Job_Id,
                Client_Material_Id: res.rows.item(i).Client_Material_Id,
                Material: res.rows.item(i).Material,
                Material_Sub: res.rows.item(i).Material_Sub,
                Classification: res.rows.item(i).Classification,
                Friable: res.rows.item(i).Friable,
                Size: res.rows.item(i).Size,
                Color: res.rows.item(i).Color,
                Material_Locations: res.rows.item(i).Material_Locations,
                Note_1: res.rows.item(i).Note_1,
                Note_2: res.rows.item(i).Note_2,
                Quantity: res.rows.item(i).Quantity,
                Units: res.rows.item(i).Units,
                Assumed: res.rows.item(i).Assumed,
              });
            }
          }
        },
        (err) => {}
      );
  }
  clear() {
    this.selectedMaterial = null;
  }

  change(flag?) {
    let query;
    if (this.selectedMaterial == null) {
      query = `select * from InspectionSample where job_id=${this.inspectionObj.JobId} and IsDelete='false'`;
    } else {
      query = `select * from InspectionSample where job_id=${this.inspectionObj.JobId} and Client_Material_Id=${this.selectedMaterial} and IsDelete='false'`;
    }
    this.databaseService.db
      .executeSql(query, [])
      .then((res) => {
        this.arrSample = [];
        if (res.rows.length != 0) {
          for (let i = 0; i < res.rows.length; i++) {
            this.arrSample.push({
              job_id: res.rows.item(i).job_id,
              InspectionGuid: res.rows.item(i).InspectionGuid,
              SampleGuid: res.rows.item(i).SampleGuid,
              analysis_type: res.rows.item(i).analysis_type,
              sample_type: res.rows.item(i).sample_type,
              sample_vol: res.rows.item(i).sample_vol,
              flow_rate: res.rows.item(i).flow_rate,
              width: res.rows.item(i).width,
              length: res.rows.item(i).length,
              weight: res.rows.item(i).weight,
              comment: res.rows.item(i).comment,
              sample_desc: res.rows.item(i).sample_desc,
              sample_loc: res.rows.item(i).sample_loc,
              date_collected: res.rows.item(i).date_collected,
              control_sample: res.rows.item(i).control_sample,
              fb_sample: res.rows.item(i).fb_sample,
              sampling_start_time: res.rows.item(i).sampling_start_time,
              sampling_end_time: res.rows.item(i).sampling_end_time,
              sampling_duration: res.rows.item(i).sampling_duration,
              IncludePaintchips: res.rows.item(i).Include_Paint_chips,
              SurfaceSmoothClean: res.rows.item(i).Surface_Smooth_Clean,
              turn_around: res.rows.item(i).turn_around,
              squarefeet: res.rows.item(i).squarefeet,
              purpose: res.rows.item(i).purpose,
              WSSN: res.rows.item(i).WSSN,
              IncludeCUAnalysis: res.rows.item(i).IncludeCUAnalysis,
              volume: res.rows.item(i).volume,
              client_sample_id: res.rows.item(i).client_sample_id,
              ship_method: res.rows.item(i).ship_method,
              waybill: res.rows.item(i).waybill,
              ship_date: res.rows.item(i).ship_date,
              Other_metal_analysis: res.rows.item(i).Other_metal_analysis,
              other_element_analysis: res.rows.item(i).other_element_analysis,
              TimeCollected: res.rows.item(i).TimeCollected,
              BottleSizeId: res.rows.item(i).BottleSizeId,
              material_id: res.rows.item(i).material_id,
              Client_Material_Id: res.rows.item(i).Client_Material_Id,
              Lab_Id_Client: res.rows.item(i).Lab_Id_Client,
              SortOrder: res.rows.item(i).SortOrder,
            });
          }

          this.arrSampleTemp = this.arrSample;
        }
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }

  goToSurveyList() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(this.inspectionObj),
      },
    };
    this.router.navigate(["/tabs/tab2/surveyroomList"], navigationExtras);
  }

  gotoMaterials() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(this.inspectionObj),
      },
    };
    this.router.navigate(["/tabs/tab2/materialList"], navigationExtras);
  }

  add(obj?) {
    if (obj) {
      obj.title = "edit";
      var new_obj;
      if (obj) {
        new_obj = Object.assign({}, this.inspectionObj, obj);
      }
      let navigationExtras: NavigationExtras = {
        queryParams: {
          inspectionObj: JSON.stringify(new_obj),
        },
      };
      this.router.navigate([`/tabs/tab2/addsample`], navigationExtras);
    } else {
      this.inspectionObj.title = "add";
      let navigationExtras: NavigationExtras = {
        queryParams: {
          inspectionObj: JSON.stringify(this.inspectionObj),
        },
      };
      this.router.navigate([`/tabs/tab2/addsample`], navigationExtras);
    }
  }

  async removeItem(item) {
    this.slidingItem.closeOpened();
    const alert = await this.alertController.create({
      header: "Confirm Delete",
      message:
        "This sample will be deleted from mobile. Do you want to continue?",
      backdropDismiss: false,
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
          handler: (blah) => {},
        },
        {
          text: "Ok",
          handler: async () => {
            this.slideDeleteSample(item);
          },
        },
      ],
    });
    await alert.present();
  }

  async slideDeleteSample(item) {
    await this.databaseService.db.executeSql(
      `update InspectionSample set IsDelete='true' where InspectionGuid=? and SampleGuid=?`,
      [item.InspectionGuid, item.SampleGuid]
    );

    //await this.doRefresh();
    //  setTimeout(() => {
    //   this.getAllSample();
    //   this.ref.detectChanges();
    // }, 500);

    await this.getAllSample();
    await this.ref.detectChanges();

    this.toastService.presentToast("Sample deleted successfully",true);
  }

  async doRefresh() {

    setTimeout(async () => {
      await this.getAllSample();
    }, 100);

  }

  ionViewWillLeave() {

    const arrList = [];
    this.arrSampleTemp.forEach(function (value, i) {
      arrList.push([`update InspectionSample set SortOrder = ${i+1} where SampleGuid = '${value.SampleGuid}' and InspectionGuid = '${value.InspectionGuid}'`]);
    });

    if (arrList.length > 0) {
      this.databaseService.db
        .sqlBatch(arrList)
        .then(() => { })
        .catch((error) => {
          console.error(error);
        });
    }

  }
  async showInspActions(event: any) {
    let popOverEvent = await this.popOverCnt.create({
      component: InspectionActionListComponent,
      event: event,
      componentProps: { inspectionObj: this.inspectionObj,fromSampleList:true },
      cssClass: 'inspActionDiv'
    });
    return await popOverEvent.present();

  }
}
