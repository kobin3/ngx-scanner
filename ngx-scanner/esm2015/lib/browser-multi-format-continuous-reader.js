/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
/// <reference path="./image-capture.d.ts" />
/// <reference path="./image-capture.d.ts" />
import { BrowserMultiFormatReader, ChecksumException, FormatException, NotFoundException } from '@zxing/library';
import { BehaviorSubject } from 'rxjs';
/**
 * Based on zxing-typescript BrowserCodeReader
 */
export class BrowserMultiFormatContinuousReader extends BrowserMultiFormatReader {
    constructor() {
        super(...arguments);
        /**
         * Says if there's a torch available for the current device.
         */
        this._isTorchAvailable = new BehaviorSubject(undefined);
    }
    /**
     * Exposes _tochAvailable .
     * @return {?}
     */
    get isTorchAvailable() {
        return this._isTorchAvailable.asObservable();
    }
    /**
     * Starts the decoding from the current or a new video element.
     *
     * @param {?=} deviceId The device's to be used Id
     * @param {?=} videoSource A new video element
     * @return {?}
     */
    continuousDecodeFromInputVideoDevice(deviceId, videoSource) {
        this.reset();
        // Keeps the deviceId between scanner resets.
        if (typeof deviceId !== 'undefined') {
            this.deviceId = deviceId;
        }
        if (typeof navigator === 'undefined') {
            return;
        }
        /** @type {?} */
        const scan$ = new BehaviorSubject({});
        try {
            // this.decodeFromInputVideoDeviceContinuously(deviceId, videoSource, (result, error) => scan$.next({ result, error }));
            this.getStreamForDevice({ deviceId })
                .then(stream => this.attachStreamToVideoAndCheckTorch(stream, videoSource))
                .then(videoElement => this.decodeOnSubject(scan$, videoElement, this.timeBetweenScansMillis));
        }
        catch (e) {
            scan$.error(e);
        }
        this._setScanStream(scan$);
        // @todo Find a way to emit a complete event on the scan stream once it's finished.
        return scan$.asObservable();
    }
    /**
     * Gets the media stream for certain device.
     * Falls back to any available device if no `deviceId` is defined.
     * @param {?} __0
     * @return {?}
     */
    getStreamForDevice({ deviceId }) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const constraints = this.getUserMediaConstraints(deviceId);
            /** @type {?} */
            const stream = yield navigator.mediaDevices.getUserMedia(constraints);
            return stream;
        });
    }
    /**
     * Creates media steram constraints for certain `deviceId`.
     * Falls back to any environment available device if no `deviceId` is defined.
     * @param {?} deviceId
     * @return {?}
     */
    getUserMediaConstraints(deviceId) {
        /** @type {?} */
        const video = typeof deviceId === 'undefined'
            ? { facingMode: { exact: 'environment' } }
            : { deviceId: { exact: deviceId } };
        /** @type {?} */
        const constraints = { video };
        return constraints;
    }
    /**
     * Enables and disables the device torch.
     * @param {?} on
     * @return {?}
     */
    setTorch(on) {
        if (!this._isTorchAvailable.value) {
            // compatibility not checked yet
            return;
        }
        /** @type {?} */
        const tracks = this.getVideoTracks(this.stream);
        if (on) {
            this.applyTorchOnTracks(tracks, true);
        }
        else {
            this.applyTorchOnTracks(tracks, false);
            // @todo check possibility to disable torch without restart
            this.restart();
        }
    }
    /**
     * Update the torch compatibility state and attachs the stream to the preview element.
     * @param {?} stream
     * @param {?} videoSource
     * @return {?}
     */
    attachStreamToVideoAndCheckTorch(stream, videoSource) {
        this.updateTorchCompatibility(stream);
        return this.attachStreamToVideo(stream, videoSource);
    }
    /**
     * Checks if the stream supports torch control.
     *
     * @param {?} stream The media stream used to check.
     * @return {?}
     */
    updateTorchCompatibility(stream) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const tracks = this.getVideoTracks(stream);
            for (const track of tracks) {
                if (yield this.isTorchCompatible(track)) {
                    this._isTorchAvailable.next(true);
                    break;
                }
            }
        });
    }
    /**
     *
     * @param {?} stream The video stream where the tracks gonna be extracted from.
     * @return {?}
     */
    getVideoTracks(stream) {
        /** @type {?} */
        let tracks = [];
        try {
            tracks = stream.getVideoTracks();
        }
        finally {
            return tracks || [];
        }
    }
    /**
     *
     * @param {?} track The track that will be checked for compatibility.
     * @return {?}
     */
    isTorchCompatible(track) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            let compatible = false;
            try {
                /** @type {?} */
                const imageCapture = new ImageCapture(track);
                /** @type {?} */
                const capabilities = yield imageCapture.getPhotoCapabilities();
                compatible = !!capabilities['torch'] || ('fillLightMode' in capabilities && capabilities.fillLightMode.length !== 0);
            }
            finally {
                return compatible;
            }
        });
    }
    /**
     * Apply the torch setting in all received tracks.
     * @param {?} tracks
     * @param {?} state
     * @return {?}
     */
    applyTorchOnTracks(tracks, state) {
        tracks.forEach(track => track.applyConstraints({
            advanced: [(/** @type {?} */ ({ torch: state, fillLightMode: state ? 'torch' : 'none' }))]
        }));
    }
    /**
     * Correctly sets a new scanStream value.
     * @param {?} scan$
     * @return {?}
     */
    _setScanStream(scan$) {
        // cleans old stream
        this._cleanScanStream();
        // sets new stream
        this.scanStream = scan$;
    }
    /**
     * Cleans any old scan stream value.
     * @return {?}
     */
    _cleanScanStream() {
        if (this.scanStream && !this.scanStream.isStopped) {
            this.scanStream.complete();
        }
        this.scanStream = null;
    }
    /**
     * Decodes values in a stream with delays between scans.
     *
     * @param {?} scan$ The subject to receive the values.
     * @param {?} videoElement The video element the decode will be applied.
     * @param {?} delay The delay between decode results.
     * @return {?}
     */
    decodeOnSubject(scan$, videoElement, delay) {
        // stops loop
        if (scan$.isStopped) {
            return;
        }
        /** @type {?} */
        let result;
        try {
            result = this.decode(videoElement);
            scan$.next({ result });
        }
        catch (error) {
            // stream cannot stop on fails.
            if (!error ||
                // scan Failure - found nothing, no error
                error instanceof NotFoundException ||
                // scan Error - found the QR but got error on decoding
                error instanceof ChecksumException ||
                error instanceof FormatException) {
                scan$.next({ error });
            }
            else {
                scan$.error(error);
            }
        }
        finally {
            /** @type {?} */
            const timeout = !result ? 0 : delay;
            setTimeout(() => this.decodeOnSubject(scan$, videoElement, delay), timeout);
        }
    }
    /**
     * Restarts the scanner.
     * @return {?}
     */
    restart() {
        // reset
        // start
        return this.continuousDecodeFromInputVideoDevice(this.deviceId, this.videoElement);
    }
}
if (false) {
    /**
     * Says if there's a torch available for the current device.
     * @type {?}
     */
    BrowserMultiFormatContinuousReader.prototype._isTorchAvailable;
    /**
     * The device id of the current media device.
     * @type {?}
     */
    BrowserMultiFormatContinuousReader.prototype.deviceId;
    /**
     * If there's some scan stream open, it shal be here.
     * @type {?}
     */
    BrowserMultiFormatContinuousReader.prototype.scanStream;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXIuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aenhpbmcvbmd4LXNjYW5uZXIvIiwic291cmNlcyI6WyJsaWIvYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw2Q0FBNkM7O0FBRTdDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQVUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6SCxPQUFPLEVBQUUsZUFBZSxFQUFjLE1BQU0sTUFBTSxDQUFDOzs7O0FBTW5ELE1BQU0sT0FBTyxrQ0FBbUMsU0FBUSx3QkFBd0I7SUFBaEY7Ozs7O1FBWVUsc0JBQWlCLEdBQUcsSUFBSSxlQUFlLENBQVUsU0FBUyxDQUFDLENBQUM7SUEyT3RFLENBQUM7Ozs7O0lBbFBDLElBQVcsZ0JBQWdCO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksRUFBRSxDQUFDO0lBQy9DLENBQUM7Ozs7Ozs7O0lBd0JNLG9DQUFvQyxDQUN6QyxRQUFpQixFQUNqQixXQUE4QjtRQUc5QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFYiw2Q0FBNkM7UUFDN0MsSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7WUFDbkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7U0FDMUI7UUFFRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsRUFBRTtZQUNwQyxPQUFPO1NBQ1I7O2NBRUssS0FBSyxHQUFHLElBQUksZUFBZSxDQUFpQixFQUFFLENBQUM7UUFFckQsSUFBSTtZQUNGLHdIQUF3SDtZQUN4SCxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQztpQkFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFD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QUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztTQUN4QjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ2QsK0JBQStCO1lBQy9CLElBQ0UsQ0FBQyxLQUFLO2dCQUNOLHlDQUF5QztnQkFDekMsS0FBSyxZQUFZLGlCQUFpQjtnQkFDbEMsc0RBQXNEO2dCQUN0RCxLQUFLLFlBQVksaUJBQWlCO2dCQUNsQyxLQUFLLFlBQVksZUFBZSxFQUNoQztnQkFDQSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQzthQUN2QjtpQkFBTTtnQkFDTCxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3BCO1NBQ0Y7Z0JBQVM7O2tCQUNGLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLO1lBQ25DLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDN0U7SUFDSCxDQUFDOzs7OztJQUtPLE9BQU87UUFDYixRQUFRO1FBQ1IsUUFBUTtRQUNSLE9BQU8sSUFBSSxDQUFDLG9DQUFvQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3JGLENBQUM7Q0FFRjs7Ozs7O0lBM09DLCtEQUFvRTs7Ozs7SUFLcEUsc0RBQXlCOzs7OztJQUt6Qix3REFBb0QiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9pbWFnZS1jYXB0dXJlLmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgQnJvd3Nlck11bHRpRm9ybWF0UmVhZGVyLCBDaGVja3N1bUV4Y2VwdGlvbiwgRm9ybWF0RXhjZXB0aW9uLCBOb3RGb3VuZEV4Y2VwdGlvbiwgUmVzdWx0IH0gZnJvbSAnQHp4aW5nL2xpYnJhcnknO1xyXG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgUmVzdWx0QW5kRXJyb3IgfSBmcm9tICcuL1Jlc3VsdEFuZEVycm9yJztcclxuXHJcbi8qKlxyXG4gKiBCYXNlZCBvbiB6eGluZy10eXBlc2NyaXB0IEJyb3dzZXJDb2RlUmVhZGVyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQnJvd3Nlck11bHRpRm9ybWF0Q29udGludW91c1JlYWRlciBleHRlbmRzIEJyb3dzZXJNdWx0aUZvcm1hdFJlYWRlciB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4cG9zZXMgX3RvY2hBdmFpbGFibGUgLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgaXNUb3JjaEF2YWlsYWJsZSgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLl9pc1RvcmNoQXZhaWxhYmxlLmFzT2JzZXJ2YWJsZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2F5cyBpZiB0aGVyZSdzIGEgdG9yY2ggYXZhaWxhYmxlIGZvciB0aGUgY3VycmVudCBkZXZpY2UuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfaXNUb3JjaEF2YWlsYWJsZSA9IG5ldyBCZWhhdmlvclN1YmplY3Q8Ym9vbGVhbj4odW5kZWZpbmVkKTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGRldmljZSBpZCBvZiB0aGUgY3VycmVudCBtZWRpYSBkZXZpY2UuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBkZXZpY2VJZDogc3RyaW5nO1xyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGVyZSdzIHNvbWUgc2NhbiBzdHJlYW0gb3BlbiwgaXQgc2hhbCBiZSBoZXJlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgc2NhblN0cmVhbTogQmVoYXZpb3JTdWJqZWN0PFJlc3VsdEFuZEVycm9yPjtcclxuXHJcbiAgLyoqXHJcbiAgICogU3RhcnRzIHRoZSBkZWNvZGluZyBmcm9tIHRoZSBjdXJyZW50IG9yIGEgbmV3IHZpZGVvIGVsZW1lbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2FsbGJhY2tGbiBUaGUgY2FsbGJhY2sgdG8gYmUgZXhlY3V0ZWQgYWZ0ZXIgZXZlcnkgc2NhbiBhdHRlbXB0XHJcbiAgICogQHBhcmFtIGRldmljZUlkIFRoZSBkZXZpY2UncyB0byBiZSB1c2VkIElkXHJcbiAgICogQHBhcmFtIHZpZGVvU291cmNlIEEgbmV3IHZpZGVvIGVsZW1lbnRcclxuICAgKi9cclxuICBwdWJsaWMgY29udGludW91c0RlY29kZUZyb21JbnB1dFZpZGVvRGV2aWNlKFxyXG4gICAgZGV2aWNlSWQ/OiBzdHJpbmcsXHJcbiAgICB2aWRlb1NvdXJjZT86IEhUTUxWaWRlb0VsZW1lbnRcclxuICApOiBPYnNlcnZhYmxlPFJlc3VsdEFuZEVycm9yPiB7XHJcblxyXG4gICAgdGhpcy5yZXNldCgpO1xyXG5cclxuICAgIC8vIEtlZXBzIHRoZSBkZXZpY2VJZCBiZXR3ZWVuIHNjYW5uZXIgcmVzZXRzLlxyXG4gICAgaWYgKHR5cGVvZiBkZXZpY2VJZCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgdGhpcy5kZXZpY2VJZCA9IGRldmljZUlkO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2NhbiQgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PFJlc3VsdEFuZEVycm9yPih7fSk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gdGhpcy5kZWNvZGVGcm9tSW5wdXRWaWRlb0RldmljZUNvbnRpbnVvdXNseShkZXZpY2VJZCwgdmlkZW9Tb3VyY2UsIChyZXN1bHQsIGVycm9yKSA9PiBzY2FuJC5uZXh0KHsgcmVzdWx0LCBlcnJvciB9KSk7XHJcbiAgICAgIHRoaXMuZ2V0U3RyZWFtRm9yRGV2aWNlKHsgZGV2aWNlSWQgfSlcclxuICAgICAgICAudGhlbihzdHJlYW0gPT4gdGhpcy5hdHRhY2hTdHJlYW1Ub1ZpZGVvQW5kQ2hlY2tUb3JjaChzdHJlYW0sIHZpZGVvU291cmNlKSlcclxuICAgICAgICAudGhlbih2aWRlb0VsZW1lbnQgPT4gdGhpcy5kZWNvZGVPblN1YmplY3Qoc2NhbiQsIHZpZGVvRWxlbWVudCwgdGhpcy50aW1lQmV0d2VlblNjYW5zTWlsbGlzKSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHNjYW4kLmVycm9yKGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3NldFNjYW5TdHJlYW0oc2NhbiQpO1xyXG5cclxuICAgIC8vIEB0b2RvIEZpbmQgYSB3YXkgdG8gZW1pdCBhIGNvbXBsZXRlIGV2ZW50IG9uIHRoZSBzY2FuIHN0cmVhbSBvbmNlIGl0J3MgZmluaXNoZWQuXHJcblxyXG4gICAgcmV0dXJuIHNjYW4kLmFzT2JzZXJ2YWJsZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbWVkaWEgc3RyZWFtIGZvciBjZXJ0YWluIGRldmljZS5cclxuICAgKiBGYWxscyBiYWNrIHRvIGFueSBhdmFpbGFibGUgZGV2aWNlIGlmIG5vIGBkZXZpY2VJZGAgaXMgZGVmaW5lZC5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgZ2V0U3RyZWFtRm9yRGV2aWNlKHsgZGV2aWNlSWQgfTogUGFydGlhbDxNZWRpYURldmljZUluZm8+KTogUHJvbWlzZTxNZWRpYVN0cmVhbT4ge1xyXG4gICAgY29uc3QgY29uc3RyYWludHMgPSB0aGlzLmdldFVzZXJNZWRpYUNvbnN0cmFpbnRzKGRldmljZUlkKTtcclxuICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKGNvbnN0cmFpbnRzKTtcclxuICAgIHJldHVybiBzdHJlYW07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIG1lZGlhIHN0ZXJhbSBjb25zdHJhaW50cyBmb3IgY2VydGFpbiBgZGV2aWNlSWRgLlxyXG4gICAqIEZhbGxzIGJhY2sgdG8gYW55IGVudmlyb25tZW50IGF2YWlsYWJsZSBkZXZpY2UgaWYgbm8gYGRldmljZUlkYCBpcyBkZWZpbmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRVc2VyTWVkaWFDb25zdHJhaW50cyhkZXZpY2VJZDogc3RyaW5nKTogTWVkaWFTdHJlYW1Db25zdHJhaW50cyB7XHJcblxyXG4gICAgY29uc3QgdmlkZW8gPSB0eXBlb2YgZGV2aWNlSWQgPT09ICd1bmRlZmluZWQnXHJcbiAgICAgID8geyBmYWNpbmdNb2RlOiB7IGV4YWN0OiAnZW52aXJvbm1lbnQnIH0gfVxyXG4gICAgICA6IHsgZGV2aWNlSWQ6IHsgZXhhY3Q6IGRldmljZUlkIH0gfTtcclxuXHJcbiAgICBjb25zdCBjb25zdHJhaW50czogTWVkaWFTdHJlYW1Db25zdHJhaW50cyA9IHsgdmlkZW8gfTtcclxuXHJcbiAgICByZXR1cm4gY29uc3RyYWludHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbmFibGVzIGFuZCBkaXNhYmxlcyB0aGUgZGV2aWNlIHRvcmNoLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb3JjaChvbjogYm9vbGVhbik6IHZvaWQge1xyXG5cclxuICAgIGlmICghdGhpcy5faXNUb3JjaEF2YWlsYWJsZS52YWx1ZSkge1xyXG4gICAgICAvLyBjb21wYXRpYmlsaXR5IG5vdCBjaGVja2VkIHlldFxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdHJhY2tzID0gdGhpcy5nZXRWaWRlb1RyYWNrcyh0aGlzLnN0cmVhbSk7XHJcblxyXG4gICAgaWYgKG9uKSB7XHJcbiAgICAgIHRoaXMuYXBwbHlUb3JjaE9uVHJhY2tzKHRyYWNrcywgdHJ1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmFwcGx5VG9yY2hPblRyYWNrcyh0cmFja3MsIGZhbHNlKTtcclxuICAgICAgLy8gQHRvZG8gY2hlY2sgcG9zc2liaWxpdHkgdG8gZGlzYWJsZSB0b3JjaCB3aXRob3V0IHJlc3RhcnRcclxuICAgICAgdGhpcy5yZXN0YXJ0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGUgdGhlIHRvcmNoIGNvbXBhdGliaWxpdHkgc3RhdGUgYW5kIGF0dGFjaHMgdGhlIHN0cmVhbSB0byB0aGUgcHJldmlldyBlbGVtZW50LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXR0YWNoU3RyZWFtVG9WaWRlb0FuZENoZWNrVG9yY2goc3RyZWFtOiBNZWRpYVN0cmVhbSwgdmlkZW9Tb3VyY2U6IEhUTUxWaWRlb0VsZW1lbnQpOiBQcm9taXNlPEhUTUxWaWRlb0VsZW1lbnQ+IHtcclxuICAgIHRoaXMudXBkYXRlVG9yY2hDb21wYXRpYmlsaXR5KHN0cmVhbSk7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRhY2hTdHJlYW1Ub1ZpZGVvKHN0cmVhbSwgdmlkZW9Tb3VyY2UpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIGlmIHRoZSBzdHJlYW0gc3VwcG9ydHMgdG9yY2ggY29udHJvbC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdHJlYW0gVGhlIG1lZGlhIHN0cmVhbSB1c2VkIHRvIGNoZWNrLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlVG9yY2hDb21wYXRpYmlsaXR5KHN0cmVhbTogTWVkaWFTdHJlYW0pOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgICBjb25zdCB0cmFja3MgPSB0aGlzLmdldFZpZGVvVHJhY2tzKHN0cmVhbSk7XHJcblxyXG4gICAgZm9yIChjb25zdCB0cmFjayBvZiB0cmFja3MpIHtcclxuICAgICAgaWYgKGF3YWl0IHRoaXMuaXNUb3JjaENvbXBhdGlibGUodHJhY2spKSB7XHJcbiAgICAgICAgdGhpcy5faXNUb3JjaEF2YWlsYWJsZS5uZXh0KHRydWUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdHJlYW0gVGhlIHZpZGVvIHN0cmVhbSB3aGVyZSB0aGUgdHJhY2tzIGdvbm5hIGJlIGV4dHJhY3RlZCBmcm9tLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0VmlkZW9UcmFja3Moc3RyZWFtOiBNZWRpYVN0cmVhbSkge1xyXG4gICAgbGV0IHRyYWNrcyA9IFtdO1xyXG4gICAgdHJ5IHtcclxuICAgICAgdHJhY2tzID0gc3RyZWFtLmdldFZpZGVvVHJhY2tzKCk7XHJcbiAgICB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgcmV0dXJuIHRyYWNrcyB8fCBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHRyYWNrIFRoZSB0cmFjayB0aGF0IHdpbGwgYmUgY2hlY2tlZCBmb3IgY29tcGF0aWJpbGl0eS5cclxuICAgKi9cclxuICBwcml2YXRlIGFzeW5jIGlzVG9yY2hDb21wYXRpYmxlKHRyYWNrOiBNZWRpYVN0cmVhbVRyYWNrKSB7XHJcblxyXG4gICAgbGV0IGNvbXBhdGlibGUgPSBmYWxzZTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbWFnZUNhcHR1cmUgPSBuZXcgSW1hZ2VDYXB0dXJlKHRyYWNrKTtcclxuICAgICAgY29uc3QgY2FwYWJpbGl0aWVzID0gYXdhaXQgaW1hZ2VDYXB0dXJlLmdldFBob3RvQ2FwYWJpbGl0aWVzKCk7XHJcbiAgICAgIGNvbXBhdGlibGUgPSAhIWNhcGFiaWxpdGllc1sndG9yY2gnXSB8fCAoJ2ZpbGxMaWdodE1vZGUnIGluIGNhcGFiaWxpdGllcyAmJiBjYXBhYmlsaXRpZXMuZmlsbExpZ2h0TW9kZS5sZW5ndGggIT09IDApO1xyXG4gICAgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgIHJldHVybiBjb21wYXRpYmxlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwbHkgdGhlIHRvcmNoIHNldHRpbmcgaW4gYWxsIHJlY2VpdmVkIHRyYWNrcy5cclxuICAgKi9cclxuICBwcml2YXRlIGFwcGx5VG9yY2hPblRyYWNrcyh0cmFja3M6IE1lZGlhU3RyZWFtVHJhY2tbXSwgc3RhdGU6IGJvb2xlYW4pIHtcclxuICAgIHRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHRyYWNrLmFwcGx5Q29uc3RyYWludHMoe1xyXG4gICAgICBhZHZhbmNlZDogWzxhbnk+eyB0b3JjaDogc3RhdGUsIGZpbGxMaWdodE1vZGU6IHN0YXRlID8gJ3RvcmNoJyA6ICdub25lJyB9XVxyXG4gICAgfSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29ycmVjdGx5IHNldHMgYSBuZXcgc2NhblN0cmVhbSB2YWx1ZS5cclxuICAgKi9cclxuICBwcml2YXRlIF9zZXRTY2FuU3RyZWFtKHNjYW4kOiBCZWhhdmlvclN1YmplY3Q8UmVzdWx0QW5kRXJyb3I+KTogdm9pZCB7XHJcbiAgICAvLyBjbGVhbnMgb2xkIHN0cmVhbVxyXG4gICAgdGhpcy5fY2xlYW5TY2FuU3RyZWFtKCk7XHJcbiAgICAvLyBzZXRzIG5ldyBzdHJlYW1cclxuICAgIHRoaXMuc2NhblN0cmVhbSA9IHNjYW4kO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYW5zIGFueSBvbGQgc2NhbiBzdHJlYW0gdmFsdWUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfY2xlYW5TY2FuU3RyZWFtKCk6IHZvaWQge1xyXG5cclxuICAgIGlmICh0aGlzLnNjYW5TdHJlYW0gJiYgIXRoaXMuc2NhblN0cmVhbS5pc1N0b3BwZWQpIHtcclxuICAgICAgdGhpcy5zY2FuU3RyZWFtLmNvbXBsZXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zY2FuU3RyZWFtID0gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlY29kZXMgdmFsdWVzIGluIGEgc3RyZWFtIHdpdGggZGVsYXlzIGJldHdlZW4gc2NhbnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc2NhbiQgVGhlIHN1YmplY3QgdG8gcmVjZWl2ZSB0aGUgdmFsdWVzLlxyXG4gICAqIEBwYXJhbSB2aWRlb0VsZW1lbnQgVGhlIHZpZGVvIGVsZW1lbnQgdGhlIGRlY29kZSB3aWxsIGJlIGFwcGxpZWQuXHJcbiAgICogQHBhcmFtIGRlbGF5IFRoZSBkZWxheSBiZXR3ZWVuIGRlY29kZSByZXN1bHRzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZGVjb2RlT25TdWJqZWN0KHNjYW4kOiBCZWhhdmlvclN1YmplY3Q8UmVzdWx0QW5kRXJyb3I+LCB2aWRlb0VsZW1lbnQ6IEhUTUxWaWRlb0VsZW1lbnQsIGRlbGF5OiBudW1iZXIpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBzdG9wcyBsb29wXHJcbiAgICBpZiAoc2NhbiQuaXNTdG9wcGVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVzdWx0OiBSZXN1bHQ7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgcmVzdWx0ID0gdGhpcy5kZWNvZGUodmlkZW9FbGVtZW50KTtcclxuICAgICAgc2NhbiQubmV4dCh7IHJlc3VsdCB9KTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIC8vIHN0cmVhbSBjYW5ub3Qgc3RvcCBvbiBmYWlscy5cclxuICAgICAgaWYgKFxyXG4gICAgICAgICFlcnJvciB8fFxyXG4gICAgICAgIC8vIHNjYW4gRmFpbHVyZSAtIGZvdW5kIG5vdGhpbmcsIG5vIGVycm9yXHJcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBOb3RGb3VuZEV4Y2VwdGlvbiB8fFxyXG4gICAgICAgIC8vIHNjYW4gRXJyb3IgLSBmb3VuZCB0aGUgUVIgYnV0IGdvdCBlcnJvciBvbiBkZWNvZGluZ1xyXG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgQ2hlY2tzdW1FeGNlcHRpb24gfHxcclxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEZvcm1hdEV4Y2VwdGlvblxyXG4gICAgICApIHtcclxuICAgICAgICBzY2FuJC5uZXh0KHsgZXJyb3IgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2NhbiQuZXJyb3IoZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBjb25zdCB0aW1lb3V0ID0gIXJlc3VsdCA/IDAgOiBkZWxheTtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmRlY29kZU9uU3ViamVjdChzY2FuJCwgdmlkZW9FbGVtZW50LCBkZWxheSksIHRpbWVvdXQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGFydHMgdGhlIHNjYW5uZXIuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSByZXN0YXJ0KCk6IE9ic2VydmFibGU8UmVzdWx0QW5kRXJyb3I+IHtcclxuICAgIC8vIHJlc2V0XHJcbiAgICAvLyBzdGFydFxyXG4gICAgcmV0dXJuIHRoaXMuY29udGludW91c0RlY29kZUZyb21JbnB1dFZpZGVvRGV2aWNlKHRoaXMuZGV2aWNlSWQsIHRoaXMudmlkZW9FbGVtZW50KTtcclxuICB9XHJcblxyXG59XHJcbiJdfQ==