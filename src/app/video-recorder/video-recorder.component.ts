import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-video-recorder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-recorder.component.html',
  styleUrl: './video-recorder.component.scss'
})
export class VideoRecorderComponent {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  videoURL: string = '';
  isRecording = false;
  private stream: MediaStream | null = null;

  ngAfterViewInit() {
    this.startCameraFeed();
  }

  startCameraFeed() {
    const videoElement = document.getElementById('camera-feed') as HTMLVideoElement;

    // Request video and audio streams
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.stream = stream;
        videoElement.srcObject = stream;
        videoElement.muted = true;
        videoElement.play();
      })
      .catch(error => {
        console.error('Error accessing camera and microphone:', error);
      });
  }

  startRecording() {
    if (!this.stream) return;

    // MediaRecorder for video with audio
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (event) => {
      this.chunks.push(event.data);
    };
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'video/webm' });
      this.videoURL = URL.createObjectURL(blob);
      this.chunks = [];
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  ngOnDestroy() {
    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}