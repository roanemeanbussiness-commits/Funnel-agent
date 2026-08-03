import json
import sys

from youtube_transcript_api import YouTubeTranscriptApi


def main():
    if len(sys.argv) != 2:
        raise ValueError("A YouTube video ID is required")

    video_id = sys.argv[1]
    transcript = YouTubeTranscriptApi().fetch(video_id)
    text = " ".join(snippet.text for snippet in transcript)
    print(json.dumps({"video_id": video_id, "language": transcript.language_code, "text": text}))


if __name__ == "__main__":
    main()
