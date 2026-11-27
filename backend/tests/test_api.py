from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_encrypt_and_successful_verify():
    client.post("/api/reset")
    encrypted = client.post(
        "/api/encrypt",
        json={
            "message": "Transfer confidential project information.",
            "sender": "Sender A",
            "receiver": "Receiver B",
        },
    )
    assert encrypted.status_code == 200
    packet = encrypted.json()["packet"]
    assert packet["spi"] == "0x1001"
    assert packet["ciphertext"]
    assert packet["authenticationTag"]

    verified = client.post(
        "/api/verify",
        json={"packet_id": packet["packetId"]},
    )
    assert verified.status_code == 200
    assert verified.json()["verified"] is True
    assert "confidential" in verified.json()["message"]


def test_tampered_packet_is_rejected():
    client.post("/api/reset")
    encrypted = client.post(
        "/api/encrypt",
        json={"message": "Integrity test", "sender": "Sender A", "receiver": "Receiver B"},
    )
    packet_id = encrypted.json()["packet"]["packetId"]
    tampered = client.post("/api/tamper", json={"packet_id": packet_id})
    assert tampered.status_code == 200
    assert tampered.json()["packet"]["tampered"] is True

    result = client.post("/api/verify", json={"packet_id": packet_id})
    assert result.status_code == 200
    assert result.json()["verified"] is False
    assert "modified" in result.json()["reason"].lower()


def test_replay_packet_is_rejected():
    client.post("/api/reset")
    encrypted = client.post(
        "/api/encrypt",
        json={"message": "Replay test", "sender": "Sender A", "receiver": "Receiver B"},
    )
    packet_id = encrypted.json()["packet"]["packetId"]

    first = client.post("/api/verify", json={"packet_id": packet_id})
    assert first.json()["verified"] is True

    replay = client.post("/api/replay", json={"packet_id": packet_id})
    assert replay.status_code == 200
    assert replay.json()["verified"] is False
    assert "Replay attack" in replay.json()["reason"]


def test_reset_clears_packets_and_activity():
    client.post("/api/encrypt", json={"message": "Reset test"})
    reset = client.post("/api/reset")
    assert reset.status_code == 200
    dashboard = client.get("/api/dashboard").json()
    assert dashboard["stats"]["totalPackets"] == 0
    assert dashboard["events"] == []
