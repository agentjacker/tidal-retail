import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../environments/environment'

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient) {
  }

  get(url, name): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(url).pipe(
        catchError(this.handleError(name, []))
      ).subscribe(data => {
        resolve(data);
      }, err => {
        reject(err);
      });
    });
  }

  async getBuyerHistory() {
    const url = "https://tidal-data.postxiami.space/api/buyerinfo";
    return await this.get(url, "getBuyerHistory");
  }

  async getRetailHistory(assetIndex_, who_, limit_, offset_) {
    const url = "https://tidal-data.postxiami.space/api/get_retail_records?" +
        "assetIndex=" + assetIndex_ + "&who=" + who_ + "&offset=" + offset_ + "&limit=" + limit_;
    return await this.get(url, "getRetailHistory");
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      if (error && error.error && error.error.message) {
        return throwError(error.error.message);
      } else {
        return throwError('Unknow error.');
      }
    };
  }
}
