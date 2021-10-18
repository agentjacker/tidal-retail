import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDepostComponent } from './buy-depost.component';

describe('BuyDepostComponent', () => {
  let component: BuyDepostComponent;
  let fixture: ComponentFixture<BuyDepostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyDepostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDepostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
