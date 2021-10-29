import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css']
})
export class PaginatorComponent implements OnInit {

  pageList = [1,2,3]
  currentPageIdx = 0;
  
  constructor() { }

  ngOnInit() {
  }

}
