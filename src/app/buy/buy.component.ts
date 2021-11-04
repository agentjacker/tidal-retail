import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { ContractService } from '../contract.service';
import { ApiService } from '../api.service';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-buy',
  templateUrl: './buy.component.html',
  styleUrls: ['./buy.component.css']
})
export class BuyComponent implements OnInit {

  @Output() onGoTo: EventEmitter<any> = new EventEmitter();

  asset: any = {};
  predepositBalance: string = "";
  premiumRate: string = "";
  effectiveCapacity: string = "";
  myCurrentCoverage: string = "";
  myFutureCoverage: string = "";
  myCurrentPremium: string = "";
  myFuturePremium: string = "";

  loading = false;

  tabIndex = 0;

  assetIndex = environment.assetIndex;
  assetSymbol = environment.assetSymbol;

  filteredBuyerHistory = [{
    date: '10/21/2021',
    subscription: '$100,100',
    premium: '$3423',
    assetBalance: '$324',
    refund: '$1000'
  },{
    date: '10/21/2021',
    subscription: '$100,100',
    premium: '$3423',
    assetBalance: '$324',
    refund: '$1000'
  },{
    date: '10/21/2021',
    subscription: '$100,100',
    premium: '$3423',
    assetBalance: '$324',
    refund: '$1000'
  }];

  willShowDeposit: boolean = false;
  willShowWithdraw: boolean = false;
  willShowSubscribe: boolean = false;
  willShowUnsubscribe: boolean = false;

  alertTitle: string = "";
  alertBody: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService, private apiService: ApiService) { }

  ngOnInit() {
    this.load();
  }

  async load() {
    await this.contractService.waitForConnection();

    let userInfo;
    let assetInfo;
    let userSubscription;

    const all = [(async () => {
      userInfo = await this.contractService.getUserInfo(this.contractService.address);
    })(), (async () => {
      assetInfo = await this.contractService.getAssetInfo();
    })(), (async () => {
      userSubscription = await this.contractService.getSubscriptionByUser(this.contractService.address);
    })(), (async () => {
      this.premiumRate = await this.contractService.getPremiumRate(this.contractService.address);
    })(), (async () => {
      this.effectiveCapacity = await this.contractService.getEffectiveCapacity();
    })()];

    this.loading = true;
    await Promise.all(all);
    this.loading = false;

    if (this.tabIndex == 0) {
      this.predepositBalance = userInfo[0];
      this.myCurrentCoverage = userSubscription[0];
      this.myFutureCoverage = userSubscription[2];
      this.myCurrentPremium = (+userInfo[2]).toFixed(2);
    } else {
      this.predepositBalance = userInfo[1];
      this.myCurrentCoverage = userSubscription[1];
      this.myFutureCoverage = userSubscription[3];
      this.myCurrentPremium = (+userInfo[3]).toFixed(2);
    }

    this.myFuturePremium = ((+this.myFutureCoverage) * (+this.premiumRate) / 1e6).toFixed(2);
  }

  refresh() {
    this.load();
  }

  formatBalance(value, decimals=6) {
    const result = '$' + ((+value) / (10 ** decimals)).toFixed(2);
    return result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  formatTokenBalance(value, decimals=6) {
    const result = ((+value) / (10 ** decimals)).toFixed(2);
    return result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return  (date.getMonth() + 1) + " / " + date.getDate() + " / " + date.getFullYear();
  }

  formatRate(value) {
    if (isNaN(value)) {
      return 'N/A';
    }

    return (value / 10000).toFixed(2) + '%';
  }

  getNumber(value) {
    return parseFloat(value);
  }

  showDeposit() {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.willShowDeposit = true;
  }

  closeDeposit() {
    this.willShowDeposit = false;
  }

  showWithdraw() {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.willShowWithdraw = true;
  }

  closeWithdraw() {
    this.willShowWithdraw = false;
  }

  showSubscribe(assetIndex: number) {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.willShowSubscribe = true;
    this.assetSymbol = this.asset.assetSymbol;
  }

  closeSubscribe() {
    this.willShowSubscribe = false;
  }

  showUnsubscribe(assetIndex: number) {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.willShowUnsubscribe = true;
    this.assetSymbol = this.asset.assetSymbol;
  }

  closeUnsubscribe() {
    this.willShowUnsubscribe = false;
  }

  showAlert(title, body) {
    this.alertTitle = title;
    this.alertBody = body;
    this.willShowAlertMessage = true;
  }

  closeAlert() {
    this.willShowAlertMessage = false;
  }

  showUSDCTab() {
    this.tabIndex = 0;
  }

  showAssetTab() {
    this.tabIndex = 1;
  }
}
