package com.test.BLEFPModule;
import android.util.Log;
import androidx.annotation.NonNull;
import android.util.Base64;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
// import com.rscja.deviceapi.exception.ConfigurationException;

// import com.facebook.react.bridge.WritableMap;

import com.fpreader.fpcore.FPFormat;
import com.fpreader.fpcore.FPMatch;
public class FPModule extends ReactContextBaseJavaModule{
    // private static ReactApplicationContext reactContext;
    // private byte[] fMatch;
    // private FPMatch mFPMatch;
    // private FPFormat mFPFormat;
    @NonNull
    @Override
    public String getName() {
        return "FPModule";
    }
    @ReactMethod
    public void initMatch(Promise promise) {
        try {
            // mFPFormat = FPFormat.getInstance();
            // mFPMatch = FPMatch.getInstance();
            // fMatch = new byte[512];
            promise.resolve(FPMatch.getInstance().InitMatch(0));
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage());
            e.printStackTrace();
        }

    }
    @ReactMethod
    public void MatchTemplate(String ref, String match,Promise promise) {
        try {
            byte[] mRefData = Base64.decode(ref,Base64.DEFAULT);
            byte[] mMatData = Base64.decode(match,Base64.DEFAULT);
            // System.out.println(mRefData);
            // for(int i=0;i<mMatData.length;i++)
            // {
            //     fMatch[i]=mMatData[i];
            // }
            if (FPFormat.getInstance().GetDataType(mRefData) == FPFormat.STD_TEMPLATE) {
                
                promise.resolve(FPMatch.getInstance().MatchTemplate(mRefData, mMatData));
            }
            else{
                final byte[] fa = new byte[512];
                final byte[] fb = new byte[512];
                FPFormat.getInstance().AnsiIsoToStd(mRefData, fa, FPFormat.ISO_19794_2005);
                FPFormat.getInstance().AnsiIsoToStd(mMatData, fb, FPFormat.ISO_19794_2005);
                promise.resolve(FPMatch.getInstance().MatchTemplate(fa, fb));
            }
            
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage());
        }
    }
}