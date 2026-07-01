import sys
import os

proto_path = os.path.join(os.getcwd(), 'backend', 'app', 'grpc_proto')
sys.path.append(proto_path)

import grpc
from dotenv import load_dotenv

try:
    import vnpt_asr_pb2
    import vnpt_asr_pb2_grpc
    import vnpt_audio_pb2
except ImportError as e:
    print("Import error:", e)
    sys.exit(1)

load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

token = os.getenv("VNPT_SMARTVOICE_ACCESS_TOKEN")
metadata = (
    ("authorization", f"Bearer {token}" if token and "Bearer" not in str(token) else str(token)),
    ("token-id", os.getenv("VNPT_SMARTVOICE_TOKEN_ID")),
    ("token-key", os.getenv("VNPT_SMARTVOICE_TOKEN_KEY")),
)

host = "api.idg.vnpt.vn:443"
credentials = grpc.ssl_channel_credentials()
channel = grpc.secure_channel(host, credentials)
stub = vnpt_asr_pb2_grpc.VnptSpeechRecognitionStub(channel)

config = vnpt_asr_pb2.RecognitionConfig(
    encoding=vnpt_audio_pb2.LINEAR_PCM,
    sample_rate_hertz=16000,
    language_code="vi-VN",
    max_alternatives=1,
    enable_automatic_punctuation=False
)
streaming_config = vnpt_asr_pb2.StreamingRecognitionConfig(config=config, interim_results=True)

def request_generator():
    yield vnpt_asr_pb2.StreamingRecognizeRequest(streaming_config=streaming_config)
    dummy_chunk = b'\x00' * 2048
    yield vnpt_asr_pb2.StreamingRecognizeRequest(audio_content=dummy_chunk)

print("Running gRPC on Mac Host...")
try:
    responses = stub.StreamingRecognize(request_generator(), metadata=metadata, timeout=10)
    for response in responses:
        print("Success! Response received:", response)
        break
    print("DONE!")
except grpc.RpcError as e:
    print(f"gRPC Error: {e.code().name} - {e.details()}")
except Exception as e:
    print("Error:", str(e))
