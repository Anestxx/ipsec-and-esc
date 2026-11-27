# SecureTunnel Class Demonstration Guide

## 1. Start the project

1. Run `setup.bat` once.
2. Run `start.bat`.
3. Wait for both terminals to finish starting.
4. Open `http://127.0.0.1:5173`.

If a browser does not open automatically, open the address manually.

## 2. Suggested live sequence

### Dashboard

Explain that the dashboard presents packets and security events stored in SQLite.
Point out:

- Total packets
- Protected packets
- Rejected packets
- Active Security Association
- Sender, ESP tunnel and receiver topology

### Packet Lab

1. Keep the default confidential message or enter a custom message.
2. Select Sender A and Receiver B.
3. Click **Encrypt & transmit**.
4. Point out the SPI, sequence number, nonce, ciphertext and authentication tag.
5. Return to the receiver panel.
6. Click **Verify & decrypt**.
7. Explain that the backend authenticated the GCM tag before revealing plaintext.

### Tampering Lab

1. Open **Tampering Lab**.
2. Click **Simulate packet tampering**.
3. Explain that one byte of ciphertext is flipped.
4. Click **Verify packet**.
5. The result must be **Rejected** with authentication failure.

### Replay demonstration

1. Create a new packet.
2. Verify it successfully once.
3. Click **Replay old packet**.
4. The result must be **Rejected** with replay attack detected.

### Protocol Explorer

Explain:

- SPI identifies the Security Association.
- Sequence number provides replay protection.
- IV/nonce is used once with the key.
- AES-GCM supplies confidentiality and authentication.
- Transport mode protects payload; tunnel mode encapsulates the complete packet.

## 3. Key viva answers

**What is IPsec ESP?**  
Encapsulating Security Payload provides confidentiality and integrity for packet data.

**How is encryption performed?**  
The backend uses AES-256-GCM with a random 96-bit nonce.

**How is tampering detected?**  
GCM verifies the authentication tag over ciphertext and associated ESP fields. A changed byte causes verification failure.

**What does replay protection do?**  
It records received sequence numbers and rejects a previously received packet.

**What is stored in SQLite?**  
Packet metadata and event history. Plaintext and secret encryption keys are not stored.

**Is this a real IPsec implementation?**  
No. It is an educational simulator. It demonstrates ESP concepts and real AES-GCM cryptography, but does not implement IKEv2 or an operating-system network tunnel.

**What is a Security Association?**  
It is the shared set of parameters used for communication, represented here by SPI, key, algorithm and sequence state.
