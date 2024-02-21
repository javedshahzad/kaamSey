import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private storage: Storage) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
    return new Promise((resolve) => {
      // this.storage.ready().then(() => {
        const token = localStorage.getItem('token');

        if (token) {
          resolve(true);
        } else {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          resolve(false);
        }
      });
    //});
  }

  logout() {
    var temp = localStorage.getItem('companyCode');
    localStorage.clear();
    this.storage.clear();
   localStorage.setItem('companyCode', temp);
    window.location.href = '';
    //this.router.navigate(['/login']);
  }
}
