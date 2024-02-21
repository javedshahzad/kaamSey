import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { InspectionPage } from "./inspection.page";
import { InspectionDetailComponent } from "./inspection-detail/inspection-detail.component";
import { JoborderComponent } from "./joborder/joborder.component";
import { InspectionTypeComponent } from "./joborder/inspection-type/inspection-type.component";
import { AddComponent } from "./joborder/inspection-type/add/add.component";
import { SampleListComponent } from "./sample-list/sample-list.component";
import { AddSampleComponent } from "./sample-list/add-sample/add-sample.component";
import { AddMaterialComponent } from "./sample-list/add-material/add-material.component";
import { MaterialListComponent } from "./sample-list/material-list/material-list.component";
import { SurveyRoomListComponent } from "./sample-list/survey-room-list/survey-room-list.component";
import { AddSurveyRoomComponent } from "./sample-list/add-survey-room/add-survey-room.component";
import { ArchiveinspectionsComponent } from "./archiveinspections/archiveinspections.component";
import { InspectionQuestionImageComponent } from "./joborder/inspection-type/inspection-question-image/inspection-question-image.component";
import { JobListComponent } from "./job-list/job-list.component";
import { AddJobComponent } from "./job-list/add-job/add-job.component";
import { AddClientComponent } from './job-list/add-client/add-client.component';
import { ShipmentTrackingComponent } from './shipment-tracking/shipment-tracking.component';

const routes: Routes = [
  {
    path: "",
    component: InspectionPage,
  },
  {
    path: "detail/:obj",
    component: InspectionDetailComponent,
  },
  {
    path: "joborder/:guid",
    component: JoborderComponent,
  },
  {
    path: "type/:guid",
    component: InspectionTypeComponent,
  },
  {
    path: "add/:guid",
    component: AddComponent,
  },
  {
    path: "samplelist",
    component: SampleListComponent,
  },
  {
    path: "addsample",
    component: AddSampleComponent,
  },
  {
    path: "addmaterial/:status/:jobid",
    component: AddMaterialComponent,
  },
  {
    path: "materialList",
    component: MaterialListComponent,
  },
  {
    path: "surveyroomList",
    component: SurveyRoomListComponent,
  },
  {
    path: "addsurveyroom/:status/:jobid",
    component: AddSurveyRoomComponent,
  },
  {
    path: "archiveinspection",
    component: ArchiveinspectionsComponent,
  },
  {
    path: "inspectionQuestionImageList/:guid/:questionguid",
    component: InspectionQuestionImageComponent,
  },
  {
    path: "joblist",
    component: JobListComponent,
  },
  {
    path: "addJob/:jobid",
    component: AddJobComponent,
  },
  {
    path: "addClient",
    component: AddClientComponent,
  },
  {
    path:"shipmentTracking",
    component:ShipmentTrackingComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
})
export class InspectionRoutingModule { }
