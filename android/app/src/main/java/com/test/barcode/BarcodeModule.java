package com.test.barcode;

import android.util.Log;

import androidx.annotation.NonNull;

// import com.facebook.common.util.Hex;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.rscja.barcode.BarcodeDecoder;
import com.rscja.barcode.BarcodeFactory;
import com.rscja.barcode.BarcodeUtility;
import com.rscja.deviceapi.entity.BarcodeEntity;
import com.rscja.deviceapi.exception.ConfigurationException;

public class BarcodeModule extends ReactContextBaseJavaModule {
    private  BarcodeDecoder mBarcode= BarcodeFactory.getInstance().getBarcodeDecoder();
    private static ReactApplicationContext reactContext;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mEmiter=null;
    @NonNull
    @Override
    public String getName() {
        return "BarcodeModule";
    }
    public BarcodeModule(ReactApplicationContext context) {
       super(context);
    //    this.context = context.getApplicationContext(); 
    }
    private void sendEvent(
                      String eventName,
                      String data) {
        WritableMap payload = Arguments.createMap();
        payload.putString("data",data);
        if(mEmiter==null){
            mEmiter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        }
        if(mEmiter!=null){
            mEmiter.emit(eventName,payload);
        }
    }

    // private String convertTextToHex(String data) {
    //     String hexString = Hex.encodeHex(data.getBytes(), false);
    //     return hexString;
    // }

    @ReactMethod
    public void open(Promise promise) {
        try {
            mBarcode.open(getReactApplicationContext());
            // if(mode==1){
            //     BarcodeUtility.getInstance().enableContinuousScan(getReactApplicationContext(),true);
            //     BarcodeUtility.getInstance().setContinuousScanIntervalTime(getReactApplicationContext(),1000);
            // }
            
            BarcodeUtility.getInstance().enablePlaySuccessSound(getReactApplicationContext(),true);
            BarcodeUtility.getInstance().enablePlayFailureSound(getReactApplicationContext(),true);
            
            mBarcode.setDecodeCallback(new BarcodeDecoder.DecodeCallback() {
                @Override
                public void onDecodeComplete(BarcodeEntity barcodeEntity) {
                    WritableMap payload = Arguments.createMap();
                    int code = barcodeEntity.getResultCode();
                    if(code == BarcodeDecoder.DECODE_SUCCESS){
                        sendEvent("scan-success",barcodeEntity.getBarcodeData());
                    }else if(code==BarcodeDecoder.DECODE_ENGINE_ERROR||code==BarcodeDecoder.DECODE_FAILURE||code==BarcodeDecoder.DECODE_TIMEOUT){
                        sendEvent("scan-error","");
                    }
                }
            });
            promise.resolve(1);
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage());
            // e.printStackTrace();
        }

    }

    @ReactMethod
    public void close(Promise promise) {
        try {
            mBarcode.close();
            promise.resolve(1);
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage());
        }
    }
    @ReactMethod
    public void setContinueMode(int  mode,int time,Promise promise) {
        try {
            if(mode==1){
                
                BarcodeUtility.getInstance().enableContinuousScan(getReactApplicationContext(),true);
                BarcodeUtility.getInstance().setContinuousScanIntervalTime(getReactApplicationContext(),time);
            }
            else{
                BarcodeUtility.getInstance().enableContinuousScan(getReactApplicationContext(),false);
            }
            promise.resolve(1);
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage());
        }
    }

    @ReactMethod
    public void start( Promise promise) {
        
        try {
            promise.resolve(mBarcode.startScan());
        } catch (Exception ex) {
            promise.reject(ex.toString(), ex.getMessage());
        }

    }

    @ReactMethod
    public void stop(Promise promise) {
        try {
            mBarcode.stopScan();
            promise.resolve(1);
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage());
        }
    }

}
