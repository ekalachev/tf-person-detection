import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html'
})
export class AppComponent implements AfterViewInit {
    @ViewChild('videoElement', { read: ElementRef }) videoElement: ElementRef;

    isStartEnabled: boolean = false;
    isStopEnabled: boolean = false;

    shouldRecord: boolean = false;
    isRecording: boolean = false;

    model: cocoSsd.ObjectDetection;
    records: any[] = [];
    lastDetections: boolean[] = [];
    stream: any;
    recorder: any;

    async ngAfterViewInit(): Promise<void> {
        this.prepareMedia();
    }

    async prepareMedia(): Promise<void> {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: true
                });

                this.stream = stream;
                this.videoElement.nativeElement.srcObject = stream;
                this.isStartEnabled = true;

                this.loadCocoModel();

            } catch (error) {
                console.log(error);
            }
        }
    }

    async loadCocoModel(): Promise<void> {
        this.model = await cocoSsd.load();
    }

    start() {
        this.shouldRecord = true;
        this.isStartEnabled = false;
        this.isStopEnabled = true;
        this.detectFrame();
    }

    stop() {
        this.shouldRecord = false;
        this.isStartEnabled = true;
        this.isStopEnabled = false;
        this.stopRecording();
    }

    async detectFrame() {
        if (!this.shouldRecord) {
            this.stopRecording();
            return;
        }

        const predictions = await this.model.detect(this.videoElement.nativeElement);

        let foundPerson = false;
        predictions.forEach((prediction) => {
            if (prediction.class === 'person') {
                foundPerson = true;
            }
        });

        if (foundPerson) {
            console.log('Found person');
            this.startRecording();
            this.lastDetections.push(true);
        } else if (this.lastDetections.filter(Boolean).length) {
            this.startRecording();
            this.lastDetections.push(false);
        } else {
            this.stopRecording();
        }

        this.lastDetections = this.lastDetections.slice(
            Math.max(this.lastDetections.length - 10, 0)
        );

        requestAnimationFrame(() => {
            this.detectFrame();
        });
    }

    async startRecording() {
        if (this.isRecording) {
            return;
        }

        this.isRecording = true;
        console.log("Start recording");

        this.recorder = new MediaRecorder(this.stream);

        this.recorder.ondataavailable = (e: any) => {
            const title = new Date() + '';
            const href = URL.createObjectURL(e.data);
            this.records.push({ href, title });
        }

        this.recorder.start();
    }

    stopRecording() {
        if (!this.isRecording) {
            return;
        }

        this.isRecording = false;
        this.recorder.stop();
        console.log("Stopped recording");
        this.lastDetections = [];
    }
}