import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css']
})
export class MainContentComponent implements OnInit {
  @Input() key: string;
  @Output() onGoTo: EventEmitter<any> = new EventEmitter();

  willShowSettings = false;

  alertTitle = '';
  alertBody = '';
  willShowAlertMessage = false;

  constructor() { }

  ngOnInit() {
  }

  goTo($event) {
    this.onGoTo.emit($event);
  }

  showSettings() {
    this.willShowSettings = true;
  }

  closeSettings() {
    this.willShowSettings = false;
  }

  showAlert(title, body) {
    this.alertTitle = title;
    this.alertBody = body;
    this.willShowAlertMessage = true;
  }

  closeAlert() {
    this.willShowAlertMessage = false;
  }

  goToPortfolio() {
    this.onGoTo.emit({ key: 'portfolio' });
  }
}
