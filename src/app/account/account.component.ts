import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { ContractService } from '../contract.service';
import { TransactionsService } from '../transactions.service';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  @Output() onRefresh: EventEmitter<any> = new EventEmitter();

  loading: boolean = false;

  usdcBalance: string = "";
  abbrAddress: string = "";
  isCorrectNetwork: boolean = false;

  alertTitle: string = "";
  alertBody: string = "";
  willShowAlertMessage: boolean = false;

  userSellerInfo: any;

  transactionsShown: boolean = false;

  constructor(private contractService: ContractService, public transactionsService: TransactionsService) { }

  ngOnInit() {
    this.load();
  }

  toggleTransactionsShown() {
    this.transactionsShown = !this.transactionsShown;
  }

  async load() {
    await this.contractService.init();
    this.isCorrectNetwork = (await this.contractService.getNetworkName()) == environment.networkName;

    this.onRefresh.emit();

    if (this.contractService.address) {
      this.abbrAddress = this.getAbbr(this.contractService.address);
      this.usdcBalance = await this.contractService.loadUSDCBalance(this.contractService.address);
    }
    window['ethereum'].on('accountsChanged', this.listenAccountChange)

    this.transactionsService.initTransactions();
    this.transactionsService.currentRefreshSource.subscribe(() => {this.refreshBalance()});
  }

  async refreshBalance() {
    this.usdcBalance = await this.contractService.loadUSDCBalance(this.contractService.address);
  }

  async switch() {
    this.loading = true;
    try {
      if (environment.networkName == 'matic-mumbai') {
        await this.contractService.switchToMaticMumbai();
      } else {
        await this.contractService.switchToMatic();
      }
    } catch(e) {
    }
    await this.load();
    this.loading = false;
  }

  getAbbr(line) {
    const len = line.length;
    if (len < 10) return len;
    return line.substr(0, 6) + '...' + line.substr(len - 4, len);
  }

  async connect() {
    if (!this.contractService.isConnected()) {
      this.showAlert("Requires MetaMask", "Please install MetaMask Chrome Extension");
      return;
    }
    this.loading = true;
    const address = await this.contractService.enable();

    const networkName = await this.contractService.getNetworkName();
    if (networkName != environment.networkName) {
      this.contractService.address = '';
      this.showAlert("Please switch to the correct network", "Currently we are on " + environment.networkName);
    } else {
      this.abbrAddress = this.getAbbr(address);
      this.usdcBalance = await this.contractService.loadUSDCBalance(address);
      this.onRefresh.emit();
    }
    this.loading = false;
  }

  showAlert(title, body) {
    this.alertTitle = title;
    this.alertBody = body;
    this.willShowAlertMessage = true;
  }

  closeAlert() {
    this.willShowAlertMessage = false;
  }

  listenAccountChange (account) {
    window.location.reload();
  }
}
