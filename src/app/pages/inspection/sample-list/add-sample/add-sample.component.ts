import { Component, ElementRef, OnInit, NgZone } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { ToastService } from "src/app/core/toast.service";
import { DatePipe, Location } from "@angular/common";
import { DatabaseService } from "src/app/core/database.service";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { GuidService } from "src/app/core/guid.service";
import { TimestampService } from "src/app/core/timestamp.service";
import { IonicSelectableComponent } from "ionic-selectable";
import { GlobalService } from "src/app/core/auth/global.service";
import { LoaderService } from 'src/app/core/loader.service';

@Component({
  selector: "app-add-sample",
  templateUrl: "./add-sample.component.html",
  styleUrls: ["./add-sample.component.scss"],
  providers: [DatePipe],
})
export class AddSampleComponent implements OnInit {
  public disableSca: Boolean = false;
  public sortOrderVal: number = 1;
  public defAnalysisType: string = "";
  public defSampleType: string = "";
  public isFirstArngSample: boolean = false;
  public other_metal_analysis_length_error: boolean = false;
  public other_element_analysis_length_error: boolean = false;
  public client_Material_Id_error: boolean = false;
  public client_Material_Id: any;
  public holdValues: any = {
    analysis_type: null,
    sample_type: null,
    sample_vol: null,
    flow_rate: null,
    width: null,
    length: null,
    comment: null,
    sample_desc: null,
    sample_loc: null,
    client_sample_id: null,
    date_collected: this.timestampService.generateLocalTimeStamp(),
    control_sample: false,
    fb_sample: false,
    sampling_start_time: null,
    sampling_end_time: null,
    sampling_duration: null,
    IncludePaintchips: null,
    SurfaceSmoothClean: null,
    turn_around: null,
    squarefeet: null,
    purpose: null,
    WSSN: null,
    IncludeCUAnalysis: null,
    volume: null,
    ship_method: null,
    waybill: null,
    ship_date: this.timestampService.generateLocalTimeStamp(),
    Other_metal_analysis: "",
    other_element_analysis: "",
    BottleSizeId: "",
    TimeCollected: this.datePipe.transform(new Date(), "hh:mm"),
    material_id: "",
    Lab_Id_Client: "",
    isFirstArngSample: false,
  };
  public clientSampleId: any;
  public sampleDescAutoFill: any;
  public iseditfirst: boolean = false;
  public sampleAssignedLabList: any = [];
  public displayImage: any;
  public from: any;
  public type: any;
  public selectedSample: any;
  public arrSampleTemp: any = [];
  public arrSample: any = [];
  isLoading = true;
  slideOneForm: any;
  arrImage = [];
  submitAttempt: boolean = false;
  imgGuid: string;
  inspectionObj: any;
  arrSampleType = [];
  arrAnalysisType = [];
  arrTurnAroundType = [];
  arrOtherMetalanalysis = [];
  empId = Number(localStorage.getItem("empId"));
  sampleChildField = {
    Dust_Wipe: ["width", "length"],
    Soil: ["squarefeet"],
    Water: ["volume", "purpose"],
    Air: [
      "flow_rate",
      "sampling_start_time",
      "sampling_end_time",
      "sample_vol",
      "sampling_duration",
    ],
  };
  sampleChildFieldNew = {
    Asbestos: {
      Air: [
        "flow_rate",
        "sampling_start_time",
        "sampling_end_time",
        "sample_vol",
        "sampling_duration",
      ],
    },
    Mold: {
      Air: ["flow_rate", "sample_vol"],
    },
    Lead: {
      Dust_Wipe: ["width", "length"],
      Dust_Wipe_PA: ["width", "length"],
      ARNG_Dust_Wipes: ["width", "length"],
      Soil: ["squarefeet"],
      Air: [
        "flow_rate",
        "sampling_start_time",
        "sampling_end_time",
        "sample_vol",
        "sampling_duration",
      ],
      Water: ["volume", "purpose"],
      Paint_Chips: ["width", "length"],
    },
  };

  arBottleSize = [];
  impField = [
    "sample_type",
    "analysis_type",
    "date_collected",
    "TimeCollected",
    "BottleSizeId",
    "material_id",
    "ship_method",
    "waybill",
    "ship_date",
    "turn_around",
    "Other_metal_analysis",
    "other_element_analysis",
    "IncludePaintchips",
    "Lab_Id_Client",
  ];
  // tokenFromUI: string = "0123456789123456";
  materialList = [];
  arrOtherElementanalysis = [];
  public sample_collection_visible: boolean = false;
  public room_collection_visible: boolean = false;
  public material_collection_visible: boolean = false;
  constructor(
    public formBuilder: FormBuilder,
    private toastService: ToastService,
    private location: Location,
    private datePipe: DatePipe,
    private databaseService: DatabaseService,
    private route: ActivatedRoute,
    private guidService: GuidService,
    private timestampService: TimestampService,
    private router: Router,
    private el: ElementRef,
    private zone: NgZone,
    private globalService: GlobalService,
    private loaderService: LoaderService
  ) {
    this.getOtherMetalanalysis();
    this.getOtherElementanalysis();
    this.getWaterBottleSizeGroup();
    this.getSampleAssignedLabList();
    this.sample_collection_visible = !!localStorage.getItem('sample_collection_visible') && localStorage.getItem('sample_collection_visible') == 'true' ? true : false;
    this.room_collection_visible = !!localStorage.getItem('room_collection_visible') && localStorage.getItem('room_collection_visible') == 'true' ? true : false;
    this.material_collection_visible = !!localStorage.getItem('material_collection_visible') && localStorage.getItem('material_collection_visible') == 'true' ? true : false;

  }

  ngOnInit() {
    // const objRoute = this.route.snapshot.params.obj;
    // this.inspectionObj = JSON.parse(objRoute);

    this.route.queryParams.subscribe(async (params) => {
      if (params && params.inspectionObj) {
        this.initialHoldValues();
        let holdValues = localStorage.getItem("HOLD_ADD_SAMPLE");
        if (holdValues) {
          this.holdValues = JSON.parse(localStorage.getItem("HOLD_ADD_SAMPLE"));
        }
        let displayImage = localStorage.getItem("displayImage");
        if (displayImage) {
          this.displayImage = localStorage.getItem("displayImage");
        }

        let data = localStorage.getItem("lastState");
        data
          ? (this.inspectionObj = JSON.parse(localStorage.getItem("lastState")))
          : (this.inspectionObj = JSON.parse(params.inspectionObj));

        this.getmaterial();
        this.from = params.from;
        this.type = this.inspectionObj.title;
        console.log(this.type);

        if (
          this.inspectionObj.title == "edit" &&
          this.from == "material_list"
        ) {
          this.iseditfirst = true;
          setTimeout(() => {
            this.iseditfirst = false;
          }, 2000);
          this.getAllSample();
        }
        if (this.inspectionObj.title == "edit") {
          if (this.inspectionObj.Lab_Id_Client) {
            this.inspectionObj.Lab_Id_Client =
              this.inspectionObj.Lab_Id_Client.toString();
          }
        }
        // this.initialHoldValues();

        this.getAnalysisType();
        this.getTurnAroundType();
        await this.FormInit();

        this.inspectionObj.title == "edit"
          ? this.getSampleType({
            detail: { value: this.inspectionObj.analysis_type },
          })
          : !!this.holdValues.analysis_type ? this.getSampleType({ detail: { value: this.holdValues.analysis_type }, }) : null;
        this.slideOneForm.get("sample_type").valueChanges.subscribe((data) => {
          if (data == "Bulk") {
            this.slideOneForm
              .get("other_element_analysis")
              .setValue(this.holdValues.other_element_analysis);
          }
          this.checkvalidation(data, this.slideOneForm.value.analysis_type);
        });
        this.slideOneForm.get("analysis_type").valueChanges.subscribe((res) => {
          this.slideOneForm
            .get("sample_type")
            .setValue(this.holdValues.sample_type);
          if (res != "Lead") {
            this.slideOneForm
              .get("Other_metal_analysis")
              .setValue(this.holdValues.Other_metal_analysis);
            this.slideOneForm.get("Other_metal_analysis").clearValidators();
            this.slideOneForm
              .get("Other_metal_analysis")
              .updateValueAndValidity();
          } else {
            this.slideOneForm
              .get("Other_metal_analysis")
              .setValidators([Validators.required]);
            this.slideOneForm
              .get("Other_metal_analysis")
              .updateValueAndValidity();
          }
          this.checkvalidation(null, null);
        });
      }
    });
  }

  initialHoldValues() {
    this.holdValues = {
      analysis_type: null,
      sample_type: null,
      sample_vol: null,
      flow_rate: null,
      width: null,
      length: null,
      comment: null,
      sample_desc: null,
      sample_loc: null,
      client_sample_id: null,
      date_collected: this.timestampService.generateLocalTimeStamp(),
      control_sample: false,
      fb_sample: false,
      sampling_start_time: null,
      sampling_end_time: null,
      sampling_duration: null,
      IncludePaintchips: null,
      SurfaceSmoothClean: null,
      turn_around: null,
      squarefeet: null,
      purpose: null,
      WSSN: null,
      IncludeCUAnalysis: null,
      volume: null,
      ship_method: null,
      waybill: null,
      ship_date: this.timestampService.generateLocalTimeStamp(),
      Other_metal_analysis: "",
      other_element_analysis: "",
      BottleSizeId: "",
      TimeCollected: this.datePipe.transform(new Date(), "hh:mm"),
      material_id: "",
      Lab_Id_Client: "",
    };
  }

  async FormInit() {
    if (this.inspectionObj.title == "add") {
      await this.bindDataOnInspection();
    }

    if (!!this.defAnalysisType) {
      this.holdValues.analysis_type = this.defAnalysisType;
    }

    if (!!this.defSampleType) {
      this.holdValues.sample_type = this.defSampleType;
    }

    this.slideOneForm = this.formBuilder.group({
      analysis_type: [
        this.inspectionObj.title == "edit" ? this.inspectionObj.analysis_type : this.holdValues.analysis_type,
        Validators.compose([Validators.required]),
      ],
      sample_type: [
        this.inspectionObj.title == "edit" ? this.inspectionObj.sample_type : this.holdValues.sample_type,
        Validators.compose([Validators.required]),
      ],
      sample_vol: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.sample_vol
          : this.holdValues.sample_vol,
      ],
      flow_rate: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.flow_rate
          : this.holdValues.flow_rate,
      ],
      width: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.width
          : this.holdValues.width,
      ],
      length: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.length
          : this.holdValues.length,
      ],
      // weight: [null],
      comment: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.comment
          : this.holdValues.comment,
        Validators.maxLength(100),
      ],
      sample_desc: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.sample_desc
          : this.holdValues.sample_desc,
        Validators.compose([Validators.required]),
      ],
      sample_loc: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.sample_loc
          : this.holdValues.sample_loc,
        Validators.compose([Validators.required]),
      ],
      client_sample_id: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.client_sample_id
          : this.holdValues.client_sample_id,
        Validators.compose([Validators.required, Validators.maxLength(50)]),
      ],
      // materialId: [(this.inspectionObj.analysis_type) ? this.inspectionObj.analysis_type : null, Validators.compose([Validators.required])],
      date_collected: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.date_collected
          : this.timestampService.generateLocalTimeStamp(),
      ],
      control_sample: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.control_sample
          : this.holdValues.control_sample,
      ],
      fb_sample: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.fb_sample
          : this.holdValues.fb_sample,
      ],
      sampling_start_time: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.sampling_start_time
          : this.holdValues.sampling_start_time,
      ],
      sampling_end_time: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.sampling_end_time
          : this.holdValues.sampling_end_time,
      ],
      sampling_duration: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.sampling_duration
          : this.holdValues.sampling_duration,
      ],
      IncludePaintchips: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.IncludePaintchips
          : this.holdValues.IncludePaintchips,
      ],
      SurfaceSmoothClean: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.SurfaceSmoothClean
          : this.holdValues.SurfaceSmoothClean,
      ],
      turn_around: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.turn_around
          : this.holdValues.turn_around,
      ],
      squarefeet: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.squarefeet
          : this.holdValues.squarefeet,
      ],
      purpose: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.purpose
          : this.holdValues.purpose,
      ],
      WSSN: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.WSSN
          : this.holdValues.WSSN,
      ],
      IncludeCUAnalysis: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.IncludeCUAnalysis
          : this.holdValues.IncludeCUAnalysis,
      ],
      volume: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.volume
          : this.holdValues.volume,
      ],
      ship_method: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.ship_method
          : this.holdValues.ship_method,
        // Validators.compose([Validators.required]),
      ],
      waybill: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.waybill
          : this.holdValues.waybill,
        Validators.maxLength(50),
      ],
      ship_date: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.ship_date
          : this.timestampService.generateLocalTimeStamp(),
      ],
      Other_metal_analysis: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.Other_metal_analysis
            ? this.inspectionObj.Other_metal_analysis.split(",")
            : null
          : this.holdValues.Other_metal_analysis,
        Validators.compose([Validators.required]),
      ],
      other_element_analysis: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.other_element_analysis
            ? this.inspectionObj.other_element_analysis.split(",")
            : null
          : this.holdValues.other_element_analysis,
      ],
      BottleSizeId: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.BottleSizeId
          : this.holdValues.BottleSizeId,
      ],
      TimeCollected: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.TimeCollected
          : this.datePipe.transform(new Date(), "hh:mm"),
      ],
      material_id: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.Client_Material_Id
          : this.holdValues.material_id,
      ],
      Lab_Id_Client: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.Lab_Id_Client
          : this.holdValues.Lab_Id_Client,
        Validators.compose([Validators.required]),
      ],
      state: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.state
          : this.holdValues.state,
      ],
      city: [
        this.inspectionObj.title == "edit"
          ? this.inspectionObj.city
          : this.holdValues.city,
      ],
    });

    if (this.slideOneForm.controls.analysis_type.value == "Lead" && this.slideOneForm.controls.sample_type.value == "ARNG Dust Wipe" && !!localStorage.getItem("isFirstArngSample")) {
      this.isFirstArngSample = localStorage.getItem("isFirstArngSample") == "true" ? true : false;
      if (this.isFirstArngSample) {
        this.slideOneForm.controls.state.setValidators(
          Validators.compose([
            Validators.required,
            Validators.maxLength(2),
            Validators.minLength(2),
            Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9]*$')
          ])
        );
        this.slideOneForm.controls.state.updateValueAndValidity();
        this.slideOneForm.controls.city.setValidators(
          Validators.compose([
            Validators.required,
            Validators.maxLength(4),
            Validators.minLength(4),
            Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9]*$')
          ])
        );
        this.slideOneForm.controls.city.updateValueAndValidity();
      }
    }
    if (!!this.slideOneForm.controls.analysis_type.value && this.slideOneForm.controls.analysis_type.value == "Lead") {
      this.slideOneForm
        .get("Other_metal_analysis")
        .setValidators([Validators.required]);
      this.slideOneForm
        .get("Other_metal_analysis")
        .updateValueAndValidity();
    }
    else {
      this.slideOneForm
        .get("Other_metal_analysis")
        .setValue(this.holdValues.Other_metal_analysis);
      this.slideOneForm.get("Other_metal_analysis").clearValidators();
      this.slideOneForm.get("Other_metal_analysis").updateValueAndValidity();
    }

    if (
      this.inspectionObj.analysis_type == "Asbestos" &&
      this.inspectionObj.sample_type == "Bulk"
    ) {
      this.slideOneForm
        .get("other_element_analysis")
        .setValue(this.holdValues.other_element_analysis);
      // this.slideOneForm.get("other_element_analysis").clearValidators();
      // this.slideOneForm.get("other_element_analysis").updateValueAndValidity();
    }
    this.checkvalidation(
      this.slideOneForm.value.sample_type,
      this.slideOneForm.value.analysis_type
    );
    if (this.inspectionObj.title == "add") {
      this.FbSampleChecked();
      this.clearMaterialData(null); // dynamic change for autofilling fields
    }
  }

  checkvalidation(sampleType, analysisType) {
    Object.keys(this.sampleChildFieldNew).forEach((analysisObj) => {
      Object.keys(this.sampleChildFieldNew[analysisObj]).forEach(
        (sampleElement) => {
          var checkVal = !!sampleType ? sampleType.replace(/\s/g, "_") : "";
          if (analysisType == analysisObj && sampleElement == checkVal) {
            for (
              let i = 0;
              i < this.sampleChildFieldNew[analysisObj][sampleElement].length;
              i++
            ) {
              this.slideOneForm
                .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
                .setValidators([Validators.required]);

              switch (this.sampleChildFieldNew[analysisObj][sampleElement][i]) {
                case "width":
                  this.slideOneForm
                    .get(
                      this.sampleChildFieldNew[analysisObj][sampleElement][i]
                    )
                    .setValidators([
                      Validators.required,
                      Validators.maxLength(30),
                    ]);
                  break;

                case "length":
                  this.slideOneForm
                    .get(
                      this.sampleChildFieldNew[analysisObj][sampleElement][i]
                    )
                    .setValidators([
                      Validators.required,
                      Validators.maxLength(20),
                    ]);
                  break;

                case "purpose":
                  this.slideOneForm
                    .get(
                      this.sampleChildFieldNew[analysisObj][sampleElement][i]
                    )
                    .setValidators([
                      Validators.required,
                      Validators.maxLength(20),
                    ]);
                  break;
              }

              this.slideOneForm
                .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
                .updateValueAndValidity();
            }
          } else {
            var excludedFields =
              this.sampleChildFieldNew[analysisObj][sampleElement];
            if (
              !!checkVal &&
              !!this.sampleChildFieldNew[analysisObj][checkVal] &&
              this.sampleChildFieldNew[analysisObj][checkVal].length > 0
            ) {
              excludedFields = this.sampleChildFieldNew[analysisObj][
                sampleElement
              ].filter(
                (x) =>
                  !this.sampleChildFieldNew[analysisObj][checkVal].some(
                    (y) => y == x
                  )
              );
            }
            for (let i = 0; i < excludedFields.length; i++) {
              if (this.inspectionObj.title != "edit") {
                this.slideOneForm.get(excludedFields[i]).setValue(null);
              }
              this.slideOneForm.get(excludedFields[i]).clearValidators();
              this.slideOneForm.get(excludedFields[i]).updateValueAndValidity();
            }
          }
        }
      );
    });

    //let isBreak = false;
    // Object.keys(this.sampleChildFieldNew).forEach((analysisObj) => {
    //   if (!isBreak) {
    //     Object.keys(this.sampleChildFieldNew[analysisObj]).forEach((sampleElement) => {
    //       if (!isBreak) {
    //         var checkVal = !!sampleType ? sampleType.replace(/\s/g, "_") : '';
    //         if (analysisType == analysisObj && sampleElement == checkVal) {
    //           for (let i = 0; i < this.sampleChildFieldNew[analysisObj][sampleElement].length; i++) {
    //             this.slideOneForm
    //               .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
    //               .setValidators([Validators.required]);

    //             switch (this.sampleChildFieldNew[analysisObj][sampleElement][i]) {
    //               case "width":
    //                 this.slideOneForm
    //                   .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
    //                   .setValidators([Validators.required, Validators.maxLength(30)]);
    //                 break;

    //               case "length":
    //                 this.slideOneForm
    //                   .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
    //                   .setValidators([Validators.required, Validators.maxLength(20)]);
    //                 break;

    //               case "purpose":
    //                 this.slideOneForm
    //                   .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
    //                   .setValidators([Validators.required, Validators.maxLength(20)]);
    //                 break;
    //             }

    //             this.slideOneForm
    //               .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
    //               .updateValueAndValidity();
    //           }
    //           isBreak = true;
    //         } else {
    //           for (let i = 0; i < this.sampleChildFieldNew[analysisObj][sampleElement].length; i++) {
    //             if (this.inspectionObj.title != "edit") {
    //               this.slideOneForm
    //                 .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
    //                 .setValue(null);
    //             }
    //             this.slideOneForm
    //               .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
    //               .clearValidators();
    //             this.slideOneForm
    //               .get(this.sampleChildFieldNew[analysisObj][sampleElement][i])
    //               .updateValueAndValidity();
    //           }
    //         }
    //       }
    //     });
    //   }
    // });
    sampleType != "Water"
      ? this.slideOneForm
        .get("BottleSizeId")
        .setValue(this.holdValues.BottleSizeId)
      : "";
  }

  async submit(flag?) {
    if (
      !!this.slideOneForm.value.Other_metal_analysis &&
      this.slideOneForm.value.Other_metal_analysis.join(",").length > 50
    ) {
      this.other_metal_analysis_length_error = true;
      this.scrollToFirstInvalidControl();
    }

    if (
      !!this.slideOneForm.value.other_element_analysis &&
      this.slideOneForm.value.other_element_analysis.join(",").length > 255
    ) {
      this.other_element_analysis_length_error = true;
      this.scrollToFirstInvalidControl();
    }

    this.submitAttempt = true;
    if (
      this.slideOneForm.valid &&
      this.slideOneForm.controls.analysis_type.value === "Lead" &&
      this.slideOneForm.controls.sample_type.value === "ARNG Dust Wipe"
    ) {
      this.bindClientSampleIdLeadArng();
    }

    let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;

    //check duplicate client sample id 
    var dupClientQuery = `select client_sample_id from InspectionSample where Job_id = ${jobId} and 
    analysis_type = '${this.slideOneForm.controls.analysis_type.value}' and 
    sample_type = '${this.slideOneForm.controls.sample_type.value}' and IsDelete = 'false'`;
    await this.databaseService.db.executeSql(dupClientQuery, []).then((data) => {
      if (data.rows.length > 0) {
        let dbArr = [];
        for (let i = 0; i < data.rows.length; i++) {
          dbArr.push(data.rows.item(i).client_sample_id);
        }
        if (dbArr.indexOf(this.slideOneForm.controls.client_sample_id.value) > -1) {
          this.toastService.presentToast("Sample client sample id already exists.");
          this.client_Material_Id_error = true;
          this.scrollToFirstInvalidControl();
          return false;
        }
      }
    });

    const query = `select count(*) as sampleCount from InspectionSample  where  IsDelete='false' and job_id=${jobId}`;
    await this.databaseService.db.executeSql(query, []).then((data) => {
      if (data.rows.length > 0) {
        this.sortOrderVal = Number(data.rows.item(0).sampleCount);

        this.sortOrderVal = this.sortOrderVal + 1;
      }
    });

    if (this.slideOneForm.valid && this.inspectionObj.title == "add") {
      this.databaseService.db
        .executeSql(
          `insert into InspectionSample(job_id, InspectionGuid,  SampleGuid, analysis_type ,sample_type, sample_vol, flow_rate, width,
         length, weight, comment, sample_desc, sample_loc, client_sample_id, date_collected, control_sample, fb_sample, sampling_start_time, sampling_end_time,
          sampling_duration, Include_Paint_chips, Surface_Smooth_Clean, turn_around, squarefeet, purpose, WSSN, IncludeCUAnalysis, volume,date_created, InspectorId,ship_method,waybill,ship_date,Other_metal_analysis,other_element_analysis,TimeCollected,BottleSizeId,material_id,Client_Material_Id,Lab_Id_Client,IsDelete,SortOrder) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            this.inspectionObj.JobId,
            this.inspectionObj.InspectionGuid,
            this.guidService.generateGuid(),
            this.slideOneForm.value.analysis_type,
            this.slideOneForm.value.sample_type,
            this.slideOneForm.value.sample_vol,
            this.slideOneForm.value.flow_rate,
            this.slideOneForm.value.width,
            this.slideOneForm.value.length,
            null,
            this.slideOneForm.value.comment,
            this.slideOneForm.value.sample_desc,
            this.slideOneForm.value.sample_loc,
            this.slideOneForm.value.client_sample_id,
            this.slideOneForm.value.date_collected,
            this.slideOneForm.value.control_sample,
            this.slideOneForm.value.fb_sample,
            this.slideOneForm.value.sampling_start_time,
            this.slideOneForm.value.sampling_end_time,
            this.slideOneForm.value.sampling_duration,
            this.slideOneForm.value.IncludePaintchips,
            this.slideOneForm.value.SurfaceSmoothClean,
            this.slideOneForm.value.turn_around,
            this.slideOneForm.value.squarefeet,
            this.slideOneForm.value.purpose,
            this.slideOneForm.value.WSSN,
            this.slideOneForm.value.IncludeCUAnalysis,
            this.slideOneForm.value.volume,
            this.timestampService.generateLocalTimeStamp(),
            this.empId,
            this.slideOneForm.value.ship_method,
            this.slideOneForm.value.waybill,
            this.slideOneForm.value.ship_date,
            this.slideOneForm.value.Other_metal_analysis,
            this.slideOneForm.value.other_element_analysis,
            this.slideOneForm.value.TimeCollected,
            this.slideOneForm.value.BottleSizeId,
            null,
            this.slideOneForm.value.material_id,
            parseInt(this.slideOneForm.value.Lab_Id_Client),
            false,
            this.sortOrderVal,
          ]
        )
        .then(async (res) => {
          this.toastService.presentToast("Sample add successfully", true);
          localStorage.removeItem("HOLD_ADD_SAMPLE");
          localStorage.removeItem("displayImage");
          if (flag == "SCA") {
            this.disableSca = true;
            // this.loaderService.present();
            this.submitAttempt = false;
            this.isFirstArngSample = false;
            var tempArr = Object.assign(this.slideOneForm.value);
            await this.slideOneForm.reset();
            var objkey = Object.keys(this.slideOneForm.value);
            await objkey.forEach((element) => {
              if (this.impField.indexOf(element) != -1) {
                if (
                  element == "Other_metal_analysis" &&
                  tempArr[element] != null
                ) {
                  this.slideOneForm
                    .get(element)
                    .setValue(tempArr["Other_metal_analysis"]);
                } else if (element == "TimeCollected") {
                  var timeval = this.datePipe.transform(new Date(), "hh:mm");

                  this.slideOneForm.get(element).setValue(timeval);
                } else if (
                  element == "Lab_Id_Client" &&
                  tempArr[element] != null
                ) {
                  this.slideOneForm
                    .get(element)
                    .setValue(tempArr["Lab_Id_Client"]);
                } else if (
                  element == "other_element_analysis" &&
                  tempArr[element] != null
                ) {
                  this.slideOneForm
                    .get(element)
                    .setValue(tempArr["other_element_analysis"]);
                } else {
                  this.slideOneForm.get(element).setValue(tempArr[element]);
                }
              }
            });
            this.isFirstArngSample = false;

            if (
              tempArr["analysis_type"] === "Asbestos" &&
              tempArr["sample_type"] === "Bulk" &&
              !!tempArr["material_id"]
            ) {
              let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;
              let material_id = tempArr["material_id"];
              this.slideOneForm
                .get("sample_desc")
                .setValue(tempArr["sample_desc"]);

              const query = `select count(*) as clientMaterialCount from InspectionSample  where Client_Material_Id=${material_id} and job_id=${jobId} and IsDelete='false'`;

              await this.databaseService.db.executeSql(query, []).then((data) => {
                if (data.rows.length > 0) {
                  let clientMaterialCount =
                    Number(data.rows.item(0).clientMaterialCount) + 1;
                  let alphaChar = this.numToSSColumn(clientMaterialCount);

                  let client_sample_id;
                  if (material_id.length > 0) {
                    client_sample_id =
                      `${material_id}`.toString().padStart(3, "0") + alphaChar;
                  }
                  this.slideOneForm.controls.client_sample_id.setValue(
                    client_sample_id
                  );
                }
              });
            } else if (
              tempArr["analysis_type"] === "Lead" &&
              tempArr["sample_type"] === "Dust Wipe"
            ) {
              await this.getClientSampleId();
            } else if (
              tempArr["analysis_type"] === "Lead" &&
              tempArr["sample_type"] === "Dust Wipe - PA"
            ) {
              await this.getClientSampleIdLeadDustPA();
            } else if (
              tempArr["analysis_type"] === "Lead" &&
              tempArr["sample_type"] === "ARNG Dust Wipes"
            ) {
              await this.getClientSampleIdLeadArng();
            } else if (
              tempArr["analysis_type"] === "Mold" &&
              !!tempArr["sample_type"]
            ) {
              this.slideOneForm.controls.sample_desc.setValue(
                this.slideOneForm.controls.sample_type.value
              );
            } else if (
              tempArr["analysis_type"] === "Lead" &&
              tempArr["sample_type"] === "Soil"
            ) {
              await this.getClientSampleIdLeadSoil();
            }
            this.disableSca = false;
            // this.loaderService.dismiss();
          } else if (flag == "SR") {
            await this.initialHoldValues();
            this.location.back();
            this.slideOneForm.reset();
            this.displayImage = "";
            await this.slideOneForm.setValue(this.holdValues);
          }
        });
    } else if (this.slideOneForm.valid && this.inspectionObj.title == "edit") {
      this.databaseService.db
        .executeSql(
          `update InspectionSample set analysis_type=? ,sample_type=?, sample_vol=?, flow_rate=?, width=?,
        length=?, weight=?, comment=?, sample_desc=?, sample_loc=?, date_collected=?, control_sample=?, fb_sample=?, sampling_start_time=?, sampling_end_time=?,
         sampling_duration=?, Include_Paint_chips=?, Surface_Smooth_Clean=?, turn_around=?, squarefeet=?, purpose=?, WSSN=?, IncludeCUAnalysis=?, volume=?, InspectorId=?, 
         client_sample_id=?, ship_method=?, waybill=?, ship_date=?, Other_metal_analysis=?,other_element_analysis=?, TimeCollected=?, BottleSizeId=?, Client_Material_Id=? ,Lab_Id_Client=?  where SampleGuid='${this.inspectionObj.SampleGuid}'`,
          [
            this.slideOneForm.value.analysis_type,
            this.slideOneForm.value.sample_type,
            this.slideOneForm.value.sample_vol,
            this.slideOneForm.value.flow_rate,
            this.slideOneForm.value.width,
            this.slideOneForm.value.length,
            null,
            this.slideOneForm.value.comment,
            this.slideOneForm.value.sample_desc,
            this.slideOneForm.value.sample_loc,
            this.slideOneForm.value.date_collected,
            this.slideOneForm.value.control_sample,
            this.slideOneForm.value.fb_sample,
            this.slideOneForm.value.sampling_start_time,
            this.slideOneForm.value.sampling_end_time,
            this.slideOneForm.value.sampling_duration,
            this.slideOneForm.value.IncludePaintchips,
            this.slideOneForm.value.SurfaceSmoothClean,
            this.slideOneForm.value.turn_around,
            this.slideOneForm.value.squarefeet,
            this.slideOneForm.value.purpose,
            this.slideOneForm.value.WSSN,
            this.slideOneForm.value.IncludeCUAnalysis,
            this.slideOneForm.value.volume,
            this.empId,
            this.slideOneForm.value.client_sample_id,
            this.slideOneForm.value.ship_method,
            this.slideOneForm.value.waybill,
            this.slideOneForm.value.ship_date,
            this.slideOneForm.value.Other_metal_analysis,
            this.slideOneForm.value.other_element_analysis,
            this.slideOneForm.value.TimeCollected,
            this.slideOneForm.value.BottleSizeId,
            this.slideOneForm.value.material_id,
            parseInt(this.slideOneForm.value.Lab_Id_Client)
            //this.slideOneForm.value.SortOrder,
          ]
        )
        .then((res) => {
          this.toastService.presentToast("Sample update successfully", true);
          this.location.back();
        })
        .catch((err) => { });
    } else {
      this.scrollToFirstInvalidControl();
    }
  }

  async getSampleType(event) {
    if (event.detail.value) {
      let description = event.detail.value.toLowerCase() + "_sample_type";
      this.arrSampleType = [];
      await this.databaseService.db
        .executeSql(`select * from SampleType where Description=?`, [
          description,
        ])
        .then((data) => {
          if (data.rows.length > 0) {
            this.arrSampleType = [];
            for (var i = 0; i < data.rows.length; i++) {
              this.arrSampleType.push({
                id: data.rows.item(i).Id,
                name: data.rows.item(i).Name,
              });
            }
          }
        });
    }
  }

  async bindDataOnInspection() {
    let inspectionId = !!this.inspectionObj
      ? this.inspectionObj.InspectionTypeId
      : 0;

    await this.databaseService.db
      .executeSql(
        `select Name from InspectionType where Id=${inspectionId}`,
        []
      )
      .then(async (data) => {
        for (var i = 0; i < data.rows.length; i++) {
          var inspectionName = !!data.rows.item(i)
            ? data.rows.item(i).Name
            : "";
          if (inspectionName.toLowerCase().includes("dust wipe - pa")) {
            this.defAnalysisType = "Lead";
            this.defSampleType = "Dust Wipe - PA";

            await this.getSampleType({
              detail: { value: "Lead" },
            });
          }
          else if (
            inspectionName.toLowerCase().includes("dust wipe") ||
            inspectionName.toLowerCase().includes("lira")
          ) {
            this.defAnalysisType = "Lead";
            this.defSampleType = "Dust Wipe";
            await this.getSampleType({
              detail: { value: "Lead" },
            });
          } else if (inspectionName.toLowerCase().includes("arng")) {
            this.defAnalysisType = "Lead";
            this.defSampleType = "ARNG Dust Wipes";

            await this.getSampleType({
              detail: { value: "Lead" },
            });
          } else if (inspectionName.toLowerCase().includes("asbestos")) {
            this.defAnalysisType = "Asbestos";
            this.defSampleType = " ";

            await this.getSampleType({
              detail: { value: "Asbestos" },
            });
          }
        }
      });
  }
  getAnalysisType() {
    this.databaseService.db
      .executeSql(`select * from AnalysisType`, [])
      .then((data) => {
        if (data.rows.length > 0) {
          for (var i = 0; i < data.rows.length; i++) {
            this.arrAnalysisType.push({
              id: data.rows.item(i).Id,
              name: data.rows.item(i).Name,
            });
          }
        }
      });
  }
  getTurnAroundType() {
    this.databaseService.db
      .executeSql(`select * from TurnArroundType`, [])
      .then((data) => {
        if (data.rows.length > 0) {
          for (var i = 0; i < data.rows.length; i++) {
            this.arrTurnAroundType.push({
              id: data.rows.item(i).Id,
              name: data.rows.item(i).Name,
            });
          }
        }
      });
  }
  getOtherMetalanalysis() {
    this.databaseService.db
      .executeSql(`select * from OtherMetalanalysis`, [])
      .then((data) => {
        if (data.rows.length > 0) {
          for (var i = 0; i < data.rows.length; i++) {
            this.arrOtherMetalanalysis.push({
              id: data.rows.item(i).Id,
              name: data.rows.item(i).Name,
            });
          }
        }
      });
  }
  getOtherElementanalysis() {
    this.databaseService.db
      .executeSql(`select * from OtherElementanalysis`, [])
      .then((data) => {
        if (data.rows.length > 0) {
          for (var i = 0; i < data.rows.length; i++) {
            this.arrOtherElementanalysis.push({
              id: data.rows.item(i).Id,
              name: data.rows.item(i).Name,
            });
          }
        }
      });
  }
  getWaterBottleSizeGroup() {
    this.databaseService.db
      .executeSql(`select * from WaterBottleSizeGroup`, [])
      .then((data) => {
        if (data.rows.length > 0) {
          for (var i = 0; i < data.rows.length; i++) {
            this.arBottleSize.push({
              record_id: data.rows.item(i).record_id,
              definition: data.rows.item(i).definition,
            });
          }
        }
      });
  }

  getSampleAssignedLabList() {
    this.databaseService.db
      .executeSql(`select * from SampleAssignedLabList`, [])
      .then((data) => {
        if (data.rows.length > 0) {
          for (var i = 0; i < data.rows.length; i++) {
            this.sampleAssignedLabList.push({
              Id: data.rows.item(i).Id,
              Name: data.rows.item(i).Name,
            });
          }
        }
      });
  }

  goBack() {
    this.location.back();
  }

  getmaterial() {
    let id =
      this.inspectionObj.job_id != undefined
        ? this.inspectionObj.job_id
        : this.inspectionObj.JobId;
    this.databaseService.db
      .executeSql(
        `select (select Path from MaterialImage where Job_Id= ? and Client_Material_Id = m.Client_Material_Id and IsDelete = 'false') as ImagePath,* from MaterialListModels m where Job_Id=? and IsDelete='false' ORDER BY CAST(Client_Material_Id AS INTEGER)`,
        [id, id]
      )
      .then(
        (res) => {
          if (res.rows.length > 0) {
            this.materialList = [];
            for (var i = 0; i < res.rows.length; i++) {
              res.rows.item(i).displayName = this.getMaterialNameFormat(
                res.rows.item(i)
              );

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
                ImagePath: res.rows.item(i).ImagePath,
                displayName: res.rows.item(i).displayName,
              });
            }

            if (this.inspectionObj.title == "edit") {
              this.zone.run(() => {
                this.materialList.map((item: any) => {
                  if (
                    item.Client_Material_Id ===
                    this.inspectionObj.Client_Material_Id
                  ) {
                    if (item.ImagePath) {
                      this.displayImage = item.ImagePath;
                    } else {
                      this.displayImage =
                        "../../../../../assets/img/DefaultImage.png";
                    }
                  }
                });
              });
            }
          }
        },
        (err) => { }
      );
  }
  add(status) {
    var new_obj = Object.assign(
      {},
      this.inspectionObj,
      this.slideOneForm.value
    );
    localStorage.setItem("lastState", JSON.stringify(new_obj));
    this.router.navigate([
      `/tabs/tab2/addmaterial/${status}/${this.inspectionObj.job_id
        ? this.inspectionObj.job_id
        : this.inspectionObj.JobId
      }`,
    ]);
  }
  goback() {
    this.location.back();
  }

  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement =
      this.el.nativeElement.querySelector("form .ng-invalid");
    firstInvalidControl.scrollIntoView();
  }

  getAllSample() {
    let query;
    query = `select * from InspectionSample where IsDelete='false' and InspectionGuid='${this.inspectionObj.InspectionGuid}' and analysis_type='Asbestos' and sample_type ='Bulk' ORDER by date_created desc`;

    this.databaseService.db
      .executeSql(query, [])
      .then((res) => {
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

          this.zone.run(() => {
            let currSelectedSample =
              this.arrSample.filter(
                (x) =>
                  x.Client_Material_Id == this.inspectionObj.Client_Material_Id
              ) != null
                ? this.arrSample.filter(
                  (x) =>
                    x.Client_Material_Id ==
                    this.inspectionObj.Client_Material_Id
                )[0]
                : this.arrSample[0];
            this.arrSampleTemp = this.arrSample;
            let tempStatus = this.inspectionObj.Status;
            let tempInpsectionDate = this.inspectionObj.InspectionDate;
            this.inspectionObj = currSelectedSample;
            this.inspectionObj.Status = tempStatus;
            this.inspectionObj.InspectionDate = tempInpsectionDate;

            this.selectedSample =
              currSelectedSample != null ? currSelectedSample.SampleGuid : "";
            this.inspectionObj.title = this.type;
            if (this.inspectionObj.Lab_Id_Client) {
              this.inspectionObj.Lab_Id_Client =
                this.inspectionObj.Lab_Id_Client.toString();
            }
            this.FormInit();
          });
        }
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }
  formAutofill(e) {
    let data = this.arrSample.filter((x) => {
      return x.SampleGuid == e.target.value;
    });
    this.selectedSample = e.target.value;
    this.inspectionObj = data[0];
    this.inspectionObj.title = this.type;
    if (this.inspectionObj.Lab_Id_Client) {
      this.inspectionObj.Lab_Id_Client =
        this.inspectionObj.Lab_Id_Client.toString();
    }
    this.reloadMaterialImage(this.inspectionObj.Client_Material_Id);
    this.FormInit();
  }

  reloadMaterialImage(clientMaterialId) {
    if (!!clientMaterialId) {
      let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;

      this.materialList.map((item: any) => {
        if (item.Client_Material_Id === clientMaterialId) {
          if (item.ImagePath) {
            this.displayImage = item.ImagePath;
          } else {
            this.displayImage = "../../../../../assets/img/DefaultImage.png";
          }
        }
      });
    }
  }

  loadMaterialImage(event: {
    component: IonicSelectableComponent;
    value: any;
  }) {
    let Client_Material_Id = event.value;
    this.client_Material_Id = Client_Material_Id;
    let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;
    this.materialList.map((item: any) => {
      if (item.Client_Material_Id === Client_Material_Id) {
        if (item.ImagePath) {
          this.displayImage = item.ImagePath;
        } else {
          this.displayImage = "../../../../../assets/img/DefaultImage.png";
        }
        this.sampleDescAutoFill = this.getMaterialNameFormat(item);
        this.slideOneForm.controls.sample_desc.setValue(
          this.sampleDescAutoFill
        );
      }
    });

    // added for client sample id

    const query = `select count(*) as clientMaterialCount from InspectionSample  where IsDelete='false' and Client_Material_Id=${Client_Material_Id} and job_id=${jobId}`;

    this.databaseService.db.executeSql(query, []).then((data) => {
      if (data.rows.length > 0) {
        let clientMaterialCount =
          Number(data.rows.item(0).clientMaterialCount) + 1;
        console.log(clientMaterialCount);
        let alphaChar = this.numToSSColumn(clientMaterialCount);

        let client_sample_id;
        if (Client_Material_Id.length > 0) {
          client_sample_id =
            `${Client_Material_Id}`.toString().padStart(3, "0") + alphaChar;
        }

        this.slideOneForm.controls.client_sample_id.setValue(client_sample_id);
      }
    });
  }

  numToSSColumn(num) {
    let s = "",
      t;

    while (num > 0) {
      t = (num - 1) % 26;
      s = String.fromCharCode(65 + t) + s;
      num = ((num - t) / 26) | 0;
    }
    return s || undefined;
  }

  getMaterialNameFormat(arr) {
    return this.timestampService.getMaterialNameFormat(arr);
  }

  async clearMaterialData(event) {
    if (!this.iseditfirst) {
      if (
        this.slideOneForm.controls.analysis_type.value &&
        this.slideOneForm.controls.sample_type.value
      ) {
        // if(!this.slideOneForm.controls.material_id.value){
        this.displayImage = "";
        this.slideOneForm.controls.material_id.setValue("");
        // }
      }
      this.sampleDescAutoFill = "";
      this.slideOneForm.controls.sample_desc.setValue(this.sampleDescAutoFill);
      this.slideOneForm.controls.client_sample_id.setValue("");

      this.slideOneForm.controls.state.clearValidators();
      this.slideOneForm.controls.state.updateValueAndValidity();
      this.slideOneForm.controls.city.clearValidators();
      this.slideOneForm.controls.city.updateValueAndValidity();

      this.isFirstArngSample = false;
      if (
        this.slideOneForm.controls.analysis_type.value === "Lead" &&
        this.slideOneForm.controls.sample_type.value === "Dust Wipe"
      ) {
        await this.getClientSampleId();
      }
      else if (
        this.slideOneForm.controls.analysis_type.value === "Lead" &&
        this.slideOneForm.controls.sample_type.value === "Dust Wipe - PA"
      ) {
        await this.getClientSampleIdLeadDustPA();
      }
      else if (
        this.slideOneForm.controls.analysis_type.value === "Lead" &&
        this.slideOneForm.controls.sample_type.value === "ARNG Dust Wipes"
      ) {
        await this.getClientSampleIdLeadArng();
      }
      else if (
        this.slideOneForm.controls.analysis_type.value === "Mold" &&
        this.slideOneForm.controls.sample_type.value
      ) {
        this.clearStateCityValidator();
        this.slideOneForm.controls.sample_desc.setValue(
          this.slideOneForm.controls.sample_type.value
        );
      }
      else if (
        this.slideOneForm.controls.analysis_type.value === "Lead" &&
        this.slideOneForm.controls.sample_type.value === "Soil"
      ) {
        await this.getClientSampleIdLeadSoil();
      }
    }
  }

  async getClientSampleIdLeadDustPA() {
    let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;
    if (
      this.slideOneForm.controls.analysis_type.value &&
      this.slideOneForm.controls.sample_type.value
    ) {
      if (
        this.slideOneForm.controls.analysis_type.value === "Lead" &&
        this.slideOneForm.controls.sample_type.value === "Dust Wipe - PA"
      ) {
        //set defaults for Dust wipe pa

        let metalAnalysisVal = [];
        metalAnalysisVal.push((this.arrOtherMetalanalysis.filter(x => x.name.toLowerCase().trim() == "none")[0].id).toString());
        this.slideOneForm.get("Other_metal_analysis").setValue(metalAnalysisVal);

        let otherElementAnalysisVal = [];
        otherElementAnalysisVal.push((this.arrOtherElementanalysis.filter(x => x.name.toLowerCase().trim() == "none")[0].id).toString());
        this.slideOneForm.get("other_element_analysis").setValue(otherElementAnalysisVal);

        let turnArounVal = this.arrTurnAroundType.filter((x) => x.name == "72 Hours")[0].id;
        this.slideOneForm.get("turn_around").setValue(turnArounVal);

        this.slideOneForm.get("control_sample").setValue(false);
        this.slideOneForm.get("fb_sample").setValue(false);
        this.slideOneForm.get("waybill").setValue("");
        if (this.sampleAssignedLabList.length > 0) {
          let assignedLabVal = (this.sampleAssignedLabList[0].Id).toString();
          this.slideOneForm.get("Lab_Id_Client").setValue(assignedLabVal);
        }

        const query = `select count(*) as clientSampleIDCount from InspectionSample  where  IsDelete='false' and job_id=${jobId} and analysis_type='Lead' and sample_type='Dust Wipe - PA'`;
        await this.databaseService.db.executeSql(query, []).then((data) => {
          this.clearStateCityValidator();

          this.isFirstArngSample = false;
          //this.FbSampleChecked();

          // var id = this.arrTurnAroundType.filter((x) => x.name.trim().toLowerCase() == "72hours")[0].id;
          //var id = this.arrTurnAroundType.filter((x) => x.name == "72 Hours")[0].id;

          //this.slideOneForm.controls.turn_around.setValue(id);

          if (data.rows.length > 0) {
            let count = Number(data.rows.item(0).clientSampleIDCount);
            if (count == 0) {
              this.slideOneForm.controls.client_sample_id.setValue("Control");
              this.slideOneForm.controls.sample_desc.setValue("Control");
              this.slideOneForm.controls.sample_loc.setValue("N/A");
              this.slideOneForm.controls.width.setValue("N/A");
              this.slideOneForm.controls.length.setValue("N/A");
            } else {
              let sampleDescription = "";
              if (count == 1) {
                sampleDescription = "Common Area-Window Sill";
              } else if (count == 2) {
                sampleDescription = " Common Area-Floor";
              } else {
                let sampleDescVal = parseInt(((count + 1) / 2).toString()) - 1;
                if (count % 2 == 0) {
                  sampleDescription = `Bedroom #${sampleDescVal}-Floor`;
                } else {
                  sampleDescription = `Bedroom #${sampleDescVal}-Window Sill`;
                }
              }
              this.slideOneForm.controls.sample_desc.setValue(
                sampleDescription
              );
              this.slideOneForm.controls.sample_loc.setValue(
                sampleDescription.toLowerCase().trim().includes("sill")
                  ? "WS"
                  : sampleDescription.trim().toLowerCase().indexOf("floor")
                    ? "F"
                    : ""
              );
              this.slideOneForm.controls.client_sample_id.setValue(count);
              this.slideOneForm.controls.width.setValue("12");
              this.slideOneForm.controls.length.setValue("12");
            }
          }
        });
      } else {
        this.slideOneForm.controls.client_sample_id.setValue("");
      }
    }
  }

  clearStateCityValidator() {
    this.slideOneForm.controls.state.setValue("");
    this.slideOneForm.controls.city.setValue("");

    this.slideOneForm.controls.state.clearValidators();
    this.slideOneForm.controls.state.updateValueAndValidity();

    this.slideOneForm.controls.city.clearValidators();
    this.slideOneForm.controls.city.updateValueAndValidity();
  }

  async getClientSampleId() {
    let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;
    if (
      this.slideOneForm.controls.analysis_type.value &&
      this.slideOneForm.controls.sample_type.value
    ) {
      if (
        this.slideOneForm.controls.analysis_type.value === "Lead" &&
        this.slideOneForm.controls.sample_type.value === "Dust Wipe"
      ) {
        const query = `select count(*) as clientSampleIDCount from InspectionSample  where  IsDelete='false' and job_id=${jobId} and analysis_type='Lead' and sample_type='Dust Wipe'`;
        await this.databaseService.db.executeSql(query, []).then((data) => {
          this.clearStateCityValidator();
          if (data.rows.length > 0) {
            this.isFirstArngSample = false;
            this.FbSampleChecked();

            let count = Number(data.rows.item(0).clientSampleIDCount);
            if (count == 0 || count % 21 == 0) {
              //this.slideOneForm.controls.client_sample_id.setValue("FB");
              // let client_sample_id = "FB" + "" + (~~(count / 21) + 1).toString().slice(-2);
              let client_sample_id =
                "FB" + "" + (~~(count / 21) + 1).toString();
              this.slideOneForm.controls.client_sample_id.setValue(
                client_sample_id
              );
              this.slideOneForm.controls.sample_desc.setValue("N/A");
              this.slideOneForm.controls.sample_loc.setValue("Field Blank");
              this.FbSampleChecked();
            } else {
              let client_sample_id =
                "DW" + "" + ("0" + (count - ~~(count / 21))).slice(-2);
              this.slideOneForm.controls.client_sample_id.setValue(
                client_sample_id
              );
            }
          }
        });
      } else {
        this.slideOneForm.controls.client_sample_id.setValue("");
      }
    }
  }

  async bindClientSampleIdLeadArng() {
    let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;
    const query = `select count(*) as clientSampleIDCount from InspectionSample  where  
      IsDelete='false' and job_id=${jobId} and analysis_type='Lead' and sample_type='ARNG Dust Wipes'`;
    await this.databaseService.db.executeSql(query, []).then((data) => {
      if (data.rows.length > 0) {
        let count = Number(data.rows.item(0).clientSampleIDCount);
        let client_sample_id = `${!!this.globalService.arngState
          ? this.globalService.arngState + "-"
          : ""
          }${!!this.globalService.arngCity ? this.globalService.arngCity + "-" : ""
          }${("0" + (count + 1)).slice(-2)}`;
        //let client_sample_id = `${(!!this.globalService.arngState ? this.globalService.arngState + "-" : "")}${(!!this.globalService.arngCity ? this.globalService.arngCity + "-" : "")}${('0' + (count - (~~(count / 11)))).slice(-2)}`;
        this.slideOneForm.controls.client_sample_id.setValue(client_sample_id);
      }
    });
  }

  async checkStateValidation(obj: any) {
    if (!!obj && obj.length == 2) {
      this.globalService.arngState = obj;
      this.bindClientSampleIdLeadArng();
    } else {
      this.scrollToFirstInvalidControl();
    }
  }

  async checkCityValidation(obj: any) {
    if (!!obj && obj.length == 4) {
      this.globalService.arngCity = obj;
      this.bindClientSampleIdLeadArng();
    } else {
      this.scrollToFirstInvalidControl();
    }
  }

  async getClientSampleIdLeadArng() {
    this.clearStateCityValidator();

    if (!!this.globalService.arngState) {
      this.slideOneForm.controls.state.setValue(this.globalService.arngState);
    }

    if (!!this.globalService.arngCity) {
      this.slideOneForm.controls.city.setValue(this.globalService.arngCity);
    }

    let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;
    if (
      this.slideOneForm.controls.analysis_type.value &&
      this.slideOneForm.controls.sample_type.value
    ) {
      if (
        this.slideOneForm.controls.analysis_type.value === "Lead" &&
        this.slideOneForm.controls.sample_type.value === "ARNG Dust Wipes"
      ) {
        const query = `select count(*) as clientSampleIDCount from InspectionSample  where  IsDelete='false' and job_id=${jobId} and analysis_type='Lead' and sample_type='ARNG Dust Wipes'`;
        await this.databaseService.db.executeSql(query, []).then(async (data) => {
          if (data.rows.length > 0) {
            this.isFirstArngSample = false;
            this.FbSampleChecked();

            let count = Number(data.rows.item(0).clientSampleIDCount);

            let client_sample_id = `${!!this.globalService.arngState
              ? this.globalService.arngState + "-"
              : ""
              }${!!this.globalService.arngCity
                ? this.globalService.arngCity + "-"
                : ""
              }${("0" + (count + 1)).slice(-2)}`;
            this.slideOneForm.controls.client_sample_id.setValue(
              client_sample_id
            );
            if (count == 0) {
              this.isFirstArngSample = true;
              this.slideOneForm.controls.state.setValidators(
                Validators.compose([
                  Validators.required,
                  Validators.maxLength(2),
                  Validators.minLength(2),
                  Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9]*$')
                ])
              );
              this.slideOneForm.controls.state.updateValueAndValidity();

              this.slideOneForm.controls.city.setValidators(
                Validators.compose([
                  Validators.required,
                  Validators.maxLength(4),
                  Validators.minLength(4),
                  Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9]*$')

                ]));
              this.slideOneForm.controls.city.updateValueAndValidity();
            }
            if (count == 0 || count % 10 == 0) {
              //let client_sample_id = "FB" + "" + (~~(count / 11) + 1).toString();
              //this.slideOneForm.controls.client_sample_id.setValue(client_sample_id);

              this.slideOneForm.controls.sample_desc.setValue("N/A");
              this.slideOneForm.controls.sample_loc.setValue("Field Blank");
              this.FbSampleChecked();
              this.slideOneForm.controls.width.setValue("0");
              this.slideOneForm.controls.length.setValue("0");
            } else {
              //let client_sample_id = `${(!!this.globalService.arngState ? this.globalService.arngState + "-" : "")}${(!!this.globalService.arngCity ? this.globalService.arngCity + "-" : "")}${('0' + (count - (~~(count / 11)))).slice(-2)}`;
              //this.slideOneForm.controls.client_sample_id.setValue(client_sample_id);

              this.slideOneForm.controls.width.setValue("12");
              this.slideOneForm.controls.length.setValue("12");
            }
          }
        });
      } else {
        this.slideOneForm.controls.client_sample_id.setValue("");
      }
    }
  }

  async getClientSampleIdLeadSoil() {
    let jobId = this.inspectionObj.JobId || this.inspectionObj.job_id;
    if (
      this.slideOneForm.controls.analysis_type.value &&
      this.slideOneForm.controls.sample_type.value
    ) {
      const query = `select count(*) as clientSampleIDCount from InspectionSample  where  IsDelete='false' and job_id=${jobId} and analysis_type='Lead' and sample_type='Soil' `;
      await this.databaseService.db.executeSql(query, []).then((data) => {
        this.clearStateCityValidator();
        if (data.rows.length > 0) {
          this.isFirstArngSample = false;
          this.FbSampleChecked();

          let count = Number(data.rows.item(0).clientSampleIDCount) + 1;
          this.slideOneForm.controls.client_sample_id.setValue("SS-" + count);
        }
      });
    } else {
      this.slideOneForm.controls.client_sample_id.setValue("");
    }
  }
  FbSampleChecked() {
    if (this.slideOneForm.controls.sample_loc.value === "Field Blank") {
      // form value set for fb_sample
      this.slideOneForm.controls.fb_sample.setValue(true);
      //this.fbSampleChecked=true;
      //if(this.slideOneForm.controls.sample_loc.value === "Field Blank")?
    }
  }

  gotoSurveyList() {
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

  gotoSamplelist() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(this.inspectionObj),
      },
    };
    this.router.navigate([`/tabs/tab2/samplelist`], navigationExtras);
  }

  ionViewWillLeave() {
    if (this.type == "add") {
      if (this.displayImage) {
        localStorage.setItem("displayImage", this.displayImage);
      }
      localStorage.setItem("isFirstArngSample", this.isFirstArngSample.toString());
      localStorage.setItem(
        "HOLD_ADD_SAMPLE",
        JSON.stringify(this.slideOneForm.value)
      );
      // let formValues = this.slideOneForm.value;
      // formValues["isFirstArngSample"] = this.isFirstArngSample;
      // localStorage.setItem("HOLD_ADD_SAMPLE", JSON.stringify(formValues));
    }
  }
}
