import { Location } from "@angular/common";
import { Component, OnInit, ChangeDetectorRef, ViewChild, NgZone } from "@angular/core";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { AlertController, IonItemSliding } from "@ionic/angular";
import { DatabaseService } from "src/app/core/database.service";
import { TimestampService } from "src/app/core/timestamp.service";
import { ToastService } from "src/app/core/toast.service";
import { StatusTypes } from "src/app/models/db-models/inspection-model";

@Component({
  selector: "app-material-list",
  templateUrl: "./material-list.component.html",
  styleUrls: ["./material-list.component.scss"],
})
export class MaterialListComponent implements OnInit {
  isFromMaterialCount: boolean = false;
  public jobId: any;
  public arrSampleTemp: any = [];
  public arrSample: any = [];
  public selectedRoom: any;
  public from: any;
  public arrSurveyRoomTemp: any = [];
  public surveyRoomList: any = [];
  isLoading = true;
  arrMaterialTemp: any[];
  objStatusType = StatusTypes;
  materialList = [];
  inspectionObj: any;
  public sample_collection_visible: boolean = false;
  public room_collection_visible: boolean = false;
  public material_collection_visible: boolean = false;
  
  @ViewChild(IonItemSliding) slidingItem: IonItemSliding;

  constructor(
    public route: ActivatedRoute,
    public databaseService: DatabaseService,
    public router: Router,
    private location: Location,
    private toastService: ToastService,
    private ref: ChangeDetectorRef,
    private timestamp: TimestampService,
    private alertController: AlertController,
    private zone: NgZone
  ) { 
    this.sample_collection_visible = !!localStorage.getItem('sample_collection_visible') && localStorage.getItem('sample_collection_visible') == 'true' ? true : false;
    this.room_collection_visible = !!localStorage.getItem('room_collection_visible') && localStorage.getItem('room_collection_visible') == 'true' ? true : false;
    this.material_collection_visible = !!localStorage.getItem('material_collection_visible') && localStorage.getItem('material_collection_visible') == 'true' ? true : false;

  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params && params.inspectionObj) {
        this.inspectionObj = JSON.parse(params.inspectionObj);
        this.jobId = this.inspectionObj.job_id
          ? this.inspectionObj.job_id
          : this.inspectionObj.JobId

        this.from = params.from;
        if (params.isFromMaterialCount) {
          this.isFromMaterialCount = params.isFromMaterialCount;
        }

        if (this.from == "survey_room_list") {
          this.selectedRoom = this.inspectionObj.roomGuid;
          this.getSurveyRooms();
        }
        setTimeout(() => {
          this.getmaterial();
          this.ref.detectChanges();
        }, 500);



      }
    });
  }

  getmaterial() {
    var query: any;
    if (this.selectedRoom == null) {
      query = `select (select Path from MaterialImage where Job_id = ${this.jobId} and  Client_Material_Id = m.Client_Material_Id and IsDelete = 'false') as ImagePath, (select count(client_material_id) from MaterialRoom where job_id = ${this.jobId} and Client_Material_Id = m.Client_Material_Id and IsDelete='false') as mr,(select count(sample_id) from InspectionSample where job_id = ${this.jobId} and Client_Material_Id = m.Client_Material_Id and IsDelete='false') as sm,* 
      from MaterialListModels m where job_id = ${this.jobId} and IsDelete='false' ORDER BY CAST(Client_Material_Id AS INTEGER)`;
    } else {
      query = `select (select Path from MaterialImage where Job_id = ${this.jobId} and  Client_Material_Id = m.Client_Material_Id and IsDelete = 'false') as ImagePath,(select count(client_material_id) from MaterialRoom where job_id = ${this.jobId} 
      and Client_Material_Id = m.Client_Material_Id and IsDelete='false') as mr,(select count(sample_id) from InspectionSample
       where job_id = ${this.jobId} 
      and Client_Material_Id = m.Client_Material_Id and IsDelete='false') as sm,* 
            from MaterialListModels m where IsDelete='false' and job_id = ${this.jobId} AND
          client_material_id in(SELECT client_material_id FROM MaterialRoom where room_number = '${this.inspectionObj.room_number}' and floor_number ='${this.inspectionObj.floor_number}' AND job_id =${this.jobId} and IsDelete='false') ORDER BY CAST(Client_Material_Id AS INTEGER)`;
    }

    this.databaseService.db.executeSql(query, []).then(
      (res) => {
        this.materialList = [];
        if (res.rows.length > 0) {
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
              countValue: res.rows.item(i).sm,
              roomCount: res.rows.item(i).mr,
              ImagePath: res.rows.item(i).ImagePath,
            });
          }


          this.arrMaterialTemp = this.materialList;
          this.ref.detectChanges();
        }
        this.isLoading = false;
      },
      (err) => {
        this.isLoading = false;

      }
    );
  }



  showsample(data) {
    var countValue = data.countValue;
    if (countValue === 0) {
      return this.toastService.presentToast("No samples to edit");
    }
    else {

      var new_obj;
      if (data) {
        new_obj = Object.assign({}, this.inspectionObj, data);
      }
      new_obj.title = "edit";
      let navigationExtras: NavigationExtras = {
        queryParams: {
          inspectionObj: JSON.stringify(new_obj),
          from: 'material_list'
        },
      };
      this.router.navigate([`/tabs/tab2/addsample`], navigationExtras);
    }
  }



  goback() {
    this.location.back();
  }
  onInput(event: any): boolean {
    this.initializeItems();

    const q = event.srcElement.value;

    if (!q) {
      return;
    }

    this.materialList = this.materialList.filter((v) => {
      if ((v.Material && q) || (v.Material_Sub && q) || (v.Size && q)) {
        if (
          v.Material.toString().toLowerCase().indexOf(q.toLowerCase()) > -1 ||
          (v.Material_Sub &&
            v.Material_Sub.valueOf()
              .toString()
              .toLowerCase()
              .indexOf(q.toLowerCase()) > -1) ||
          (v.Size &&
            v.Size.toString().toLowerCase().indexOf(q.toLowerCase()) > -1)
        ) {
          return true;
        }
        return false;
      }
    });
  }
  initializeItems() {
    this.materialList = this.arrMaterialTemp;
  }

  addSurvey(status, data?) {
    if (data.roomCount == 0 && status == "edit") {
      this.toastService.presentToast("No rooms to edit");
      return;
    }
    var new_obj;
    if (data) {
      new_obj = Object.assign({}, this.inspectionObj, data);
    }
    // localStorage.setItem("lastState", JSON.stringify(new_obj));
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(new_obj),
        from: "material_list",
      },
    };
    this.router.navigate(
      [
        `/tabs/tab2/addsurveyroom/${status}/${this.inspectionObj.job_id
          ? this.inspectionObj.job_id
          : this.inspectionObj.JobId
        }`,
      ],
      navigationExtras
    );
  }

  public redirectToSurveyRoom(data) {
    var new_obj;
    if (data) {
      new_obj = Object.assign({}, this.inspectionObj, data);
    }

    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(new_obj),
        from: "material_list",
      },
    };
    this.router.navigate(["/tabs/tab2/surveyroomList"], navigationExtras);
  }

  getSurveyRooms() {
    let query;
    query = `select * from MaterialRoom where job_id=${this.jobId} and IsDelete='false'`;
    this.databaseService.db.executeSql(query, []).then(
      (data) => {
        if (data.rows.length > 0) {


          this.surveyRoomList = [];
          for (var i = 0; i < data.rows.length; i++) {
            this.surveyRoomList.push({
              material_id: data.rows.item(i).material_id,
              room_number: data.rows.item(i).room_number,
              floor_number: data.rows.item(i).floor_number,
              sq_feet: data.rows.item(i).sq_feet,
              linear_feet_0_4: data.rows.item(i).linear_feet_0_4,
              linear_feet_5_7: data.rows.item(i).linear_feet_5_7,
              linear_feet_8_12: data.rows.item(i).linear_feet_8_12,
              linear_feet_12_up: data.rows.item(i).linear_feet_12_up,
              Ends: data.rows.item(i).Ends,
              Hangers: data.rows.item(i).Hangers,
              damage_puncture: data.rows.item(i).damage_puncture,
              damage_vibration: data.rows.item(i).damage_vibration,
              damage_water: data.rows.item(i).damage_water,
              damage_air: data.rows.item(i).damage_air,
              damage_delamination: data.rows.item(i).damage_delamination,
              damage_slow_deterioration: data.rows.item(i)
                .damage_slow_deterioration,
              damage_use_wear: data.rows.item(i).damage_use_wear,
              damage_extent: data.rows.item(i).damage_extent,
              damage_feet: data.rows.item(i).damage_feet,
              access: data.rows.item(i).access,
              access_frequency: data.rows.item(i).access_frequency,
              risk_vibration: data.rows.item(i).risk_vibration,
              risk_air_move: data.rows.item(i).risk_air_move,
              risk_dist_potential: data.rows.item(i).risk_dist_potential,
              acm_condition: data.rows.item(i).acm_condition,
              acm_height: data.rows.item(i).acm_height,
              roomGuid: data.rows.item(i).roomGuid,
              record_id: data.rows.item(i).record_id,
              job_id: data.rows.item(i).job_id,
              client_material_id: data.rows.item(i).client_material_id,
              IsDelete: data.rows.item(i).IsDelete
            });
          }
          var helper = {};
          this.surveyRoomList = this.surveyRoomList.reduce(function (r, o) {
            var key = o.room_number + "-" + o.floor_number;
            if (!helper[key]) {
              helper[key] = Object.assign({}, o); // create a copy of o
              if (helper[key]["matcount"] == undefined) {
                helper[key]["matcount"] = 1;
              }
              r.push(helper[key]);
            } else {
              helper[key]["matcount"] += 1;
            }

            return r;
          }, []);

        }
        this.isLoading = false;
      },
      (err) => {
        this.isLoading = false;

      }
    );
  }

  change(flag?) {
    let query;
    if (this.selectedRoom == null) {
      query = `select (select Path from MaterialImage where Job_id = ${this.jobId} and  Client_Material_Id = m.Client_Material_Id and IsDelete = 'false') as ImagePath,(select count(client_material_id) from MaterialRoom where job_id = ${this.jobId} and Client_Material_Id = m.Client_Material_Id and IsDelete='false') as mr,(select count(sample_id) from InspectionSample where job_id = ${this.jobId} and Client_Material_Id = m.Client_Material_Id and IsDelete='false') as sm,* 
      from MaterialListModels m where job_id = ${this.jobId} and IsDelete='false' ORDER BY CAST(Client_Material_Id AS INTEGER)`;
    } else {
      let obj: any = this.surveyRoomList.filter((item) => {
        return item.roomGuid == this.selectedRoom;
      });
      query = `select (select Path from MaterialImage where Job_id = ${this.jobId} and  Client_Material_Id = m.Client_Material_Id and IsDelete = 'false') as ImagePath,(select count(client_material_id) from MaterialRoom where job_id = ${this.jobId} 
      and Client_Material_Id = m.Client_Material_Id and IsDelete='false') as mr,(select count(sample_id) from InspectionSample
      where job_id = ${this.jobId} 
      and Client_Material_Id = m.Client_Material_Id and IsDelete='false') as sm,* 
      from MaterialListModels m where IsDelete='false' and job_id = ${this.jobId} AND
      client_material_id in(SELECT client_material_id FROM MaterialRoom where room_number = '${obj[0].room_number}'
      and floor_number ='${obj[0].floor_number}' AND job_id =${this.jobId} and IsDelete='false') ORDER BY CAST(Client_Material_Id AS INTEGER)`;
    }
    this.databaseService.db.executeSql(query, []).then(
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
              countValue: res.rows.item(i).sm,
              roomCount: res.rows.item(i).mr,
            });
          }
          this.arrMaterialTemp = this.materialList;
        }
        this.isLoading = false;
      },
      (err) => {
        this.isLoading = false;

      }
    );
  }
  clear() {
    this.selectedRoom = null;
  }
  getMaterialNameFormat(arr) {
    return this.timestamp.getMaterialNameFormat(arr);
  }

  limitNotes(value: string, stringLimit: number): any {

    if (value.length > stringLimit) value = value.substring(0, stringLimit);
    return value;
  }

  gotoSurveyRoomList() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(this.inspectionObj),
      },
    };
    this.router.navigate(["/tabs/tab2/surveyroomList"], navigationExtras);
  }

  gotoSamplelist() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(this.inspectionObj),
      },
    };
    this.router.navigate([`/tabs/tab2/samplelist`], navigationExtras);
  }

  add(status, data?) {
    var new_obj;
    if (data) {
      new_obj = Object.assign({}, this.inspectionObj, data);
    }
    // localStorage.setItem("lastState", JSON.stringify(new_obj));
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(new_obj),
      },
    };
    this.router.navigate(
      [
        `/tabs/tab2/addmaterial/${status}/${this.inspectionObj.job_id
          ? this.inspectionObj.job_id
          : this.inspectionObj.JobId
        }`,
      ],
      navigationExtras
    );
  }

  async removeItem(item) {
    this.slidingItem.closeOpened();
    let isSamp = false; let isMatRoom = false;

    let querySamp = `select * from InspectionSample where job_id=${item.Job_Id} and Client_Material_Id ='${item.Client_Material_Id}' and IsDelete='false'`;
    await this.databaseService.db.executeSql(querySamp, []).then(
      (data) => {
        if (data.rows.length > 0) {
          isSamp = true;
        }
      },
      (err) => {
      }
    );

    let query = `select * from MaterialRoom where job_id=${item.Job_Id} and Client_Material_Id ='${item.Client_Material_Id}' and IsDelete='false'`;
    await this.databaseService.db.executeSql(query, []).then(
      (data) => {
        if (data.rows.length > 0) {
          isMatRoom = true;
        }
      },
      (err) => {
      }
    );

    let delMsg = "This material will be deleted from mobile. Do you want to continue?";
    if (isSamp && isMatRoom) {
      delMsg = "This material has a recorded sample and survey room. Deleting this material will also delete them. Do you want to continue?";
    }
    else if (isSamp) {
      delMsg = "This material has a recorded sample. Deleting this material will also delete the sample. Do you want to continue?";
    }
    else if (isMatRoom) {
      delMsg = "This material has a recorded survey room. Deleting this material will also delete the survey room. Do you want to continue?";
    }

    const alert = await this.alertController.create({
      header: "Confirm Delete",
      message: delMsg,
      backdropDismiss: false,
      buttons: [
        {
          text: "No",
          role: "cancel",
          handler: (blah) => { },
        },
        {
          text: "Yes",
          handler: async () => {
            this.slideDeleteMaterial(item);
          },
        },
      ],
    });
    await alert.present();
  }

  async slideDeleteMaterial(item) {
    await this.databaseService.db.executeSql(
      `update MaterialListModels set IsDelete='true' where Job_Id=? and Client_Material_Id=?`,
      [item.Job_Id, item.Client_Material_Id]
    );
    await this.databaseService.db.executeSql(
      `update MaterialImage set IsDelete='true' where Job_Id=? and Client_Material_Id=?`,
      [item.Job_Id, item.Client_Material_Id]
    );
    await this.databaseService.db.executeSql(
      `update MaterialRoom set IsDelete='true' where Job_Id=? and Client_Material_Id=?`,
      [item.Job_Id, item.Client_Material_Id]
    );
    await this.databaseService.db.executeSql(
      `update InspectionSample set IsDelete='true' where Job_Id=? and Client_Material_Id=?`,
      [item.Job_Id, item.Client_Material_Id]
    );

    this.toastService.presentToast("Material deleted successfully",true);
    setTimeout(() => {
      this.getmaterial();
      this.ref.detectChanges();
    }, 500);
  }
}
