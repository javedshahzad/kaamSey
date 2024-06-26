import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleListComponent } from './sample-list.component';

describe('SampleListComponent', () => {
  let component: SampleListComponent;
  let fixture: ComponentFixture<SampleListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SampleListComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SampleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
