import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileHeadComponent } from './mobile-head.component';

describe('MobileHeadComponent', () => {
  let component: MobileHeadComponent;
  let fixture: ComponentFixture<MobileHeadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MobileHeadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MobileHeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
