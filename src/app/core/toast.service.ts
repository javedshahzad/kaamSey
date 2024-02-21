import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable()
export class ToastService {

  constructor(private toastController: ToastController) { }

  async presentToast(msgText,isSuccess: boolean = false) {
    let duration = isSuccess ? 1000 : 4000;
    const toast = await this.toastController.create({
      message: msgText,
      duration: duration,
      position: 'bottom',
      buttons: [
        {
          side: 'end', // Adjust the side as per your preference (start, end)
          icon: 'close',
          role: 'cancel',
          handler: () => {
            // Handle the close button click event here
            console.log('Toast closed');
          }
        }
      ]
    });
    toast.present();
  }
}
