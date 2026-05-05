%%writefile app.py

import streamlit as st
import librosa
import numpy as np
import joblib
from tensorflow.keras.models import load_model
import whisper
from openai import OpenAI
from gtts import gTTS
import os

# Set page config for better layout
st.set_page_config(page_title="Emotion-Aware AI Assistant", layout="centered")

# --- Load Models (Cached for efficiency) ---
@st.cache_resource
def load_all_models():
    emotion_model = load_model("saved_models/emotion_cnn_best.h5")
    le = joblib.load("prepared_data/label_encoder.joblib")
    stt_model = whisper.load_model("base")
    return emotion_model, le, stt_model

emotion_model, le, stt_model = load_all_models()

# --- Securely access API key ---
# Streamlit handles secrets slightly differently than Colab userdata.
# For local deployment, users would set this as an environment variable or in .streamlit/secrets.toml
# For this Colab environment, we'll try to get it from os.environ or a placeholder.

try:
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', st.secrets['OPENAI_API_KEY'])
except Exception:
    st.warning("OPENAI_API_KEY not found. Please set it in your environment variables or Streamlit secrets for full functionality.")
    OPENAI_API_KEY = "YOUR_OPENAI_API_KEY" # Placeholder for local testing without key

openai_client = OpenAI(api_key=OPENAI_API_KEY)

# --- Constants ---
SR, DURATION, N_MELS = 16000, 3.0, 64

# --- Helper Functions ---
def extract_logmel_file(audio_bytes, sr=SR, n_mels=N_MELS, duration=DURATION):
    # Save bytes to a temporary file for librosa
    with open("temp_audio.wav", "wb") as f:
        f.write(audio_bytes)
    y, sr = librosa.load("temp_audio.wav", sr=sr, duration=duration, mono=True)
    os.remove("temp_audio.wav") # Clean up temp file

    if len(y) < int(duration*sr):
        y = np.pad(y, (0, int(duration*sr)-len(y)))
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=1024, hop_length=256, n_mels=n_mels)
    logmel = librosa.power_to_db(mel)
    logmel = (logmel - np.mean(logmel)) / (np.std(logmel) + 1e-9)
    return logmel.astype(np.float32)

def predict_emotion(audio_bytes):
    logmel = extract_logmel_file(audio_bytes)[np.newaxis, ..., np.newaxis]
    pred = emotion_model.predict(logmel)
    pred_class = np.argmax(pred, axis=1)[0]
    emotion = le.inverse_transform([pred_class])[0]
    confidence = np.max(pred)
    return emotion, confidence

def transcribe(audio_bytes):
    # Save bytes to a temporary file for whisper
    with open("temp_audio.wav", "wb") as f:
        f.write(audio_bytes)
    result = stt_model.transcribe("temp_audio.wav")
    os.remove("temp_audio.wav") # Clean up temp file
    return result["text"]

def generate_reply(text, emotion):
    if not openai_client.api_key or openai_client.api_key == "YOUR_OPENAI_API_KEY":
        return "Please set your OpenAI API key to enable AI replies."

    prompt_text = f"The user said: '{text}' with a {emotion} tone. Respond in a helpful and empathetic manner, acknowledging their emotion. Keep the response concise, around 2-3 sentences."
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt_text}
            ],
            stream=False
        )
        return response.choices[0].message.content
    except Exception as e:
        st.error(f"Error generating AI reply: {e}")
        return "I encountered an error while trying to generate a reply."

def text_to_speech(text, filename="ai_reply.mp3"):
    try:
        tts = gTTS(text=text, lang="en")
        tts.save(filename)
        return filename
    except Exception as e:
        st.error(f"Error converting text to speech: {e}")
        return None

# --- Streamlit UI ---
st.title("🎙️ Emotion-Aware Conversational AI")
st.markdown("Upload an audio file and let the AI transcribe it, predict the emotion, and respond empathetically.")

uploaded_file = st.file_uploader("Choose an audio file (WAV, MP3, M4A, OGG)", type=["wav", "mp3", "m4a", "ogg"])

if uploaded_file is not None:
    audio_bytes = uploaded_file.read()
    st.audio(audio_bytes, format=uploaded_file.type)

    st.subheader("Processing Audio...")
    
    with st.spinner("Transcribing audio..."):
        text = transcribe(audio_bytes)
        st.success("Transcription complete!")
        st.write(f"**Transcript:** {text}")

    with st.spinner("Predicting emotion..."):
        emotion, conf = predict_emotion(audio_bytes)
        st.success("Emotion prediction complete!")
        st.write(f"**Predicted Emotion:** {emotion.capitalize()} (Confidence: {conf:.2f})")

    with st.spinner("Generating AI reply..."):
        reply = generate_reply(text, emotion)
        st.success("AI reply generated!")
        st.info(f"**AI Reply:** {reply}")

    if reply and reply != "Please set your OpenAI API key to enable AI replies.":
        with st.spinner("Converting AI reply to speech..."):
            audio_file_path = text_to_speech(reply)
            if audio_file_path:
                st.success("Audio reply ready!")
                st.audio(audio_file_path, format='audio/mp3')
                os.remove(audio_file_path) # Clean up generated audio file
