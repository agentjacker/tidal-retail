import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyWithdrawComponent } from './buy-withdraw.component';

describe('BuyWithdrawComponent', () => {
  let component: BuyWithdrawComponent;
  let fixture: ComponentFixture<BuyWithdrawComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyWithdrawComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyWithdrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
