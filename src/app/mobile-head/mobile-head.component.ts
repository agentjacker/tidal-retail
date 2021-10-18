import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-mobile-head',
  templateUrl: './mobile-head.component.html',
  styleUrls: ['./mobile-head.component.css']
})
export class MobileHeadComponent implements OnInit {

  @Input() key: string;
  @Output() onGoTo: EventEmitter<any> = new EventEmitter();
  menuItems: string[] = environment.networkName != 'matic-mumbai' ?
      ['sell', 'staking', 'guarantor', 'cover-status', 'claims']:
      ['sell', 'staking', 'guarantor', 'cover-status', 'claims'];
  menuTitles: string[] = environment.networkName != 'matic-mumbai' ?
      ['USDC Reserve', 'TIDAL Staking', 'Guarantor', 'Cover Status', 'Claims']:
      ['USDC Reserve', 'TIDAL Staking', 'Guarantor', 'Cover Status', 'Claims'];
  menuHidden: boolean = false;
  willShowSettings: boolean;

  constructor() { }

  ngOnInit() {
    // this.key = 'sell';
  }

  goTo(key) {
    this.key = key;
    this.onGoTo.emit({
      key: key
    });
  }

  goToPortfolio() {
    this.onGoTo.emit({key: 'portfolio'});
  }

  getRestItems() {
    let arr = [];
    for(let i of this.menuItems){
      if(i !== this.key){
        arr.push(i);
      }
    }
    return arr;
  }

  showSettings() {
    this.willShowSettings = true;
  }

  closeSettings() {
    this.willShowSettings = false;
  }

  changeMenuStatus() {
    this.menuHidden = !this.menuHidden;
  }
}
