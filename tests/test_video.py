from backend.services.video_processor import extract_audio


video_path = "C:\\Users\\Omkar\\OneDrive\\Desktop\\ProfessorMindAI\\storage\\notebooks\\f048190f-5ebf-495c-ab12-cfbcdae0eba9\\sources\\f7b5da3d-6ccd-4411-9ad8-131aec006968.mp4"
audio_path = "test_audio.wav"


result = extract_audio(
    video_path,
    audio_path
)

print("Audio extracted successfully:")
print(result)
