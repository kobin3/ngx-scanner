import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, NgModule } from '@angular/core';
import { __awaiter, __generator, __spread, __extends, __values } from 'tslib';
import { BrowserMultiFormatReader, ChecksumException, FormatException, NotFoundException, ArgumentException, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BehaviorSubject } from 'rxjs';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */
/**
 * Based on zxing-typescript BrowserCodeReader
 */
var /**
 * Based on zxing-typescript BrowserCodeReader
 */
BrowserMultiFormatContinuousReader = /** @class */ (function (_super) {
    __extends(BrowserMultiFormatContinuousReader, _super);
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
        return __awaiter(this, void 0, void 0, function () {
            var constraints, stream;
            return __generator(this, function (_b) {
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
        return __awaiter(this, void 0, void 0, function () {
            var e_1, _a, tracks, tracks_1, tracks_1_1, track, e_1_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tracks = this.getVideoTracks(stream);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, 7, 8]);
                        tracks_1 = __values(tracks), tracks_1_1 = tracks_1.next();
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
        return __awaiter(this, void 0, void 0, function () {
            var compatible, imageCapture, capabilities;
            return __generator(this, function (_a) {
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
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */
var ZXingScannerComponent = /** @class */ (function () {
    /**
     * Constructor to build the object and do some DI.
     */
    function ZXingScannerComponent() {
        /**
         * How the preview element shoud be fit inside the :host container.
         */
        this.previewFitMode = 'cover';
        // instance based emitters
        this.autostarted = new EventEmitter();
        this.autostarting = new EventEmitter();
        this.torchCompatible = new EventEmitter();
        this.scanSuccess = new EventEmitter();
        this.scanFailure = new EventEmitter();
        this.scanError = new EventEmitter();
        this.scanComplete = new EventEmitter();
        this.camerasFound = new EventEmitter();
        this.camerasNotFound = new EventEmitter();
        this.permissionResponse = new EventEmitter(true);
        this.hasDevices = new EventEmitter();
        this.deviceChange = new EventEmitter();
        this._device = null;
        this._enabled = true;
        this._hints = new Map();
        this.autofocusEnabled = true;
        this.autostart = true;
        this.formats = [BarcodeFormat.QR_CODE];
        // computed data
        this.hasNavigator = typeof navigator !== 'undefined';
        this.isMediaDevicesSuported = this.hasNavigator && !!navigator.mediaDevices;
    }
    Object.defineProperty(ZXingScannerComponent.prototype, "codeReader", {
        /**
         * Exposes the current code reader, so the user can use it's APIs.
         */
        get: /**
         * Exposes the current code reader, so the user can use it's APIs.
         * @return {?}
         */
        function () {
            return this._codeReader;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "device", {
        /**
         * User device acessor.
         */
        get: /**
         * User device acessor.
         * @return {?}
         */
        function () {
            return this._device;
        },
        /**
         * User device input
         */
        set: /**
         * User device input
         * @param {?} device
         * @return {?}
         */
        function (device) {
            if (!device && device !== null) {
                throw new ArgumentException('The `device` must be a valid MediaDeviceInfo or null.');
            }
            if (this.isCurrentDevice(device)) {
                console.warn('Setting the same device is not allowed.');
                return;
            }
            if (this.isAutostarting) {
                // do not allow setting devices during auto-start, since it will set one and emit it.
                console.warn('Avoid setting a device during auto-start.');
                return;
            }
            if (!this.hasPermission) {
                console.warn('Permissions not set yet, waiting for them to be set to apply device change.');
                // this.permissionResponse
                //   .pipe(
                //     take(1),
                //     tap(() => console.log(`Permissions set, applying device change${device ? ` (${device.deviceId})` : ''}.`))
                //   )
                //   .subscribe(() => this.device = device);
                // return;
            }
            // in order to change the device the codeReader gotta be reseted
            this._reset();
            this._device = device;
            // if enabled, starts scanning
            if (this._enabled && device !== null) {
                this.scanFromDevice(device.deviceId);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "formats", {
        /**
         * Returns all the registered formats.
         */
        get: /**
         * Returns all the registered formats.
         * @return {?}
         */
        function () {
            return this.hints.get(DecodeHintType.POSSIBLE_FORMATS);
        },
        /**
         * Registers formats the scanner should support.
         *
         * @param input BarcodeFormat or case-insensitive string array.
         */
        set: /**
         * Registers formats the scanner should support.
         *
         * @param {?} input BarcodeFormat or case-insensitive string array.
         * @return {?}
         */
        function (input) {
            var _this = this;
            if (typeof input === 'string') {
                throw new Error('Invalid formats, make sure the [formats] input is a binding.');
            }
            // formats may be set from html template as BarcodeFormat or string array
            /** @type {?} */
            var formats = input.map(function (f) { return _this.getBarcodeFormatOrFail(f); });
            /** @type {?} */
            var hints = this.hints;
            // updates the hints
            hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
            this.hints = hints;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "hints", {
        /**
         * Returns all the registered hints.
         */
        get: /**
         * Returns all the registered hints.
         * @return {?}
         */
        function () {
            return this._hints;
        },
        /**
         * Does what it takes to set the hints.
         */
        set: /**
         * Does what it takes to set the hints.
         * @param {?} hints
         * @return {?}
         */
        function (hints) {
            this._hints = hints;
            // @note avoid restarting the code reader when possible
            // new instance with new hints.
            this.restart();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "isAutostarting", {
        /**
         *
         */
        set: /**
         *
         * @param {?} state
         * @return {?}
         */
        function (state) {
            this._isAutostarting = state;
            this.autostarting.next(state);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "isAutstarting", {
        /**
         *
         */
        get: /**
         *
         * @return {?}
         */
        function () {
            return this._isAutostarting;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "torch", {
        /**
         * Allow start scan or not.
         */
        set: /**
         * Allow start scan or not.
         * @param {?} on
         * @return {?}
         */
        function (on) {
            this.getCodeReader().setTorch(on);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "enable", {
        /**
         * Allow start scan or not.
         */
        set: /**
         * Allow start scan or not.
         * @param {?} enabled
         * @return {?}
         */
        function (enabled) {
            this._enabled = Boolean(enabled);
            if (!this._enabled) {
                this.reset();
            }
            else if (this.device) {
                this.scanFromDevice(this.device.deviceId);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "enabled", {
        /**
         * Tells if the scanner is enabled or not.
         */
        get: /**
         * Tells if the scanner is enabled or not.
         * @return {?}
         */
        function () {
            return this._enabled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ZXingScannerComponent.prototype, "tryHarder", {
        /**
         * If is `tryHarder` enabled.
         */
        get: /**
         * If is `tryHarder` enabled.
         * @return {?}
         */
        function () {
            return this.hints.get(DecodeHintType.TRY_HARDER);
        },
        /**
         * Enable/disable tryHarder hint.
         */
        set: /**
         * Enable/disable tryHarder hint.
         * @param {?} enable
         * @return {?}
         */
        function (enable) {
            /** @type {?} */
            var hints = this.hints;
            if (enable) {
                hints.set(DecodeHintType.TRY_HARDER, true);
            }
            else {
                hints.delete(DecodeHintType.TRY_HARDER);
            }
            this.hints = hints;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Gets and registers all cammeras.
     */
    /**
     * Gets and registers all cammeras.
     * @return {?}
     */
    ZXingScannerComponent.prototype.askForPermission = /**
     * Gets and registers all cammeras.
     * @return {?}
     */
    function () {
        return __awaiter(this, void 0, void 0, function () {
            var stream, permission, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.hasNavigator) {
                            console.error('@zxing/ngx-scanner', 'Can\'t ask permission, navigator is not present.');
                            this.setPermission(null);
                            return [2 /*return*/, this.hasPermission];
                        }
                        if (!this.isMediaDevicesSuported) {
                            console.error('@zxing/ngx-scanner', 'Can\'t get user media, this is not supported.');
                            this.setPermission(null);
                            return [2 /*return*/, this.hasPermission];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, this.getAnyVideoDevice()];
                    case 2:
                        // Will try to ask for permission
                        stream = _a.sent();
                        permission = !!stream;
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        return [2 /*return*/, this.handlePermissionException(err_1)];
                    case 4:
                        this.terminateStream(stream);
                        return [7 /*endfinally*/];
                    case 5:
                        this.setPermission(permission);
                        // Returns the permission
                        return [2 /*return*/, permission];
                }
            });
        });
    };
    /**
     *
     */
    /**
     *
     * @return {?}
     */
    ZXingScannerComponent.prototype.getAnyVideoDevice = /**
     *
     * @return {?}
     */
    function () {
        return navigator.mediaDevices.getUserMedia({ video: true });
    };
    /**
     * Terminates a stream and it's tracks.
     */
    /**
     * Terminates a stream and it's tracks.
     * @param {?} stream
     * @return {?}
     */
    ZXingScannerComponent.prototype.terminateStream = /**
     * Terminates a stream and it's tracks.
     * @param {?} stream
     * @return {?}
     */
    function (stream) {
        if (stream) {
            stream.getTracks().forEach(function (t) { return t.stop(); });
        }
        stream = undefined;
    };
    /**
     * Initializes the component without starting the scanner.
     */
    /**
     * Initializes the component without starting the scanner.
     * @return {?}
     */
    ZXingScannerComponent.prototype.initAutostartOff = /**
     * Initializes the component without starting the scanner.
     * @return {?}
     */
    function () {
        // do not ask for permission when autostart is off
        this.isAutostarting = null;
        // just update devices information
        this.updateVideoInputDevices();
    };
    /**
     * Initializes the component and starts the scanner.
     * Permissions are asked to accomplish that.
     */
    /**
     * Initializes the component and starts the scanner.
     * Permissions are asked to accomplish that.
     * @return {?}
     */
    ZXingScannerComponent.prototype.initAutostartOn = /**
     * Initializes the component and starts the scanner.
     * Permissions are asked to accomplish that.
     * @return {?}
     */
    function () {
        return __awaiter(this, void 0, void 0, function () {
            var hasPermission, e_1, devices;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.isAutostarting = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.askForPermission()];
                    case 2:
                        // Asks for permission before enumerating devices so it can get all the device's info
                        hasPermission = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        console.error('Exception occurred while asking for permission:', e_1);
                        return [2 /*return*/];
                    case 4:
                        if (!hasPermission) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.updateVideoInputDevices()];
                    case 5:
                        devices = _a.sent();
                        this.autostartScanner(__spread(devices));
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if the given device is the current defined one.
     */
    /**
     * Checks if the given device is the current defined one.
     * @param {?} device
     * @return {?}
     */
    ZXingScannerComponent.prototype.isCurrentDevice = /**
     * Checks if the given device is the current defined one.
     * @param {?} device
     * @return {?}
     */
    function (device) {
        return this.device && device && device.deviceId === this.device.deviceId;
    };
    /**
     * Executed after the view initialization.
     */
    /**
     * Executed after the view initialization.
     * @return {?}
     */
    ZXingScannerComponent.prototype.ngAfterViewInit = /**
     * Executed after the view initialization.
     * @return {?}
     */
    function () {
        var _this = this;
        // makes torch availability information available to user
        this.getCodeReader().isTorchAvailable.subscribe(function (x) { return _this.torchCompatible.emit(x); });
        if (!this.autostart) {
            console.warn('New feature \'autostart\' disabled, be careful. Permissions and devices recovery has to be run manually.');
            // does the necessary configuration without autostarting
            this.initAutostartOff();
            return;
        }
        // configurates the component and starts the scanner
        this.initAutostartOn();
    };
    /**
     * Executes some actions before destroy the component.
     */
    /**
     * Executes some actions before destroy the component.
     * @return {?}
     */
    ZXingScannerComponent.prototype.ngOnDestroy = /**
     * Executes some actions before destroy the component.
     * @return {?}
     */
    function () {
        this.reset();
    };
    /**
     * Stops old `codeReader` and starts scanning in a new one.
     */
    /**
     * Stops old `codeReader` and starts scanning in a new one.
     * @return {?}
     */
    ZXingScannerComponent.prototype.restart = /**
     * Stops old `codeReader` and starts scanning in a new one.
     * @return {?}
     */
    function () {
        /** @type {?} */
        var prevDevice = this._reset();
        if (!prevDevice) {
            return;
        }
        // @note apenas necessario por enquanto causa da Torch
        this._codeReader = undefined;
        this.device = prevDevice;
    };
    /**
     * Discovers and updates known video input devices.
     */
    /**
     * Discovers and updates known video input devices.
     * @return {?}
     */
    ZXingScannerComponent.prototype.updateVideoInputDevices = /**
     * Discovers and updates known video input devices.
     * @return {?}
     */
    function () {
        return __awaiter(this, void 0, void 0, function () {
            var devices, hasDevices;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // permissions aren't needed to get devices, but to access them and their info
                        return [4 /*yield*/, this.getCodeReader().listVideoInputDevices()];
                    case 1:
                        devices = (_a.sent()) || [];
                        hasDevices = devices && devices.length > 0;
                        // stores discovered devices and updates information
                        this.hasDevices.next(hasDevices);
                        this.camerasFound.next(__spread(devices));
                        if (!hasDevices) {
                            this.camerasNotFound.next();
                        }
                        return [2 /*return*/, devices];
                }
            });
        });
    };
    /**
     * Starts the scanner with the back camera otherwise take the last
     * available device.
     */
    /**
     * Starts the scanner with the back camera otherwise take the last
     * available device.
     * @param {?} devices
     * @return {?}
     */
    ZXingScannerComponent.prototype.autostartScanner = /**
     * Starts the scanner with the back camera otherwise take the last
     * available device.
     * @param {?} devices
     * @return {?}
     */
    function (devices) {
        /** @type {?} */
        var matcher = function (_a) {
            var label = _a.label;
            return /back|trás|rear|traseira|environment|ambiente/gi.test(label);
        };
        // select the rear camera by default, otherwise take the last camera.
        /** @type {?} */
        var device = devices.find(matcher) || devices.pop();
        if (!device) {
            throw new Error('Impossible to autostart, no input devices available.');
        }
        this.device = device;
        // @note when listening to this change, callback code will sometimes run before the previous line.
        this.deviceChange.emit(device);
        this.isAutostarting = false;
        this.autostarted.next();
    };
    /**
     * Dispatches the scan success event.
     *
     * @param result the scan result.
     */
    /**
     * Dispatches the scan success event.
     *
     * @param {?} result the scan result.
     * @return {?}
     */
    ZXingScannerComponent.prototype.dispatchScanSuccess = /**
     * Dispatches the scan success event.
     *
     * @param {?} result the scan result.
     * @return {?}
     */
    function (result) {
        this.scanSuccess.next(result.getText());
    };
    /**
     * Dispatches the scan failure event.
     */
    /**
     * Dispatches the scan failure event.
     * @param {?=} reason
     * @return {?}
     */
    ZXingScannerComponent.prototype.dispatchScanFailure = /**
     * Dispatches the scan failure event.
     * @param {?=} reason
     * @return {?}
     */
    function (reason) {
        this.scanFailure.next(reason);
    };
    /**
     * Dispatches the scan error event.
     *
     * @param error the error thing.
     */
    /**
     * Dispatches the scan error event.
     *
     * @param {?} error the error thing.
     * @return {?}
     */
    ZXingScannerComponent.prototype.dispatchScanError = /**
     * Dispatches the scan error event.
     *
     * @param {?} error the error thing.
     * @return {?}
     */
    function (error) {
        this.scanError.next(error);
    };
    /**
     * Dispatches the scan event.
     *
     * @param result the scan result.
     */
    /**
     * Dispatches the scan event.
     *
     * @param {?} result the scan result.
     * @return {?}
     */
    ZXingScannerComponent.prototype.dispatchScanComplete = /**
     * Dispatches the scan event.
     *
     * @param {?} result the scan result.
     * @return {?}
     */
    function (result) {
        this.scanComplete.next(result);
    };
    /**
     * Returns the filtered permission.
     */
    /**
     * Returns the filtered permission.
     * @param {?} err
     * @return {?}
     */
    ZXingScannerComponent.prototype.handlePermissionException = /**
     * Returns the filtered permission.
     * @param {?} err
     * @return {?}
     */
    function (err) {
        // failed to grant permission to video input
        console.error('@zxing/ngx-scanner', 'Error when asking for permission.', err);
        /** @type {?} */
        var permission;
        switch (err.name) {
            // usually caused by not secure origins
            case 'NotSupportedError':
                console.warn('@zxing/ngx-scanner', err.message);
                // could not claim
                permission = null;
                // can't check devices
                this.hasDevices.next(null);
                break;
            // user denied permission
            case 'NotAllowedError':
                console.warn('@zxing/ngx-scanner', err.message);
                // claimed and denied permission
                permission = false;
                // this means that input devices exists
                this.hasDevices.next(true);
                break;
            // the device has no attached input devices
            case 'NotFoundError':
                console.warn('@zxing/ngx-scanner', err.message);
                // no permissions claimed
                permission = null;
                // because there was no devices
                this.hasDevices.next(false);
                // tells the listener about the error
                this.camerasNotFound.next(err);
                break;
            case 'NotReadableError':
                console.warn('@zxing/ngx-scanner', 'Couldn\'t read the device(s)\'s stream, it\'s probably in use by another app.');
                // no permissions claimed
                permission = null;
                // there are devices, which I couldn't use
                this.hasDevices.next(false);
                // tells the listener about the error
                this.camerasNotFound.next(err);
                break;
            default:
                console.warn('@zxing/ngx-scanner', 'I was not able to define if I have permissions for camera or not.', err);
                // unknown
                permission = null;
                // this.hasDevices.next(undefined;
                break;
        }
        this.setPermission(permission);
        // tells the listener about the error
        this.permissionResponse.error(err);
        return permission;
    };
    /**
     * Returns a valid BarcodeFormat or fails.
     */
    /**
     * Returns a valid BarcodeFormat or fails.
     * @param {?} format
     * @return {?}
     */
    ZXingScannerComponent.prototype.getBarcodeFormatOrFail = /**
     * Returns a valid BarcodeFormat or fails.
     * @param {?} format
     * @return {?}
     */
    function (format) {
        return typeof format === 'string'
            ? BarcodeFormat[format.trim().toUpperCase()]
            : format;
    };
    /**
     * Retorna um code reader, cria um se nenhume existe.
     */
    /**
     * Retorna um code reader, cria um se nenhume existe.
     * @return {?}
     */
    ZXingScannerComponent.prototype.getCodeReader = /**
     * Retorna um code reader, cria um se nenhume existe.
     * @return {?}
     */
    function () {
        if (!this._codeReader) {
            this._codeReader = new BrowserMultiFormatContinuousReader(this.hints);
        }
        return this._codeReader;
    };
    /**
     * Starts the continuous scanning for the given device.
     *
     * @param deviceId The deviceId from the device.
     */
    /**
     * Starts the continuous scanning for the given device.
     *
     * @param {?} deviceId The deviceId from the device.
     * @return {?}
     */
    ZXingScannerComponent.prototype.scanFromDevice = /**
     * Starts the continuous scanning for the given device.
     *
     * @param {?} deviceId The deviceId from the device.
     * @return {?}
     */
    function (deviceId) {
        var _this = this;
        /** @type {?} */
        var videoElement = this.previewElemRef.nativeElement;
        /** @type {?} */
        var codeReader = this.getCodeReader();
        /** @type {?} */
        var decodingStream = codeReader.continuousDecodeFromInputVideoDevice(deviceId, videoElement);
        if (!decodingStream) {
            throw new Error('Undefined decoding stream, aborting.');
        }
        /** @type {?} */
        var next = function (x) { return _this._onDecodeResult(x.result, x.error); };
        /** @type {?} */
        var error = function (err) { return _this._onDecodeError(err); };
        /** @type {?} */
        var complete = function () { _this.reset(); console.log('completed'); };
        decodingStream.subscribe(next, error, complete);
    };
    /**
     * Handles decode errors.
     */
    /**
     * Handles decode errors.
     * @param {?} err
     * @return {?}
     */
    ZXingScannerComponent.prototype._onDecodeError = /**
     * Handles decode errors.
     * @param {?} err
     * @return {?}
     */
    function (err) {
        this.dispatchScanError(err);
        this.reset();
    };
    /**
     * Handles decode results.
     */
    /**
     * Handles decode results.
     * @param {?} result
     * @param {?} error
     * @return {?}
     */
    ZXingScannerComponent.prototype._onDecodeResult = /**
     * Handles decode results.
     * @param {?} result
     * @param {?} error
     * @return {?}
     */
    function (result, error) {
        if (result) {
            this.dispatchScanSuccess(result);
        }
        else {
            this.dispatchScanFailure(error);
        }
        this.dispatchScanComplete(result);
    };
    /**
     * Stops the code reader and returns the previous selected device.
     */
    /**
     * Stops the code reader and returns the previous selected device.
     * @return {?}
     */
    ZXingScannerComponent.prototype._reset = /**
     * Stops the code reader and returns the previous selected device.
     * @return {?}
     */
    function () {
        if (!this._codeReader) {
            return;
        }
        /** @type {?} */
        var device = this.device;
        // do not set this.device inside this method, it would create a recursive loop
        this._device = null;
        this._codeReader.reset();
        return device;
    };
    /**
     * Resets the scanner and emits device change.
     */
    /**
     * Resets the scanner and emits device change.
     * @return {?}
     */
    ZXingScannerComponent.prototype.reset = /**
     * Resets the scanner and emits device change.
     * @return {?}
     */
    function () {
        this._reset();
        this.deviceChange.emit(null);
    };
    /**
     * Sets the permission value and emmits the event.
     */
    /**
     * Sets the permission value and emmits the event.
     * @param {?} hasPermission
     * @return {?}
     */
    ZXingScannerComponent.prototype.setPermission = /**
     * Sets the permission value and emmits the event.
     * @param {?} hasPermission
     * @return {?}
     */
    function (hasPermission) {
        this.hasPermission = hasPermission;
        this.permissionResponse.next(hasPermission);
    };
    ZXingScannerComponent.decorators = [
        { type: Component, args: [{
                    selector: 'zxing-scanner',
                    template: "<video #preview [style.object-fit]=\"previewFitMode\">\r\n  <p>\r\n    Your browser does not support this feature, please try to upgrade it.\r\n  </p>\r\n  <p>\r\n    Seu navegador n\u00E3o suporta este recurso, por favor tente atualiz\u00E1-lo.\r\n  </p>\r\n</video>\r\n",
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    styles: [":host{display:block}video{width:100%;height:auto;-o-object-fit:contain;object-fit:contain}"]
                }] }
    ];
    /** @nocollapse */
    ZXingScannerComponent.ctorParameters = function () { return []; };
    ZXingScannerComponent.propDecorators = {
        previewElemRef: [{ type: ViewChild, args: ['preview',] }],
        autofocusEnabled: [{ type: Input }],
        autostarted: [{ type: Output }],
        autostarting: [{ type: Output }],
        autostart: [{ type: Input }],
        previewFitMode: [{ type: Input }],
        torchCompatible: [{ type: Output }],
        scanSuccess: [{ type: Output }],
        scanFailure: [{ type: Output }],
        scanError: [{ type: Output }],
        scanComplete: [{ type: Output }],
        camerasFound: [{ type: Output }],
        camerasNotFound: [{ type: Output }],
        permissionResponse: [{ type: Output }],
        hasDevices: [{ type: Output }],
        device: [{ type: Input }],
        deviceChange: [{ type: Output }],
        formats: [{ type: Input }],
        torch: [{ type: Input }],
        enable: [{ type: Input }],
        tryHarder: [{ type: Input }]
    };
    return ZXingScannerComponent;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */
var ZXingScannerModule = /** @class */ (function () {
    function ZXingScannerModule() {
    }
    ZXingScannerModule.decorators = [
        { type: NgModule, args: [{
                    imports: [
                        CommonModule,
                        FormsModule
                    ],
                    declarations: [ZXingScannerComponent],
                    exports: [ZXingScannerComponent],
                },] }
    ];
    return ZXingScannerModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */

export { ZXingScannerModule, ZXingScannerComponent };

//# sourceMappingURL=zxing-ngx-scanner.js.map