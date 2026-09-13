from pathlib import Path
from moviepy import VideoFileClip


def extract_audio(video_path: str, audio_path: str):
    """
    Extract audio from a video file.

    Args:
        video_path: Path to the input video.
        audio_path: Path where the extracted audio will be saved.

    Returns:
        Path to the extracted audio file.
    """

    video_path = Path(video_path)
    audio_path = Path(audio_path)

    if not video_path.exists():
        raise FileNotFoundError(
            f"Video file not found: {video_path}"
        )

    audio_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    video = None

    try:
        video = VideoFileClip(str(video_path))

        if video.audio is None:
            raise ValueError(
                "The video does not contain an audio track."
            )

        video.audio.write_audiofile(
            str(audio_path),
            codec="pcm_s16le",
            logger=None
        )

        return str(audio_path)

    finally:
        if video is not None:
            video.close()
