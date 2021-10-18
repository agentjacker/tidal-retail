import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuySubscribeComponent } from './buy-subscribe.component';

describe('BuySubscribeComponent', () => {
  let component: BuySubscribeComponent;
  let fixture: ComponentFixture<BuySubscribeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuySubscribeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuySubscribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
