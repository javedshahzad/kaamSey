import { Injectable } from '@angular/core';
import {
    HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HTTP_INTERCEPTORS, HttpErrorResponse,
    HttpResponseBase
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../toast.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

    token: string;
    TOKEN_HEADER = 'ApiToken';

    constructor(private toastService: ToastService, private router: Router, private translateService: TranslateService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let token = localStorage.getItem('token');
        if (token) {
            request = request.clone({
                setHeaders: {
                    'Authorization': 'Bearer ' + token
                }
            });
        }

        // if (request.body instanceof FormData) {
        //     // Allow Angular to handle the content-type header automatically
           
        // }
        // else if (!request.headers.has('Content-Type')) {
        //     request = request.clone({
        //         setHeaders: {
        //             'content-type': 'application/json',
        //         }
        //     });
        // }

        request = request.clone({
            headers: request.headers.set('Accept', 'application/json')
        });

        return next.handle(request).pipe(
            map((event: HttpEvent<any>) => {
                return event;
            }),
            catchError((error: HttpErrorResponse) => {
                console.log(request);
                console.error(error);
                // this.toastService.presentToast(error.statusText + '. ' + 'Please contact your system administrator.');
                this.toastService.presentToast(' Your session has expired, Please log out and log back in again.');
                return throwError(error);
            }));
    }
    // interceptOld(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    //     const clonedReq = req.clone({ setHeaders: this.authHeaders });

    //     return next.handle(clonedReq).pipe(
    //         tap(this.onSubscribeSuccess.bind(this), this.onSubscribeError.bind(this))
    //     );
    // }

    // private onSubscribeSuccess(res: HttpEvent<any>) {
    //     if (res instanceof HttpResponse) {
    //         this.updateTokenFromResponse(res);
    //     }
    // }

    // private onSubscribeError(error: HttpEvent<any>) {
    //     if (!(error instanceof HttpErrorResponse)) {
    //         return;
    //     }
    //     const handlerName = 'handleError' + error.status;

    //     if (typeof this[handlerName] === 'function') {
    //         return this[handlerName](error);
    //     }
    //     this.defaultErrorHandler(error);
    //     this.updateTokenFromResponse(error);
    // }

    // defaultErrorHandler(error: HttpErrorResponse) {
    //     const errorMessage = this.errorMessage(error);
    //     if (errorMessage) {
    //         this.toastService.presentToast(errorMessage);
    //     }
    // }

    // handleError401(error: HttpErrorResponse) {
    //     this.defaultErrorHandler(error);
    //     localStorage.clear();
    //     this.router.navigate(['/']);
    // }

    // updateTokenFromResponse(res: HttpResponseBase) {
    //     const headerName = this.TOKEN_HEADER;

    //     if (res.headers && res.headers.has(headerName)) {
    //         this.token = res.headers.get(headerName);
    //         localStorage.setItem('token', this.token);
    //     }
    // }

    // get authHeaders(): { [h: string]: string } {
    //     this.token = localStorage.getItem('token');
    //     return this.token ? { [this.TOKEN_HEADER]: this.token } : {};
    // }

    // errorMessage(error: HttpErrorResponse): string {
    //     return error.error.message || this.statusErrorMessage(error.status);
    // }

    // statusErrorMessage(status: number): string {
    //     const key = `Errors.${status}`;
    //     const errorMessage = this.translateService.instant(key);
    //     return errorMessage === key ? '' : errorMessage;
    // }
}