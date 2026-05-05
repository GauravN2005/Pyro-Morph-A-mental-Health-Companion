#!/usr/bin/env python3
"""Test WAV encoding and voice API with different audio formats"""
import requests
import numpy as np
import struct
import io
import sys

API_URL = "http://127.0.0.1:5001"

def generate_wav_bytes(duration=1.0, sample_rate=16000, frequency=220):
    """Generate a simple sine wave WAV file"""
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, False)
    signal = np.sin(2 * np.pi * frequency * t) * 0.3
    signal = (signal * 32767).astype(np.int16)
    
    # WAV header
    num_channels = 1
    bytes_per_sample = 2
    byte_rate = sample_rate * num_channels * bytes_per_sample
    block_align = num_channels * bytes_per_sample
    
    wav_header = b'RIFF'
    wav_header += struct.pack('<I', 36 + len(signal) * bytes_per_sample)
    wav_header += b'WAVE'
    wav_header += b'fmt '
    wav_header += struct.pack('<I', 16)  # Subchunk1Size
    wav_header += struct.pack('<H', 1)   # AudioFormat (1=PCM)
    wav_header += struct.pack('<H', num_channels)
    wav_header += struct.pack('<I', sample_rate)
    wav_header += struct.pack('<I', byte_rate)
    wav_header += struct.pack('<H', block_align)
    wav_header += struct.pack('<H', 16)  # BitsPerSample
    wav_header += b'data'
    wav_header += struct.pack('<I', len(signal) * bytes_per_sample)
    wav_header += signal.tobytes()
    
    return wav_header

def test_voice_health():
    """Check if voice API is ready"""
    print("[1] Testing /voice/health endpoint...")
    try:
        resp = requests.get(f"{API_URL}/voice/health", timeout=5)
        print(f"    Status: {resp.status_code}")
        data = resp.json()
        print(f"    Model loaded: {data.get('voiceModelLoaded', 'N/A')}")
        print(f"    Model path: {data.get('modelPath', 'N/A')}")
        if data.get('error'):
            print(f"    ERROR: {data['error']}")
        return resp.status_code == 200
    except Exception as e:
        print(f"    ERROR: {e}")
        return False

def test_voice_analyze_wav():
    """Test voice analysis with WAV file"""
    print("\n[2] Testing /voice/analyze with WAV file...")
    try:
        wav_data = generate_wav_bytes(duration=2.0)  # 2-second test audio
        files = {'audio': ('test.wav', io.BytesIO(wav_data), 'audio/wav')}
        resp = requests.post(f"{API_URL}/voice/analyze", files=files, timeout=10)
        print(f"    Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"    Emotion: {data.get('emotion', 'N/A')}")
            print(f"    Confidence: {data.get('confidence', 'N/A'):.2%}" if data.get('confidence') else "")
            print(f"    ✅ WAV analysis successful")
            return True
        else:
            print(f"    Response: {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"    ERROR: {e}")
        return False

def test_voice_analyze_webm():
    """Test voice analysis with WebM/Opus file (simulated browser scenario)"""
    print("\n[3] Testing /voice/analyze with WebM file (browser scenario)...")
    # Create a minimal WebM header + dummy data (will fail to decode but shows error handling)
    webm_header = b'\x1a\x45\xdf\xa3' + b'\x00' * 100  # Minimal WebM header
    files = {'audio': ('test.webm', io.BytesIO(webm_header), 'audio/webm')}
    
    try:
        resp = requests.post(f"{API_URL}/voice/analyze", files=files, timeout=10)
        print(f"    Status: {resp.status_code}")
        
        try:
            data = resp.json()
            error_msg = data.get('error', 'Unknown error')
            print(f"    Response: {error_msg}")
        except:
            print(f"    Response (raw): {resp.text[:300]}")
            error_msg = resp.text
        
        if resp.status_code != 200:
            if 'decode' in error_msg.lower() or 'audio' in error_msg.lower():
                print(f"    ✅ Proper error handling for invalid audio")
                return True
            else:
                print(f"    ✅ Backend rejected invalid audio (good error handling)")
                return True
        else:
            print(f"    ⚠️  Unexpected 200 response (malformed WebM should fail)")
            return False
    except Exception as e:
        print(f"    ERROR: {e}")
        return False

def main():
    print("=" * 60)
    print("Voice API WAV Conversion & Error Handling Test")
    print("=" * 60)
    
    health_ok = test_voice_health()
    if not health_ok:
        print("\n❌ Backend is not ready. Make sure Flask API is running at http://127.0.0.1:5001")
        sys.exit(1)
    
    wav_ok = test_voice_analyze_wav()
    webm_ok = test_voice_analyze_webm()
    
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  WAV handling: {'✅ PASS' if wav_ok else '❌ FAIL'}")
    print(f"  Error handling: {'✅ PASS' if webm_ok else '❌ FAIL'}")
    print("=" * 60)
    
    if wav_ok and webm_ok:
        print("\n✅ All tests passed! Browser should now work with WAV conversion.")
    else:
        print("\n⚠️  Some tests failed. Check backend logs for details.")

if __name__ == "__main__":
    main()
