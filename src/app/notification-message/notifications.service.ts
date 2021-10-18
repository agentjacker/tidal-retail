import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly NOTIFICATION_DURATION: number = 5000;
  title: string;
  body: string;
  type: string;
  transactionHash: string;
  private shownSource = new BehaviorSubject<boolean>(false);
  notificationShown = this.shownSource.asObservable();

  hideNotification() {
    this.shownSource.next(false);
  }

  showNotification({title, body, transactionHash, type}) {
    this.type = type, this.title = title, this.body = body, this.transactionHash = transactionHash;
    this.shownSource.next(true);

    setTimeout(() => {
      this.hideNotification();

      this.title = '';
      this.body = '';
      this.transactionHash = '';
      this.type = '';
    }, this.NOTIFICATION_DURATION);
  }
}
