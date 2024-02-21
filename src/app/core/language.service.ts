import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { defaultLanguage } from './language.constants';
import { Storage } from '@ionic/storage';

const LNG_KEY = 'SELECTED_LANGUAGE';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  selected = '';

  constructor(private translate: TranslateService, private storage: Storage) { }

  setInitialAppLanguage() {
    this.translate.setDefaultLang(defaultLanguage);
    this.storage.set(LNG_KEY, defaultLanguage);

    this.storage.get(LNG_KEY).then((value) => {
      if (value) {
        this.setLanguage(value);
        this.selected = value;
      }
    });
  }

  setLanguage(lng: string) {
    this.translate.use(lng);
    this.selected = lng;
    this.storage.set(LNG_KEY, lng);
  }
}
