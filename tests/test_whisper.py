from backend.services.whisper_service import transcribe_audio


audio_path = "test_audio.wav"

transcript_path = "test_transcript.json"


result = transcribe_audio(
    audio_path,
    transcript_path
)


print("Transcript saved successfully:")
print(transcript_path)

print("\nTotal segments:")
print(len(result["segments"]))

print("\nFirst 5 segments:\n")

for segment in result["segments"][:5]:

    print(
        f"[{segment['start']:.2f}s - "
        f"{segment['end']:.2f}s] "
        f"{segment['text']}"
    )
