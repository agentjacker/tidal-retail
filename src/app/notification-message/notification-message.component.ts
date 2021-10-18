import {ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {NotificationsService} from './notifications.service';

@Component({
  selector: 'app-notification-message',
  templateUrl: './notification-message.component.html',
  styleUrls: ['./notification-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class NotificationMessageComponent implements OnInit {
  constructor(public notificationsService: NotificationsService, private cdRef: ChangeDetectorRef) {}
  notificationShown: boolean;
    ngOnInit(): void {
        this.notificationsService.notificationShown.subscribe(notificationShown => {
          this.notificationShown = notificationShown;
          this.cdRef.detectChanges();
        });
    }
}
