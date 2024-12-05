import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audio-recorder.component.html',
  styleUrl: './audio-recorder.component.scss'
})
export class AudioRecorderComponent {
    @ViewChild('audioElement', { static: false }) audioElement!: ElementRef<HTMLAudioElement>;
  
    private chunks: Blob[] = [];
    private mediaRecorder: MediaRecorder | null = null;
    audioBlob!: Blob;
    audioBlobUrl: string = '';
    isRecording = false;
  
    trimStart = 0;
    trimEnd = 0;
    trimmedAudioBlobUrl: string = '';
  
    constructor (
      private cdr: ChangeDetectorRef
    ){

    }

    startRecording() {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.mediaRecorder = new MediaRecorder(stream);
          this.mediaRecorder.ondataavailable = (event) => {
            this.chunks.push(event.data);
          };
          this.mediaRecorder.onstop = () => {
            this.audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
            this.audioBlobUrl = URL.createObjectURL(this.audioBlob);
            this.chunks = [];
          };
          this.mediaRecorder.start();
          this.isRecording = true;
        })
        .catch(error => console.error('Error accessing microphone:', error));
    }
  
    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.isRecording = false;
    
        // Ensure the onstop event triggers change detection
        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
          this.audioBlobUrl = URL.createObjectURL(this.audioBlob);
          this.chunks = [];
          this.cdr.detectChanges();
        };
      }
    }
  
    trimAudio() {
      if (!this.audioBlob || this.trimStart >= this.trimEnd) {
        console.error('Invalid trim range or no audio available.');
        return;
      }
  
      const audioContext = new AudioContext();
      const fileReader = new FileReader();
  
      fileReader.onload = async () => {
        const arrayBuffer = fileReader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
        const startSample = Math.floor(this.trimStart * audioBuffer.sampleRate);
        const endSample = Math.floor(this.trimEnd * audioBuffer.sampleRate);
        const trimmedLength = endSample - startSample;
  
        if (trimmedLength <= 0) {
          console.error('Invalid trim range.');
          return;
        }
  
        const trimmedAudioBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          trimmedLength,
          audioBuffer.sampleRate
        );
  
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          const channelData = audioBuffer.getChannelData(i);
          trimmedAudioBuffer.copyToChannel(channelData.slice(startSample, endSample), i);
        }
  
        const trimmedBlob = await this.encodeAudioBuffer(trimmedAudioBuffer, audioContext);
        this.trimmedAudioBlobUrl = URL.createObjectURL(trimmedBlob);
      };
  
      fileReader.readAsArrayBuffer(this.audioBlob);
      this.cdr.detectChanges();

    }
  
    private async encodeAudioBuffer(audioBuffer: AudioBuffer, audioContext: AudioContext): Promise<Blob> {
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
  
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
  
      const renderedBuffer = await offlineContext.startRendering();
      const wavBlob = this.audioBufferToWav(renderedBuffer);
      return new Blob([wavBlob], { type: 'audio/wav' });
    }
  
    private audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
      const numOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length * numOfChannels * 2 + 44;
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
  
      this.writeWavHeader(view, numOfChannels, sampleRate, length - 44);
  
      let offset = 44;
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const channel = audioBuffer.getChannelData(i);
        for (let j = 0; j < channel.length; j++) {
          view.setInt16(offset, channel[j] * 0x7FFF, true);
          offset += 2;
        }
      }
      return buffer;
    }
  
    private writeWavHeader(view: DataView, numOfChannels: number, sampleRate: number, dataSize: number) {
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + dataSize, true);
      view.setUint32(8, 0x57415645, false); // "WAVE"
      view.setUint32(12, 0x666D7420, false); // "fmt "
      view.setUint32(16, 16, true); // PCM chunk size
      view.setUint16(20, 1, true); // Audio format (1 for PCM)
      view.setUint16(22, numOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numOfChannels * 2, true);
      view.setUint16(32, numOfChannels * 2, true);
      view.setUint16(34, 16, true); // Bits per sample
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, dataSize, true);
    }
  }