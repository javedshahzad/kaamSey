import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { InspectionPage } from "./inspection.page";
import { InspectionRoutingModule } from "./inspection-routing.module";
import { TranslateModule } from "@ngx-translate/core";
import { InspectionDetailComponent } from "./inspection-detail/inspection-detail.component";
import { JoborderComponent } from "./joborder/joborder.component";
import { InspectionTypeComponent } from "./joborder/inspection-type/inspection-type.component";
import { AddComponent } from "./joborder/inspection-type/add/add.component";
import { Camera } from "@ionic-native/Camera/ngx";
import { File } from "@ionic-native/File/ngx";
import { WebView } from "@ionic-native/ionic-webview/ngx";
import { Crop } from "@ionic-native/crop/ngx";
import { ExpandableComponent } from "./inspection-detail/expandable/expandable.component";
// import { PdfDownloadService } from '../dashboard/pdf-download.service';
import {
  FileTransfer,
  FileTransferObject,
} from "@ionic-native/file-transfer/ngx";
import { SignaturePadModule } from "angular2-signaturepad";
import { SignatureComponent } from "./joborder/inspection-type/signature/signature.component";
import { SampleListComponent } from "./sample-list/sample-list.component";
import { AddSampleComponent } from "./sample-list/add-sample/add-sample.component";
import { EditImgNameComponent } from "./joborder/inspection-type/add/edit-img-name/edit-img-name.component";
import { AddMaterialComponent } from "./sample-list/add-material/add-material.component";
import { MaterialListComponent } from "./sample-list/material-list/material-list.component";
// import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
// import { FileOpener } from '@ionic-native/file-opener/ngx';
import { SurveyRoomListComponent } from "./sample-list/survey-room-list/survey-room-list.component";
import { AddSurveyRoomComponent } from "./sample-list/add-survey-room/add-survey-room.component";
import { ImageResizer, ImageResizerOptions } from '@ionic-native/image-resizer/ngx';
import { IonicSelectableModule } from 'ionic-selectable';
import { ArchiveinspectionsComponent } from "./archiveinspections/archiveinspections.component";
import { InspectionActionListComponent } from "./inspection-action-list/inspection-action-list.component";
import { InspectionQuestionImageComponent } from "./joborder/inspection-type/inspection-question-image/inspection-question-image.component";
import { EditImageComponent } from "./joborder/inspection-type/inspection-question-image/edit-image/edit-image.component";
import { JobService } from "./job.service";
import { JobListComponent } from "./job-list/job-list.component";
import { AddJobComponent } from "./job-list/add-job/add-job.component";
import { AddClientComponent } from './job-list/add-client/add-client.component';
import { ShipmentTrackingComponent } from './shipment-tracking/shipment-tracking.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InspectionRoutingModule,
    TranslateModule,
    ReactiveFormsModule,
    SignaturePadModule,
    IonicSelectableModule,
  ],
  declarations: [
    InspectionPage,
    InspectionDetailComponent,
    ExpandableComponent,
    JoborderComponent,
    InspectionTypeComponent,
    AddComponent,
    SignatureComponent,
    SampleListComponent,
    AddSampleComponent,
    EditImgNameComponent,
    AddMaterialComponent,
    MaterialListComponent,
    SurveyRoomListComponent,
    AddSurveyRoomComponent,
    ArchiveinspectionsComponent,
    InspectionActionListComponent,
    InspectionQuestionImageComponent,
    EditImageComponent,
    JobListComponent,
    AddJobComponent,
    AddClientComponent,
    ShipmentTrackingComponent
  ],
  providers: [
    Camera,
    File,
    FileTransfer,
    FileTransferObject,
    WebView,
    Crop,
    DatePipe,
    ImageResizer,
    JobService
    // PdfDownloadService,
    // AndroidPermissions,
    // FileOpener
  ],
  entryComponents: [SignatureComponent, EditImgNameComponent, InspectionActionListComponent, EditImageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InspectionPageModule { }
