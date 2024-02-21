import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SignaturePad } from 'angular2-signaturepad';
import { File, IWriteOptions } from '@ionic-native/File/ngx';
@Component({
  selector: 'app-signature',
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss'],
})
export class SignatureComponent implements OnInit {
  @ViewChild(SignaturePad) public signaturePad: SignaturePad;

  public signaturePadOptions: Object = {
    'minWidth': 2,
    'canvasWidth': screen.width,
    'canvasHeight': screen.height
  };
  public signatureImage: string;
  constructor(public modalCtrl: ModalController, private file: File) { }

  ngOnInit() { }
  dismissModal() {
    this.modalCtrl.dismiss();
  }
  async drawComplete() {
    this.signatureImage = this.signaturePad.toDataURL();
    var data = this.signatureImage.split(',')[1];
    let blob = await this.b64toBlob(data, 'image/png');
    let options: IWriteOptions = { replace: true };
    this.file.writeFile(this.file.dataDirectory, 'signature-' + new Date().getTime() + '.jpg', blob, options).then(res => {
      this.modalCtrl.dismiss(res);
    }, err => {
      
    });
  }

  drawClear() {
    this.signaturePad.clear();
  }

  b64toBlob(b64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }
}
