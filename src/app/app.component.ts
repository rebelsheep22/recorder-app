import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VideoRecorderComponent } from './video-recorder/video-recorder.component';
import { AudioRecorderComponent } from './audio-recorder/audio-recorder.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VideoRecorderComponent,AudioRecorderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'recorder-app';
}
