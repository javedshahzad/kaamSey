import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Location } from "@angular/common";
import { InspectionQuestionImage } from 'src/app/models/db-models/inspection-question-image-model';
import { DatabaseService } from 'src/app/core/database.service';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from 'src/app/core/toast.service';
import { ModalController, NavController } from '@ionic/angular';
import { GlobalService } from 'src/app/core/auth/global.service';
import { EditImageComponent } from './edit-image/edit-image.component';
import { File } from '@ionic-native/File/ngx';

@Component({
  selector: 'app-inspection-question-image',
  templateUrl: './inspection-question-image.component.html',
  styleUrls: ['./inspection-question-image.component.scss'],
})
export class InspectionQuestionImageComponent implements OnInit {
  inspectionImgList: InspectionQuestionImage[] = [];
  questionImgList: InspectionQuestionImage[] = [];
  inspectionGuid: string;
  questionGuid: string;
  isLoading = true;
  jobid: any;

  constructor(
    private location: Location, private databaseService: DatabaseService, private route: ActivatedRoute,
    private ref: ChangeDetectorRef, private toastService: ToastService, private zone: NgZone, private navCtrl: NavController,
    private globalService: GlobalService, private modalController: ModalController, public file: File) { }

  ngOnInit() { }

  async ionViewWillEnter() {
    this.inspectionGuid = this.route.snapshot.params.guid;
    this.questionGuid = this.route.snapshot.params.questionguid;
    console.log(this.inspectionGuid,this.questionGuid)
    //this.isLoading = true;

    this.databaseService.db.executeSql('select JobId from inspection where InspectionGuid=?', [this.inspectionGuid]).then(res => {
      console.log(res)
      if (res.rows.length != 0) {
        this.jobid = res.rows.item(0).JobId
      }
    });
    this.getInspectionQuestionImgList();
  }

  async getInspectionQuestionImgList() {
    this.inspectionImgList = []; this.questionImgList = [];
    const query = `select * from InspectionQuestionImage where InspectionGuid='${this.inspectionGuid}' and IsDelete='false' order by Id desc`;
    await this.databaseService.db.executeSql(query, []).then(data => {
      console.log(data)
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          if (!data.rows.item(i).QuestionGuid) {
            this.inspectionImgList.push({
              Id: data.rows.item(i).Id,
              InspectionQuestionImageGuid: data.rows.item(i).InspectionQuestionImageGuid,
              Name: data.rows.item(i).Name,
              Path: data.rows.item(i).Path,
              Filepath: data.rows.item(i).Filepath,
              Timestamp: data.rows.item(i).Timestamp,
              InspectionGuid: data.rows.item(i).InspectionGuid,
              QuestionGuid: data.rows.item(i).QuestionGuid,
              IsDelete: data.rows.item(i).IsDelete,
              IsSync: data.rows.item(i).IsSync
            });
          }
          else if (!!data.rows.item(i).QuestionGuid && data.rows.item(i).QuestionGuid === this.questionGuid) {
            this.questionImgList.push({
              Id: data.rows.item(i).Id,
              InspectionQuestionImageGuid: data.rows.item(i).InspectionQuestionImageGuid,
              Name: data.rows.item(i).Name,
              Path: data.rows.item(i).Path,
              Filepath: data.rows.item(i).Filepath,
              Timestamp: data.rows.item(i).Timestamp,
              InspectionGuid: data.rows.item(i).InspectionGuid,
              QuestionGuid: data.rows.item(i).QuestionGuid,
              IsDelete: data.rows.item(i).IsDelete,
              IsSync: data.rows.item(i).IsSync
            });
          }
        }
      }
      console.log(this.inspectionImgList)
      this.isLoading = false;
    }).catch((err) => {
      console.log(err);
      this.isLoading = false;
    });
  }

  deleteImage(obj) {
    const query = `update InspectionQuestionImage set IsDelete='true', IsSync='false' where InspectionQuestionImageGuid='${obj.InspectionQuestionImageGuid}'`;
    this.databaseService.db.executeSql(query, []).then(data => {
      setTimeout(() => {
        this.zone.run(() => {
          this.getInspectionQuestionImgList();
        })
      }, 0);
      this.toastService.presentToast("Image deleted successfully.",true);
    }).catch((err) => {
      console.log(err);
      this.getInspectionQuestionImgList();
    });
  }

  async editName(obj) {
    const modal = await this.modalController.create({
      component: EditImageComponent,
      cssClass: 'editImage-modal',
      backdropDismiss: false,
      componentProps: {
        data: JSON.stringify(obj)
      }
    });

    modal.onWillDismiss().then(async res => {
      if (res.data) {
        res.data.Name = this.jobid + '_' + res.data.Name + '_' + (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace(/[^0-9]/g, ""));
        if (!res.data.Name.endsWith('.jpg')) {
          res.data.Name = res.data.Name + '.jpg';
        }
        let filepath = res.data.Filepath.substring(0, res.data.Filepath.lastIndexOf('/') + 1);
        let path = res.data.Path.substring(0, res.data.Path.lastIndexOf('/') + 1);
        this.file.copyFile(filepath, obj.Name, this.file.dataDirectory, res.data.Name).then(async (data) => {
          res.data.Filepath = filepath + res.data.Name;
          res.data.Path = path + res.data.Name;
          await this.databaseService.updateInspectionQuestionImageName(res.data);
          setTimeout(() => {
            this.zone.run(() => {
              this.getInspectionQuestionImgList();
            })
          }, 0);
        })
      }
    })
    await modal.present();

  }

  goBack() {
    this.globalService.isFromInsQueImgList = true;
    this.location.back();
  }
}