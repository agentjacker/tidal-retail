import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.css']
})
export class AlertMessageComponent implements OnInit {

  @Input() title: string;
  @Input() body: string;

  @Output() onClose: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  close() {
    this.onClose.emit();
  }
}
