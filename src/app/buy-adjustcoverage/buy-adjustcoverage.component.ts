import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ContractService } from '../contract.service';
import { ApiService } from '../api.service';


@Component({
  selector: 'app-buy-adjustcoverage',
  templateUrl: './buy-adjustcoverage.component.html',
  styleUrls: ['./buy-adjustcoverage.component.css']
})
export class BuyAdjustcoverageComponent implements OnInit {

  @Input() assetIndex: number;
  @Input() premiumRate: number;
  @Input() assetSymbol: string;
  @Input() AdjustType: string;
  @Input() subscribeType: string;
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onRefresh: EventEmitter<any> = new EventEmitter();

  amount: string = "";
  predepositBalance: string = "";
  coveredAmount: string = "";
  currentSubscription: string = "";
  futureSubscription: string = "";
  premiumAmount: string = "";
  loading: boolean = false;

  constructor(private contractService: ContractService, private apiService: ApiService) { }

  ngOnInit() {
    this.loading = true;
    this.load();
    this.loading = false;
  }

  async load() {
    const all = [(async () => {
      this.predepositBalance = await this.contractService.getPredepositBalance(
          this.contractService.address);
    })(), (async () => {
      this.currentSubscription = await this.contractService.getCurrentSubscription(
          this.assetIndex);
    })(), (async () => {
      this.futureSubscription = await this.contractService.getFutureSubscription(
          this.assetIndex);
    })()];

    await Promise.all(all);
    this.premiumAmount = (this.premiumRate * parseFloat(this.futureSubscription) / 1e6).toFixed(2);
  }

  max() {
    this.amount = this.predepositBalance;
  }

  getNumber(x) {
    return parseFloat(x);
  }

  async subscribe() {
    this.loading = true;
    try {
      await this.contractService.buyerSubscribe(this.assetIndex, +this.amount);
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

