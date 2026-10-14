import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PledgeComponent } from './pledge.component';

describe('PledgeComponent', () => {
  let component: PledgeComponent;
  let fixture: ComponentFixture<PledgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PledgeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PledgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
