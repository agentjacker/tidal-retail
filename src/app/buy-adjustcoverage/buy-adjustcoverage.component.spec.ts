import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyAdjustcoverageComponent } from './buy-adjustcoverage.component';

describe('BuyAdjustcoverageComponent', () => {
  let component: BuyAdjustcoverageComponent;
  let fixture: ComponentFixture<BuyAdjustcoverageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyAdjustcoverageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyAdjustcoverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
