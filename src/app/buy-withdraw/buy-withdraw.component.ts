import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { ContractService } from '../contract.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-buy-withdraw',
  templateUrl: './buy-withdraw.component.html',
  styleUrls: ['./buy-withdraw.component.css']
})
export class BuyWithdrawComponent implements OnInit {

  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onRefresh: EventEmitter<any> = new EventEmitter();

  amount: string = "";
  usdcBalance: string = "";
  predepositBalance: string = "";

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

      this.predepositBalance = await this.contractService.getPredepositBalance(
          this.contractService.address);
    }
  }

  max() {
    this.amount = this.predepositBalance;
  }

  getNumber(x) {
    return parseFloat(x);
  }

  async withdraw() {
    this.loading = true;
    try {
      await this.contractService.buyerWithdraw(+this.amount);
      await this.load();
    } catch(e) {
    }
    this.loading = false;
    this.onRefresh.emit();
  }

  willDisableButton() {
    const buttonDisabled = (this.loading || !this.amount || !this.getNumber(this.amount) ||
      this.getNumber(this.amount) > this.getNumber(this.predepositBalance));
    return buttonDisabled;
  }

  close() {
    this.onClose.emit();
  }
}
