import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ContractService } from '../contract.service';
import { ApiService } from '../api.service';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-buy-subscribe',
  templateUrl: './buy-subscribe.component.html',
  styleUrls: ['./buy-subscribe.component.css']
})
export class BuySubscribeComponent implements OnInit {

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
      this.predepositBalance = this.getTokenBalance(userInfo[0], environment.usdcDecimals);
      this.currentSubscription = this.getTokenBalance(userSubscription[0], environment.usdcDecimals);
      this.futureSubscription = this.getTokenBalance(userSubscription[2], environment.usdcDecimals);
      this.premiumAmount = this.getTokenBalance(userInfo[2], environment.usdcDecimals);
    } else {
      this.predepositBalance = this.getTokenBalance(userInfo[1], environment.assetDecimals);
      this.currentSubscription = this.getTokenBalance(userSubscription[1], environment.usdcDecimals);
      this.futureSubscription = this.getTokenBalance(userSubscription[3], environment.usdcDecimals);
      this.premiumAmount = this.getTokenBalance(userInfo[2], environment.assetDecimals);
    }
  }

  max() {
    this.amount = this.predepositBalance;
  }

  getNumber(x) {
    return parseFloat(x);
  }

  getTokenBalance(value, decimals) {
    return ((+value) / (10 ** decimals)).toFixed(2);
  }

  formatTokenBalance(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  async subscribe() {
    this.loading = true;
    try {
      await this.contractService.subscribe(+this.amount, this.tabIndex==0);
      await this.load();
    } catch(e) {
    }

    this.loading = false;
    this.onRefresh.emit();
  }

  willDisableButton() {
    const buttonDisabled = (this.loading || !this.amount || !this.getNumber(this.amount) ||
      (this.getNumber(this.premiumAmount) + this.getNumber(this.premiumRate) * this.getNumber(this.amount) / 1e6) > this.getNumber(this.predepositBalance));
    return buttonDisabled;
  }

  close() {
    this.onClose.emit();
  }
}
