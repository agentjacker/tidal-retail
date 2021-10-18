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

  allAssets: any = [];
  subscribeType: string = "";
  predepositBalance: string = "";
  weeksBeCovered: string = "";
  sumOfPremium: number = 0;
  assetSymbol: string = "";

  currentWeek: number = 0;
  userBuyerInfo: any = {};
  filteredBuyerHistory = [];

  willShowDeposit: boolean = false;
  willShowWithdraw: boolean = false;
  willShowSubscribe: boolean = false;
  willShowAdjust: boolean = false;
  willShowUnsubscribe: boolean = false;

  selectedAssetIndex: number = 0;
  seletedPremiumRate: number = 0;

  hasAsset = false;
  assetIndex = -1;

  approving = false;
  needApproval = true;

  willShowFileAClaim: boolean = false;

  alertTitle: string = "";
  alertBody: string = "";
  willShowAlertMessage: boolean = false;
  myCurrentPremium: number = 0;
  AdjustType: string;

  constructor(private contractService: ContractService, private apiService: ApiService) { }

  ngOnInit() {
    this.load();
  }

  async load() {
    let assetIndexPlusOne = 0;
    if (this.contractService.address) {
      assetIndexPlusOne = await this.contractService.buyerAssetIndexPlusOne(this.contractService.address);
    }

    this.hasAsset = assetIndexPlusOne > 0;
    this.assetIndex = assetIndexPlusOne - 1;

    const all0 = [(async () => {
      const data = await this.apiService.getAllAssets();
      this.allAssets = data.map(asset => {
        return {
          name: asset.name,
          index: asset.index,
          _premiumRate: asset.premiumRate,
          premiumRate: this.formatRate(asset.premiumRate),
          sellerBalance: this.formatBalance(asset.sellerBalance),
          currentSubscription: this.formatBalance(asset.currentSubscription),
          loading: true,
          assetSymbol: asset.symbol
        };
      });
    })(), (async () => {
      if (this.contractService.address && this.hasAsset) {
        this.predepositBalance = await this.contractService.getPredepositBalance(
            this.contractService.address);
      };
    })(), (async () => {
      if (this.contractService.address && this.hasAsset) {
        this.currentWeek = await this.contractService.getCurrentWeek();
      }
    })(), (async () => {
      if (this.contractService.address && this.hasAsset) {
        this.userBuyerInfo = await this.contractService.getUserBuyerInfo(this.contractService.address);
      }
    })(), (async () => {
      if (this.contractService.address) {
        this.approving = true;
        const allowance = await this.contractService.getAllowance(
            environment.usdcAddress,
            this.contractService.address,
            environment.committeeAddress,
            environment.usdcDecimals);
        this.needApproval = parseFloat(allowance) < 1e9;
        this.approving = false;
      }
    })(), (async () => {
      if (this.contractService.address && this.hasAsset) {
        let data = await this.apiService.getBuyerHistory();
        data = data.filter(r => r.who.toLowerCase() == this.contractService.address.toLowerCase());
        this.filteredBuyerHistory = data.map(r => {
          return {
            date: this.formatDate(r.blockTime),
            subscription: this.formatBalance(r.currentSubscription / (10 ** environment.usdcDecimals)),
            premium: this.formatBalance((r.paid) / (10 ** environment.usdcDecimals)),
            balance: this.formatBalance(r.balance / (10 ** environment.usdcDecimals)),
            refund: this.formatBalance(r.premiumToRefund / (10 ** environment.usdcDecimals)),
            assetBalance: this.formatBalance(r.assetBalance / (10 ** environment.usdcDecimals)),
          };
        });
        this.filteredBuyerHistory = this.filteredBuyerHistory.reverse();
      }
    })()];

    await Promise.all(all0);

    if (this.contractService.address && this.hasAsset) {
      this.sumOfPremium = 0;

      const all1 = this.allAssets.map(async (asset, index) => {
        await Promise.all([(async () => {
          const currentCoveredAmount = await this.contractService.getCurrentSubscription(
              asset.index);
          this.allAssets[index].myCurrentCoveredAmount = this.formatBalance(currentCoveredAmount);
          const myCurrentPremium = parseFloat(currentCoveredAmount) * asset._premiumRate / 1e6;
          this.allAssets[index].myCurrentPremium = myCurrentPremium;
          if (this.assetIndex === asset.index) {
            this.myCurrentPremium = asset.myCurrentPremium
          }
          this.sumOfPremium += myCurrentPremium;
        })(), (async () => {
          const futureCoveredAmount = await this.contractService.getFutureSubscription(
              asset.index);
          this.allAssets[index].myFutureCoveredAmount = this.formatBalance(futureCoveredAmount);
          const myFuturePremium = parseFloat(futureCoveredAmount) * asset._premiumRate / 1e6;
          this.allAssets[index].myFuturePremium = myFuturePremium;
        })()]);
        this.allAssets[index].loading = false;
      });

      await Promise.all(all1);

      this.weeksBeCovered = this.myCurrentPremium ? Math.floor(parseFloat(this.predepositBalance) / this.myCurrentPremium).toString() : "0";
    }
  }

  refresh() {
    this.load();
  }

  formatBalance(value) {
    const result = '$' + (+value).toFixed(0);
    return result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  formatUSDCBalance(value) {
    const result = (+value).toFixed(0);
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

  goToPortfolio() {
    this.onGoTo.emit({key: 'portfolio'});
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

  showAdjust(type: string) {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.willShowAdjust = true;
    this.AdjustType = type;
  }

  showSubscribe(assetIndex: number, type: string) {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.willShowSubscribe = true;
    this.selectedAssetIndex = assetIndex;
    this.seletedPremiumRate = this.allAssets[assetIndex]._premiumRate;
    this.subscribeType = type;
    this.assetSymbol = this.allAssets[assetIndex].assetSymbol;
  }

  closeSubscribe() {
    this.willShowSubscribe = false;
  }

  closeAdjust() {
    this.willShowAdjust = false;
  }

  showUnsubscribe(assetIndex: number) {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.willShowUnsubscribe = true;
    this.selectedAssetIndex = assetIndex;
    this.seletedPremiumRate = this.allAssets[assetIndex]._premiumRate;
    this.assetSymbol = this.allAssets[assetIndex].assetSymbol;
  }

  closeUnsubscribe() {
    this.willShowUnsubscribe = false;
  }

  async approve() {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.approving = true;
    try {
      await this.contractService.approveTokenWithBiconomy(environment.usdcAddress, environment.committeeAddress);
      this.needApproval = false;
    } catch(e) {
    }

    this.approving = false;
  }

  showFileAClaim() {
    if (!this.contractService.address) {
      this.showAlert("Please connect to MetaMask", "");
      return;
    }

    this.willShowFileAClaim = true;
  }

  closeFileAClaim() {
    this.willShowFileAClaim = false;
  }

  showAlert(title, body) {
    this.alertTitle = title;
    this.alertBody = body;
    this.willShowAlertMessage = true;
  }

  closeAlert() {
    this.willShowAlertMessage = false;
  }

  toggleTab($event, type) {
    console.log($event.target.tagName, type)
    Array.from(document.querySelectorAll<HTMLElement>('.tab-content')).forEach(tabContent => {
      tabContent.style.display = 'none'
    })
    Array.from(document.querySelectorAll<HTMLElement>('#toggleTabBar div')).forEach(tab => {
      tab.classList.remove('tab-active')
    })
    document.querySelector(type).style.display = 'block'
    let tab = $event.target.tagName == 'P' ?  $event.target.parentNode : $event.target;
    tab.classList.add('tab-active')
  }
}
