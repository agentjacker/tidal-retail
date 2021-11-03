import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MobileHeadComponent } from './mobile-head/mobile-head.component';
import { MainContentComponent } from './main-content/main-content.component';
import { MobileFooterComponent } from './mobile-footer/mobile-footer.component';
import { AccountComponent } from './account/account.component';
import { AlertMessageComponent } from './alert-message/alert-message.component';
import { BuyComponent } from './buy/buy.component';
import { BuyDepositComponent } from './buy-deposit/buy-deposit.component';
import { BuyWithdrawComponent } from './buy-withdraw/buy-withdraw.component';
import { BuySubscribeComponent } from './buy-subscribe/buy-subscribe.component';
import { BuyUnsubscribeComponent } from './buy-unsubscribe/buy-unsubscribe.component';
import { NotificationMessageComponent } from './notification-message/notification-message.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SettingsComponent } from './settings/settings.component';
import { PaginatorComponent } from './paginator/paginator.component';

@NgModule({
  declarations: [
    AppComponent,
    MobileHeadComponent,
    MainContentComponent,
    MobileFooterComponent,
    AccountComponent,
    AlertMessageComponent,
    BuyComponent,
    BuyDepositComponent,
    BuyWithdrawComponent,
    BuySubscribeComponent,
    BuyUnsubscribeComponent,
    NotificationMessageComponent,
    SettingsComponent,
    PaginatorComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
