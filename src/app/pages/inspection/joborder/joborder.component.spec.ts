import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { JoborderComponent } from './joborder.component';

describe('JoborderComponent', () => {
  let component: JoborderComponent;
  let fixture: ComponentFixture<JoborderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoborderComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoborderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
