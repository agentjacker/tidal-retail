import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ApiService } from '../api.service';
import { ContractService } from '../contract.service';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-file-a-claim',
  templateUrl: './file-a-claim.component.html',
  styleUrls: ['./file-a-claim.component.css']
})
export class FileAClaimComponent implements OnInit {

  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onRefresh: EventEmitter<any> = new EventEmitter();

  claiming = false;

  allAssets: any[] = [];
  assetIndex = 0;

  alertTitle: string = "";
  alertBody: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService, private apiService: ApiService) { }

  ngOnInit() {
    this.load();
  }

  async load() {
    this.claiming = true;
    const assets = await this.apiService.getAllAssets();
    this.allAssets = assets.map(asset => {
      return {
        index: asset.index,
        name: asset.name,
        symbol: asset.symbol
      }
    });
    this.claiming = false;
  }

  toggleAsset(assetIndex: number) {
    if (this.claiming) return;
    this.assetIndex = assetIndex;
  }

  async claim() {
    this.claiming = true;

    try {
      await this.contractService.requestPayoutStart(this.assetIndex);

      this.showAlert("Claim is filed", "Please wait for up to 3 days to the committee to confirm");
      this.onRefresh.emit();
    } catch(e) {
    }

    this.claiming = false;
  }

  close() {
    this.onClose.emit();
  }

  showAlert(title, body) {
    this.alertTitle = title;
    this.alertBody = body;
    this.willShowAlertMessage = true;
  }

  closeAlert() {
    this.willShowAlertMessage = false;
  }
}
