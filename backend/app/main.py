import base64
import os
import secrets
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pydantic import BaseModel, Field

from .database import (
    initialize_database,
    log_event,
    fetch_events,
    fetch_stats,
    reset_events,
)


APP_NAME = "SecureTunnel"
SPI = "0x1001"
AES_KEY = AESGCM.generate_key(bit_length=256)
PACKETS = {}
RECEIVED_SEQUENCE_NUMBERS = set()
SEQUENCE_NUMBER = 0

app = FastAPI(title="SecureTunnel API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EncryptRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    sender: str = "Sender A"
    receiver: str = "Receiver B"


class PacketRequest(BaseModel):
    packet_id: str


class VerifyRequest(BaseModel):
    packet_id: str
    allow_replay: bool = False


def encode(value):
    return base64.b64encode(value).decode("ascii")


def decode(value):
    return base64.b64decode(value.encode("ascii"))


def associated_data(packet_id, sequence_number):
    return f"{SPI}|{packet_id}|{sequence_number}".encode("ascii")


@app.on_event("startup")
def startup():
    initialize_database()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": APP_NAME}


@app.post("/api/reset")
def reset_demo():
    global SEQUENCE_NUMBER
    PACKETS.clear()
    RECEIVED_SEQUENCE_NUMBERS.clear()
    SEQUENCE_NUMBER = 0
    reset_events()
    return {"status": "reset", "stats": fetch_stats()}


@app.get("/api/dashboard")
def dashboard():
    stats = fetch_stats()
    events = fetch_events(12)
    return {"stats": stats, "events": events}


@app.get("/api/history")
def history():
    return {"events": fetch_events(50)}


@app.post("/api/encrypt")
def encrypt(request: EncryptRequest):
    global SEQUENCE_NUMBER
    SEQUENCE_NUMBER += 1
    nonce = os.urandom(12)
    packet_id = f"PKT-{secrets.token_hex(4).upper()}"
    ciphertext = AESGCM(AES_KEY).encrypt(
        nonce,
        request.message.encode("utf-8"),
        associated_data(packet_id, SEQUENCE_NUMBER),
    )

    packet = {
        "packetId": packet_id,
        "spi": SPI,
        "sequenceNumber": SEQUENCE_NUMBER,
        "iv": encode(nonce),
        "ciphertext": encode(ciphertext),
        "authenticationTag": encode(ciphertext[-16:]),
        "packetSize": len(ciphertext) + 12 + 16,
        "sender": request.sender,
        "receiver": request.receiver,
        "status": "encrypted",
        "tampered": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    PACKETS[packet_id] = packet
    log_event(
        "Encryption",
        "protected",
        packet_id,
        SEQUENCE_NUMBER,
        packet["packetSize"],
        request.sender,
        request.receiver,
    )
    return {"packet": packet}


@app.post("/api/decrypt")
def decrypt(request: PacketRequest):
    packet = PACKETS.get(request.packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail="Packet not found")
    return verify_packet(packet, allow_replay=False)


@app.post("/api/tamper")
def tamper(request: PacketRequest):
    packet = PACKETS.get(request.packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail="Packet not found")

    ciphertext = bytearray(decode(packet["ciphertext"]))
    if ciphertext:
        ciphertext[0] ^= 1
    packet["ciphertext"] = encode(bytes(ciphertext))
    packet["tampered"] = True
    packet["status"] = "tampered"
    return {"packet": packet}


@app.post("/api/verify")
def verify(request: VerifyRequest):
    packet = PACKETS.get(request.packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail="Packet not found")
    return verify_packet(packet, request.allow_replay)


def verify_packet(packet, allow_replay=False):
    sequence_number = packet["sequenceNumber"]
    try:
        plaintext = AESGCM(AES_KEY).decrypt(
            decode(packet["iv"]),
            decode(packet["ciphertext"]),
            associated_data(packet["packetId"], sequence_number),
        )
    except (InvalidTag, ValueError):
        packet["status"] = "rejected"
        log_event(
            "Authentication failed",
            "rejected",
            packet["packetId"],
            sequence_number,
            packet["packetSize"],
            packet["sender"],
            packet["receiver"],
        )
        return {
            "verified": False,
            "reason": "Authentication failed. The packet was modified.",
            "message": None,
            "packetStatus": "Rejected",
        }

    if sequence_number in RECEIVED_SEQUENCE_NUMBERS and not allow_replay:
        log_event(
            "Replay blocked",
            "rejected",
            packet["packetId"],
            sequence_number,
            packet["packetSize"],
            packet["sender"],
            packet["receiver"],
        )
        return {
            "verified": False,
            "reason": "Replay attack detected",
            "message": None,
            "packetStatus": "Rejected",
        }

    RECEIVED_SEQUENCE_NUMBERS.add(sequence_number)
    packet["status"] = "verified"
    log_event(
        "Decryption",
        "protected",
        packet["packetId"],
        sequence_number,
        packet["packetSize"],
        packet["sender"],
        packet["receiver"],
    )
    return {
        "verified": True,
        "reason": "Authentication and integrity verified",
        "message": plaintext.decode("utf-8"),
        "packetStatus": "Verified",
    }


@app.post("/api/replay")
def replay(request: PacketRequest):
    packet = PACKETS.get(request.packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail="Packet not found")
    return verify_packet(packet, allow_replay=False)


@app.get("/api/esp-info")
def esp_info():
    return {
        "spi": SPI,
        "algorithm": "AES-256-GCM",
        "nonceSize": 96,
        "tagSize": 128,
        "mode": "ESP Transport Simulation",
    }
