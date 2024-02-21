import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { GlobalService } from 'src/app/core/auth/global.service';
import { DatabaseService } from 'src/app/core/database.service';
import { ToastService } from 'src/app/core/toast.service';

@Component({
  selector: 'app-edit-image',
  templateUrl: './edit-image.component.html',
  styleUrls: ['./edit-image.component.scss'],
})
export class EditImageComponent implements OnInit {
  @Input() data: any;
  objImg: any;
  public imgName: any;
  public imgSuggList: string[] = [];
  showImgSuggList: boolean = false;

  constructor(public modalCtrl: ModalController, private databaseService: DatabaseService, public toastService: ToastService, public globalService: GlobalService) { }

  ngOnInit() {
    this.objImg = JSON.parse(this.data);
    if (this.objImg.Name.split('_').length > 3) {
      let temparr = [];
      for (let i = this.objImg.Name.split('_').length - 2; i > 0; i--) {
        temparr.push(this.objImg.Name.split('_')[i]);
      }
      let str = temparr.reverse().join('_');
      this.objImg.Name = str;
    }
    else {
      this.objImg.Name = (this.objImg.Name.split('_').length > 1) ? this.objImg.Name.split('_')[1] : this.objImg.Name.split('_')[0];
    }
    if (this.objImg.Name.lastIndexOf(".") > -1) {
      this.objImg.Name = this.objImg.Name.substring(0, this.objImg.Name.lastIndexOf("."));
    }
    //   if (this.objImg.Name.split('_').length > 2) {
    //     let temparr = [];
    //     for (let i = this.objImg.Name.split('_').length - 1; i > 0; i--) {
    //       temparr.push(this.objImg.Name.split('_')[i]);
    //     }
    //     let mainstring = temparr.reverse().join('_');
    //     let str = mainstring.substring(0, mainstring.lastIndexOf("."));
    //     this.objImg.Name = str;
    //   }
    //   else {
    //     this.objImg.Name = (this.objImg.Name.split('_').length > 1) ? this.objImg.Name.split('_')[1] : this.objImg.Name.split('_')[0];
    //     this.objImg.Name = this.objImg.Name.substring(0, this.objImg.Name.lastIndexOf("."));
    //   }
    //   this.imgName = this.objImg.Name;
    // }
  }

  async dismissModal(obj?) {
    if (obj) {
      const query = `select * from InspectionQuestionImage where QuestionGuid='${obj.QuestionGuid}' and Name='${obj.Name}_${(new Date(Date.now()-(new Date()).getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace(/[^0-9]/g, ""))}'`;
      await this.databaseService.db.executeSql(query, []).then(data => {
        if (data.rows.length > 0) {
          this.toastService.presentToast('Image name already exist');
        }
        else {
          var pattern: RegExp = new RegExp("^[ A-Za-z0-9_@.#&+-]*$");
          if (!pattern.test(this.objImg.Name)) {
            return this.toastService.presentToast('Please Enter Valid Image Name');
          }
          this.modalCtrl.dismiss(obj);
        }
      }).catch((err) => {
        console.log(err);
      });
    } else {
      this.modalCtrl.dismiss();
    }
  }

  addImgNameSugg(item: string) {
    this.objImg.Name = item;
    this.showImgSuggList = false;
  }

  async viewImgNameSuggestion() {
    this.imgSuggList = [];
    const query = `select * from AppFieldSuggestions where InspectionId=? and FieldName='InspectionQuestionImage'  and IsDelete='false'`;
    await this.databaseService.db.executeSql(query, [this.globalService.inspectionType]).then((data) => {
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          this.imgSuggList.push(data.rows.item(i).SuggestedValue);
        }
      }
    });

    this.showImgSuggList = true;
  }

  removeImgNameSuggestion() {
    setTimeout(() => {
      this.showImgSuggList = false;
    }, 100);

  }
}