import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ContractService } from '../contract.service';
import { ApiService } from '../api.service';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-buy-unsubscribe',
  templateUrl: './buy-unsubscribe.component.html',
  styleUrls: ['./buy-unsubscribe.component.css']
})
export class BuyUnsubscribeComponent implements OnInit {

  @Input() tabIndex: number;
  @Input() premiumRate: number;
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onRefresh: EventEmitter<any> = new EventEmitter();

  amount: string = "";
  predepositBalance: string = "";
  coveredAmount: string = "";
  currentSubscription: string = "";
  futureSubscription: string = "";
  premiumAmount: string = "";

  assetIndex = environment.assetIndex;
  assetSymbol = environment.assetSymbol;

  loading: boolean = false;

  constructor(private contractService: ContractService, private apiService: ApiService) { }

  ngOnInit() {
    this.load();
  }

  async load() {
    let userInfo;
    let userSubscription;

    const all = [(async () => {
      userInfo = await this.contractService.getUserInfo(this.contractService.address);
    })(), (async () => { 
      userSubscription = await this.contractService.getSubscriptionByUser(this.contractService.address);
    })()];

    this.loading = true;
    await Promise.all(all);
    this.loading = false;

    if (this.tabIndex == 0) {
      this.predepositBalance = userInfo[0];
      this.currentSubscription = userSubscription[0];
      this.futureSubscription = userSubscription[2];
      this.premiumAmount = userInfo[2];
    } else {
      this.predepositBalance = userInfo[1];
      this.currentSubscription = userSubscription[1];
      this.futureSubscription = userSubscription[3];
      this.premiumAmount = userInfo[2];
    }
  }

  max() {
    this.amount = this.futureSubscription;
  }

  getNumber(x) {
    return parseFloat(x);
  }

  async unsubscribe() {
    this.loading = true;
    try {
      await this.contractService.unsubscribe(+this.amount, this.tabIndex==0);
      await this.load();
    } catch(e) {
    }

    this.loading = false;
    this.onRefresh.emit();
  }

  willDisableButton() {
    const buttonDisabled = (this.loading || !this.amount || !this.getNumber(this.amount) ||
      this.getNumber(this.amount) > this.getNumber(this.futureSubscription));
    return buttonDisabled;
  }

  close() {
    this.onClose.emit();
  }
}
