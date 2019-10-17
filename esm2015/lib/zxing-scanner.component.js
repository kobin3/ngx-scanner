/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ArgumentException, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserMultiFormatContinuousReader } from './browser-multi-format-continuous-reader';
export class ZXingScannerComponent {
    /**
     * Constructor to build the object and do some DI.
     */
    constructor() {
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
    /**
     * Exposes the current code reader, so the user can use it's APIs.
     * @return {?}
     */
    get codeReader() {
        return this._codeReader;
    }
    /**
     * User device input
     * @param {?} device
     * @return {?}
     */
    set device(device) {
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
    }
    /**
     * User device acessor.
     * @return {?}
     */
    get device() {
        return this._device;
    }
    /**
     * Returns all the registered formats.
     * @return {?}
     */
    get formats() {
        return this.hints.get(DecodeHintType.POSSIBLE_FORMATS);
    }
    /**
     * Registers formats the scanner should support.
     *
     * @param {?} input BarcodeFormat or case-insensitive string array.
     * @return {?}
     */
    set formats(input) {
        if (typeof input === 'string') {
            throw new Error('Invalid formats, make sure the [formats] input is a binding.');
        }
        // formats may be set from html template as BarcodeFormat or string array
        /** @type {?} */
        const formats = input.map(f => this.getBarcodeFormatOrFail(f));
        /** @type {?} */
        const hints = this.hints;
        // updates the hints
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        this.hints = hints;
    }
    /**
     * Returns all the registered hints.
     * @return {?}
     */
    get hints() {
        return this._hints;
    }
    /**
     * Does what it takes to set the hints.
     * @param {?} hints
     * @return {?}
     */
    set hints(hints) {
        this._hints = hints;
        // @note avoid restarting the code reader when possible
        // new instance with new hints.
        this.restart();
    }
    /**
     *
     * @param {?} state
     * @return {?}
     */
    set isAutostarting(state) {
        this._isAutostarting = state;
        this.autostarting.next(state);
    }
    /**
     *
     * @return {?}
     */
    get isAutstarting() {
        return this._isAutostarting;
    }
    /**
     * Allow start scan or not.
     * @param {?} on
     * @return {?}
     */
    set torch(on) {
        this.getCodeReader().setTorch(on);
    }
    /**
     * Allow start scan or not.
     * @param {?} enabled
     * @return {?}
     */
    set enable(enabled) {
        this._enabled = Boolean(enabled);
        if (!this._enabled) {
            this.reset();
        }
        else if (this.device) {
            this.scanFromDevice(this.device.deviceId);
        }
    }
    /**
     * Tells if the scanner is enabled or not.
     * @return {?}
     */
    get enabled() {
        return this._enabled;
    }
    /**
     * If is `tryHarder` enabled.
     * @return {?}
     */
    get tryHarder() {
        return this.hints.get(DecodeHintType.TRY_HARDER);
    }
    /**
     * Enable/disable tryHarder hint.
     * @param {?} enable
     * @return {?}
     */
    set tryHarder(enable) {
        /** @type {?} */
        const hints = this.hints;
        if (enable) {
            hints.set(DecodeHintType.TRY_HARDER, true);
        }
        else {
            hints.delete(DecodeHintType.TRY_HARDER);
        }
        this.hints = hints;
    }
    /**
     * Gets and registers all cammeras.
     * @return {?}
     */
    askForPermission() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.hasNavigator) {
                console.error('@zxing/ngx-scanner', 'Can\'t ask permission, navigator is not present.');
                this.setPermission(null);
                return this.hasPermission;
            }
            if (!this.isMediaDevicesSuported) {
                console.error('@zxing/ngx-scanner', 'Can\'t get user media, this is not supported.');
                this.setPermission(null);
                return this.hasPermission;
            }
            /** @type {?} */
            let stream;
            /** @type {?} */
            let permission;
            try {
                // Will try to ask for permission
                stream = yield this.getAnyVideoDevice();
                permission = !!stream;
            }
            catch (err) {
                return this.handlePermissionException(err);
            }
            finally {
                this.terminateStream(stream);
            }
            this.setPermission(permission);
            // Returns the permission
            return permission;
        });
    }
    /**
     *
     * @return {?}
     */
    getAnyVideoDevice() {
        return navigator.mediaDevices.getUserMedia({ video: true });
    }
    /**
     * Terminates a stream and it's tracks.
     * @param {?} stream
     * @return {?}
     */
    terminateStream(stream) {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
        stream = undefined;
    }
    /**
     * Initializes the component without starting the scanner.
     * @return {?}
     */
    initAutostartOff() {
        // do not ask for permission when autostart is off
        this.isAutostarting = null;
        // just update devices information
        this.updateVideoInputDevices();
    }
    /**
     * Initializes the component and starts the scanner.
     * Permissions are asked to accomplish that.
     * @return {?}
     */
    initAutostartOn() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.isAutostarting = true;
            /** @type {?} */
            let hasPermission;
            try {
                // Asks for permission before enumerating devices so it can get all the device's info
                hasPermission = yield this.askForPermission();
            }
            catch (e) {
                console.error('Exception occurred while asking for permission:', e);
                return;
            }
            // from this point, things gonna need permissions
            if (hasPermission) {
                /** @type {?} */
                const devices = yield this.updateVideoInputDevices();
                this.autostartScanner([...devices]);
            }
        });
    }
    /**
     * Checks if the given device is the current defined one.
     * @param {?} device
     * @return {?}
     */
    isCurrentDevice(device) {
        return this.device && device && device.deviceId === this.device.deviceId;
    }
    /**
     * Executed after the view initialization.
     * @return {?}
     */
    ngAfterViewInit() {
        // makes torch availability information available to user
        this.getCodeReader().isTorchAvailable.subscribe(x => this.torchCompatible.emit(x));
        if (!this.autostart) {
            console.warn('New feature \'autostart\' disabled, be careful. Permissions and devices recovery has to be run manually.');
            // does the necessary configuration without autostarting
            this.initAutostartOff();
            return;
        }
        // configurates the component and starts the scanner
        this.initAutostartOn();
    }
    /**
     * Executes some actions before destroy the component.
     * @return {?}
     */
    ngOnDestroy() {
        this.reset();
    }
    /**
     * Stops old `codeReader` and starts scanning in a new one.
     * @return {?}
     */
    restart() {
        /** @type {?} */
        const prevDevice = this._reset();
        if (!prevDevice) {
            return;
        }
        // @note apenas necessario por enquanto causa da Torch
        this._codeReader = undefined;
        this.device = prevDevice;
    }
    /**
     * Discovers and updates known video input devices.
     * @return {?}
     */
    updateVideoInputDevices() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // permissions aren't needed to get devices, but to access them and their info
            /** @type {?} */
            const devices = (yield this.getCodeReader().listVideoInputDevices()) || [];
            /** @type {?} */
            const hasDevices = devices && devices.length > 0;
            // stores discovered devices and updates information
            this.hasDevices.next(hasDevices);
            this.camerasFound.next([...devices]);
            if (!hasDevices) {
                this.camerasNotFound.next();
            }
            return devices;
        });
    }
    /**
     * Starts the scanner with the back camera otherwise take the last
     * available device.
     * @param {?} devices
     * @return {?}
     */
    autostartScanner(devices) {
        /** @type {?} */
        const matcher = ({ label }) => /back|trás|rear|traseira|environment|ambiente/gi.test(label);
        // select the rear camera by default, otherwise take the last camera.
        /** @type {?} */
        const device = devices.find(matcher) || devices.pop();
        if (!device) {
            throw new Error('Impossible to autostart, no input devices available.');
        }
        this.device = device;
        // @note when listening to this change, callback code will sometimes run before the previous line.
        this.deviceChange.emit(device);
        this.isAutostarting = false;
        this.autostarted.next();
    }
    /**
     * Dispatches the scan success event.
     *
     * @param {?} result the scan result.
     * @return {?}
     */
    dispatchScanSuccess(result) {
        this.scanSuccess.next(result.getText());
    }
    /**
     * Dispatches the scan failure event.
     * @param {?=} reason
     * @return {?}
     */
    dispatchScanFailure(reason) {
        this.scanFailure.next(reason);
    }
    /**
     * Dispatches the scan error event.
     *
     * @param {?} error the error thing.
     * @return {?}
     */
    dispatchScanError(error) {
        this.scanError.next(error);
    }
    /**
     * Dispatches the scan event.
     *
     * @param {?} result the scan result.
     * @return {?}
     */
    dispatchScanComplete(result) {
        this.scanComplete.next(result);
    }
    /**
     * Returns the filtered permission.
     * @param {?} err
     * @return {?}
     */
    handlePermissionException(err) {
        // failed to grant permission to video input
        console.error('@zxing/ngx-scanner', 'Error when asking for permission.', err);
        /** @type {?} */
        let permission;
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
    }
    /**
     * Returns a valid BarcodeFormat or fails.
     * @param {?} format
     * @return {?}
     */
    getBarcodeFormatOrFail(format) {
        return typeof format === 'string'
            ? BarcodeFormat[format.trim().toUpperCase()]
            : format;
    }
    /**
     * Retorna um code reader, cria um se nenhume existe.
     * @return {?}
     */
    getCodeReader() {
        if (!this._codeReader) {
            this._codeReader = new BrowserMultiFormatContinuousReader(this.hints);
        }
        return this._codeReader;
    }
    /**
     * Starts the continuous scanning for the given device.
     *
     * @param {?} deviceId The deviceId from the device.
     * @return {?}
     */
    scanFromDevice(deviceId) {
        /** @type {?} */
        const videoElement = this.previewElemRef.nativeElement;
        /** @type {?} */
        const codeReader = this.getCodeReader();
        /** @type {?} */
        const decodingStream = codeReader.continuousDecodeFromInputVideoDevice(deviceId, videoElement);
        if (!decodingStream) {
            throw new Error('Undefined decoding stream, aborting.');
        }
        /** @type {?} */
        const next = (x) => this._onDecodeResult(x.result, x.error);
        /** @type {?} */
        const error = (err) => this._onDecodeError(err);
        /** @type {?} */
        const complete = () => { this.reset(); console.log('completed'); };
        decodingStream.subscribe(next, error, complete);
    }
    /**
     * Handles decode errors.
     * @param {?} err
     * @return {?}
     */
    _onDecodeError(err) {
        this.dispatchScanError(err);
        this.reset();
    }
    /**
     * Handles decode results.
     * @param {?} result
     * @param {?} error
     * @return {?}
     */
    _onDecodeResult(result, error) {
        if (result) {
            this.dispatchScanSuccess(result);
        }
        else {
            this.dispatchScanFailure(error);
        }
        this.dispatchScanComplete(result);
    }
    /**
     * Stops the code reader and returns the previous selected device.
     * @return {?}
     */
    _reset() {
        if (!this._codeReader) {
            return;
        }
        /** @type {?} */
        const device = this.device;
        // do not set this.device inside this method, it would create a recursive loop
        this._device = null;
        this._codeReader.reset();
        return device;
    }
    /**
     * Resets the scanner and emits device change.
     * @return {?}
     */
    reset() {
        this._reset();
        this.deviceChange.emit(null);
    }
    /**
     * Sets the permission value and emmits the event.
     * @param {?} hasPermission
     * @return {?}
     */
    setPermission(hasPermission) {
        this.hasPermission = hasPermission;
        this.permissionResponse.next(hasPermission);
    }
}
ZXingScannerComponent.decorators = [
    { type: Component, args: [{
                selector: 'zxing-scanner',
                template: "<video #preview [style.object-fit]=\"previewFitMode\">\r\n  <p>\r\n    Your browser does not support this feature, please try to upgrade it.\r\n  </p>\r\n  <p>\r\n    Seu navegador n\u00E3o suporta este recurso, por favor tente atualiz\u00E1-lo.\r\n  </p>\r\n</video>\r\n",
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [":host{display:block}video{width:100%;height:auto;-o-object-fit:contain;object-fit:contain}"]
            }] }
];
/** @nocollapse */
ZXingScannerComponent.ctorParameters = () => [];
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
if (false) {
    /**
     * Supported Hints map.
     * @type {?}
     */
    ZXingScannerComponent.prototype._hints;
    /**
     * The ZXing code reader.
     * @type {?}
     */
    ZXingScannerComponent.prototype._codeReader;
    /**
     * The device that should be used to scan things.
     * @type {?}
     */
    ZXingScannerComponent.prototype._device;
    /**
     * The device that should be used to scan things.
     * @type {?}
     */
    ZXingScannerComponent.prototype._enabled;
    /**
     *
     * @type {?}
     */
    ZXingScannerComponent.prototype._isAutostarting;
    /**
     * Has `navigator` access.
     * @type {?}
     */
    ZXingScannerComponent.prototype.hasNavigator;
    /**
     * Says if some native API is supported.
     * @type {?}
     */
    ZXingScannerComponent.prototype.isMediaDevicesSuported;
    /**
     * If the user-agent allowed the use of the camera or not.
     * @type {?}
     */
    ZXingScannerComponent.prototype.hasPermission;
    /**
     * Reference to the preview element, should be the `video` tag.
     * @type {?}
     */
    ZXingScannerComponent.prototype.previewElemRef;
    /**
     * Enable or disable autofocus of the camera (might have an impact on performance)
     * @type {?}
     */
    ZXingScannerComponent.prototype.autofocusEnabled;
    /**
     * Emits when and if the scanner is autostarted.
     * @type {?}
     */
    ZXingScannerComponent.prototype.autostarted;
    /**
     * True during autostart and false after. It will be null if won't autostart at all.
     * @type {?}
     */
    ZXingScannerComponent.prototype.autostarting;
    /**
     * If the scanner should autostart with the first available device.
     * @type {?}
     */
    ZXingScannerComponent.prototype.autostart;
    /**
     * How the preview element shoud be fit inside the :host container.
     * @type {?}
     */
    ZXingScannerComponent.prototype.previewFitMode;
    /**
     * Emitts events when the torch compatibility is changed.
     * @type {?}
     */
    ZXingScannerComponent.prototype.torchCompatible;
    /**
     * Emitts events when a scan is successful performed, will inject the string value of the QR-code to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.scanSuccess;
    /**
     * Emitts events when a scan fails without errors, usefull to know how much scan tries where made.
     * @type {?}
     */
    ZXingScannerComponent.prototype.scanFailure;
    /**
     * Emitts events when a scan throws some error, will inject the error to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.scanError;
    /**
     * Emitts events when a scan is performed, will inject the Result value of the QR-code scan (if available) to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.scanComplete;
    /**
     * Emitts events when no cameras are found, will inject an exception (if available) to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.camerasFound;
    /**
     * Emitts events when no cameras are found, will inject an exception (if available) to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.camerasNotFound;
    /**
     * Emitts events when the users answers for permission.
     * @type {?}
     */
    ZXingScannerComponent.prototype.permissionResponse;
    /**
     * Emitts events when has devices status is update.
     * @type {?}
     */
    ZXingScannerComponent.prototype.hasDevices;
    /**
     * Emits when the current device is changed.
     * @type {?}
     */
    ZXingScannerComponent.prototype.deviceChange;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoienhpbmctc2Nhbm5lci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aenhpbmcvbmd4LXNjYW5uZXIvIiwic291cmNlcyI6WyJsaWIvenhpbmctc2Nhbm5lci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBRUwsdUJBQXVCLEVBQ3ZCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLEtBQUssRUFFTCxNQUFNLEVBQ04sU0FBUyxFQUVWLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFDTCxpQkFBaUIsRUFDakIsYUFBYSxFQUNiLGNBQWMsRUFHZixNQUFNLGdCQUFnQixDQUFDO0FBRXhCLE9BQU8sRUFBRSxrQ0FBa0MsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBUzlGLE1BQU0sT0FBTyxxQkFBcUI7Ozs7SUE2VGhDOzs7O1FBalBBLG1CQUFjLEdBQXlELE9BQU8sQ0FBQztRQWtQN0UsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN2QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJ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SzFCLGdEQUFpQzs7Ozs7SUFLakMsNkNBQThCOzs7OztJQUs5Qix1REFBd0M7Ozs7O0lBS3hDLDhDQUFzQzs7Ozs7SUFLdEMsK0NBQzZDOzs7OztJQUs3QyxpREFDMEI7Ozs7O0lBSzFCLDRDQUNnQzs7Ozs7SUFLaEMsNkNBQzJDOzs7OztJQUszQywwQ0FDbUI7Ozs7O0lBS25CLCtDQUMrRTs7Ozs7SUFLL0UsZ0RBQ3VDOzs7OztJQUt2Qyw0Q0FDa0M7Ozs7O0lBS2xDLDRDQUNpRDs7Ozs7SUFLakQsMENBQytCOzs7OztJQUsvQiw2Q0FDbUM7Ozs7O0lBS25DLDZDQUM4Qzs7Ozs7SUFLOUMsZ0RBQ21DOzs7OztJQUtuQyxtREFDMEM7Ozs7O0lBSzFDLDJDQUNrQzs7Ozs7SUF1RGxDLDZDQUM0QyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgQWZ0ZXJWaWV3SW5pdCxcclxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcclxuICBDb21wb25lbnQsXHJcbiAgRWxlbWVudFJlZixcclxuICBFdmVudEVtaXR0ZXIsXHJcbiAgSW5wdXQsXHJcbiAgT25EZXN0cm95LFxyXG4gIE91dHB1dCxcclxuICBWaWV3Q2hpbGQsXHJcbiAgTmdab25lXHJcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcblxyXG5pbXBvcnQge1xyXG4gIEFyZ3VtZW50RXhjZXB0aW9uLFxyXG4gIEJhcmNvZGVGb3JtYXQsXHJcbiAgRGVjb2RlSGludFR5cGUsXHJcbiAgRXhjZXB0aW9uLFxyXG4gIFJlc3VsdFxyXG59IGZyb20gJ0B6eGluZy9saWJyYXJ5JztcclxuXHJcbmltcG9ydCB7IEJyb3dzZXJNdWx0aUZvcm1hdENvbnRpbnVvdXNSZWFkZXIgfSBmcm9tICcuL2Jyb3dzZXItbXVsdGktZm9ybWF0LWNvbnRpbnVvdXMtcmVhZGVyJztcclxuaW1wb3J0IHsgUmVzdWx0QW5kRXJyb3IgfSBmcm9tICcuL1Jlc3VsdEFuZEVycm9yJztcclxuXHJcbkBDb21wb25lbnQoe1xyXG4gIHNlbGVjdG9yOiAnenhpbmctc2Nhbm5lcicsXHJcbiAgdGVtcGxhdGVVcmw6ICcuL3p4aW5nLXNjYW5uZXIuY29tcG9uZW50Lmh0bWwnLFxyXG4gIHN0eWxlVXJsczogWycuL3p4aW5nLXNjYW5uZXIuY29tcG9uZW50LnNjc3MnXSxcclxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxyXG59KVxyXG5leHBvcnQgY2xhc3MgWlhpbmdTY2FubmVyQ29tcG9uZW50IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcclxuXHJcbiAgLyoqXHJcbiAgICogU3VwcG9ydGVkIEhpbnRzIG1hcC5cclxuICAgKi9cclxuICBwcml2YXRlIF9oaW50czogTWFwPERlY29kZUhpbnRUeXBlLCBhbnk+IHwgbnVsbDtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIFpYaW5nIGNvZGUgcmVhZGVyLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2NvZGVSZWFkZXI6IEJyb3dzZXJNdWx0aUZvcm1hdENvbnRpbnVvdXNSZWFkZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBkZXZpY2UgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBzY2FuIHRoaW5ncy5cclxuICAgKi9cclxuICBwcml2YXRlIF9kZXZpY2U6IE1lZGlhRGV2aWNlSW5mbztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGRldmljZSB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIHNjYW4gdGhpbmdzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2VuYWJsZWQ6IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfaXNBdXRvc3RhcnRpbmc6IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhcyBgbmF2aWdhdG9yYCBhY2Nlc3MuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYXNOYXZpZ2F0b3I6IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqIFNheXMgaWYgc29tZSBuYXRpdmUgQVBJIGlzIHN1cHBvcnRlZC5cclxuICAgKi9cclxuICBwcml2YXRlIGlzTWVkaWFEZXZpY2VzU3Vwb3J0ZWQ6IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoZSB1c2VyLWFnZW50IGFsbG93ZWQgdGhlIHVzZSBvZiB0aGUgY2FtZXJhIG9yIG5vdC5cclxuICAgKi9cclxuICBwcml2YXRlIGhhc1Blcm1pc3Npb246IGJvb2xlYW4gfCBudWxsO1xyXG5cclxuICAvKipcclxuICAgKiBSZWZlcmVuY2UgdG8gdGhlIHByZXZpZXcgZWxlbWVudCwgc2hvdWxkIGJlIHRoZSBgdmlkZW9gIHRhZy5cclxuICAgKi9cclxuICBAVmlld0NoaWxkKCdwcmV2aWV3JylcclxuICBwcmV2aWV3RWxlbVJlZjogRWxlbWVudFJlZjxIVE1MVmlkZW9FbGVtZW50PjtcclxuXHJcbiAgLyoqXHJcbiAgICogRW5hYmxlIG9yIGRpc2FibGUgYXV0b2ZvY3VzIG9mIHRoZSBjYW1lcmEgKG1pZ2h0IGhhdmUgYW4gaW1wYWN0IG9uIHBlcmZvcm1hbmNlKVxyXG4gICAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgYXV0b2ZvY3VzRW5hYmxlZDogYm9vbGVhbjtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHMgd2hlbiBhbmQgaWYgdGhlIHNjYW5uZXIgaXMgYXV0b3N0YXJ0ZWQuXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgYXV0b3N0YXJ0ZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPjtcclxuXHJcbiAgLyoqXHJcbiAgICogVHJ1ZSBkdXJpbmcgYXV0b3N0YXJ0IGFuZCBmYWxzZSBhZnRlci4gSXQgd2lsbCBiZSBudWxsIGlmIHdvbid0IGF1dG9zdGFydCBhdCBhbGwuXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgYXV0b3N0YXJ0aW5nOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbiB8IG51bGw+O1xyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGUgc2Nhbm5lciBzaG91bGQgYXV0b3N0YXJ0IHdpdGggdGhlIGZpcnN0IGF2YWlsYWJsZSBkZXZpY2UuXHJcbiAgICovXHJcbiAgQElucHV0KClcclxuICBhdXRvc3RhcnQ6IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqIEhvdyB0aGUgcHJldmlldyBlbGVtZW50IHNob3VkIGJlIGZpdCBpbnNpZGUgdGhlIDpob3N0IGNvbnRhaW5lci5cclxuICAgKi9cclxuICBASW5wdXQoKVxyXG4gIHByZXZpZXdGaXRNb2RlOiAnZmlsbCcgfCAnY29udGFpbicgfCAnY292ZXInIHwgJ3NjYWxlLWRvd24nIHwgJ25vbmUnID0gJ2NvdmVyJztcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIHRoZSB0b3JjaCBjb21wYXRpYmlsaXR5IGlzIGNoYW5nZWQuXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgdG9yY2hDb21wYXRpYmxlOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj47XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBhIHNjYW4gaXMgc3VjY2Vzc2Z1bCBwZXJmb3JtZWQsIHdpbGwgaW5qZWN0IHRoZSBzdHJpbmcgdmFsdWUgb2YgdGhlIFFSLWNvZGUgdG8gdGhlIGNhbGxiYWNrLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIHNjYW5TdWNjZXNzOiBFdmVudEVtaXR0ZXI8c3RyaW5nPjtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIGEgc2NhbiBmYWlscyB3aXRob3V0IGVycm9ycywgdXNlZnVsbCB0byBrbm93IGhvdyBtdWNoIHNjYW4gdHJpZXMgd2hlcmUgbWFkZS5cclxuICAgKi9cclxuICBAT3V0cHV0KClcclxuICBzY2FuRmFpbHVyZTogRXZlbnRFbWl0dGVyPEV4Y2VwdGlvbiB8IHVuZGVmaW5lZD47XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBhIHNjYW4gdGhyb3dzIHNvbWUgZXJyb3IsIHdpbGwgaW5qZWN0IHRoZSBlcnJvciB0byB0aGUgY2FsbGJhY2suXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgc2NhbkVycm9yOiBFdmVudEVtaXR0ZXI8RXJyb3I+O1xyXG5cclxuICAvKipcclxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gYSBzY2FuIGlzIHBlcmZvcm1lZCwgd2lsbCBpbmplY3QgdGhlIFJlc3VsdCB2YWx1ZSBvZiB0aGUgUVItY29kZSBzY2FuIChpZiBhdmFpbGFibGUpIHRvIHRoZSBjYWxsYmFjay5cclxuICAgKi9cclxuICBAT3V0cHV0KClcclxuICBzY2FuQ29tcGxldGU6IEV2ZW50RW1pdHRlcjxSZXN1bHQ+O1xyXG5cclxuICAvKipcclxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gbm8gY2FtZXJhcyBhcmUgZm91bmQsIHdpbGwgaW5qZWN0IGFuIGV4Y2VwdGlvbiAoaWYgYXZhaWxhYmxlKSB0byB0aGUgY2FsbGJhY2suXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgY2FtZXJhc0ZvdW5kOiBFdmVudEVtaXR0ZXI8TWVkaWFEZXZpY2VJbmZvW10+O1xyXG5cclxuICAvKipcclxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gbm8gY2FtZXJhcyBhcmUgZm91bmQsIHdpbGwgaW5qZWN0IGFuIGV4Y2VwdGlvbiAoaWYgYXZhaWxhYmxlKSB0byB0aGUgY2FsbGJhY2suXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgY2FtZXJhc05vdEZvdW5kOiBFdmVudEVtaXR0ZXI8YW55PjtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIHRoZSB1c2VycyBhbnN3ZXJzIGZvciBwZXJtaXNzaW9uLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIHBlcm1pc3Npb25SZXNwb25zZTogRXZlbnRFbWl0dGVyPGJvb2xlYW4+O1xyXG5cclxuICAvKipcclxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gaGFzIGRldmljZXMgc3RhdHVzIGlzIHVwZGF0ZS5cclxuICAgKi9cclxuICBAT3V0cHV0KClcclxuICBoYXNEZXZpY2VzOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj47XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4cG9zZXMgdGhlIGN1cnJlbnQgY29kZSByZWFkZXIsIHNvIHRoZSB1c2VyIGNhbiB1c2UgaXQncyBBUElzLlxyXG4gICAqL1xyXG4gIGdldCBjb2RlUmVhZGVyKCk6IEJyb3dzZXJNdWx0aUZvcm1hdENvbnRpbnVvdXNSZWFkZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NvZGVSZWFkZXI7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2VyIGRldmljZSBpbnB1dFxyXG4gICAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgc2V0IGRldmljZShkZXZpY2U6IE1lZGlhRGV2aWNlSW5mbyB8IG51bGwpIHtcclxuXHJcbiAgICBpZiAoIWRldmljZSAmJiBkZXZpY2UgIT09IG51bGwpIHtcclxuICAgICAgdGhyb3cgbmV3IEFyZ3VtZW50RXhjZXB0aW9uKCdUaGUgYGRldmljZWAgbXVzdCBiZSBhIHZhbGlkIE1lZGlhRGV2aWNlSW5mbyBvciBudWxsLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmlzQ3VycmVudERldmljZShkZXZpY2UpKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignU2V0dGluZyB0aGUgc2FtZSBkZXZpY2UgaXMgbm90IGFsbG93ZWQuJyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5pc0F1dG9zdGFydGluZykge1xyXG4gICAgICAvLyBkbyBub3QgYWxsb3cgc2V0dGluZyBkZXZpY2VzIGR1cmluZyBhdXRvLXN0YXJ0LCBzaW5jZSBpdCB3aWxsIHNldCBvbmUgYW5kIGVtaXQgaXQuXHJcbiAgICAgIGNvbnNvbGUud2FybignQXZvaWQgc2V0dGluZyBhIGRldmljZSBkdXJpbmcgYXV0by1zdGFydC4nKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5oYXNQZXJtaXNzaW9uKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignUGVybWlzc2lvbnMgbm90IHNldCB5ZXQsIHdhaXRpbmcgZm9yIHRoZW0gdG8gYmUgc2V0IHRvIGFwcGx5IGRldmljZSBjaGFuZ2UuJyk7XHJcbiAgICAgIC8vIHRoaXMucGVybWlzc2lvblJlc3BvbnNlXHJcbiAgICAgIC8vICAgLnBpcGUoXHJcbiAgICAgIC8vICAgICB0YWtlKDEpLFxyXG4gICAgICAvLyAgICAgdGFwKCgpID0+IGNvbnNvbGUubG9nKGBQZXJtaXNzaW9ucyBzZXQsIGFwcGx5aW5nIGRldmljZSBjaGFuZ2Uke2RldmljZSA/IGAgKCR7ZGV2aWNlLmRldmljZUlkfSlgIDogJyd9LmApKVxyXG4gICAgICAvLyAgIClcclxuICAgICAgLy8gICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuZGV2aWNlID0gZGV2aWNlKTtcclxuICAgICAgLy8gcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGluIG9yZGVyIHRvIGNoYW5nZSB0aGUgZGV2aWNlIHRoZSBjb2RlUmVhZGVyIGdvdHRhIGJlIHJlc2V0ZWRcclxuICAgIHRoaXMuX3Jlc2V0KCk7XHJcblxyXG4gICAgdGhpcy5fZGV2aWNlID0gZGV2aWNlO1xyXG5cclxuICAgIC8vIGlmIGVuYWJsZWQsIHN0YXJ0cyBzY2FubmluZ1xyXG4gICAgaWYgKHRoaXMuX2VuYWJsZWQgJiYgZGV2aWNlICE9PSBudWxsKSB7XHJcbiAgICAgIHRoaXMuc2NhbkZyb21EZXZpY2UoZGV2aWNlLmRldmljZUlkKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXRzIHdoZW4gdGhlIGN1cnJlbnQgZGV2aWNlIGlzIGNoYW5nZWQuXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgZGV2aWNlQ2hhbmdlOiBFdmVudEVtaXR0ZXI8TWVkaWFEZXZpY2VJbmZvPjtcclxuXHJcbiAgLyoqXHJcbiAgICogVXNlciBkZXZpY2UgYWNlc3Nvci5cclxuICAgKi9cclxuICBnZXQgZGV2aWNlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2RldmljZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYWxsIHRoZSByZWdpc3RlcmVkIGZvcm1hdHMuXHJcbiAgICovXHJcbiAgZ2V0IGZvcm1hdHMoKTogQmFyY29kZUZvcm1hdFtdIHtcclxuICAgIHJldHVybiB0aGlzLmhpbnRzLmdldChEZWNvZGVIaW50VHlwZS5QT1NTSUJMRV9GT1JNQVRTKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVycyBmb3JtYXRzIHRoZSBzY2FubmVyIHNob3VsZCBzdXBwb3J0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGlucHV0IEJhcmNvZGVGb3JtYXQgb3IgY2FzZS1pbnNlbnNpdGl2ZSBzdHJpbmcgYXJyYXkuXHJcbiAgICovXHJcbiAgQElucHV0KClcclxuICBzZXQgZm9ybWF0cyhpbnB1dDogQmFyY29kZUZvcm1hdFtdKSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGZvcm1hdHMsIG1ha2Ugc3VyZSB0aGUgW2Zvcm1hdHNdIGlucHV0IGlzIGEgYmluZGluZy4nKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBmb3JtYXRzIG1heSBiZSBzZXQgZnJvbSBodG1sIHRlbXBsYXRlIGFzIEJhcmNvZGVGb3JtYXQgb3Igc3RyaW5nIGFycmF5XHJcbiAgICBjb25zdCBmb3JtYXRzID0gaW5wdXQubWFwKGYgPT4gdGhpcy5nZXRCYXJjb2RlRm9ybWF0T3JGYWlsKGYpKTtcclxuXHJcbiAgICBjb25zdCBoaW50cyA9IHRoaXMuaGludHM7XHJcblxyXG4gICAgLy8gdXBkYXRlcyB0aGUgaGludHNcclxuICAgIGhpbnRzLnNldChEZWNvZGVIaW50VHlwZS5QT1NTSUJMRV9GT1JNQVRTLCBmb3JtYXRzKTtcclxuXHJcbiAgICB0aGlzLmhpbnRzID0gaGludHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFsbCB0aGUgcmVnaXN0ZXJlZCBoaW50cy5cclxuICAgKi9cclxuICBnZXQgaGludHMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5faGludHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEb2VzIHdoYXQgaXQgdGFrZXMgdG8gc2V0IHRoZSBoaW50cy5cclxuICAgKi9cclxuICBzZXQgaGludHMoaGludHM6IE1hcDxEZWNvZGVIaW50VHlwZSwgYW55Pikge1xyXG5cclxuICAgIHRoaXMuX2hpbnRzID0gaGludHM7XHJcblxyXG4gICAgLy8gQG5vdGUgYXZvaWQgcmVzdGFydGluZyB0aGUgY29kZSByZWFkZXIgd2hlbiBwb3NzaWJsZVxyXG5cclxuICAgIC8vIG5ldyBpbnN0YW5jZSB3aXRoIG5ldyBoaW50cy5cclxuICAgIHRoaXMucmVzdGFydCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKi9cclxuICBzZXQgaXNBdXRvc3RhcnRpbmcoc3RhdGU6IGJvb2xlYW4gfCBudWxsKSB7XHJcbiAgICB0aGlzLl9pc0F1dG9zdGFydGluZyA9IHN0YXRlO1xyXG4gICAgdGhpcy5hdXRvc3RhcnRpbmcubmV4dChzdGF0ZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqL1xyXG4gIGdldCBpc0F1dHN0YXJ0aW5nKCk6IGJvb2xlYW4gfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9pc0F1dG9zdGFydGluZztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsbG93IHN0YXJ0IHNjYW4gb3Igbm90LlxyXG4gICAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgc2V0IHRvcmNoKG9uOiBib29sZWFuKSB7XHJcbiAgICB0aGlzLmdldENvZGVSZWFkZXIoKS5zZXRUb3JjaChvbik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGxvdyBzdGFydCBzY2FuIG9yIG5vdC5cclxuICAgKi9cclxuICBASW5wdXQoKVxyXG4gIHNldCBlbmFibGUoZW5hYmxlZDogYm9vbGVhbikge1xyXG5cclxuICAgIHRoaXMuX2VuYWJsZWQgPSBCb29sZWFuKGVuYWJsZWQpO1xyXG5cclxuICAgIGlmICghdGhpcy5fZW5hYmxlZCkge1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuZGV2aWNlKSB7XHJcbiAgICAgIHRoaXMuc2NhbkZyb21EZXZpY2UodGhpcy5kZXZpY2UuZGV2aWNlSWQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGVsbHMgaWYgdGhlIHNjYW5uZXIgaXMgZW5hYmxlZCBvciBub3QuXHJcbiAgICovXHJcbiAgZ2V0IGVuYWJsZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fZW5hYmxlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIGlzIGB0cnlIYXJkZXJgIGVuYWJsZWQuXHJcbiAgICovXHJcbiAgZ2V0IHRyeUhhcmRlcigpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmhpbnRzLmdldChEZWNvZGVIaW50VHlwZS5UUllfSEFSREVSKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuYWJsZS9kaXNhYmxlIHRyeUhhcmRlciBoaW50LlxyXG4gICAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgc2V0IHRyeUhhcmRlcihlbmFibGU6IGJvb2xlYW4pIHtcclxuXHJcbiAgICBjb25zdCBoaW50cyA9IHRoaXMuaGludHM7XHJcblxyXG4gICAgaWYgKGVuYWJsZSkge1xyXG4gICAgICBoaW50cy5zZXQoRGVjb2RlSGludFR5cGUuVFJZX0hBUkRFUiwgdHJ1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoaW50cy5kZWxldGUoRGVjb2RlSGludFR5cGUuVFJZX0hBUkRFUik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5oaW50cyA9IGhpbnRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0b3IgdG8gYnVpbGQgdGhlIG9iamVjdCBhbmQgZG8gc29tZSBESS5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIC8vIGluc3RhbmNlIGJhc2VkIGVtaXR0ZXJzXHJcbiAgICB0aGlzLmF1dG9zdGFydGVkID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG4gICAgdGhpcy5hdXRvc3RhcnRpbmcgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcbiAgICB0aGlzLnRvcmNoQ29tcGF0aWJsZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuICAgIHRoaXMuc2NhblN1Y2Nlc3MgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcbiAgICB0aGlzLnNjYW5GYWlsdXJlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG4gICAgdGhpcy5zY2FuRXJyb3IgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcbiAgICB0aGlzLnNjYW5Db21wbGV0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuICAgIHRoaXMuY2FtZXJhc0ZvdW5kID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG4gICAgdGhpcy5jYW1lcmFzTm90Rm91bmQgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcbiAgICB0aGlzLnBlcm1pc3Npb25SZXNwb25zZSA9IG5ldyBFdmVudEVtaXR0ZXIodHJ1ZSk7XHJcbiAgICB0aGlzLmhhc0RldmljZXMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcbiAgICB0aGlzLmRldmljZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuXHJcbiAgICB0aGlzLl9kZXZpY2UgPSBudWxsO1xyXG4gICAgdGhpcy5fZW5hYmxlZCA9IHRydWU7XHJcbiAgICB0aGlzLl9oaW50cyA9IG5ldyBNYXA8RGVjb2RlSGludFR5cGUsIGFueT4oKTtcclxuICAgIHRoaXMuYXV0b2ZvY3VzRW5hYmxlZCA9IHRydWU7XHJcbiAgICB0aGlzLmF1dG9zdGFydCA9IHRydWU7XHJcbiAgICB0aGlzLmZvcm1hdHMgPSBbQmFyY29kZUZvcm1hdC5RUl9DT0RFXTtcclxuXHJcbiAgICAvLyBjb21wdXRlZCBkYXRhXHJcbiAgICB0aGlzLmhhc05hdmlnYXRvciA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnO1xyXG4gICAgdGhpcy5pc01lZGlhRGV2aWNlc1N1cG9ydGVkID0gdGhpcy5oYXNOYXZpZ2F0b3IgJiYgISFuYXZpZ2F0b3IubWVkaWFEZXZpY2VzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyBhbmQgcmVnaXN0ZXJzIGFsbCBjYW1tZXJhcy5cclxuICAgKi9cclxuICBhc3luYyBhc2tGb3JQZXJtaXNzaW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG5cclxuICAgIGlmICghdGhpcy5oYXNOYXZpZ2F0b3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignQHp4aW5nL25neC1zY2FubmVyJywgJ0NhblxcJ3QgYXNrIHBlcm1pc3Npb24sIG5hdmlnYXRvciBpcyBub3QgcHJlc2VudC4nKTtcclxuICAgICAgdGhpcy5zZXRQZXJtaXNzaW9uKG51bGwpO1xyXG4gICAgICByZXR1cm4gdGhpcy5oYXNQZXJtaXNzaW9uO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5pc01lZGlhRGV2aWNlc1N1cG9ydGVkKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0B6eGluZy9uZ3gtc2Nhbm5lcicsICdDYW5cXCd0IGdldCB1c2VyIG1lZGlhLCB0aGlzIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XHJcbiAgICAgIHRoaXMuc2V0UGVybWlzc2lvbihudWxsKTtcclxuICAgICAgcmV0dXJuIHRoaXMuaGFzUGVybWlzc2lvbjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc3RyZWFtOiBNZWRpYVN0cmVhbTtcclxuICAgIGxldCBwZXJtaXNzaW9uOiBib29sZWFuO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIFdpbGwgdHJ5IHRvIGFzayBmb3IgcGVybWlzc2lvblxyXG4gICAgICBzdHJlYW0gPSBhd2FpdCB0aGlzLmdldEFueVZpZGVvRGV2aWNlKCk7XHJcbiAgICAgIHBlcm1pc3Npb24gPSAhIXN0cmVhbTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gdGhpcy5oYW5kbGVQZXJtaXNzaW9uRXhjZXB0aW9uKGVycik7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICB0aGlzLnRlcm1pbmF0ZVN0cmVhbShzdHJlYW0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2V0UGVybWlzc2lvbihwZXJtaXNzaW9uKTtcclxuXHJcbiAgICAvLyBSZXR1cm5zIHRoZSBwZXJtaXNzaW9uXHJcbiAgICByZXR1cm4gcGVybWlzc2lvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICovXHJcbiAgZ2V0QW55VmlkZW9EZXZpY2UoKTogUHJvbWlzZTxNZWRpYVN0cmVhbT4ge1xyXG4gICAgcmV0dXJuIG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgdmlkZW86IHRydWUgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUZXJtaW5hdGVzIGEgc3RyZWFtIGFuZCBpdCdzIHRyYWNrcy5cclxuICAgKi9cclxuICBwcml2YXRlIHRlcm1pbmF0ZVN0cmVhbShzdHJlYW06IE1lZGlhU3RyZWFtKSB7XHJcblxyXG4gICAgaWYgKHN0cmVhbSkge1xyXG4gICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHQuc3RvcCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgY29tcG9uZW50IHdpdGhvdXQgc3RhcnRpbmcgdGhlIHNjYW5uZXIuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpbml0QXV0b3N0YXJ0T2ZmKCk6IHZvaWQge1xyXG5cclxuICAgIC8vIGRvIG5vdCBhc2sgZm9yIHBlcm1pc3Npb24gd2hlbiBhdXRvc3RhcnQgaXMgb2ZmXHJcbiAgICB0aGlzLmlzQXV0b3N0YXJ0aW5nID0gbnVsbDtcclxuXHJcbiAgICAvLyBqdXN0IHVwZGF0ZSBkZXZpY2VzIGluZm9ybWF0aW9uXHJcbiAgICB0aGlzLnVwZGF0ZVZpZGVvSW5wdXREZXZpY2VzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgY29tcG9uZW50IGFuZCBzdGFydHMgdGhlIHNjYW5uZXIuXHJcbiAgICogUGVybWlzc2lvbnMgYXJlIGFza2VkIHRvIGFjY29tcGxpc2ggdGhhdC5cclxuICAgKi9cclxuICBwcml2YXRlIGFzeW5jIGluaXRBdXRvc3RhcnRPbigpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgICB0aGlzLmlzQXV0b3N0YXJ0aW5nID0gdHJ1ZTtcclxuXHJcbiAgICBsZXQgaGFzUGVybWlzc2lvbjogYm9vbGVhbjtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBBc2tzIGZvciBwZXJtaXNzaW9uIGJlZm9yZSBlbnVtZXJhdGluZyBkZXZpY2VzIHNvIGl0IGNhbiBnZXQgYWxsIHRoZSBkZXZpY2UncyBpbmZvXHJcbiAgICAgIGhhc1Blcm1pc3Npb24gPSBhd2FpdCB0aGlzLmFza0ZvclBlcm1pc3Npb24oKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignRXhjZXB0aW9uIG9jY3VycmVkIHdoaWxlIGFza2luZyBmb3IgcGVybWlzc2lvbjonLCBlKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZyb20gdGhpcyBwb2ludCwgdGhpbmdzIGdvbm5hIG5lZWQgcGVybWlzc2lvbnNcclxuICAgIGlmIChoYXNQZXJtaXNzaW9uKSB7XHJcbiAgICAgIGNvbnN0IGRldmljZXMgPSBhd2FpdCB0aGlzLnVwZGF0ZVZpZGVvSW5wdXREZXZpY2VzKCk7XHJcbiAgICAgIHRoaXMuYXV0b3N0YXJ0U2Nhbm5lcihbLi4uZGV2aWNlc10pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIGlmIHRoZSBnaXZlbiBkZXZpY2UgaXMgdGhlIGN1cnJlbnQgZGVmaW5lZCBvbmUuXHJcbiAgICovXHJcbiAgaXNDdXJyZW50RGV2aWNlKGRldmljZTogTWVkaWFEZXZpY2VJbmZvKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kZXZpY2UgJiYgZGV2aWNlICYmIGRldmljZS5kZXZpY2VJZCA9PT0gdGhpcy5kZXZpY2UuZGV2aWNlSWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeGVjdXRlZCBhZnRlciB0aGUgdmlldyBpbml0aWFsaXphdGlvbi5cclxuICAgKi9cclxuICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XHJcblxyXG4gICAgLy8gbWFrZXMgdG9yY2ggYXZhaWxhYmlsaXR5IGluZm9ybWF0aW9uIGF2YWlsYWJsZSB0byB1c2VyXHJcbiAgICB0aGlzLmdldENvZGVSZWFkZXIoKS5pc1RvcmNoQXZhaWxhYmxlLnN1YnNjcmliZSh4ID0+IHRoaXMudG9yY2hDb21wYXRpYmxlLmVtaXQoeCkpO1xyXG5cclxuICAgIGlmICghdGhpcy5hdXRvc3RhcnQpIHtcclxuICAgICAgY29uc29sZS53YXJuKCdOZXcgZmVhdHVyZSBcXCdhdXRvc3RhcnRcXCcgZGlzYWJsZWQsIGJlIGNhcmVmdWwuIFBlcm1pc3Npb25zIGFuZCBkZXZpY2VzIHJlY292ZXJ5IGhhcyB0byBiZSBydW4gbWFudWFsbHkuJyk7XHJcblxyXG4gICAgICAvLyBkb2VzIHRoZSBuZWNlc3NhcnkgY29uZmlndXJhdGlvbiB3aXRob3V0IGF1dG9zdGFydGluZ1xyXG4gICAgICB0aGlzLmluaXRBdXRvc3RhcnRPZmYoKTtcclxuXHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25maWd1cmF0ZXMgdGhlIGNvbXBvbmVudCBhbmQgc3RhcnRzIHRoZSBzY2FubmVyXHJcbiAgICB0aGlzLmluaXRBdXRvc3RhcnRPbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhlY3V0ZXMgc29tZSBhY3Rpb25zIGJlZm9yZSBkZXN0cm95IHRoZSBjb21wb25lbnQuXHJcbiAgICovXHJcbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdG9wcyBvbGQgYGNvZGVSZWFkZXJgIGFuZCBzdGFydHMgc2Nhbm5pbmcgaW4gYSBuZXcgb25lLlxyXG4gICAqL1xyXG4gIHJlc3RhcnQoKTogdm9pZCB7XHJcblxyXG4gICAgY29uc3QgcHJldkRldmljZSA9IHRoaXMuX3Jlc2V0KCk7XHJcblxyXG4gICAgaWYgKCFwcmV2RGV2aWNlKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBAbm90ZSBhcGVuYXMgbmVjZXNzYXJpbyBwb3IgZW5xdWFudG8gY2F1c2EgZGEgVG9yY2hcclxuICAgIHRoaXMuX2NvZGVSZWFkZXIgPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLmRldmljZSA9IHByZXZEZXZpY2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNjb3ZlcnMgYW5kIHVwZGF0ZXMga25vd24gdmlkZW8gaW5wdXQgZGV2aWNlcy5cclxuICAgKi9cclxuICBhc3luYyB1cGRhdGVWaWRlb0lucHV0RGV2aWNlcygpOiBQcm9taXNlPE1lZGlhRGV2aWNlSW5mb1tdPiB7XHJcblxyXG4gICAgLy8gcGVybWlzc2lvbnMgYXJlbid0IG5lZWRlZCB0byBnZXQgZGV2aWNlcywgYnV0IHRvIGFjY2VzcyB0aGVtIGFuZCB0aGVpciBpbmZvXHJcbiAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgdGhpcy5nZXRDb2RlUmVhZGVyKCkubGlzdFZpZGVvSW5wdXREZXZpY2VzKCkgfHwgW107XHJcbiAgICBjb25zdCBoYXNEZXZpY2VzID0gZGV2aWNlcyAmJiBkZXZpY2VzLmxlbmd0aCA+IDA7XHJcblxyXG4gICAgLy8gc3RvcmVzIGRpc2NvdmVyZWQgZGV2aWNlcyBhbmQgdXBkYXRlcyBpbmZvcm1hdGlvblxyXG4gICAgdGhpcy5oYXNEZXZpY2VzLm5leHQoaGFzRGV2aWNlcyk7XHJcbiAgICB0aGlzLmNhbWVyYXNGb3VuZC5uZXh0KFsuLi5kZXZpY2VzXSk7XHJcblxyXG4gICAgaWYgKCFoYXNEZXZpY2VzKSB7XHJcbiAgICAgIHRoaXMuY2FtZXJhc05vdEZvdW5kLm5leHQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGV2aWNlcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0YXJ0cyB0aGUgc2Nhbm5lciB3aXRoIHRoZSBiYWNrIGNhbWVyYSBvdGhlcndpc2UgdGFrZSB0aGUgbGFzdFxyXG4gICAqIGF2YWlsYWJsZSBkZXZpY2UuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhdXRvc3RhcnRTY2FubmVyKGRldmljZXM6IE1lZGlhRGV2aWNlSW5mb1tdKSB7XHJcblxyXG4gICAgY29uc3QgbWF0Y2hlciA9ICh7IGxhYmVsIH0pID0+IC9iYWNrfHRyw6FzfHJlYXJ8dHJhc2VpcmF8ZW52aXJvbm1lbnR8YW1iaWVudGUvZ2kudGVzdChsYWJlbCk7XHJcblxyXG4gICAgLy8gc2VsZWN0IHRoZSByZWFyIGNhbWVyYSBieSBkZWZhdWx0LCBvdGhlcndpc2UgdGFrZSB0aGUgbGFzdCBjYW1lcmEuXHJcbiAgICBjb25zdCBkZXZpY2UgPSBkZXZpY2VzLmZpbmQobWF0Y2hlcikgfHwgZGV2aWNlcy5wb3AoKTtcclxuXHJcbiAgICBpZiAoIWRldmljZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ltcG9zc2libGUgdG8gYXV0b3N0YXJ0LCBubyBpbnB1dCBkZXZpY2VzIGF2YWlsYWJsZS4nKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRldmljZSA9IGRldmljZTtcclxuICAgIC8vIEBub3RlIHdoZW4gbGlzdGVuaW5nIHRvIHRoaXMgY2hhbmdlLCBjYWxsYmFjayBjb2RlIHdpbGwgc29tZXRpbWVzIHJ1biBiZWZvcmUgdGhlIHByZXZpb3VzIGxpbmUuXHJcbiAgICB0aGlzLmRldmljZUNoYW5nZS5lbWl0KGRldmljZSk7XHJcblxyXG4gICAgdGhpcy5pc0F1dG9zdGFydGluZyA9IGZhbHNlO1xyXG4gICAgdGhpcy5hdXRvc3RhcnRlZC5uZXh0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwYXRjaGVzIHRoZSBzY2FuIHN1Y2Nlc3MgZXZlbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcmVzdWx0IHRoZSBzY2FuIHJlc3VsdC5cclxuICAgKi9cclxuICBwcml2YXRlIGRpc3BhdGNoU2NhblN1Y2Nlc3MocmVzdWx0OiBSZXN1bHQpOiB2b2lkIHtcclxuICAgIHRoaXMuc2NhblN1Y2Nlc3MubmV4dChyZXN1bHQuZ2V0VGV4dCgpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpc3BhdGNoZXMgdGhlIHNjYW4gZmFpbHVyZSBldmVudC5cclxuICAgKi9cclxuICBwcml2YXRlIGRpc3BhdGNoU2NhbkZhaWx1cmUocmVhc29uPzogRXhjZXB0aW9uKTogdm9pZCB7XHJcbiAgICB0aGlzLnNjYW5GYWlsdXJlLm5leHQocmVhc29uKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpc3BhdGNoZXMgdGhlIHNjYW4gZXJyb3IgZXZlbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZXJyb3IgdGhlIGVycm9yIHRoaW5nLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZGlzcGF0Y2hTY2FuRXJyb3IoZXJyb3I6IGFueSk6IHZvaWQge1xyXG4gICAgdGhpcy5zY2FuRXJyb3IubmV4dChlcnJvcik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwYXRjaGVzIHRoZSBzY2FuIGV2ZW50LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlc3VsdCB0aGUgc2NhbiByZXN1bHQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBkaXNwYXRjaFNjYW5Db21wbGV0ZShyZXN1bHQ6IFJlc3VsdCk6IHZvaWQge1xyXG4gICAgdGhpcy5zY2FuQ29tcGxldGUubmV4dChyZXN1bHQpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZmlsdGVyZWQgcGVybWlzc2lvbi5cclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVBlcm1pc3Npb25FeGNlcHRpb24oZXJyOiBET01FeGNlcHRpb24pOiBib29sZWFuIHtcclxuXHJcbiAgICAvLyBmYWlsZWQgdG8gZ3JhbnQgcGVybWlzc2lvbiB0byB2aWRlbyBpbnB1dFxyXG4gICAgY29uc29sZS5lcnJvcignQHp4aW5nL25neC1zY2FubmVyJywgJ0Vycm9yIHdoZW4gYXNraW5nIGZvciBwZXJtaXNzaW9uLicsIGVycik7XHJcblxyXG4gICAgbGV0IHBlcm1pc3Npb246IGJvb2xlYW47XHJcblxyXG4gICAgc3dpdGNoIChlcnIubmFtZSkge1xyXG5cclxuICAgICAgLy8gdXN1YWxseSBjYXVzZWQgYnkgbm90IHNlY3VyZSBvcmlnaW5zXHJcbiAgICAgIGNhc2UgJ05vdFN1cHBvcnRlZEVycm9yJzpcclxuICAgICAgICBjb25zb2xlLndhcm4oJ0B6eGluZy9uZ3gtc2Nhbm5lcicsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAvLyBjb3VsZCBub3QgY2xhaW1cclxuICAgICAgICBwZXJtaXNzaW9uID0gbnVsbDtcclxuICAgICAgICAvLyBjYW4ndCBjaGVjayBkZXZpY2VzXHJcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQobnVsbCk7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAvLyB1c2VyIGRlbmllZCBwZXJtaXNzaW9uXHJcbiAgICAgIGNhc2UgJ05vdEFsbG93ZWRFcnJvcic6XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdAenhpbmcvbmd4LXNjYW5uZXInLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgLy8gY2xhaW1lZCBhbmQgZGVuaWVkIHBlcm1pc3Npb25cclxuICAgICAgICBwZXJtaXNzaW9uID0gZmFsc2U7XHJcbiAgICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IGlucHV0IGRldmljZXMgZXhpc3RzXHJcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAvLyB0aGUgZGV2aWNlIGhhcyBubyBhdHRhY2hlZCBpbnB1dCBkZXZpY2VzXHJcbiAgICAgIGNhc2UgJ05vdEZvdW5kRXJyb3InOlxyXG4gICAgICAgIGNvbnNvbGUud2FybignQHp4aW5nL25neC1zY2FubmVyJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgIC8vIG5vIHBlcm1pc3Npb25zIGNsYWltZWRcclxuICAgICAgICBwZXJtaXNzaW9uID0gbnVsbDtcclxuICAgICAgICAvLyBiZWNhdXNlIHRoZXJlIHdhcyBubyBkZXZpY2VzXHJcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQoZmFsc2UpO1xyXG4gICAgICAgIC8vIHRlbGxzIHRoZSBsaXN0ZW5lciBhYm91dCB0aGUgZXJyb3JcclxuICAgICAgICB0aGlzLmNhbWVyYXNOb3RGb3VuZC5uZXh0KGVycik7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlICdOb3RSZWFkYWJsZUVycm9yJzpcclxuICAgICAgICBjb25zb2xlLndhcm4oJ0B6eGluZy9uZ3gtc2Nhbm5lcicsICdDb3VsZG5cXCd0IHJlYWQgdGhlIGRldmljZShzKVxcJ3Mgc3RyZWFtLCBpdFxcJ3MgcHJvYmFibHkgaW4gdXNlIGJ5IGFub3RoZXIgYXBwLicpO1xyXG4gICAgICAgIC8vIG5vIHBlcm1pc3Npb25zIGNsYWltZWRcclxuICAgICAgICBwZXJtaXNzaW9uID0gbnVsbDtcclxuICAgICAgICAvLyB0aGVyZSBhcmUgZGV2aWNlcywgd2hpY2ggSSBjb3VsZG4ndCB1c2VcclxuICAgICAgICB0aGlzLmhhc0RldmljZXMubmV4dChmYWxzZSk7XHJcbiAgICAgICAgLy8gdGVsbHMgdGhlIGxpc3RlbmVyIGFib3V0IHRoZSBlcnJvclxyXG4gICAgICAgIHRoaXMuY2FtZXJhc05vdEZvdW5kLm5leHQoZXJyKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdAenhpbmcvbmd4LXNjYW5uZXInLCAnSSB3YXMgbm90IGFibGUgdG8gZGVmaW5lIGlmIEkgaGF2ZSBwZXJtaXNzaW9ucyBmb3IgY2FtZXJhIG9yIG5vdC4nLCBlcnIpO1xyXG4gICAgICAgIC8vIHVua25vd25cclxuICAgICAgICBwZXJtaXNzaW9uID0gbnVsbDtcclxuICAgICAgICAvLyB0aGlzLmhhc0RldmljZXMubmV4dCh1bmRlZmluZWQ7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2V0UGVybWlzc2lvbihwZXJtaXNzaW9uKTtcclxuXHJcbiAgICAvLyB0ZWxscyB0aGUgbGlzdGVuZXIgYWJvdXQgdGhlIGVycm9yXHJcbiAgICB0aGlzLnBlcm1pc3Npb25SZXNwb25zZS5lcnJvcihlcnIpO1xyXG5cclxuICAgIHJldHVybiBwZXJtaXNzaW9uO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHZhbGlkIEJhcmNvZGVGb3JtYXQgb3IgZmFpbHMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRCYXJjb2RlRm9ybWF0T3JGYWlsKGZvcm1hdDogc3RyaW5nIHwgQmFyY29kZUZvcm1hdCk6IEJhcmNvZGVGb3JtYXQge1xyXG4gICAgcmV0dXJuIHR5cGVvZiBmb3JtYXQgPT09ICdzdHJpbmcnXHJcbiAgICAgID8gQmFyY29kZUZvcm1hdFtmb3JtYXQudHJpbSgpLnRvVXBwZXJDYXNlKCldXHJcbiAgICAgIDogZm9ybWF0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0b3JuYSB1bSBjb2RlIHJlYWRlciwgY3JpYSB1bSBzZSBuZW5odW1lIGV4aXN0ZS5cclxuICAgKi9cclxuICBwcml2YXRlIGdldENvZGVSZWFkZXIoKTogQnJvd3Nlck11bHRpRm9ybWF0Q29udGludW91c1JlYWRlciB7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9jb2RlUmVhZGVyKSB7XHJcbiAgICAgIHRoaXMuX2NvZGVSZWFkZXIgPSBuZXcgQnJvd3Nlck11bHRpRm9ybWF0Q29udGludW91c1JlYWRlcih0aGlzLmhpbnRzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5fY29kZVJlYWRlcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0YXJ0cyB0aGUgY29udGludW91cyBzY2FubmluZyBmb3IgdGhlIGdpdmVuIGRldmljZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBkZXZpY2VJZCBUaGUgZGV2aWNlSWQgZnJvbSB0aGUgZGV2aWNlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgc2NhbkZyb21EZXZpY2UoZGV2aWNlSWQ6IHN0cmluZyk6IHZvaWQge1xyXG5cclxuICAgIGNvbnN0IHZpZGVvRWxlbWVudCA9IHRoaXMucHJldmlld0VsZW1SZWYubmF0aXZlRWxlbWVudDtcclxuXHJcbiAgICBjb25zdCBjb2RlUmVhZGVyID0gdGhpcy5nZXRDb2RlUmVhZGVyKCk7XHJcblxyXG4gICAgY29uc3QgZGVjb2RpbmdTdHJlYW0gPSBjb2RlUmVhZGVyLmNvbnRpbnVvdXNEZWNvZGVGcm9tSW5wdXRWaWRlb0RldmljZShkZXZpY2VJZCwgdmlkZW9FbGVtZW50KTtcclxuXHJcbiAgICBpZiAoIWRlY29kaW5nU3RyZWFtKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5kZWZpbmVkIGRlY29kaW5nIHN0cmVhbSwgYWJvcnRpbmcuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbmV4dCA9ICh4OiBSZXN1bHRBbmRFcnJvcikgPT4gdGhpcy5fb25EZWNvZGVSZXN1bHQoeC5yZXN1bHQsIHguZXJyb3IpO1xyXG4gICAgY29uc3QgZXJyb3IgPSAoZXJyOiBhbnkpID0+IHRoaXMuX29uRGVjb2RlRXJyb3IoZXJyKTtcclxuICAgIGNvbnN0IGNvbXBsZXRlID0gKCkgPT4geyB0aGlzLnJlc2V0KCk7IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKTsgfTtcclxuXHJcbiAgICBkZWNvZGluZ1N0cmVhbS5zdWJzY3JpYmUobmV4dCwgZXJyb3IsIGNvbXBsZXRlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgZGVjb2RlIGVycm9ycy5cclxuICAgKi9cclxuICBwcml2YXRlIF9vbkRlY29kZUVycm9yKGVycjogYW55KSB7XHJcbiAgICB0aGlzLmRpc3BhdGNoU2NhbkVycm9yKGVycik7XHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGRlY29kZSByZXN1bHRzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX29uRGVjb2RlUmVzdWx0KHJlc3VsdDogUmVzdWx0LCBlcnJvcjogRXhjZXB0aW9uKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKHJlc3VsdCkge1xyXG4gICAgICB0aGlzLmRpc3BhdGNoU2NhblN1Y2Nlc3MocmVzdWx0KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hTY2FuRmFpbHVyZShlcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5kaXNwYXRjaFNjYW5Db21wbGV0ZShyZXN1bHQpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3RvcHMgdGhlIGNvZGUgcmVhZGVyIGFuZCByZXR1cm5zIHRoZSBwcmV2aW91cyBzZWxlY3RlZCBkZXZpY2UuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfcmVzZXQoKTogTWVkaWFEZXZpY2VJbmZvIHtcclxuXHJcbiAgICBpZiAoIXRoaXMuX2NvZGVSZWFkZXIpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRldmljZSA9IHRoaXMuZGV2aWNlO1xyXG4gICAgLy8gZG8gbm90IHNldCB0aGlzLmRldmljZSBpbnNpZGUgdGhpcyBtZXRob2QsIGl0IHdvdWxkIGNyZWF0ZSBhIHJlY3Vyc2l2ZSBsb29wXHJcbiAgICB0aGlzLl9kZXZpY2UgPSBudWxsO1xyXG5cclxuICAgIHRoaXMuX2NvZGVSZWFkZXIucmVzZXQoKTtcclxuXHJcbiAgICByZXR1cm4gZGV2aWNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzZXRzIHRoZSBzY2FubmVyIGFuZCBlbWl0cyBkZXZpY2UgY2hhbmdlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcclxuICAgIHRoaXMuX3Jlc2V0KCk7XHJcbiAgICB0aGlzLmRldmljZUNoYW5nZS5lbWl0KG51bGwpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcGVybWlzc2lvbiB2YWx1ZSBhbmQgZW1taXRzIHRoZSBldmVudC5cclxuICAgKi9cclxuICBwcml2YXRlIHNldFBlcm1pc3Npb24oaGFzUGVybWlzc2lvbjogYm9vbGVhbiB8IG51bGwpOiB2b2lkIHtcclxuICAgIHRoaXMuaGFzUGVybWlzc2lvbiA9IGhhc1Blcm1pc3Npb247XHJcbiAgICB0aGlzLnBlcm1pc3Npb25SZXNwb25zZS5uZXh0KGhhc1Blcm1pc3Npb24pO1xyXG4gIH1cclxuXHJcbn1cclxuIl19