import { Component, ElementRef, OnInit, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { DatabaseService } from "src/app/core/database.service";
import { ToastService } from "src/app/core/toast.service";
import { Location } from "@angular/common";
import { ActionSheetController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/Camera/ngx';
import { Crop } from '@ionic-native/crop/ngx';
import { File } from '@ionic-native/File/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { MaterialImage } from '../../../../models/db-models/material-image';
import { TimestampService } from 'src/app/core/timestamp.service';
import { GuidService } from 'src/app/core/guid.service';
import { environment } from "src/environments/environment";
import { IonicSelectableComponent } from 'ionic-selectable';
import { ImageResizer, ImageResizerOptions } from "@ionic-native/image-resizer/ngx";
import { LoaderService } from "src/app/core/loader.service";




@Component({
  selector: "app-add-material",
  templateUrl: "./add-material.component.html",
  styleUrls: ["./add-material.component.scss"],
})
export class AddMaterialComponent implements OnInit {
  kbytes: any;
  showOtherLocation: boolean = false;
  public otherMatLocId: Number = 0;
  public holdValues: any = {
    "client_material_id": null,
    "material": null,
    "Other_Material": null,
    "material_sub": null,
    "classification": null,
    "friable": null,
    "size": null,
    "units": null,
    "quantity": null,
    "color": null,
    "Other_color": null,
    "note1": null,
    "note2": null,
    "assumed": null,
    "location": null
  }
  private _note1SuggList: string[] = [
    'Exterior',
    'Interior',
    'Window',
    'Door',
    'Foundation',
    'Sashes',
    'Dots',
    'Smooth',
    'Reccessed',
    'Holes',
    'Textured',
    'Fluffy',
    'Hard',
    'Stretchy',
    'Floral',
    'Wood Grain',
    'Checkered',
    'Striped',
    'Paper Back',
    'Burlap Back',
    'Mosaic',
    'Wrap',
    'Tape',
    'Sealant',
    'Insulation',
    'Cloth',
    'Diamond',
    'Circle',
    'Square',
    'Corregated',
    'Faux',
    'Light Fixture'
  ];
  public note1SuggList: string[] = [];
  public subMaterialList: any = [];
  public materialUniqID: any = {};
  public isSubmitClicked: boolean = false;
  public deletedMaterialImageList: any = [];
  public materialImages: any = [];
  public arrImage: any = [];
  slideOneForm: FormGroup;
  inspectionObj: any = {};
  type: any;
  dropDown: any;
  materialLocation = [];
  jobId;
  materialList: any = [];
  submitAttempt: boolean = false;
  selectedMaterial: any;
  showNote1SuggList: boolean = false;
  otherMaterial: any;
  otherColor: any;
  otherLocation: any;
  showOtherMaterial: boolean = false;
  showOtherColor: boolean = false;
  constructor(
    public formBuilder: FormBuilder,
    public route: ActivatedRoute,
    public router: Router,
    private databaseService: DatabaseService,
    private toastService: ToastService,
    private location: Location,
    private el: ElementRef,
    private actionSheetController: ActionSheetController,
    private translateService: TranslateService,
    private camera: Camera,
    private crop: Crop,
    private platform: Platform,
    private file: File,
    private ref: ChangeDetectorRef,
    private webview: WebView,
    private timestampService: TimestampService,
    private guidService: GuidService,
    private imageResizer: ImageResizer,
    private loaderService: LoaderService
  ) {
    this.type = this.route.snapshot.params.status;
    this.jobId = this.route.snapshot.params.jobid;

    this.getmaterials();
  }



  async ngOnInit() {
    console.log(this.type);
    this.route.queryParams.subscribe((params) => {
      if (params && params.inspectionObj) {
        this.inspectionObj = JSON.parse(params.inspectionObj);
        this.selectedMaterial = this.inspectionObj.Client_Material_Id;
      }
    });

    let holdValues = localStorage.getItem('HOLD_ADD_MATERIAL');
    if (holdValues) {
      this.holdValues = JSON.parse(localStorage.getItem('HOLD_ADD_MATERIAL'));
      if (this.holdValues.material) {
        this.getEditSubMaterial(this.holdValues.material);
      }
    }

    let arrImages = localStorage.getItem('MATERIAL_IMAGES');
    if (arrImages) {
      this.arrImage = JSON.parse(localStorage.getItem('MATERIAL_IMAGES'));
    }

    this.FormInit();
    this.getData();
    this.getlocation();
    this.type != "edit" ? this.getmaterialId() : null;
    if (this.type == "edit") {
      this.getEditSubMaterial(this.slideOneForm.value.material);
      this.arrImage = await this.loadStoredImages();
      if (this.arrImage.length > 0) {
        this.createImgDisplayName();
      }

    }
  }

  initialHoldValues() {
    this.holdValues = {
      "client_material_id": null,
      "material": null,
      "Other_Material": null,
      "material_sub": null,
      "classification": null,
      "friable": null,
      "size": null,
      "units": null,
      "quantity": null,
      "color": null,
      "Other_color": null,
      "note1": null,
      "note2": null,
      "assumed": null,
      "location": null
    }
  }

  FormInit() {


    this.slideOneForm = this.formBuilder.group({
      client_material_id: [
        this.inspectionObj.Client_Material_Id
          ? this.inspectionObj.Client_Material_Id
          : this.holdValues.client_material_id,
        Validators.compose([Validators.required, Validators.pattern("^[1-9]+[0-9]*$"), Validators.maxLength(50)]),
      ],
      material: [
        this.inspectionObj.Material ? this.inspectionObj.Material : this.holdValues.material,
        Validators.compose([Validators.required, Validators.maxLength(255)]),
      ],
      Other_Material: [
        this.inspectionObj.Other_Material ? this.inspectionObj.Other_Material : this.holdValues.Other_Material,
      ],
      material_sub: [
        this.inspectionObj.Material_Sub
          ? this.inspectionObj.Material_Sub
          : this.holdValues.material_sub,
        Validators.compose([Validators.maxLength(255)])
      ],
      classification: [
        this.inspectionObj.Classification
          ? this.inspectionObj.Classification
          : this.holdValues.classification,
        Validators.compose([Validators.maxLength(255)])
      ],
      friable: [this.inspectionObj.Friable ? this.inspectionObj.Friable : this.holdValues.friable,
      Validators.compose([Validators.maxLength(255)])],
      size: [this.inspectionObj.Size ? this.inspectionObj.Size : this.holdValues.size,
      Validators.compose([Validators.maxLength(255)])],
      units: [this.inspectionObj.Units ? this.inspectionObj.Units : this.holdValues.units,
      Validators.compose([Validators.maxLength(255)])],
      quantity: [
        this.inspectionObj.Quantity ? this.inspectionObj.Quantity : this.holdValues.quantity,
        Validators.compose([Validators.pattern("[0-9]+")]),
      ],
      color: [this.inspectionObj.Color ? this.inspectionObj.Color : this.holdValues.color,
      Validators.compose([Validators.required, Validators.maxLength(255)])
      ],
      Other_color: [
        this.inspectionObj.Other_color ? this.inspectionObj.Other_color : this.holdValues.Other_color,
      ],
      note1: [this.inspectionObj.Note_1 ? this.inspectionObj.Note_1 : this.holdValues.note1,
      Validators.compose([Validators.maxLength(255)])],
      note2: [this.inspectionObj.Note_2 ? this.inspectionObj.Note_2 : this.holdValues.note2,
      Validators.compose([Validators.maxLength(255)])],
      assumed: [
        this.inspectionObj.Assumed ? this.inspectionObj.Assumed : this.holdValues.assumed,
      ],
      location: [
        this.inspectionObj.Material_Locations
          ? this.inspectionObj.Material_Locations.split(",")
          : this.holdValues.location,
        Validators.compose([Validators.maxLength(255)])
      ],
      Other_location: [
        '',
        Validators.compose([Validators.maxLength(255)]),
      ],
    });

    if (this.holdValues.material == 'Other') {
      this.showOtherMaterial = true;
    }
    if (this.holdValues.color == 'Other') {
      this.showOtherColor = true;
    }

    this.changeMaterial();
    this.changeColor();
  }

  getData() {
    this.databaseService.db
      .executeSql(`select * from MaterialDropDownList ORDER by Name`, [])
      .then(
        (data) => {
          let localData = [];
          if (data.rows.length > 0) {
            for (var i = 0; i < data.rows.length; i++) {
              localData.push({
                Material_Id: data.rows.item(i).Material_Id,
                Name: data.rows.item(i).Name,
                Material_Type: data.rows.item(i).Material_Type
              });
            }
            this.dropDown = localData.reduce(function (r, a) {
              r[a.Material_Type] = r[a.Material_Type] || [];
              r[a.Material_Type].push(a);

              return r;
            }, Object.create(null));

            this.sortMaterialDropdown();
          }
        },
        (err) => { }
      );
  }
  sortMaterialDropdown() {
    this.dropDown['Material'].sort((a, b) => {
      if (a.Name < b.Name) {
        return -1;
      }
      if (a.Name > b.Name) {
        return 1;
      }
      return 0;
    });

    this.dropDown['Classification'].sort((a, b) => {
      if (a.Name < b.Name) {
        return -1;
      }
      if (a.Name > b.Name) {
        return 1;
      }
      return 0;
    });

    this.dropDown['Friable'].sort((a, b) => {
      if (a.Name < b.Name) {
        return -1;
      }
      if (a.Name > b.Name) {
        return 1;
      }
      return 0;
    });
    this.dropDown['Units'].sort((a, b) => {
      if (a.Name < b.Name) {
        return -1;
      }
      if (a.Name > b.Name) {
        return 1;
      }
      return 0;
    });

    this.dropDown['Size'].sort((a, b) => {
      if (a.Name < b.Name) {
        return -1;
      }
      if (a.Name > b.Name) {
        return 1;
      }
      return 0;
    });

    this.dropDown['Color'].sort((a, b) => {
      if (a.Name < b.Name) {
        return -1;
      }
      if (a.Name > b.Name) {
        return 1;
      }
      return 0;
    });

    (["Material", "Color"]).forEach(element => {
      this.dropDown[element] = this.dropDown[element].filter(x => x.Name !== "Other").concat(this.dropDown[element].filter(x => x.Name === "Other"));
    });
  }

  getEditSubMaterial(material) {

    if (material) {
      let query = `select * from AsbMaterialMappingList where Trim(Material) = trim('${material}')`;
      this.databaseService.db
        .executeSql(query, [])
        .then(
          (data) => {
            this.subMaterialList = [];

            if (data.rows.length > 0) {

              for (var i = 0; i < data.rows.length; i++) {
                this.subMaterialList.push({
                  Material: data.rows.item(i).Material,
                  Material_Sub: data.rows.item(i).Material_Sub,
                  Classification: data.rows.item(i).Classification,
                  Friable: data.rows.item(i).Friable,
                  Units: data.rows.item(i).Units,
                });
              }

              this.subMaterialList.sort((a, b) => {
                if (a.Material_Sub < b.Material_Sub) {
                  return -1;
                }
                if (a.Material_Sub > b.Material_Sub) {
                  return 1;
                }
                return 0;
              });

            }
            else {
              this.subMaterialList = [];
            }
          },
          (err) => { }
        );
    }
  }

  changeMaterial() {
    if (this.slideOneForm.value.material) {
      let query = `select * from AsbMaterialMappingList where Trim(Material) = trim('${this.slideOneForm.value.material}')`;
      this.databaseService.db
        .executeSql(query, [])
        .then(
          (data) => {
            this.subMaterialList = [];
            this.slideOneForm.controls.material_sub.setValue("");
            this.slideOneForm.controls.classification.setValue("");
            this.slideOneForm.controls.friable.setValue("");
            this.slideOneForm.controls.units.setValue("");
            if (data.rows.length > 0) {

              for (var i = 0; i < data.rows.length; i++) {
                this.subMaterialList.push({
                  Material: data.rows.item(i).Material,
                  Material_Sub: data.rows.item(i).Material_Sub,
                  Classification: data.rows.item(i).Classification,
                  Friable: data.rows.item(i).Friable,
                  Units: data.rows.item(i).Units,
                });
              }
              this.subMaterialList.sort((a, b) => {
                if (a.Material_Sub < b.Material_Sub) {
                  return -1;
                }
                if (a.Material_Sub > b.Material_Sub) {
                  return 1;
                }
                return 0;
              });
            }
            else {
              this.subMaterialList = [];
              this.slideOneForm.controls.material_sub.setValue("");
              this.slideOneForm.controls.classification.setValue("");
              this.slideOneForm.controls.friable.setValue("");
              this.slideOneForm.controls.units.setValue("");
            }
          },
          (err) => { }
        );
    }

    if (this.slideOneForm.value.material == "Other") {
      this.showOtherMaterial = true;
      this.slideOneForm.controls.Other_Material.setValue("");

      // Added validations for material other category
      this.slideOneForm.controls.Other_Material.setValidators(
        Validators.compose([
          Validators.required,
          Validators.maxLength(255),
          Validators.pattern('^(?!^\\s+$).*$')
        ])
      );
    }
    else {
      this.showOtherMaterial = false;
      this.slideOneForm.controls.Other_Material.clearValidators();
    }

    this.slideOneForm.controls.Other_Material.updateValueAndValidity();
  }

  changeColor() {
    if (this.slideOneForm.value.color == "Other") {
      this.showOtherColor = true;
      this.slideOneForm.controls.Other_color.setValue("");
      // Added validations for color other category
      this.slideOneForm.controls.Other_color.setValidators(
        Validators.compose([
          Validators.required,
          Validators.maxLength(255),
          Validators.pattern('^(?!^\\s+$).*$')
        ])
      );
    }
    else {
      this.showOtherColor = false;
      this.slideOneForm.controls.Other_color.clearValidators();
    }
    this.slideOneForm.controls.Other_color.updateValueAndValidity();
  }


  changeSubMaterial(event: {
    component: IonicSelectableComponent,
    value: any
  }) {
    if (this.slideOneForm.value.material && this.slideOneForm.value.material_sub) {
      let query = `select * from AsbMaterialMappingList where Trim(Material) = trim('${this.slideOneForm.value.material}') and Trim(Material_Sub) = trim('${this.slideOneForm.value.material_sub}')`;
      this.databaseService.db
        .executeSql(query, [])
        .then(
          (data) => {
            if (data.rows.length > 0) {
              for (var i = 0; i < data.rows.length; i++) {
                if (data.rows.item(i).Clasification) {
                  this.slideOneForm.controls.classification.setValue(data.rows.item(i).Clasification);
                }
                else {
                  this.slideOneForm.controls.classification.setValue("");
                }

                if (data.rows.item(i).Friable) {
                  this.slideOneForm.controls.friable.setValue(data.rows.item(i).Friable);
                }
                else {
                  this.slideOneForm.controls.friable.setValue("");
                }

                if (data.rows.item(i).Units) {
                  this.slideOneForm.controls.units.setValue(data.rows.item(i).Units);
                }
                else {
                  this.slideOneForm.controls.units.setValue("");
                }
              }
            }
            else {
              this.slideOneForm.controls.classification.setValue("");
              this.slideOneForm.controls.friable.setValue("");
              this.slideOneForm.controls.units.setValue("");
            }
          },
          (err) => { }
        );
    }
  }



  getMaterialNameFormat(arr) {
    return this.timestampService.getMaterialNameFormat(arr);
  }


  getlocation() {
    this.databaseService.db
      .executeSql("select * from MaterialLocations", [])
      .then((res) => {
        if (res.rows.length > 0) {
          for (var i = 0; i < res.rows.length; i++) {
            this.materialLocation.push({
              Id: res.rows.item(i).Id.toString(),
              Name: res.rows.item(i).Name,
            });
          }
          this.materialLocation.sort((a, b) => {
            if (a.Name.toLowerCase() < b.Name.toLowerCase()) {
              return -1;
            }
            if (a.Name.toLowerCase() > b.Name.toLowerCase()) {
              return 1;
            }
            return 0;
          });

          let index = this.materialLocation.findIndex(item => item.Name === "Other");
          if (index !== -1) {
            let removedItem = this.materialLocation.splice(index, 1)[0];
            this.materialLocation.push(removedItem);
          }
        }
      });
  }
  getmaterialId() {
    this.databaseService.db
      .executeSql(
        `SELECT * FROM MaterialListModels where Job_Id=? and IsDelete='false' ORDER BY CAST(Client_Material_Id AS INTEGER) DESC LIMIT 1`,
        [this.jobId]
      )
      .then(
        (data) => {
          if (data.rows.length > 0) {

            this.slideOneForm.controls.client_material_id.setValue(
              Number(data.rows.item(0).Client_Material_Id) + 1
            );
          } else {
            this.slideOneForm.controls.client_material_id.setValue(1);
          }
        },
        (err) => {

        }
      );
  }
  getmaterials() {
    this.databaseService.db
      .executeSql(
        `select * from MaterialListModels where Job_Id=? and IsDelete='false' ORDER BY CAST(Client_Material_Id AS INTEGER)`,
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

  checkOtherMaterialValidation(): Promise<Boolean> {
    return new Promise(async (resolve) => {
      //material Add
      if (this.slideOneForm.value.material == 'Other') {
        let query = `Select * from MaterialDropDownList where Trim(Name) = trim('${this.slideOneForm.value.Other_Material}') COLLATE NOCASE and Material_Type='Material'`;
        await this.databaseService.db
          .executeSql(query, [])
          .then(async (res: any) => {
            if (res.rows.length > 0) {
              return await resolve(false);
            }
            else {
              //insert other material to database
              return await resolve(true);
              //   await this.databaseService.db
              //     .executeSql(
              //       `insert into MaterialDropDownList(Name,Material_Type) values (?,?)`,
              //       [
              //         this.slideOneForm.value.Other_Material,
              //         "Material"
              //       ]).then(async (m: any) => {
              //         console.log("Other material added");
              //         this.dropDown["Material"].push({
              //           Name: this.slideOneForm.value.Other_Material,
              //           Material_Type: "Material"
              //         });
              //         return await resolve(true);
              //       }
              //       ).catch(async (e) => { console.log(e); return await resolve(false); });
            }
          }
          );
      }
      return await resolve(true);
    });
  }

  checkOtherColorValidation(): Promise<Boolean> {
    return new Promise(async (resolve) => {
      //material Add
      if (this.slideOneForm.value.color == 'Other') {
        await this.databaseService.db
          .executeSql(
            `Select * from MaterialDropDownList where Trim(Name) = trim('${this.slideOneForm.value.Other_color}') COLLATE NOCASE and Material_Type='Color'`, [])
          .then(async (res: any) => {
            if (res.rows.length > 0) {
              return await resolve(false);
            }
            else {
              //insert other color to database
              return await resolve(true);
              // await this.databaseService.db
              //   .executeSql(
              //     `insert into MaterialDropDownList(Name,Material_Type) values (?,?)`,
              //     [
              //       this.slideOneForm.value.Other_color,
              //       "Color"
              //     ]).then(async (m: any) => {
              //       console.log("Other color added");
              //       this.dropDown["Color"].push({
              //         Name: this.slideOneForm.value.Other_color,
              //         Material_Type: "Color"
              //       });
              //       return await resolve(true);
              //     }
              //     ).catch(async (e) => { console.log(e); return await resolve(false); });;

            }
          }
          );
      }
      return await resolve(true);
    });
  }

  checkOtherCategoryValidation(): Promise<string> {
    return new Promise(async (resolve) => {
      //Other material Check
      let otherMaterialCheck = await this.checkOtherMaterialValidation();
      if (otherMaterialCheck) {
        let otherColorCheck = await this.checkOtherColorValidation();
        if (otherColorCheck) {
          let otherLocationCheck = await this.checkOtherLocationValidation();
          if (otherLocationCheck) {
            // other material insert
            if (this.slideOneForm.value.material == 'Other') {
              await this.databaseService.db
                .executeSql(
                  `insert into MaterialDropDownList(Name,Material_Type) values (?,?)`,
                  [
                    this.slideOneForm.value.Other_Material,
                    "Material"
                  ]).then(async (m: any) => {
                    console.log("Other material added");
                    this.dropDown["Material"].push({
                      Name: this.slideOneForm.value.Other_Material,
                      Material_Type: "Material"
                    });
                  }
                  ).catch(async (e) => { console.log(e); });
            }

            // other color insert
            if (this.slideOneForm.value.color == 'Other') {
              await this.databaseService.db
                .executeSql(
                  `insert into MaterialDropDownList(Name,Material_Type) values (?,?)`,
                  [
                    this.slideOneForm.value.Other_color,
                    "Color"
                  ]).then(async (m: any) => {
                    console.log("Other color added");
                    this.dropDown["Color"].push({
                      Name: this.slideOneForm.value.Other_color,
                      Material_Type: "Color"
                    });
                  }
                  ).catch(async (e) => { console.log(e); });;
            }

            //   return await resolve("");
            // }

            //other location insert
            let mId = !!this.materialLocation.find(x => x.Name == "Other") ? this.materialLocation.find(x => x.Name == "Other").Id : 0;
            if (!!this.slideOneForm.controls.location.value && this.slideOneForm.controls.location.value.includes(mId)) {
              await this.databaseService.db
                .executeSql(
                  `select Id from MaterialLocations order by Id desc limit 1`,
                  []).then(async (m: any) => {
                    this.otherMatLocId = (m.rows.item(0).Id + 1);
                  }
                  ).catch(async (e) => { console.log(e); });;

              await this.databaseService.db
                .executeSql(
                  `insert into MaterialLocations(Id,Name,IsSync) values (?,?,?)`,
                  [
                    this.otherMatLocId,
                    this.slideOneForm.value.Other_location,
                    false
                  ]).then(async (m: any) => {
                    console.log("Other location added");
                    this.materialLocation.push({
                      Id: this.otherMatLocId.toString(),
                      Name: this.slideOneForm.value.Other_location
                    });
                  }
                  ).catch(async (e) => { console.log(e); });;
            }

            return await resolve("");
          }
          else {
            return await resolve("Same location already exists.");
          }

        }

        else {
          return await resolve("Same color already exists.");
        }
      }
      else {
        return await resolve("Same material already exists.");
      }
    });
  }
  async AddMaterial(flag?) {
    this.submitAttempt = true;
    if (this.slideOneForm.valid) {
      let otherCatCheck = await this.checkOtherCategoryValidation();
      if (otherCatCheck) {//Check other category validation
        this.toastService.presentToast(otherCatCheck);
      }
      else {
        this.otherMaterial = this.slideOneForm.value.material == 'Other' ? this.slideOneForm.value.Other_Material : this.slideOneForm.value.material;
        this.otherColor = this.slideOneForm.value.color == 'Other' ? this.slideOneForm.value.Other_color : this.slideOneForm.value.color;
        this.otherLocation = this.slideOneForm.value.location;
        let mId = !!this.materialLocation.find(x => x.Name == "Other") ? this.materialLocation.find(x => x.Name == "Other").Id : 0;
        if (!!this.slideOneForm.controls.location.value && this.slideOneForm.controls.location.value.includes(mId)) {
          // this.otherLocation = this.slideOneForm.value.Other_location;
          this.otherLocation.pop(this.otherLocation.indexOf(mId));
          this.otherLocation.push(this.otherMatLocId.toString());
        }

        if (this.type == "add" && this.slideOneForm.valid) {
          if (Number(this.slideOneForm.value.client_material_id) == 0) {
            return this.toastService.presentToast("0 is not  allowed in Material ID");
          }
          if (Math.sign(this.slideOneForm.value.client_material_id) == -1) {
            return this.toastService.presentToast("Negative values  is not  allowed in Material ID");
          }

          if (this.slideOneForm.value.note1 && this.slideOneForm.value.note1.length > 255) {
            return this.toastService.presentToast("Maximum allowed character is 255 for note 1");
          }
          if (this.slideOneForm.value.note2 && this.slideOneForm.value.note2.length > 255) {
            return this.toastService.presentToast("Maximum allowed character is 255 for note 2");
          }

          // if (this.arrImage.length === 0) {
          //   return this.toastService.presentToast("Please Upload material image");
          // }
          this.validateMaterialId().then((res) => {
            this.submitAttempt = true;
            this.databaseService.db
              .executeSql(
                `insert into MaterialListModels(Id, Job_Id,Client_Material_Id, Material, Material_Sub, 
                                Classification,Friable, Size,Color, Material_Locations,  
                                Note_1 , Note_2 ,Quantity ,Units , Assumed ,IsDelete) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                  0,
                  this.jobId,
                  this.slideOneForm.value.client_material_id,
                  this.otherMaterial,
                  this.slideOneForm.value.material_sub,
                  this.slideOneForm.value.classification,
                  this.slideOneForm.value.friable,
                  this.slideOneForm.value.size,
                  this.otherColor,
                  this.otherLocation,
                  this.slideOneForm.value.note1,
                  this.slideOneForm.value.note2,
                  this.slideOneForm.value.quantity,
                  this.slideOneForm.value.units,
                  this.slideOneForm.value.assumed,
                  false
                ]
              )
              .then((res) => {
                this.isSubmitClicked = false;

                this.toastService.presentToast("Material added successfully.", true);
                localStorage.removeItem('HOLD_ADD_MATERIAL');
                localStorage.removeItem('MATERIAL_IMAGES');
                if (flag == "SCA") {
                  this.showOtherMaterial = false;
                  this.showOtherColor = false;
                  this.showOtherLocation=false;
                  let id = this.slideOneForm.value.client_material_id;
                  this.insertUpdateMaterialImage().then(() => {
                    this.slideOneForm.reset();
                    this.slideOneForm.controls.assumed.setValue(false);
                    this.getmaterialId();
                    this.arrImage = [];
                  });
                } else {

                  this.initialHoldValues();

                  this.insertUpdateMaterialImage().then(() => {
                    this.location.back();
                    this.slideOneForm.reset();
                    this.slideOneForm.setValue(this.holdValues);
                    this.arrImage = [];
                  });
                }
              });
          });
        } else if (this.type == "edit" && this.slideOneForm.valid) {
          // if (this.arrImage.length === 0) {
          //   return this.toastService.presentToast("Please Upload material image");
          // }
          if (Number(this.slideOneForm.value.client_material_id) == 0) {
            return this.toastService.presentToast("0 is not  allowed in Material ID");
          }
          if (Math.sign(this.slideOneForm.value.client_material_id) == -1) {
            return this.toastService.presentToast("Negative values  is not  allowed in Material ID");
          }

          if (this.slideOneForm.value.note1 && this.slideOneForm.value.note1.length > 255) {
            return this.toastService.presentToast("Maximum allowed character is 255 for note 1");
          }
          if (this.slideOneForm.value.note2 && this.slideOneForm.value.note2.length > 255) {
            return this.toastService.presentToast("Maximum allowed character is 255 for note 2");
          }

          this.slideOneForm.value.client_material_id !=
            this.inspectionObj.Client_Material_Id
            ? await this.validateMaterialId()
            : "";
          this.validateMaterial().then((res) => {
            this.databaseService.db
              .executeSql(
                `update MaterialListModels set Client_Material_Id=?, Material=?, Material_Sub=?, 
                                  Classification=?, Friable=?,Size=? ,Color=? ,Material_Locations=? ,  
                                  Note_1=? , Note_2=? ,Quantity=? ,Units=? , Assumed=? where Client_Material_Id=?`,
                [
                  this.slideOneForm.value.client_material_id,
                  this.otherMaterial,
                  this.slideOneForm.value.material_sub,
                  this.slideOneForm.value.classification,
                  this.slideOneForm.value.friable,
                  this.slideOneForm.value.size,
                  this.otherColor,
                  this.otherLocation,
                  // this.slideOneForm.value.location,
                  this.slideOneForm.value.note1,
                  this.slideOneForm.value.note2,
                  this.slideOneForm.value.quantity,
                  this.slideOneForm.value.units,
                  this.slideOneForm.value.assumed,
                  this.inspectionObj.Client_Material_Id,
                ]
              )
              .then((res) => {
                this.isSubmitClicked = false;
                this.insertUpdateMaterialImage();
                this.toastService.presentToast("Material updated successfully.", true);
                this.location.back();
              });
          });
        } else {
          this.scrollToFirstInvalidControl();
        }
      }
    }
    else {
      this.scrollToFirstInvalidControl();
    }
  }

  async insertUpdateMaterialImage() {
    return new Promise(async resolve => {
      this.databaseService.db
        .executeSql(
          `select * from MaterialImage where Client_Material_Id=? and Job_Id=?`,
          [this.slideOneForm.value.client_material_id, this.jobId]
        )
        .then((res) => {
          if (res.rows.length > 0) {
            for (var i = 0; i < res.rows.length; i++) {
              this.materialImages.push({
                Id: res.rows.item(i).Id,
                Name: res.rows.item(i).Name,
                MaterialImageGuid: res.rows.item(i).MaterialImageGuid,
                Job_Id: res.rows.item(i).Job_Id,
                Client_Material_Id: res.rows.item(i).Client_Material_Id,
                IsSync: res.rows.item(i).IsSync,
                IsDelete: res.rows.item(i).IsDelete
              });

              var target = this.arrImage.find(temp => temp.MaterialImageGuid == res.rows.item(i).MaterialImageGuid);

              if (!target) {
                this.deleteMaterialImage(res.rows.item(i));
              }
              this.deletedMaterialImageList.map((item) => {
                var isRemove = this.arrImage.find(temp => temp.MaterialImageGuid != item.MaterialImageGuid);
                if (isRemove) {
                  const correctPath = item.Filepath.substr(0, item.Filepath.lastIndexOf('/') + 1);
                  this.file.removeFile(correctPath, item.Name).then(async () => { });
                }
              })
            }
          }

          this.arrImage.forEach(item => {
            var target1 = this.materialImages.find(temp => temp.MaterialImageGuid == item.MaterialImageGuid);
            if (target1) {
              this.updateMaterialImage(item)
            }
            else {
              const guid = this.guidService.generateGuid();
              item.MaterialImageGuid = guid;
              item.Client_Material_Id = this.slideOneForm.value.client_material_id;
              item.Job_Id = this.jobId;
              this.insertMaterialImage(item);
            }
          });

          return resolve(true);
        });
    })
    // return true;
  }

  async updateMaterialImage(obj: MaterialImage) {
    const query = `update  MaterialImage set Id =?,Name =?, Path =?, Filepath =?,MaterialImageGuid =? ,Client_Material_Id =?, Job_id =?, IsSync =?,IsDelete=? where MaterialImageGuid = ?`;
    await this.databaseService.db.executeSql(query,
      [
        obj.Id,
        obj.Name,
        obj.Path,
        obj.Filepath,
        obj.MaterialImageGuid,
        obj.Client_Material_Id,
        obj.Job_Id,
        false,
        false,
        obj.MaterialImageGuid,
      ]
    ).then(() => { }).catch(() => { });
  }

  async deleteMaterialImage(obj: MaterialImage) {
    const query = `update  MaterialImage set IsDelete=? where MaterialImageGuid = ?`;
    await this.databaseService.db.executeSql(query,
      [
        "true",
        obj.MaterialImageGuid,
      ]
    ).then(() => { }).catch(() => { });
  }

  validateMaterialId() {
    return new Promise((resolve, reject) => {
      this.databaseService.db
        .executeSql(
          `select Client_Material_Id from MaterialListModels where IsDelete='false' and Client_Material_Id=? and Job_Id=?`,
          [this.slideOneForm.value.client_material_id, this.jobId]
        )
        .then((data) => {
          if (data.rows.length > 0) {
            this.submitAttempt = false;
            return this.toastService.presentToast("Material id already exists.");
          } else {
            this.validateMaterial(resolve).then((res) => {
              resolve(res);
            });
          }
        });
    });
  }
  private validateMaterial(resolve?) {
    let query = `select * from MaterialListModels where IsDelete='false' and ${this.type == "edit"
      ? "Client_Material_Id != '" +
      this.slideOneForm.value.client_material_id +
      "' and "
      : ""
      } Job_Id='${this.jobId}' and Material='${this.slideOneForm.value.material
      }' and (Material_Sub ${this.slideOneForm.value.material_sub
        ? " = '" + this.slideOneForm.value.material_sub + "')"
        : " is null or Material_Sub = '')"
      }
                                      and (Classification ${this.slideOneForm.value.classification
        ? " = '" + this.slideOneForm.value.classification + "')"
        : " is null or Classification = '')"
      } 
                                      and Quantity='${this.slideOneForm.value.quantity}' 
                                      and (Friable ${this.slideOneForm.value.friable
        ? " = '" + this.slideOneForm.value.friable + "')"
        : " is null or Friable = '')"
      }
                                      and (Size ${this.slideOneForm.value.size
        ? " = '" + this.slideOneForm.value.size + "')"
        : " is null or Size = '')"
      }
                                      and (Color ${this.slideOneForm.value.color
        ? " = '" + this.slideOneForm.value.color + "')"
        : " is null or Color='')"
      }
                                      and (Material_Locations ${this.slideOneForm.value.location
        ? " ='" + this.slideOneForm.value.location + "')"
        : " is null or Material_Locations = '')"
      }
                                      and (Note_1 ${this.slideOneForm.value.note1
        ? " ='" + this.slideOneForm.value.note1 + "')"
        : "  is null or Note_1 = '')"
      }
                                      and (Note_2 ${this.slideOneForm.value.note2
        ? " ='" + this.slideOneForm.value.note2 + "')"
        : "  is null or Note_2 = '')"
      }
                                      and (Units${this.slideOneForm.value.units
        ? " ='" + this.slideOneForm.value.units + "')"
        : "  is null or Units = '')"
      } and Assumed = '${this.slideOneForm.value.assumed}'`;


    return new Promise((resolve, reject) => {
      this.databaseService.db.executeSql(query, []).then((data) => {

        if (data.rows.length > 0) {
          this.toastService.presentToast(
            "Same material data already exists for material id " +
            data.rows.item(0).Client_Material_Id +
            "."
          );
        } else {
          resolve(true);
        }
      });
    });
  }

  showsample() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        inspectionObj: JSON.stringify(this.inspectionObj),
        from: "materialPage",
      },
    };
    this.router.navigate([`/tabs/tab2/samplelist`], navigationExtras);
  }
  formAutofill(e) {
    let data = this.materialList.filter((x) => {
      return x.Client_Material_Id == e.target.value;
    });
    this.inspectionObj = data[0];
    this.FormInit();
  }
  goback() {
    this.location.back();
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

  async selectImage() {
    if (this.arrImage.length == 1) {
      return this.toastService.presentToast("You can upload one only material image");
    }
    const actionSheet = await this.actionSheetController.create({
      header: this.translateService.instant('InspectionAdd.imageTitle'),
      buttons: [{
        text: this.translateService.instant('InspectionAdd.library'),
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
        }
      }, {
        text: this.translateService.instant('InspectionAdd.camera'),
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.CAMERA);
        }
      }, {
        text: this.translateService.instant('Login.cancel'),
        role: 'cancel'
      }]
    });
    await actionSheet.present();
  }

  takePicture(sourceType: PictureSourceType) {
    const options: CameraOptions = {
      quality: 60,
      sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };

    this.camera.getPicture(options).then(imagePath => {
      this.loaderService.present();
      console.log("imagePath", imagePath);
      //imagePath file:///storage/emulated/0/Android/data/
      //com.kaamsey.inspection/cache/images (1).jpeg?1695884459786
      let newPath = imagePath.split('?')[0];
      console.log("newPath", newPath);
      //newPath file:///storage/emulated/0/Android/data/
      //com.kaamsey.inspection/cache/images (1).jpeg
      var copyPath = newPath;
      var splitPath = copyPath.split('/');
      console.log("splitPath", splitPath);
      // splitPath 0: "file:"
      //1: ""
      // 2: ""
      // 3: "storage"
      // 4: "emulated"
      // 5: "0"
      // 6: "Android"
      // 7: "data"
      // 8: "com.kaamsey.inspection"
      // 9: "cache"
      // 10: "images (1).jpeg"
      // length: 11
      var imageName = splitPath[splitPath.length - 1];
      console.log("imageName", imageName);
      //imageName images (1).jpeg
      var filePath = newPath.split(imageName)[0];
      console.log("filePath", filePath);
      // filePath file:///storage/emulated/0/Android/data/com.kaamsey.inspection/cache/

      // this.file.readAsDataURL(filePath, imageName).then(async base64 => {
        this.loaderService.dismiss();
        // console.log("base64", base64);

        // let imageSize = this.calculateImageSize(base64);
        // console.log("imageSize", imageSize);
        // //imageSize 235.43825
        // if (imageSize > 1024) {
        //   let resizeOptions: ImageResizerOptions = {
        //     uri: imagePath,
        //     folderName: this.file.dataDirectory,
        //     quality: 70,
        //     height: 1000,
        //     width: 1500,
        //     fileName: imageName
        //   };
        //   console.log("resizeOptions", resizeOptions);
        //   let newPath = await this.resizeImage(resizeOptions);
        //   console.log("Resizer comepleted with -" + newPath);
        //   console.log("RnewPath", newPath);
        //   var splitPath = newPath.split('/');
        //   console.log("RsplitPath", splitPath);
        //   imageName = splitPath[splitPath.length - 1];
        //   console.log("RimageName", imageName);
        //   filePath = newPath.split(imageName)[0];
        //   console.log("RfilePath", filePath);
        // }
        this.copyFileToLocalDir(filePath, imageName, this.createFileName());
      // },
      //   error => {
      //     this.loaderService.dismiss();
      //     alert('Error in showing image' + error);
      //   });


      // this.crop.crop(imagePath, { quality: 100, targetHeight: 300, targetWidth: 400 }).then(newImage => {
      //   if (this.platform.is('android')) {
      //     this.filePath.resolveNativePath(newImage).then(filePath => {
      //       const correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
      //       const currentName = newImage.substring(newImage.lastIndexOf('/') + 1, newImage.lastIndexOf('?'));
      //       this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
      //     });
      //   } else {
      //     const currentName = newImage.substr(newImage.lastIndexOf('/') + 1);
      //     const correctPath = newImage.substr(0, newImage.lastIndexOf('/') + 1);
      //     this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
      //   }
      // }).catch(() => { });
    }).catch(() => { });
  }

  resizeImage(resizeOptions): Promise<string> {
    console.log("resizeOptions Arr" + JSON.stringify(resizeOptions));
    console.log("imageResizer Arr" + JSON.stringify(this.imageResizer));
    this.imageResizer
      .resize(resizeOptions)
      .then((filePath: string) => {
        console.log("1)Resizer filePath-" + filePath);

      })
      .catch(e => {
        console.log("2)Resizer error-" + e);
        console.log(e);;
      });
    console.log("3)Resizer started with options" + resizeOptions);
    return new Promise((resolve) => {
      this.imageResizer
        .resize(resizeOptions)
        .then((filePath: any) => {
          console.log("Resizer filePath-" + filePath);
          resolve(filePath);
        })
        .catch(e => {
          console.log("Resizer error-" + e);
          console.log(e); resolve("");
        });
    });
  }

  copyFileToLocalDir(namePath: string, currentName: string, newFileName: string) {
    this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFileName).then(() => {
      this.updateStoredImages(newFileName);
    }, err => {
      this.toastService.presentToast(JSON.stringify(err));
    });
  }

  calculateImageSize(base64String) {
    let padding;
    let inBytes;
    let base64StringLength;
    if (base64String.endsWith('==')) { padding = 2; }
    else if (base64String.endsWith('=')) { padding = 1; }
    else { padding = 0; }

    base64StringLength = base64String.length;

    inBytes = (base64StringLength / 4) * 3 - padding;

    this.kbytes = inBytes / 1000;
    return this.kbytes;
  }

  createFileName(): string {
    const d = new Date();
    const n = d.getTime();
    const newFileName = n + '.jpg';
    return newFileName;
  }

  async updateStoredImages(name: string) {
    const filePath = this.file.dataDirectory + name;
    const resPath = this.pathForImage(filePath);

    const newEntry: MaterialImage = {
      Id: 1,
      Name: name,
      Path: resPath,
      Filepath: filePath,
      MaterialImageGuid: '',
      Job_Id: '',
      Client_Material_Id: '',
      IsDelete: false,
      IsSync: false
    };
    this.arrImage = [newEntry, ...this.arrImage];
    this.arrImage[0].displayName = this.arrImage[0].Name;


    this.ref.detectChanges();
  }


  public createImgDisplayName() {

    var str = (this.slideOneForm.value.material && this.slideOneForm.value.size ?
      this.slideOneForm.value.material + " -" + this.slideOneForm.value.size : this.slideOneForm.value.material) +
      (this.slideOneForm.value.color ? " -" + this.slideOneForm.value.color : "") + "-HA(" + this.slideOneForm.value.client_material_id + ")";

    var mainstring = this.slideOneForm.value.material_sub ? this.slideOneForm.value.material_sub + " " + str : str;
    if (this.arrImage.length > 0) {
      this.arrImage[0].displayName = mainstring;
    }

  }

  pathForImage(img) {
    if (img === null) {
      return '';
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  async deleteImage(imgEntry: MaterialImage, position: number) {
    this.arrImage.splice(position, 1);
    this.deletedMaterialImageList.push(imgEntry);
  }

  async insertMaterialImage(obj: MaterialImage) {
    const query = `insert into MaterialImage(Name, Path, Filepath,MaterialImageGuid ,Client_Material_Id, Job_id, IsSync,IsDelete) values (?,?,?,?,?,?,?,?)`;
    await this.databaseService.db.executeSql(query, [obj.Name, obj.Path, obj.Filepath, obj.MaterialImageGuid,
    obj.Client_Material_Id, obj.Job_Id, false, false]).then(() => { }).catch(() => { });
  }


  loadStoredImages(): Promise<MaterialImage[]> {
    return new Promise(async resolve => {
      const query = `SELECT * FROM MaterialImage WHERE Job_Id = ? and Client_Material_Id = ? AND IsDelete = 'false'`;

      await this.databaseService.db.executeSql(query, [this.jobId, this.inspectionObj.Client_Material_Id]).then(data => {
        if (data.rows.length > 0) {
          const arrImage: MaterialImage[] = [];
          for (let i = 0; i < data.rows.length; i++) {
            arrImage.push({
              Id: data.rows.item(i).Id,
              Name: data.rows.item(i).Name,
              Path: data.rows.item(i).Path,
              Filepath: data.rows.item(i).Filepath,
              MaterialImageGuid: data.rows.item(i).MaterialImageGuid,
              Client_Material_Id: data.rows.item(i).Client_Material_Id,
              Job_Id: data.rows.item(i).Job_Id,
              IsSync: data.rows.item(i).IsSync,
              IsDelete: data.rows.item(i).IsDelete
            });
          }

          return resolve(arrImage);
        }
      }).catch(() => {
        return resolve([]);
      });
      return resolve([]);
    });
  }

  ionViewWillLeave() {
    if (this.type == 'add') {
      localStorage.setItem('HOLD_ADD_MATERIAL', JSON.stringify(this.slideOneForm.value));
      localStorage.setItem('MATERIAL_IMAGES', JSON.stringify(this.arrImage));
    }
  }

  add(item: string) {
    this.slideOneForm.controls.note1.setValue(item);
    this.showNote1SuggList = false;
  }

  viewSuggestion() {
    this.showNote1SuggList = true;
    if (!!this.slideOneForm.controls.note1.value.trim()) {
      this.note1SuggList = this._note1SuggList.filter(item => item.toLowerCase().includes(this.slideOneForm.controls.note1.value.toLowerCase()));
    }
    else {
      this.showNote1SuggList = false;
    }
  }

  removeSuggestion() {
    setTimeout(() => {
      this.showNote1SuggList = false;
    }, 100);

  }

  changeMatLoc() {
    this.showOtherLocation = false;
    let mId = !!this.materialLocation.find(x => x.Name == "Other") ? this.materialLocation.find(x => x.Name == "Other").Id : 0;
    if (!!this.slideOneForm.controls.location.value) {
      this.showOtherLocation = this.slideOneForm.controls.location.value.includes(mId);
    }
    if (this.showOtherLocation) {
      // this.showOtherLocation = true;
      this.slideOneForm.controls.Other_location.setValue("");
      // Added validations for color other category
      this.slideOneForm.controls.Other_location.setValidators(
        Validators.compose([
          Validators.required,
          Validators.maxLength(255),
          Validators.pattern('^(?!^\\s+$).*$')
        ])
      );
    }
    else {
      // this.showOtherLocation = false;
      this.slideOneForm.controls.Other_location.clearValidators();
    }
    this.slideOneForm.controls.Other_location.updateValueAndValidity();
  }

  checkOtherLocationValidation(): Promise<Boolean> {
    return new Promise(async (resolve) => {
      //material Add
      let mId = !!this.materialLocation.find(x => x.Name == "Other") ? this.materialLocation.find(x => x.Name == "Other").Id : 0;
      if (!!this.slideOneForm.controls.location.value && this.slideOneForm.controls.location.value.includes(mId)) {
        let query = `Select * from MaterialLocations where Trim(Name) = trim('${this.slideOneForm.value.Other_location}') COLLATE NOCASE`;
        await this.databaseService.db
          .executeSql(query, [])
          .then(async (res: any) => {
            if (res.rows.length > 0) {
              return await resolve(false);
            }
            else {
              //insert other material to database
              return await resolve(true);
              //   await this.databaseService.db
              //     .executeSql(
              //       `insert into MaterialDropDownList(Name,Material_Type) values (?,?)`,
              //       [
              //         this.slideOneForm.value.Other_Material,
              //         "Material"
              //       ]).then(async (m: any) => {
              //         console.log("Other material added");
              //         this.dropDown["Material"].push({
              //           Name: this.slideOneForm.value.Other_Material,
              //           Material_Type: "Material"
              //         });
              //         return await resolve(true);
              //       }
              //       ).catch(async (e) => { console.log(e); return await resolve(false); });
            }
          }
          );
      }
      return await resolve(true);
    });
  }
}
