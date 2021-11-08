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
  futureSubscription: string = "";
  futureSubscriptionNumber = 0;
  futurePremium: string = "";

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
    let premiumRate;

    const all = [(async () => {
      userInfo = await this.contractService.getUserInfo(this.contractService.address);
    })(), (async () => {
      userSubscription = await this.contractService.getSubscriptionByUser(this.contractService.address);
    })(), (async () => {
      premiumRate = await this.contractService.getPremiumRate(this.contractService.address);
    })()];

    this.loading = true;
    await Promise.all(all);
    this.loading = false;

    if (this.tabIndex == 0) {
      this.predepositBalance = this.getTokenBalance(userInfo[0], environment.usdcDecimals);
      this.futureSubscription = this.getTokenBalance(userSubscription[2], environment.usdcDecimals);
      this.futureSubscriptionNumber = (+userSubscription[2]) / (10 ** environment.usdcDecimals);
      this.futurePremium = this.getTokenBalance(
          ((+userSubscription[2]) * premiumRate / 1e6).toFixed(2), environment.usdcDecimals);
    } else {
      this.predepositBalance = this.getTokenBalance(userInfo[1], environment.assetDecimals);
      this.futureSubscription = this.getTokenBalance(userSubscription[3], environment.usdcDecimals);
      this.futureSubscriptionNumber = (+userSubscription[3]) / (10 ** environment.usdcDecimals);
      this.futurePremium = this.getTokenBalance(
          ((+userSubscription[3]) * premiumRate / 1e6).toFixed(2), environment.usdcDecimals);
    }
  }

  max() {
    this.amount = this.predepositBalance;
  }

  isNumber(x) {
    return !isNaN(parseFloat(x));
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

  async adjust() {
    const amount = this.getNumber(this.amount);

    this.loading = true;
    try {
      if (amount > this.futureSubscriptionNumber) {
        const amountToAdd = +(amount - this.futureSubscriptionNumber).toFixed(2);
        await this.contractService.subscribe(amountToAdd, this.tabIndex==0);
      } else {
        const amountToReduce = +(this.futureSubscriptionNumber - amount).toFixed(2);
        await this.contractService.unsubscribe(amountToReduce, this.tabIndex==0);
      }

      await this.load();
    } catch(e) {
    }

    this.loading = false;
    this.onRefresh.emit();
  }

  willDisableButton() {
    const buttonDisabled = (this.loading || isNaN(+this.amount));
    return buttonDisabled;
  }

  close() {
    this.onClose.emit();
  }
}
