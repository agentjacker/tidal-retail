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

  @Input() premiumSum: number;
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onRefresh: EventEmitter<any> = new EventEmitter();

  amount: string = "";
  usdcBalance: string = "";
  predepositBalance: string = "";

  needApproval: boolean = true;
  loading: boolean = false;

  constructor(private contractService: ContractService, private apiService: ApiService) { }

  ngOnInit() {
    this.loading = true;
    this.load();
    this.loading = false;
  }

  async load() {
    if (this.contractService.address && this.contractService.usdcBalance) {
      this.usdcBalance = this.contractService.usdcBalance;

      const all = [(async ()=> {
        const allowance = await this.contractService.getAllowance(environment.usdcAddress, this.contractService.address, environment.buyerAddress, environment.usdcDecimals);
        this.needApproval = parseFloat(allowance) < parseFloat(this.usdcBalance);
      })(), (async ()=> {
        this.predepositBalance = await this.contractService.getPredepositBalance(
            this.contractService.address);
      })()];

      await Promise.all(all);
    }
  }

  max() {
    this.amount = this.usdcBalance;
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
      await this.contractService.approveTokenWithBiconomy(environment.usdcAddress, environment.buyerAddress);
      this.needApproval = false;
    } catch(e) {
    }

    this.loading = false;
  }

  async deposit() {
    this.loading = true;
    try {
      await this.contractService.buyerDeposit(+this.amount);
      await this.load();
      this.amount = "";
    } catch(e) {
    }
    this.loading = false;
    this.onRefresh.emit();
  }

  willDisableButton() {
    const buttonDisabled = (this.loading || !this.amount ||
      !this.getNumber(this.amount) || this.getNumber(this.amount) > this.getNumber(this.usdcBalance));
    return buttonDisabled;
  }

  close() {
    this.onClose.emit();
  }
}
