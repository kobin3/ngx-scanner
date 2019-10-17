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
var /**
 * Based on zxing-typescript BrowserCodeReader
 */
BrowserMultiFormatContinuousReader = /** @class */ (function (_super) {
    tslib_1.__extends(BrowserMultiFormatContinuousReader, _super);
    function BrowserMultiFormatContinuousReader() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Says if there's a torch available for the current device.
         */
        _this._isTorchAvailable = new BehaviorSubject(undefined);
        return _this;
    }
    Object.defineProperty(BrowserMultiFormatContinuousReader.prototype, "isTorchAvailable", {
        /**
         * Exposes _tochAvailable .
         */
        get: /**
         * Exposes _tochAvailable .
         * @return {?}
         */
        function () {
            return this._isTorchAvailable.asObservable();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Starts the decoding from the current or a new video element.
     *
     * @param callbackFn The callback to be executed after every scan attempt
     * @param deviceId The device's to be used Id
     * @param videoSource A new video element
     */
    /**
     * Starts the decoding from the current or a new video element.
     *
     * @param {?=} deviceId The device's to be used Id
     * @param {?=} videoSource A new video element
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.continuousDecodeFromInputVideoDevice = /**
     * Starts the decoding from the current or a new video element.
     *
     * @param {?=} deviceId The device's to be used Id
     * @param {?=} videoSource A new video element
     * @return {?}
     */
    function (deviceId, videoSource) {
        var _this = this;
        this.reset();
        // Keeps the deviceId between scanner resets.
        if (typeof deviceId !== 'undefined') {
            this.deviceId = deviceId;
        }
        if (typeof navigator === 'undefined') {
            return;
        }
        /** @type {?} */
        var scan$ = new BehaviorSubject({});
        try {
            // this.decodeFromInputVideoDeviceContinuously(deviceId, videoSource, (result, error) => scan$.next({ result, error }));
            this.getStreamForDevice({ deviceId: deviceId })
                .then(function (stream) { return _this.attachStreamToVideoAndCheckTorch(stream, videoSource); })
                .then(function (videoElement) { return _this.decodeOnSubject(scan$, videoElement, _this.timeBetweenScansMillis); });
        }
        catch (e) {
            scan$.error(e);
        }
        this._setScanStream(scan$);
        // @todo Find a way to emit a complete event on the scan stream once it's finished.
        return scan$.asObservable();
    };
    /**
     * Gets the media stream for certain device.
     * Falls back to any available device if no `deviceId` is defined.
     */
    /**
     * Gets the media stream for certain device.
     * Falls back to any available device if no `deviceId` is defined.
     * @param {?} __0
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.getStreamForDevice = /**
     * Gets the media stream for certain device.
     * Falls back to any available device if no `deviceId` is defined.
     * @param {?} __0
     * @return {?}
     */
    function (_a) {
        var deviceId = _a.deviceId;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var constraints, stream;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        constraints = this.getUserMediaConstraints(deviceId);
                        return [4 /*yield*/, navigator.mediaDevices.getUserMedia(constraints)];
                    case 1:
                        stream = _b.sent();
                        return [2 /*return*/, stream];
                }
            });
        });
    };
    /**
     * Creates media steram constraints for certain `deviceId`.
     * Falls back to any environment available device if no `deviceId` is defined.
     */
    /**
     * Creates media steram constraints for certain `deviceId`.
     * Falls back to any environment available device if no `deviceId` is defined.
     * @param {?} deviceId
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.getUserMediaConstraints = /**
     * Creates media steram constraints for certain `deviceId`.
     * Falls back to any environment available device if no `deviceId` is defined.
     * @param {?} deviceId
     * @return {?}
     */
    function (deviceId) {
        /** @type {?} */
        var video = typeof deviceId === 'undefined'
            ? { facingMode: { exact: 'environment' } }
            : { deviceId: { exact: deviceId } };
        /** @type {?} */
        var constraints = { video: video };
        return constraints;
    };
    /**
     * Enables and disables the device torch.
     */
    /**
     * Enables and disables the device torch.
     * @param {?} on
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.setTorch = /**
     * Enables and disables the device torch.
     * @param {?} on
     * @return {?}
     */
    function (on) {
        if (!this._isTorchAvailable.value) {
            // compatibility not checked yet
            return;
        }
        /** @type {?} */
        var tracks = this.getVideoTracks(this.stream);
        if (on) {
            this.applyTorchOnTracks(tracks, true);
        }
        else {
            this.applyTorchOnTracks(tracks, false);
            // @todo check possibility to disable torch without restart
            this.restart();
        }
    };
    /**
     * Update the torch compatibility state and attachs the stream to the preview element.
     */
    /**
     * Update the torch compatibility state and attachs the stream to the preview element.
     * @param {?} stream
     * @param {?} videoSource
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.attachStreamToVideoAndCheckTorch = /**
     * Update the torch compatibility state and attachs the stream to the preview element.
     * @param {?} stream
     * @param {?} videoSource
     * @return {?}
     */
    function (stream, videoSource) {
        this.updateTorchCompatibility(stream);
        return this.attachStreamToVideo(stream, videoSource);
    };
    /**
     * Checks if the stream supports torch control.
     *
     * @param stream The media stream used to check.
     */
    /**
     * Checks if the stream supports torch control.
     *
     * @param {?} stream The media stream used to check.
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.updateTorchCompatibility = /**
     * Checks if the stream supports torch control.
     *
     * @param {?} stream The media stream used to check.
     * @return {?}
     */
    function (stream) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var e_1, _a, tracks, tracks_1, tracks_1_1, track, e_1_1;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tracks = this.getVideoTracks(stream);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, 7, 8]);
                        tracks_1 = tslib_1.__values(tracks), tracks_1_1 = tracks_1.next();
                        _b.label = 2;
                    case 2:
                        if (!!tracks_1_1.done) return [3 /*break*/, 5];
                        track = tracks_1_1.value;
                        return [4 /*yield*/, this.isTorchCompatible(track)];
                    case 3:
                        if (_b.sent()) {
                            this._isTorchAvailable.next(true);
                            return [3 /*break*/, 5];
                        }
                        _b.label = 4;
                    case 4:
                        tracks_1_1 = tracks_1.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (tracks_1_1 && !tracks_1_1.done && (_a = tracks_1.return)) _a.call(tracks_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     *
     * @param stream The video stream where the tracks gonna be extracted from.
     */
    /**
     *
     * @param {?} stream The video stream where the tracks gonna be extracted from.
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.getVideoTracks = /**
     *
     * @param {?} stream The video stream where the tracks gonna be extracted from.
     * @return {?}
     */
    function (stream) {
        /** @type {?} */
        var tracks = [];
        try {
            tracks = stream.getVideoTracks();
        }
        finally {
            return tracks || [];
        }
    };
    /**
     *
     * @param track The track that will be checked for compatibility.
     */
    /**
     *
     * @param {?} track The track that will be checked for compatibility.
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.isTorchCompatible = /**
     *
     * @param {?} track The track that will be checked for compatibility.
     * @return {?}
     */
    function (track) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var compatible, imageCapture, capabilities;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        compatible = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        imageCapture = new ImageCapture(track);
                        return [4 /*yield*/, imageCapture.getPhotoCapabilities()];
                    case 2:
                        capabilities = _a.sent();
                        compatible = !!capabilities['torch'] || ('fillLightMode' in capabilities && capabilities.fillLightMode.length !== 0);
                        return [3 /*break*/, 4];
                    case 3: return [2 /*return*/, compatible];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Apply the torch setting in all received tracks.
     */
    /**
     * Apply the torch setting in all received tracks.
     * @param {?} tracks
     * @param {?} state
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.applyTorchOnTracks = /**
     * Apply the torch setting in all received tracks.
     * @param {?} tracks
     * @param {?} state
     * @return {?}
     */
    function (tracks, state) {
        tracks.forEach(function (track) { return track.applyConstraints({
            advanced: [(/** @type {?} */ ({ torch: state, fillLightMode: state ? 'torch' : 'none' }))]
        }); });
    };
    /**
     * Correctly sets a new scanStream value.
     */
    /**
     * Correctly sets a new scanStream value.
     * @param {?} scan$
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype._setScanStream = /**
     * Correctly sets a new scanStream value.
     * @param {?} scan$
     * @return {?}
     */
    function (scan$) {
        // cleans old stream
        this._cleanScanStream();
        // sets new stream
        this.scanStream = scan$;
    };
    /**
     * Cleans any old scan stream value.
     */
    /**
     * Cleans any old scan stream value.
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype._cleanScanStream = /**
     * Cleans any old scan stream value.
     * @return {?}
     */
    function () {
        if (this.scanStream && !this.scanStream.isStopped) {
            this.scanStream.complete();
        }
        this.scanStream = null;
    };
    /**
     * Decodes values in a stream with delays between scans.
     *
     * @param scan$ The subject to receive the values.
     * @param videoElement The video element the decode will be applied.
     * @param delay The delay between decode results.
     */
    /**
     * Decodes values in a stream with delays between scans.
     *
     * @param {?} scan$ The subject to receive the values.
     * @param {?} videoElement The video element the decode will be applied.
     * @param {?} delay The delay between decode results.
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.decodeOnSubject = /**
     * Decodes values in a stream with delays between scans.
     *
     * @param {?} scan$ The subject to receive the values.
     * @param {?} videoElement The video element the decode will be applied.
     * @param {?} delay The delay between decode results.
     * @return {?}
     */
    function (scan$, videoElement, delay) {
        var _this = this;
        // stops loop
        if (scan$.isStopped) {
            return;
        }
        /** @type {?} */
        var result;
        try {
            result = this.decode(videoElement);
            scan$.next({ result: result });
        }
        catch (error) {
            // stream cannot stop on fails.
            if (!error ||
                // scan Failure - found nothing, no error
                error instanceof NotFoundException ||
                // scan Error - found the QR but got error on decoding
                error instanceof ChecksumException ||
                error instanceof FormatException) {
                scan$.next({ error: error });
            }
            else {
                scan$.error(error);
            }
        }
        finally {
            /** @type {?} */
            var timeout = !result ? 0 : delay;
            setTimeout(function () { return _this.decodeOnSubject(scan$, videoElement, delay); }, timeout);
        }
    };
    /**
     * Restarts the scanner.
     */
    /**
     * Restarts the scanner.
     * @return {?}
     */
    BrowserMultiFormatContinuousReader.prototype.restart = /**
     * Restarts the scanner.
     * @return {?}
     */
    function () {
        // reset
        // start
        return this.continuousDecodeFromInputVideoDevice(this.deviceId, this.videoElement);
    };
    return BrowserMultiFormatContinuousReader;
}(BrowserMultiFormatReader));
/**
 * Based on zxing-typescript BrowserCodeReader
 */
export { BrowserMultiFormatContinuousReader };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXIuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aenhpbmcvbmd4LXNjYW5uZXIvIiwic291cmNlcyI6WyJsaWIvYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw2Q0FBNkM7O0FBRTdDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQVUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6SCxPQUFPLEVBQUUsZUFBZSxFQUFjLE1BQU0sTUFBTSxDQUFDOzs7O0FBTW5EOzs7O0lBQXdELDhEQUF3QjtJQUFoRjtRQUFBLHFFQXVQQzs7OztRQTNPUyx1QkFBaUIsR0FBRyxJQUFJLGVBQWUsQ0FBVSxTQUFTLENBQUMsQ0FBQzs7SUEyT3RFLENBQUM7SUFsUEMsc0JBQVcsZ0VBQWdCO1FBSDNCOztXQUVHOzs7OztRQUNIO1lBQ0UsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDL0MsQ0FBQzs7O09BQUE7SUFpQkQ7Ozs7OztPQU1HOzs7Ozs7OztJQUNJLGlGQUFvQzs7Ozs7OztJQUEzQyxVQUNFLFFBQWlCLEVBQ2pCLFdBQThCO1FBRmhDLGlCQWdDQztRQTNCQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFYiw2Q0FBNkM7UUFDN0MsSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7WUFDbkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7U0FDMUI7UUFFRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsRUFBRTtZQUNwQyxPQUFPO1NBQ1I7O1lBRUssS0FBSyxHQUFHLElBQUksZUFBZSxDQUFpQixFQUFFLENBQUM7UUFFckQsSUFBSTtZQUNGLHdIQUF3SDtZQUN4SCxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxRQUFRLFVBQUEs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Y0FBTSxPQUFBLEtBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsRUFBaEQsQ0FBZ0QsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM3RTtJQUNILENBQUM7SUFFRDs7T0FFRzs7Ozs7SUFDSyxvREFBTzs7OztJQUFmO1FBQ0UsUUFBUTtRQUNSLFFBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBRUgseUNBQUM7QUFBRCxDQUFDLEFBdlBELENBQXdELHdCQUF3QixHQXVQL0U7Ozs7Ozs7Ozs7SUEzT0MsK0RBQW9FOzs7OztJQUtwRSxzREFBeUI7Ozs7O0lBS3pCLHdEQUFvRCIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2ltYWdlLWNhcHR1cmUuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgeyBCcm93c2VyTXVsdGlGb3JtYXRSZWFkZXIsIENoZWNrc3VtRXhjZXB0aW9uLCBGb3JtYXRFeGNlcHRpb24sIE5vdEZvdW5kRXhjZXB0aW9uLCBSZXN1bHQgfSBmcm9tICdAenhpbmcvbGlicmFyeSc7XHJcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBSZXN1bHRBbmRFcnJvciB9IGZyb20gJy4vUmVzdWx0QW5kRXJyb3InO1xyXG5cclxuLyoqXHJcbiAqIEJhc2VkIG9uIHp4aW5nLXR5cGVzY3JpcHQgQnJvd3NlckNvZGVSZWFkZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyIGV4dGVuZHMgQnJvd3Nlck11bHRpRm9ybWF0UmVhZGVyIHtcclxuXHJcbiAgLyoqXHJcbiAgICogRXhwb3NlcyBfdG9jaEF2YWlsYWJsZSAuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpc1RvcmNoQXZhaWxhYmxlKCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2lzVG9yY2hBdmFpbGFibGUuYXNPYnNlcnZhYmxlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTYXlzIGlmIHRoZXJlJ3MgYSB0b3JjaCBhdmFpbGFibGUgZm9yIHRoZSBjdXJyZW50IGRldmljZS5cclxuICAgKi9cclxuICBwcml2YXRlIF9pc1RvcmNoQXZhaWxhYmxlID0gbmV3IEJlaGF2aW9yU3ViamVjdDxib29sZWFuPih1bmRlZmluZWQpO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgZGV2aWNlIGlkIG9mIHRoZSBjdXJyZW50IG1lZGlhIGRldmljZS5cclxuICAgKi9cclxuICBwcml2YXRlIGRldmljZUlkOiBzdHJpbmc7XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoZXJlJ3Mgc29tZSBzY2FuIHN0cmVhbSBvcGVuLCBpdCBzaGFsIGJlIGhlcmUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzY2FuU3RyZWFtOiBCZWhhdmlvclN1YmplY3Q8UmVzdWx0QW5kRXJyb3I+O1xyXG5cclxuICAvKipcclxuICAgKiBTdGFydHMgdGhlIGRlY29kaW5nIGZyb20gdGhlIGN1cnJlbnQgb3IgYSBuZXcgdmlkZW8gZWxlbWVudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjYWxsYmFja0ZuIFRoZSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCBhZnRlciBldmVyeSBzY2FuIGF0dGVtcHRcclxuICAgKiBAcGFyYW0gZGV2aWNlSWQgVGhlIGRldmljZSdzIHRvIGJlIHVzZWQgSWRcclxuICAgKiBAcGFyYW0gdmlkZW9Tb3VyY2UgQSBuZXcgdmlkZW8gZWxlbWVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb250aW51b3VzRGVjb2RlRnJvbUlucHV0VmlkZW9EZXZpY2UoXHJcbiAgICBkZXZpY2VJZD86IHN0cmluZyxcclxuICAgIHZpZGVvU291cmNlPzogSFRNTFZpZGVvRWxlbWVudFxyXG4gICk6IE9ic2VydmFibGU8UmVzdWx0QW5kRXJyb3I+IHtcclxuXHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcblxyXG4gICAgLy8gS2VlcHMgdGhlIGRldmljZUlkIGJldHdlZW4gc2Nhbm5lciByZXNldHMuXHJcbiAgICBpZiAodHlwZW9mIGRldmljZUlkICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICB0aGlzLmRldmljZUlkID0gZGV2aWNlSWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzY2FuJCA9IG5ldyBCZWhhdmlvclN1YmplY3Q8UmVzdWx0QW5kRXJyb3I+KHt9KTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyB0aGlzLmRlY29kZUZyb21JbnB1dFZpZGVvRGV2aWNlQ29udGludW91c2x5KGRldmljZUlkLCB2aWRlb1NvdXJjZSwgKHJlc3VsdCwgZXJyb3IpID0+IHNjYW4kLm5leHQoeyByZXN1bHQsIGVycm9yIH0pKTtcclxuICAgICAgdGhpcy5nZXRTdHJlYW1Gb3JEZXZpY2UoeyBkZXZpY2VJZCB9KVxyXG4gICAgICAgIC50aGVuKHN0cmVhbSA9PiB0aGlzLmF0dGFjaFN0cmVhbVRvVmlkZW9BbmRDaGVja1RvcmNoKHN0cmVhbSwgdmlkZW9Tb3VyY2UpKVxyXG4gICAgICAgIC50aGVuKHZpZGVvRWxlbWVudCA9PiB0aGlzLmRlY29kZU9uU3ViamVjdChzY2FuJCwgdmlkZW9FbGVtZW50LCB0aGlzLnRpbWVCZXR3ZWVuU2NhbnNNaWxsaXMpKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgc2NhbiQuZXJyb3IoZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fc2V0U2NhblN0cmVhbShzY2FuJCk7XHJcblxyXG4gICAgLy8gQHRvZG8gRmluZCBhIHdheSB0byBlbWl0IGEgY29tcGxldGUgZXZlbnQgb24gdGhlIHNjYW4gc3RyZWFtIG9uY2UgaXQncyBmaW5pc2hlZC5cclxuXHJcbiAgICByZXR1cm4gc2NhbiQuYXNPYnNlcnZhYmxlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBtZWRpYSBzdHJlYW0gZm9yIGNlcnRhaW4gZGV2aWNlLlxyXG4gICAqIEZhbGxzIGJhY2sgdG8gYW55IGF2YWlsYWJsZSBkZXZpY2UgaWYgbm8gYGRldmljZUlkYCBpcyBkZWZpbmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBnZXRTdHJlYW1Gb3JEZXZpY2UoeyBkZXZpY2VJZCB9OiBQYXJ0aWFsPE1lZGlhRGV2aWNlSW5mbz4pOiBQcm9taXNlPE1lZGlhU3RyZWFtPiB7XHJcbiAgICBjb25zdCBjb25zdHJhaW50cyA9IHRoaXMuZ2V0VXNlck1lZGlhQ29uc3RyYWludHMoZGV2aWNlSWQpO1xyXG4gICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMpO1xyXG4gICAgcmV0dXJuIHN0cmVhbTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgbWVkaWEgc3RlcmFtIGNvbnN0cmFpbnRzIGZvciBjZXJ0YWluIGBkZXZpY2VJZGAuXHJcbiAgICogRmFsbHMgYmFjayB0byBhbnkgZW52aXJvbm1lbnQgYXZhaWxhYmxlIGRldmljZSBpZiBubyBgZGV2aWNlSWRgIGlzIGRlZmluZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVzZXJNZWRpYUNvbnN0cmFpbnRzKGRldmljZUlkOiBzdHJpbmcpOiBNZWRpYVN0cmVhbUNvbnN0cmFpbnRzIHtcclxuXHJcbiAgICBjb25zdCB2aWRlbyA9IHR5cGVvZiBkZXZpY2VJZCA9PT0gJ3VuZGVmaW5lZCdcclxuICAgICAgPyB7IGZhY2luZ01vZGU6IHsgZXhhY3Q6ICdlbnZpcm9ubWVudCcgfSB9XHJcbiAgICAgIDogeyBkZXZpY2VJZDogeyBleGFjdDogZGV2aWNlSWQgfSB9O1xyXG5cclxuICAgIGNvbnN0IGNvbnN0cmFpbnRzOiBNZWRpYVN0cmVhbUNvbnN0cmFpbnRzID0geyB2aWRlbyB9O1xyXG5cclxuICAgIHJldHVybiBjb25zdHJhaW50cztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuYWJsZXMgYW5kIGRpc2FibGVzIHRoZSBkZXZpY2UgdG9yY2guXHJcbiAgICovXHJcbiAgcHVibGljIHNldFRvcmNoKG9uOiBib29sZWFuKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9pc1RvcmNoQXZhaWxhYmxlLnZhbHVlKSB7XHJcbiAgICAgIC8vIGNvbXBhdGliaWxpdHkgbm90IGNoZWNrZWQgeWV0XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFja3MgPSB0aGlzLmdldFZpZGVvVHJhY2tzKHRoaXMuc3RyZWFtKTtcclxuXHJcbiAgICBpZiAob24pIHtcclxuICAgICAgdGhpcy5hcHBseVRvcmNoT25UcmFja3ModHJhY2tzLCB0cnVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuYXBwbHlUb3JjaE9uVHJhY2tzKHRyYWNrcywgZmFsc2UpO1xyXG4gICAgICAvLyBAdG9kbyBjaGVjayBwb3NzaWJpbGl0eSB0byBkaXNhYmxlIHRvcmNoIHdpdGhvdXQgcmVzdGFydFxyXG4gICAgICB0aGlzLnJlc3RhcnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgdG9yY2ggY29tcGF0aWJpbGl0eSBzdGF0ZSBhbmQgYXR0YWNocyB0aGUgc3RyZWFtIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhdHRhY2hTdHJlYW1Ub1ZpZGVvQW5kQ2hlY2tUb3JjaChzdHJlYW06IE1lZGlhU3RyZWFtLCB2aWRlb1NvdXJjZTogSFRNTFZpZGVvRWxlbWVudCk6IFByb21pc2U8SFRNTFZpZGVvRWxlbWVudD4ge1xyXG4gICAgdGhpcy51cGRhdGVUb3JjaENvbXBhdGliaWxpdHkoc3RyZWFtKTtcclxuICAgIHJldHVybiB0aGlzLmF0dGFjaFN0cmVhbVRvVmlkZW8oc3RyZWFtLCB2aWRlb1NvdXJjZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgaWYgdGhlIHN0cmVhbSBzdXBwb3J0cyB0b3JjaCBjb250cm9sLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0cmVhbSBUaGUgbWVkaWEgc3RyZWFtIHVzZWQgdG8gY2hlY2suXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGVUb3JjaENvbXBhdGliaWxpdHkoc3RyZWFtOiBNZWRpYVN0cmVhbSk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICAgIGNvbnN0IHRyYWNrcyA9IHRoaXMuZ2V0VmlkZW9UcmFja3Moc3RyZWFtKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHRyYWNrIG9mIHRyYWNrcykge1xyXG4gICAgICBpZiAoYXdhaXQgdGhpcy5pc1RvcmNoQ29tcGF0aWJsZSh0cmFjaykpIHtcclxuICAgICAgICB0aGlzLl9pc1RvcmNoQXZhaWxhYmxlLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0cmVhbSBUaGUgdmlkZW8gc3RyZWFtIHdoZXJlIHRoZSB0cmFja3MgZ29ubmEgYmUgZXh0cmFjdGVkIGZyb20uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRWaWRlb1RyYWNrcyhzdHJlYW06IE1lZGlhU3RyZWFtKSB7XHJcbiAgICBsZXQgdHJhY2tzID0gW107XHJcbiAgICB0cnkge1xyXG4gICAgICB0cmFja3MgPSBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcclxuICAgIH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICByZXR1cm4gdHJhY2tzIHx8IFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHJhY2sgVGhlIHRyYWNrIHRoYXQgd2lsbCBiZSBjaGVja2VkIGZvciBjb21wYXRpYmlsaXR5LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXN5bmMgaXNUb3JjaENvbXBhdGlibGUodHJhY2s6IE1lZGlhU3RyZWFtVHJhY2spIHtcclxuXHJcbiAgICBsZXQgY29tcGF0aWJsZSA9IGZhbHNlO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGltYWdlQ2FwdHVyZSA9IG5ldyBJbWFnZUNhcHR1cmUodHJhY2spO1xyXG4gICAgICBjb25zdCBjYXBhYmlsaXRpZXMgPSBhd2FpdCBpbWFnZUNhcHR1cmUuZ2V0UGhvdG9DYXBhYmlsaXRpZXMoKTtcclxuICAgICAgY29tcGF0aWJsZSA9ICEhY2FwYWJpbGl0aWVzWyd0b3JjaCddIHx8ICgnZmlsbExpZ2h0TW9kZScgaW4gY2FwYWJpbGl0aWVzICYmIGNhcGFiaWxpdGllcy5maWxsTGlnaHRNb2RlLmxlbmd0aCAhPT0gMCk7XHJcbiAgICB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgcmV0dXJuIGNvbXBhdGlibGU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBseSB0aGUgdG9yY2ggc2V0dGluZyBpbiBhbGwgcmVjZWl2ZWQgdHJhY2tzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXBwbHlUb3JjaE9uVHJhY2tzKHRyYWNrczogTWVkaWFTdHJlYW1UcmFja1tdLCBzdGF0ZTogYm9vbGVhbikge1xyXG4gICAgdHJhY2tzLmZvckVhY2godHJhY2sgPT4gdHJhY2suYXBwbHlDb25zdHJhaW50cyh7XHJcbiAgICAgIGFkdmFuY2VkOiBbPGFueT57IHRvcmNoOiBzdGF0ZSwgZmlsbExpZ2h0TW9kZTogc3RhdGUgPyAndG9yY2gnIDogJ25vbmUnIH1dXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb3JyZWN0bHkgc2V0cyBhIG5ldyBzY2FuU3RyZWFtIHZhbHVlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX3NldFNjYW5TdHJlYW0oc2NhbiQ6IEJlaGF2aW9yU3ViamVjdDxSZXN1bHRBbmRFcnJvcj4pOiB2b2lkIHtcclxuICAgIC8vIGNsZWFucyBvbGQgc3RyZWFtXHJcbiAgICB0aGlzLl9jbGVhblNjYW5TdHJlYW0oKTtcclxuICAgIC8vIHNldHMgbmV3IHN0cmVhbVxyXG4gICAgdGhpcy5zY2FuU3RyZWFtID0gc2NhbiQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGVhbnMgYW55IG9sZCBzY2FuIHN0cmVhbSB2YWx1ZS5cclxuICAgKi9cclxuICBwcml2YXRlIF9jbGVhblNjYW5TdHJlYW0oKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKHRoaXMuc2NhblN0cmVhbSAmJiAhdGhpcy5zY2FuU3RyZWFtLmlzU3RvcHBlZCkge1xyXG4gICAgICB0aGlzLnNjYW5TdHJlYW0uY29tcGxldGUoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNjYW5TdHJlYW0gPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVjb2RlcyB2YWx1ZXMgaW4gYSBzdHJlYW0gd2l0aCBkZWxheXMgYmV0d2VlbiBzY2Fucy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzY2FuJCBUaGUgc3ViamVjdCB0byByZWNlaXZlIHRoZSB2YWx1ZXMuXHJcbiAgICogQHBhcmFtIHZpZGVvRWxlbWVudCBUaGUgdmlkZW8gZWxlbWVudCB0aGUgZGVjb2RlIHdpbGwgYmUgYXBwbGllZC5cclxuICAgKiBAcGFyYW0gZGVsYXkgVGhlIGRlbGF5IGJldHdlZW4gZGVjb2RlIHJlc3VsdHMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBkZWNvZGVPblN1YmplY3Qoc2NhbiQ6IEJlaGF2aW9yU3ViamVjdDxSZXN1bHRBbmRFcnJvcj4sIHZpZGVvRWxlbWVudDogSFRNTFZpZGVvRWxlbWVudCwgZGVsYXk6IG51bWJlcik6IHZvaWQge1xyXG5cclxuICAgIC8vIHN0b3BzIGxvb3BcclxuICAgIGlmIChzY2FuJC5pc1N0b3BwZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCByZXN1bHQ6IFJlc3VsdDtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICByZXN1bHQgPSB0aGlzLmRlY29kZSh2aWRlb0VsZW1lbnQpO1xyXG4gICAgICBzY2FuJC5uZXh0KHsgcmVzdWx0IH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgLy8gc3RyZWFtIGNhbm5vdCBzdG9wIG9uIGZhaWxzLlxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIWVycm9yIHx8XHJcbiAgICAgICAgLy8gc2NhbiBGYWlsdXJlIC0gZm91bmQgbm90aGluZywgbm8gZXJyb3JcclxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIE5vdEZvdW5kRXhjZXB0aW9uIHx8XHJcbiAgICAgICAgLy8gc2NhbiBFcnJvciAtIGZvdW5kIHRoZSBRUiBidXQgZ290IGVycm9yIG9uIGRlY29kaW5nXHJcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBDaGVja3N1bUV4Y2VwdGlvbiB8fFxyXG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRm9ybWF0RXhjZXB0aW9uXHJcbiAgICAgICkge1xyXG4gICAgICAgIHNjYW4kLm5leHQoeyBlcnJvciB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzY2FuJC5lcnJvcihlcnJvcik7XHJcbiAgICAgIH1cclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIGNvbnN0IHRpbWVvdXQgPSAhcmVzdWx0ID8gMCA6IGRlbGF5O1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZGVjb2RlT25TdWJqZWN0KHNjYW4kLCB2aWRlb0VsZW1lbnQsIGRlbGF5KSwgdGltZW91dCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXN0YXJ0cyB0aGUgc2Nhbm5lci5cclxuICAgKi9cclxuICBwcml2YXRlIHJlc3RhcnQoKTogT2JzZXJ2YWJsZTxSZXN1bHRBbmRFcnJvcj4ge1xyXG4gICAgLy8gcmVzZXRcclxuICAgIC8vIHN0YXJ0XHJcbiAgICByZXR1cm4gdGhpcy5jb250aW51b3VzRGVjb2RlRnJvbUlucHV0VmlkZW9EZXZpY2UodGhpcy5kZXZpY2VJZCwgdGhpcy52aWRlb0VsZW1lbnQpO1xyXG4gIH1cclxuXHJcbn1cclxuIl19