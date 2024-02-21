import { Location } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { DatabaseService } from "src/app/core/database.service";
import { StatusTypes } from "src/app/models/db-models/inspection-model";

@Component({
  selector: "app-survey-room-list",
  templateUrl: "./survey-room-list.component.html",
  styleUrls: ["./survey-room-list.component.scss"],
})
export class SurveyRoomListComponent implements OnInit {
  public keyword: any;
  public selectedMaterial: any;
  public materialList: any = [];
  public jobId: any;
  public from: any;
  isLoading = true;
  arrSurveyRoomTemp: any[];
  objStatusType = StatusTypes;
  surveyRoomList: any = [];
  inspectionObj: any = {};
  public sample_collection_visible: boolean = false;
  public room_collection_visible: boolean = false;
  public material_collection_visible: boolean = false;
  constructor(
    public route: ActivatedRoute,
    public databaseService: DatabaseService,
    public router: Router,
    private location: Location
  ) { 
    this.sample_collection_visible = !!localStorage.getItem('sample_collection_visible') && localStorage.getItem('sample_collection_visible') == 'true' ? true : false;
    this.room_collection_visible = !!localStorage.getItem('room_collection_visible') && localStorage.getItem('room_collection_visible') == 'true' ? true : false;
    this.material_collection_visible = !!localStorage.getItem('material_collection_visible') && localStorage.getItem('material_collection_visible') == 'true' ? true : false;

  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params && params.inspectionObj) {
        this.inspectionObj = JSON.parse(params.inspectionObj);

        // this.jobId = this.inspectionObj.JobId;
        this.jobId = this.inspectionObj.job_id
          ? this.inspectionObj.job_id
          : this.inspectionObj.JobId

        this.from = params.from;
        this.keyword = "";
        // if(this.from =='material_list'){
        //   this.getmaterials();
        // }
        if (!params.from) {
          localStorage.removeItem("lastState");
        }
        if (params.from) {
          this.getmaterials();
          this.selectedMaterial = this.inspectionObj.Client_Material_Id;
        }
        this.getSurveyRooms();
      }
    });
  }

  goback() {
    this.location.back();
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
        from: "survey_room",
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

  getSurveyRooms() {
    let query;
    if (this.inspectionObj.Client_Material_Id) {
      query = `select * from MaterialRoom where job_id=${this.jobId} and Client_Material_Id=${this.inspectionObj.Client_Material_Id} and IsDelete='false'`;
    } else {
      query = `select * from MaterialRoom where job_id=${this.jobId} and IsDelete='false'`;
    }
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
          this.arrSurveyRoomTemp = this.surveyRoomList;
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
    if (this.selectedMaterial == null) {
      query = `select * from MaterialRoom where job_id = ${this.jobId} and IsDelete='false'`;
    } else {
      query = `select * from MaterialRoom where job_id=${this.jobId} and Client_Material_Id=${this.selectedMaterial} and IsDelete='false'`;
    }
    this.databaseService.db
      .executeSql(query, [])
      .then((data) => {
        this.surveyRoomList = [];
        if (data.rows.length != 0) {
          for (let i = 0; i < data.rows.length; i++) {
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
          this.arrSurveyRoomTemp = this.surveyRoomList;
          this.keyword = "";

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
    this.surveyRoomList = this.surveyRoomList.filter((v) => {
      if ((v.room_number && q) || (v.floor_number && q)) {
        if (
          v.room_number.toString().toLowerCase().indexOf(q.toLowerCase()) >
          -1 ||
          (v.floor_number &&
            v.floor_number.toString().toLowerCase().indexOf(q.toLowerCase()) >
            -1)
        ) {
          return true;
        }
        return false;
      }
    });
  }
  initializeItems() {
    this.surveyRoomList = this.arrSurveyRoomTemp;
  }
  getmaterials() {
    this.databaseService.db
      .executeSql(
        `select * from MaterialListModels where Job_Id=? and IsDelete='false' ORDER by Material`,
        [this.jobId]
      )
      .then(
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
              });
            }
          }
        },
        (err) => {

        }
      );
  }
  clear() {
    this.selectedMaterial = null;
    this.keyword = "";
  }

  materials(data, isFromMaterialCount?) {

    let paramsObj: any;
    var new_obj;
    if (data) {
      new_obj = Object.assign({}, this.inspectionObj, data);
    }
    paramsObj = {
      inspectionObj: JSON.stringify(new_obj),
      from: isFromMaterialCount ? "survey_room_list" : "",
    }
    if (isFromMaterialCount) {
      paramsObj.isFromMaterialCount = isFromMaterialCount;
    }

    let navigationExtras: NavigationExtras = {
      queryParams: paramsObj,
    };

    this.router.navigate(["/tabs/tab2/materialList"], navigationExtras);
  }
  gotoSamplelist() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(this.inspectionObj),
      },
    };
    this.router.navigate([`/tabs/tab2/samplelist`], navigationExtras);
  }
}
