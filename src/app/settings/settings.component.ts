import { Component, EventEmitter, OnInit, Output } from '@angular/core';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  @Output() onClose: EventEmitter<any> = new EventEmitter();

  willUseBiconomy = 0;

  constructor() { }

  ngOnInit() {
    this.willUseBiconomy = parseInt(localStorage.getItem('willUseBiconomy'));
    if (isNaN(this.willUseBiconomy)) {
      this.willUseBiconomy = 1;
      localStorage.setItem('willUseBiconomy', this.willUseBiconomy.toString());
    }
  }

  toggleBiconomy() {
    this.willUseBiconomy = this.willUseBiconomy ? 0 : 1;
    localStorage.setItem('willUseBiconomy', this.willUseBiconomy.toString());
  }

  close() {
    this.onClose.emit();
  }
}
