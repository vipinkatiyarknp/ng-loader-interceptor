import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoaderService } from '../services/loader.service';

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
    private requests: HttpRequest<any>[] = [];
    constructor(private loadingService: LoaderService) { }

    removeRequest(req: HttpRequest<any>) {
        const i: number = this.requests.findIndex(x => x.url === req.url);
        if (i >= 0) {
            this.requests.splice(i, 1);
        }
        this.loadingService.isLoading.next(this.requests.length > 0);
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.requests.push(request);
        this.loadingService.isLoading.next(true);
        return Observable.create(observer => {
            const subscription = next.handle(request)
                .subscribe(
                    event => {
                        if (event instanceof HttpResponse) {
                            this.removeRequest(request);
                            observer.next(event);
                        }
                    },
                    err => {
                        console.error('error returned from Interceptor APIS');
                        this.removeRequest(request);
                        observer.error(err);
                    },
                    () => {
                        this.removeRequest(request);
                        observer.complete();
                    });
            // remove request from queue when cancelled
            return () => {
                this.removeRequest(request);
                subscription.unsubscribe();
            };
        });

    }
}
