import { TestBed } from '@angular/core/testing';
import { TimestampService } from './timestamp.service';

describe('TimestampService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TimestampService = TestBed.get(TimestampService);
    expect(service).toBeTruthy();
  });
});
