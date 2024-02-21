import { Location } from "@angular/common";
import { Component, OnInit, ElementRef } from "@angular/core";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { DatabaseService } from "src/app/core/database.service";
import { StatusTypes } from "src/app/models/db-models/inspection-model";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastService } from "src/app/core/toast.service";
import { GuidService } from "src/app/core/guid.service";
import { TimestampService } from "src/app/core/timestamp.service";

@Component({
  selector: "app-add-survey-room",
  templateUrl: "./add-survey-room.component.html",
  styleUrls: ["./add-survey-room.component.scss"],
})
export class AddSurveyRoomComponent implements OnInit {

  public holdValues: any = {
    "client_material_id": null,
    "room_number": null,
    "floor_number": null,
    "sq_feet": null,
    "linear_feet_0_4": null,
    "linear_feet_5_7": null,
    "linear_feet_8_12": null,
    "linear_feet_12_up": null,
    "Ends": false,
    "Hangers": false,
    "damage_puncture": false,
    "damage_vibration": false,
    "damage_water": false,
    "damage_air": false,
    "damage_delamination": false,
    "damage_slow_deterioration": false,
    "damage_use_wear": false,
    "damage_extent": null,
    "damage_feet": null,
    "access": false,
    "access_frequency": false,
    "risk_vibration": null,
    "risk_dist_potential": null,
    "acm_condition": null,
    "acm_height": null
  };

  public yesID: any;
  public disableFields: boolean = false;
  public from: any;
  public MaterialId: any;
  public MaterialDropDown: any = [];
  submitAttempt: boolean = false;
  SurveyDropDown: any = [];
  public selectedMaterial: any;
  type: any;
  materialList: any = [];
  surverRoomForm: FormGroup;
  jobId;
  public inspectionObj: any = {};
  surveyRoomList: any[];
  selectedRoom: any;
  constructor(
    public route: ActivatedRoute,
    public databaseService: DatabaseService,
    public router: Router,
    private location: Location,
    public formBuilder: FormBuilder,
    public toastService: ToastService,
    private el: ElementRef,
    public guidService: GuidService,
    public timestamp: TimestampService
  ) {
    this.type = this.route.snapshot.params.status;
    this.jobId = this.route.snapshot.params.jobid;
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params && params.inspectionObj) {
        this.inspectionObj = JSON.parse(params.inspectionObj);
        this.from = params.from;
        console.log(this.type);
        if (this.type == 'edit') {
          this.setStringDropDown();
          this.setFeetFields();
        }
      }
    });
    // if(this.type=='edit'){
    //   this.sqFeetChange();
    //   this.linearFeetChange();
    //   this.endHangerChange();
    //   this.setFeetFields();

    // }
    this.holdValues = {
      "client_material_id": null,
      "room_number": null,
      "floor_number": null,
      "sq_feet": null,
      "linear_feet_0_4": null,
      "linear_feet_5_7": null,
      "linear_feet_8_12": null,
      "linear_feet_12_up": null,
      "Ends": false,
      "Hangers": false,
      "damage_puncture": false,
      "damage_vibration": false,
      "damage_water": false,
      "damage_air": false,
      "damage_delamination": false,
      "damage_slow_deterioration": false,
      "damage_use_wear": false,
      "damage_extent": null,
      "damage_feet": null,
      "access": false,
      "access_frequency": false,
      "risk_vibration": null,
      "risk_dist_potential": null,
      "acm_condition": null,
      "acm_height": null
    };
    let holdValues = localStorage.getItem('HOLD_ADD_SURVEY');
    if (holdValues) {
      this.holdValues = JSON.parse(localStorage.getItem('HOLD_ADD_SURVEY'));
    }
    this.FormInit();

    if (this.from == "material_list") {
      this.setMaterialValue();
    }
    if (this.type == "edit" && this.from == "material_list") {
      this.getSurveyRooms();
    }
    this.getmaterials();
    this.getDropdown();
  }
  setMaterialValue() {
    this.surverRoomForm.controls.client_material_id.setValue(
      this.inspectionObj.Client_Material_Id
    );
  }
  setFeetFields() {
    if (this.inspectionObj.sq_feet === 0) {
      this.inspectionObj.sq_feet = this.inspectionObj.sq_feet.toString();
    }
    if (this.inspectionObj.linear_feet_0_4 === 0) {
      this.inspectionObj.linear_feet_0_4 = this.inspectionObj.linear_feet_0_4.toString();
    }
    if (this.inspectionObj.linear_feet_5_7 === 0) {
      this.inspectionObj.linear_feet_5_7 = this.inspectionObj.linear_feet_5_7.toString();
    }
    if (this.inspectionObj.linear_feet_8_12 === 0) {
      this.inspectionObj.linear_feet_8_12 = this.inspectionObj.linear_feet_8_12.toString();
    }
    if (this.inspectionObj.linear_feet_12_up === 0) {
      this.inspectionObj.linear_feet_12_up = this.inspectionObj.linear_feet_12_up.toString();
    }
  }
  setStringDropDown() {

    this.inspectionObj.Ends = this.inspectionObj.Ends ? this.inspectionObj.Ends.toString() : '';
    this.inspectionObj.Hangers = this.inspectionObj.Hangers ? this.inspectionObj.Hangers.toString() : '';
    this.inspectionObj.damage_puncture = this.inspectionObj.damage_puncture ? this.inspectionObj.damage_puncture.toString() : '';
    this.inspectionObj.damage_vibration = this.inspectionObj.damage_vibration ? this.inspectionObj.damage_vibration.toString() : '';;
    this.inspectionObj.damage_water = this.inspectionObj.damage_water ? this.inspectionObj.damage_water.toString() : '';;
    this.inspectionObj.damage_air = this.inspectionObj.damage_air ? this.inspectionObj.damage_air.toString() : '';
    this.inspectionObj.damage_delamination = this.inspectionObj.damage_delamination ? this.inspectionObj.damage_delamination.toString() : '';
    this.inspectionObj.damage_slow_deterioration = this.inspectionObj.damage_slow_deterioration ? this.inspectionObj.damage_slow_deterioration.toString() : '';
    this.inspectionObj.damage_use_wear = this.inspectionObj.damage_use_wear ? this.inspectionObj.damage_use_wear.toString() : '';
    this.inspectionObj.damage_extent = this.inspectionObj.damage_extent ? this.inspectionObj.damage_extent.toString() : '';
    this.inspectionObj.access = this.inspectionObj.access ? this.inspectionObj.access.toString() : '';
    this.inspectionObj.access_frequency = this.inspectionObj.access_frequency ? this.inspectionObj.access_frequency.toString() : '';
    this.inspectionObj.risk_vibration = this.inspectionObj.risk_vibration ? this.inspectionObj.risk_vibration.toString() : '';
    this.inspectionObj.risk_air_move = this.inspectionObj.risk_air_move ? this.inspectionObj.risk_air_move.toString() : '';
    this.inspectionObj.risk_dist_potential = this.inspectionObj.risk_dist_potential ? this.inspectionObj.risk_dist_potential.toString() : '';
    this.inspectionObj.acm_condition = this.inspectionObj.acm_condition ? this.inspectionObj.acm_condition.toString() : '';
  }

  goback() {
    this.location.back();
  }

  FormInit() {


    this.surverRoomForm = this.formBuilder.group({
      client_material_id: [
        this.type == 'edit'
          ? this.inspectionObj.client_material_id
          : this.holdValues.client_material_id,
        Validators.compose([Validators.required, Validators.pattern("[0-9]+")]),
      ],
      room_number: [
        this.type == 'edit' ? this.inspectionObj.room_number : this.holdValues.room_number,
        Validators.compose([Validators.required, Validators.maxLength(50)]),
      ],
      floor_number: [
        this.type == 'edit'
          ? this.inspectionObj.floor_number
          : this.holdValues.floor_number,
        Validators.compose([Validators.required, Validators.maxLength(50)]),
      ],
      sq_feet: [this.type == 'edit' ? this.inspectionObj.sq_feet : this.holdValues.sq_feet],
      linear_feet_0_4: [
        this.type == 'edit'
          ? this.inspectionObj.linear_feet_0_4
          : this.holdValues.linear_feet_0_4,
      ],
      linear_feet_5_7: [
        this.type == 'edit'
          ? this.inspectionObj.linear_feet_5_7
          : this.holdValues.linear_feet_5_7,
      ],
      linear_feet_8_12: [
        this.type == 'edit'
          ? this.inspectionObj.linear_feet_8_12
          : this.holdValues.linear_feet_8_12,
      ],
      linear_feet_12_up: [
        this.type == 'edit'
          ? this.inspectionObj.linear_feet_12_up
          : this.holdValues.linear_feet_12_up,
      ],
      Ends: [this.type == 'edit' ? this.inspectionObj.Ends : this.holdValues.Ends],
      Hangers: [
        this.type === "edit" ? this.inspectionObj.Hangers : this.holdValues.Hangers,
      ],
      damage_puncture: [
        this.type == 'edit'
          ? this.inspectionObj.damage_puncture
          : this.holdValues.damage_puncture,
      ],
      damage_vibration: [
        this.type == 'edit'
          ? this.inspectionObj.damage_vibration
          : this.holdValues.damage_puncture,
      ],
      damage_water: [
        this.type == 'edit'
          ? this.inspectionObj.damage_water
          : this.holdValues.damage_water,
      ],
      damage_air: [
        this.type == 'edit' ? this.inspectionObj.damage_air : this.holdValues.damage_air,
      ],
      damage_delamination: [
        this.type == 'edit'
          ? this.inspectionObj.damage_delamination
          : this.holdValues.damage_delamination,
      ],
      damage_slow_deterioration: [
        this.type == 'edit'
          ? this.inspectionObj.damage_slow_deterioration
          : this.holdValues.damage_slow_deterioration,
      ],
      damage_use_wear: [
        this.type == 'edit'
          ? this.inspectionObj.damage_use_wear
          : this.holdValues.damage_use_wear,
      ],
      damage_extent: [
        this.type == 'edit'
          ? this.inspectionObj.damage_extent
          : this.holdValues.damage_extent,
      ],
      damage_feet: [
        this.type == 'edit' ? this.inspectionObj.damage_feet : this.holdValues.damage_feet,
        Validators.compose([Validators.pattern("^[0-9]*$")]),

      ],
      access: [this.type == 'edit' ? this.inspectionObj.access : this.holdValues.access],
      access_frequency: [
        this.type == 'edit'
          ? this.inspectionObj.access_frequency
          : this.holdValues.access_frequency,
      ],
      risk_vibration: [
        this.type == 'edit'
          ? this.inspectionObj.risk_vibration
          : this.holdValues.risk_vibration,
      ],
      risk_air_move: [
        this.type == 'edit'
          ? this.inspectionObj.risk_air_move
          : this.holdValues.risk_air_move,
      ],
      risk_dist_potential: [
        this.type == 'edit'
          ? this.inspectionObj.risk_dist_potential
          : this.holdValues.risk_dist_potential,
      ],
      acm_condition: [
        this.type == 'edit'
          ? this.inspectionObj.acm_condition
          : this.holdValues.acm_condition,
      ],
      acm_height: [
        this.type == 'edit' ? this.inspectionObj.acm_height : this.holdValues.acm_height,
        Validators.compose([Validators.maxLength(50)]),
        []
      ],
    });
  }

  formAutofill(e) {
    let data = this.materialList.filter((item) => {
      return item.Client_Material_Id == e.target.value;
    });
    //  this.clientMaterialId = data[0].Client_Material_Id;
    this.MaterialId = data[0].Id;
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

  public AddSurveyRoom(flag?) {
    this.submitAttempt = true;
    if (this.type == "add" && this.surverRoomForm.valid) {
      this.databaseService.db
        .executeSql(
          `insert into MaterialRoom(roomGuid,record_id,job_id,client_material_id,material_id,room_number,floor_number,sq_feet,linear_feet_0_4,linear_feet_5_7, 
                    linear_feet_8_12,linear_feet_12_up,Ends,Hangers,damage_puncture,  
                    damage_vibration,damage_water,damage_air,damage_delamination,damage_slow_deterioration,damage_use_wear,damage_extent,damage_feet,access,access_frequency,risk_vibration,risk_air_move,risk_dist_potential,acm_condition,acm_height,IsDelete) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            this.guidService.generateGuid(),
            0,
            this.jobId,
            this.surverRoomForm.value.client_material_id,
            this.MaterialId,
            this.surverRoomForm.value.room_number,
            this.surverRoomForm.value.floor_number,
            this.surverRoomForm.value.sq_feet,
            this.surverRoomForm.value.linear_feet_0_4,
            this.surverRoomForm.value.linear_feet_5_7,
            this.surverRoomForm.value.linear_feet_8_12,
            this.surverRoomForm.value.linear_feet_12_up,
            this.surverRoomForm.value.Ends,
            this.surverRoomForm.value.Hangers,
            this.surverRoomForm.value.damage_puncture,
            this.surverRoomForm.value.damage_vibration,
            this.surverRoomForm.value.damage_water,
            this.surverRoomForm.value.damage_air,
            this.surverRoomForm.value.damage_delamination,
            this.surverRoomForm.value.damage_slow_deterioration,
            this.surverRoomForm.value.damage_use_wear,
            this.surverRoomForm.value.damage_extent,
            this.surverRoomForm.value.damage_feet,
            this.surverRoomForm.value.access,
            this.surverRoomForm.value.access_frequency,
            this.surverRoomForm.value.risk_vibration,
            this.surverRoomForm.value.risk_air_move,
            this.surverRoomForm.value.risk_dist_potential,
            this.surverRoomForm.value.acm_condition,
            this.surverRoomForm.value.acm_height,
            false
          ]
        )
        .then((res) => {
          localStorage.removeItem('HOLD_ADD_SURVEY');
          this.toastService.presentToast("Survey Room added successfully.",true);
          if (flag == "SCA") {
            this.surverRoomForm.reset();
          } else {

            this.location.back();
            this.surverRoomForm.reset();
          }
        });
    } else if (this.type == "edit" && this.surverRoomForm.valid) {
      this.databaseService.db
        .executeSql(
          `update MaterialRoom set record_id=?,job_id=?,client_material_id=?, material_id=?, room_number=?,floor_number=?, sq_feet=?, linear_feet_0_4=?, 
                        linear_feet_5_7=?,linear_feet_8_12=?,linear_feet_12_up=?,Ends=?, Hangers=?,damage_puncture=?,damage_vibration=?,damage_water=?,
                        damage_air=?,damage_delamination=?,damage_slow_deterioration=? ,damage_use_wear=?,damage_extent=?,damage_feet=?,access=?,access_frequency=?,risk_vibration=?,
                        risk_air_move=?,risk_dist_potential=?,acm_condition=?,acm_height =? where roomGuid=?`,
          [
            this.inspectionObj.record_id,
            this.inspectionObj.JobId,
            this.surverRoomForm.value.client_material_id,
            this.inspectionObj.material_id,
            this.surverRoomForm.value.room_number,
            this.surverRoomForm.value.floor_number,
            parseInt(this.surverRoomForm.value.sq_feet),
            parseInt(this.surverRoomForm.value.linear_feet_0_4),
            parseInt(this.surverRoomForm.value.linear_feet_5_7),
            parseInt(this.surverRoomForm.value.linear_feet_8_12),
            parseInt(this.surverRoomForm.value.linear_feet_12_up),
            parseInt(this.surverRoomForm.value.Ends),
            parseInt(this.surverRoomForm.value.Hangers),
            parseInt(this.surverRoomForm.value.damage_puncture),
            parseInt(this.surverRoomForm.value.damage_vibration),
            parseInt(this.surverRoomForm.value.damage_water),
            parseInt(this.surverRoomForm.value.damage_air),
            parseInt(this.surverRoomForm.value.damage_delamination),
            parseInt(this.surverRoomForm.value.damage_slow_deterioration),
            parseInt(this.surverRoomForm.value.damage_use_wear),
            parseInt(this.surverRoomForm.value.damage_extent),
            this.surverRoomForm.value.damage_feet,
            parseInt(this.surverRoomForm.value.access),
            parseInt(this.surverRoomForm.value.access_frequency),
            parseInt(this.surverRoomForm.value.risk_vibration),
            parseInt(this.surverRoomForm.value.risk_air_move),
            parseInt(this.surverRoomForm.value.risk_dist_potential),
            parseInt(this.surverRoomForm.value.acm_condition),
            this.surverRoomForm.value.acm_height,
            this.inspectionObj.roomGuid,
          ]
        )
        .then((res) => {
          this.toastService.presentToast("Survey Room updated successfully.",true);
          this.location.back();
        });
    } else {
      this.scrollToFirstInvalidControl();
    }
  }
  private scrollToFirstInvalidControl() {
    // const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
    //   ".ion-invalid"
    // );
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      "form .ng-invalid"
    );
    firstInvalidControl.scrollIntoView(); //without smooth behavior
  }

  getMaterialNameFormat(arr) {
    return this.timestamp.getMaterialNameFormat(arr);
  }

  public getDropdown() {
    this.databaseService.db
      .executeSql(
        "select * from MaterialRoomDropDownList ORDER by Name desc",
        []
      )
      .then(
        (data) => {
          let localData = [];
          if (data.rows.length > 0) {
            for (var i = 0; i < data.rows.length; i++) {
              localData.push({
                Id: Number(data.rows.item(i).Id),
                Name: data.rows.item(i).Name,
                Description: data.rows.item(i).Description,
              });
            }
            this.SurveyDropDown = localData.reduce(function (r, a) {
              r[a.Description] = r[a.Description] || [];
              r[a.Description].push(a);
              return r;
            }, Object.create(null));

            let value = this.SurveyDropDown['survey_close_ended_data'].filter((item) => {
              return item.Name === 'Yes';

            });
            this.yesID = value[0].Id;
          }
        },
        (err) => { }
      );
  }
  getSurveyRooms() {
    let query = `select * from MaterialRoom where job_id=${this.inspectionObj.Job_Id} and Client_Material_Id=${this.inspectionObj.Client_Material_Id} and IsDelete='false'`;
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
          this.inspectionObj = this.surveyRoomList[0];
          this.selectedRoom = this.inspectionObj.roomGuid;
          this.FormInit();
        }
      },
      (err) => {

      }
    );
  }

  change(e) {
    let data = this.surveyRoomList.filter((x) => {
      return x.roomGuid == e.target.value;
    });
    this.inspectionObj = data[0];
    this.inspectionObj.JobId = this.inspectionObj.job_id;
    this.FormInit();
  }

  public showDamageFields() {
    let showfields: boolean = false;
    if (parseInt(this.surverRoomForm.value.damage_puncture) == this.yesID || parseInt(this.surverRoomForm.value.damage_vibration) == this.yesID || parseInt(this.surverRoomForm.value.damage_water) == this.yesID || parseInt(this.surverRoomForm.value.damage_air) == this.yesID || parseInt(this.surverRoomForm.value.damage_delamination) == this.yesID || parseInt(this.surverRoomForm.value.damage_slow_deterioration) == this.yesID || parseInt(this.surverRoomForm.value.damage_use_wear) == this.yesID) {
      showfields = true;
    }
    else {
      showfields = false;
    }
    return showfields;
  }

  sqFeetChange() {

    if (this.surverRoomForm.value.sq_feet != 0 && this.surverRoomForm.value.sq_feet) {
      this.surverRoomForm.controls.linear_feet_0_4.setValue('');
      this.surverRoomForm.controls.linear_feet_5_7.setValue('');
      this.surverRoomForm.controls.linear_feet_8_12.setValue('');
      this.surverRoomForm.controls.linear_feet_12_up.setValue('');
    }
  }

  linearFeetChange() {

    if (((this.surverRoomForm.value.linear_feet_0_4 != 0 && !!this.surverRoomForm.value.linear_feet_0_4) || (this.surverRoomForm.value.linear_feet_5_7 != 0 && !!this.surverRoomForm.value.linear_feet_5_7) || (this.surverRoomForm.value.linear_feet_8_12 != 0 && !!this.surverRoomForm.value.linear_feet_8_12) || (this.surverRoomForm.value.linear_feet_12_up != 0 && !!this.surverRoomForm.value.linear_feet_12_up))) {
      this.surverRoomForm.controls.sq_feet.setValue('');
    }
  }

  endHangerChange() {
    if (((this.surverRoomForm.value.linear_feet_0_4 == 0 || !this.surverRoomForm.value.linear_feet_0_4) && (this.surverRoomForm.value.linear_feet_5_7 == 0 || !this.surverRoomForm.value.linear_feet_5_7) && (this.surverRoomForm.value.linear_feet_8_12 == 0 || !this.surverRoomForm.value.linear_feet_8_12) && (this.surverRoomForm.value.linear_feet_12_up == 0 || !this.surverRoomForm.value.linear_feet_12_up))) {
      this.surverRoomForm.controls.Ends.setValue('');
      this.surverRoomForm.controls.Hangers.setValue('');
    }
  }

  ionViewWillLeave() {
    if (this.type == 'add') {
      localStorage.setItem('HOLD_ADD_SURVEY', JSON.stringify(this.surverRoomForm.value));
    }
  }

}
