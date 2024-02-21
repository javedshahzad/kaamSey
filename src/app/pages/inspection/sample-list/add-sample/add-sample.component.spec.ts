import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSampleComponent } from './add-sample.component';

describe('AddSampleComponent', () => {
  let component: AddSampleComponent;
  let fixture: ComponentFixture<AddSampleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSampleComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
