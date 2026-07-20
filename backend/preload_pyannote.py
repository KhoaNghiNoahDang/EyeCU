import os
from pyannote.audio import Pipeline
from app.core.config import settings

print("Start loading Pyannote...")
os.environ["HF_TOKEN"] = settings.HUGGINGFACE_TOKEN
pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", token=settings.HUGGINGFACE_TOKEN)
print("Load successful! Model cached.")
