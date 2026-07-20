import torch
import soundfile as sf
import io
from pyannote.audio import Pipeline
import os

token = os.environ.get("HUGGINGFACE_TOKEN")
if not token:
    raise ValueError("HUGGINGFACE_TOKEN environment variable is not set")
pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", token=token)

data = torch.zeros((1, 16000))
out = pipeline({"waveform": data, "sample_rate": 16000})
print("Type of out:", type(out))
