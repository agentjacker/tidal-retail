import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../environments/environment'

@Injectable({ providedIn: 'root' })
export class ApiService {

  private getAllCategoriesUrl = environment.apiUrl + '/get_all_categories';
  private getAllAssetsUrl = environment.apiUrl + '/get_all_assets';
  private getPayoutRequestsUrl = environment.apiUrl + '/get_payout_requests';
  private getPriceUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=tidal-finance&vs_currencies=usd';

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

  async getAllCategories() {
    const url = this.getAllCategoriesUrl;
    return await this.get(url, 'getAllCategories');
  }

  async getAllAssets() {
    const url = this.getAllAssetsUrl;
    return await this.get(url, 'getAllAssets');
  }

  async getPayoutRequests(offset = 0, limit = 20) {
    const url = this.getPayoutRequestsUrl + '?offset=' + offset + '&limit=' + limit;
    return await this.get(url, 'getPayoutRequests');
  }

  async getPendingDepositAmount() {
    const url = "https://tidal-data.postxiami.space/api/getPendingBalance";
    return await this.get(url, 'getPendingDepositAmount');
  }

  async getBuyerHistory() {
    const url = "https://tidal-data.postxiami.space/api/buyerinfo";
    return await this.get(url, 'getBuyerHistory');
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

  async getPrice() {
    const url = this.getPriceUrl;
    const result = await this.get(url, "getPrice");
    return result['tidal-finance'].usd;
  }
}
