import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoRecorderComponent } from './video-recorder.component';

describe('VideoRecorderComponent', () => {
  let component: VideoRecorderComponent;
  let fixture: ComponentFixture<VideoRecorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoRecorderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoRecorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
