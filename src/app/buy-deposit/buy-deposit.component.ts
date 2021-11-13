import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';

import { ContractService } from '../contract.service';
import { ApiService } from '../api.service';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-buy-deposit',
  templateUrl: './buy-deposit.component.html',
  styleUrls: ['./buy-deposit.component.css']
})
export class BuyDepositComponent implements OnInit {

  @Input() tabIndex: number;
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onRefresh: EventEmitter<any> = new EventEmitter();

  amount: string = "";
  tokenBalance: string = "";
  predepositBalance: string = "";

  assetIndex = environment.assetIndex;
  assetSymbol = environment.assetSymbol;

  needApproval: boolean = true;
  loading: boolean = false;

  constructor(private contractService: ContractService, private apiService: ApiService) { }

  ngOnInit() {
    this.load();
  }

  async load() {
    if (!this.contractService.address) {
      return;
    }

    let allowance;

    const all = [(async ()=> {
      if (this.tabIndex == 0) {
        this.tokenBalance = await this.contractService.balanceOf(
            environment.usdcAddress, this.contractService.address, environment.usdcDecimals);
      } else {
        this.tokenBalance = await this.contractService.balanceOf(
            environment.assetTokenAddress, this.contractService.address, environment.assetDecimals);
      }
    })(), (async ()=> {
      if (this.tabIndex == 0) {
        allowance = await this.contractService.getAllowance(
            environment.usdcAddress,
            this.contractService.address,
            environment.retailHelperAddress,
            environment.usdcDecimals);
      } else {
        allowance = await this.contractService.getAllowance(
            environment.assetTokenAddress,
            this.contractService.address,
            environment.retailHelperAddress,
            environment.assetDecimals);
      }
    })(), (async ()=> {
      const userInfo = await this.contractService.getUserInfo(this.contractService.address);
      if (this.tabIndex == 0) {
        this.predepositBalance = this.getTokenBalance(userInfo[0], environment.usdcDecimals);
      } else {
        this.predepositBalance = this.getTokenBalance(userInfo[1], environment.assetDecimals);
      }
    })()];

    this.loading = true;
    await Promise.all(all);
    this.loading = false;

    this.needApproval = parseFloat(allowance) < parseFloat(this.tokenBalance);
  }

  max() {
    this.amount = this.tokenBalance;
  }

  getTokenBalance(value, decimals) {
    return ((+value) / (10 ** decimals)).toFixed(environment.assetPrecision);
  }

  formatTokenBalance(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  getNumber(x) {
    if(!x) {
      return 0;
    }

    return parseFloat(x);
  }

  mathFloor(x){
    return Math.floor(this.getNumber(x));
  }

  async approve() {
    this.loading = true;
    try {
      if (this.tabIndex == 0) {
        await this.contractService.approve(
            environment.usdcAddress, environment.retailHelperAddress);
      } else {
        await this.contractService.approve(
            environment.assetTokenAddress, environment.retailHelperAddress);
      }

      this.needApproval = false;
    } catch(e) {
    }

    this.loading = false;
  }

  async deposit() {
    this.loading = true;
    try {
      await this.contractService.deposit(+this.amount, this.tabIndex==0);
      await this.load();
      this.amount = "";
    } catch(e) {
    }
    this.loading = false;
    this.onRefresh.emit();
  }

  willDisableButton() {
    const buttonDisabled = (this.loading || !this.amount ||
      !this.getNumber(this.amount) || this.getNumber(this.amount) > this.getNumber(this.tokenBalance));
    return buttonDisabled;
  }

  close() {
    this.onClose.emit();
  }
}
