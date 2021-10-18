import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyUnsubscribeComponent } from './buy-unsubscribe.component';

describe('BuyUnsubscribeComponent', () => {
  let component: BuyUnsubscribeComponent;
  let fixture: ComponentFixture<BuyUnsubscribeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyUnsubscribeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyUnsubscribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
