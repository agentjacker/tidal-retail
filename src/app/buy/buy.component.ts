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

  weeksBeCovered = 0;

  records = [];

  loading = false;

  tabIndex = 0;

  assetIndex = environment.assetIndex;
  assetSymbol = environment.assetSymbol;
  assetTokenAddress = environment.assetTokenAddress;

  pageLimit = 20;
  pageOffset = 0;

  willShowDeposit: boolean = false;
  willShowWithdraw: boolean = false;
  willShowSubscribe: boolean = false;

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
      this.effectiveCapacity = this.getTokenBalance(
          (await this.contractService.getEffectiveCapacity()), environment.usdcDecimals);
    })(), (async () => {
      await this.loadRecords();
    })()];

    this.loading = true;
    await Promise.all(all);
    this.loading = false;

    if (this.tabIndex == 0) {
      this.predepositBalance = this.getTokenBalance(userInfo[0], environment.usdcDecimals);
      this.myCurrentCoverage = this.getTokenBalance(userSubscription[0], environment.usdcDecimals);
      this.myFutureCoverage = this.getTokenBalance(userSubscription[2], environment.usdcDecimals);
      this.myCurrentPremium = this.getTokenBalance(userInfo[2], environment.usdcDecimals);
      this.myFuturePremium = this.getTokenBalance(
          ((+userSubscription[2]) * (+this.premiumRate) / 1e6).toFixed(2), environment.usdcDecimals);
      this.weeksBeCovered = Math.floor((+userInfo[0]) / (+userInfo[2]));
    } else {
      this.predepositBalance = this.getTokenBalance(userInfo[1], environment.assetDecimals, environment.assetPrecision);
      this.myCurrentCoverage = this.getTokenBalance(userSubscription[1], environment.usdcDecimals);
      this.myFutureCoverage = this.getTokenBalance(userSubscription[3], environment.usdcDecimals);
      this.myCurrentPremium = this.getTokenBalance(
          userInfo[3], environment.assetDecimals, environment.assetPrecision);
      this.myFuturePremium = this.getTokenBalance(
          ((+userSubscription[3]) * (+this.premiumRate) / 1e6).toFixed(environment.assetPrecision),
          environment.usdcDecimals,
          environment.assetPrecision);
      this.weeksBeCovered = Math.floor((+userInfo[1]) / (+userInfo[3]));
    }
  }

  async loadRecords() {
    const records = await this.apiService.getRetailHistory(
        this.assetIndex, this.contractService.address, this.pageLimit, this.pageOffset);
    this.records = records.map(r => {
      return {
        blockTime: r.blockTime,
        futureBase: this.getTokenBalance(r.futureBase, environment.usdcDecimals),
        currentBase: this.getTokenBalance(r.currentBase, environment.usdcDecimals),
        premiumBase: this.getTokenBalance(r.premiumBase, environment.usdcDecimals),
        futureAsset: this.getTokenBalance(r.futureAsset, environment.usdcDecimals),
        currentAsset: this.getTokenBalance(r.currentAsset, environment.usdcDecimals),
        premiumAsset: this.getTokenBalance(r.premiumAsset, environment.assetDecimals, environment.assetPrecision)
      }
    });
  }

  refresh() {
    this.load();
  }

  getTokenBalance(value, decimals, precision=2) {
    return ((+value) / (10 ** decimals)).toFixed(precision);
  }

  formatTokenBalance(value) {
    const arr = value.toString().split(".");
    if (arr[1]) {
      return [arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","), arr[1]].join(".");
    } else {
      return arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
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
    this.load();
  }

  showAssetTab() {
    this.tabIndex = 1;
    this.load();
  }

  goFirst() {
    this.pageOffset = 0;
    this.loadRecords();
  }

  goPrev() {
    this.pageOffset -= this.pageLimit;
    this.loadRecords();
  }

  goNext() {
    this.pageOffset -= this.pageLimit;
    this.loadRecords();
  }

  hasFirst() {
    return this.pageOffset > 0;
  }

  hasPrev() {
    return this.pageOffset >= this.pageLimit;
  }

  hasNext() {
    return this.records.length >= this.pageLimit;
  }
}
