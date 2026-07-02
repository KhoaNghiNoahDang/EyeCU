from dotenv import load_dotenv
import os
load_dotenv()
print("TOKEN:", os.getenv("VNPT_SMARTVOICE_ACCESS_TOKEN")[:40])
print("ID:", os.getenv("VNPT_SMARTVOICE_TOKEN_ID"))
