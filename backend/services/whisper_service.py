import json
import whisper
from pathlib import Path


def transcribe_audio(audio_path: str, transcript_path: str = None):
    """
    Transcribe audio using Whisper and preserve timestamps.

    Args:
        audio_path: Path to the audio file.
        transcript_path: Optional path to save the transcript JSON.

    Returns:
        Dictionary containing full transcript and timestamped segments.
    """

    model = whisper.load_model("base")

    result = model.transcribe(
        audio_path,
        fp16=False
    )

    segments = []

    for segment in result["segments"]:
        segments.append({
            "start": float(segment["start"]),
            "end": float(segment["end"]),
            "text": segment["text"].strip()
        })

    transcript = {
        "text": result["text"].strip(),
        "segments": segments
    }

    # Save transcript if a path is provided
    if transcript_path:
        transcript_path = Path(transcript_path)

        transcript_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(
            transcript_path,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(
                transcript,
                f,
                ensure_ascii=False,
                indent=2
            )

    return transcript
