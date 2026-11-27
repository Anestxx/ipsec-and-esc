# SecureTunnel

## Abstract

SecureTunnel is a web-based educational simulator for IPsec Encapsulating Security Payload. It demonstrates confidentiality, integrity, authentication and replay protection using React, FastAPI, AES-256-GCM and SQLite.

## Objectives

- Demonstrate AES-256-GCM authenticated encryption.
- Represent ESP packet fields in an inspectable interface.
- Simulate ciphertext modification and replay attacks.
- Record packet activity for a live dashboard.
- Explain IPsec ESP concepts through an interactive protocol explorer.

## System architecture

The React presentation layer communicates with FastAPI through REST APIs. FastAPI performs cryptographic operations with Python Cryptography and logs packet metadata in SQLite.

```text
React UI -> FastAPI routes -> AES-GCM security module -> SQLite event database
                    |
                    -> ESP packet state and replay protection
```

## Security design

Each encryption operation creates a fresh 96-bit nonce and an incrementing sequence number. The ciphertext and 128-bit authentication tag are generated using AES-256-GCM. Packet ID, SPI and sequence number are provided as associated data.

Tampering is detected because GCM verification fails when ciphertext or associated packet data changes. Replay is detected because the receiver records processed sequence numbers.

## Scope limitations

The application is an ESP educational simulator, not a complete IPsec implementation. It does not implement IKEv2, kernel-level packet encapsulation or operating-system tunnel interfaces. Keys are simulated in process memory for demonstration purposes.
