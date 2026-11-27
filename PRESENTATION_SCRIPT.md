# SecureTunnel — Detailed Presentation Script

**Suggested duration:** 18–22 minutes, including the live application demo  
**Audience:** Classmates and faculty  
**Presentation files:** `SecureTunnel_Presentation.pptx` and the running application at `http://127.0.0.1:5173`

## Before the presentation

1. Start the backend and frontend and confirm the application opens.
2. Keep the two server terminal windows open.
3. Open the PowerPoint deck and start the slide show.
4. Open the application in a second browser tab.
5. In the app, use **Reset demo** so the dashboard begins clean.
6. Make sure a sample message is ready in the Packet Lab.

If the live demo fails, continue with the slides and explain the expected outcome. Do not describe a simulated behavior as a real network tunnel.

---

## Slide 1 — SecureTunnel

**Say:**

“Good morning. My project is called SecureTunnel. It is an educational simulator for IPsec Encapsulating Security Payload, usually shortened to ESP. The purpose is to make the security ideas behind protected network packets visible and interactive. A user can send a message, inspect its protected packet representation, receive and decrypt it, and then deliberately test what happens if a packet is changed or replayed.”

“This project combines a React web interface, a Python FastAPI backend, AES-256-GCM cryptography, and SQLite activity logging. I will explain the problem, how the security flow works, what the application demonstrates, and finally show the main features.”

**Transition:** “First, let us look at the problem we are trying to understand.”

## Slide 2 — Presentation roadmap

**Say:**

“I will begin with network threats and the project goals. Then I will explain where ESP fits in IPsec, describe the system architecture and packet flow, and introduce the cryptographic fields. After that, I will demonstrate the dashboard, encryption and decryption, tampering detection, replay rejection, and the protocol explorer. I will finish with tests, limitations, and possible future improvements.”

## Slide 3 — The problem: communicating over an untrusted network

**Say:**

“When a message travels across a network, we should not assume the path is private or trustworthy. An observer could capture traffic. Someone could change bits in a packet. Someone could capture a previously valid packet and send it again later.”

“Think of sending a sealed parcel through a public delivery service. We want only the intended recipient to read its contents. We also want the recipient to notice if someone opened or changed the parcel. Finally, we do not want an old parcel to be accepted as a brand-new instruction. SecureTunnel uses that simple story to demonstrate the packet security concepts.”

**Transition:** “These threats lead to the security goals.”

## Slide 4 — Security goals

**Say:**

“The first goal is confidentiality: an outsider should not be able to read the protected message. The second is integrity: a receiver should detect an unauthorized change. The third is authentication: the receiver should have evidence that the protected data has not been altered and is associated with the expected security context. The fourth feature demonstrated here is replay protection: a packet already accepted once should not be accepted a second time.”

“In the application, confidentiality and integrity/authentication are demonstrated with AES-GCM. Replay detection is demonstrated by remembering sequence numbers that have already been received.”

## Slide 5 — Where IPsec ESP fits

**Say:**

“IPsec is a family of networking protocols used to protect IP communication. ESP means Encapsulating Security Payload. In a real IPsec system, ESP protects packet data according to a Security Association, which describes parameters such as the security identifier, algorithms, and keying context.”

“ESP can be used in transport mode or tunnel mode. Transport mode protects the payload of an IP packet while retaining its original IP header. Tunnel mode wraps an original IP packet inside another packet, which is useful in network-to-network VPN designs. SecureTunnel explains both modes in diagrams. It does not configure either mode in the operating system.”

## Slide 6 — What is real and what is simulated

**Say:**

“It is important to state the scope accurately. The encryption, decryption, and authentication checks in this application use the real AES-GCM implementation from Python’s Cryptography library. The ciphertext-tampering check and replay demonstration also execute real backend logic.”

“The packet layout is an educational representation, and transmission is simulated between two pages or panels. The application does not negotiate keys with IKEv2, install a network interface, or create an operating-system IPsec tunnel. So this is an ESP security simulator, not a production VPN or a complete IPsec stack.”

**Emphasize:** “The distinction is part of the project, not a weakness to hide.”

## Slide 7 — Application architecture

**Say:**

“The project has four main layers. The presentation layer is React. It displays the dashboard, forms, packet fields, and protocol explanations. The API layer is FastAPI. It receives requests from React, validates inputs, and returns JSON responses. The security layer uses Python Cryptography to encrypt, decrypt, and verify packets. Finally, SQLite stores activity metadata and event history.”

“The frontend does not perform cryptographic operations. For example, when a user clicks Encrypt, React sends a request to the backend. The backend performs the encryption and sends the protected packet fields back as JSON.”

## Slide 8 — End-to-end packet journey

**Say:**

“Here is the packet journey. First, the sender enters plaintext. The backend increments the simulated sequence number and generates a fresh 12-byte nonce. AES-GCM uses the key and nonce to produce encrypted data and an authentication tag. The backend associates the SPI, packet ID, and sequence number as authenticated associated data. It then returns an ESP-like packet object to the frontend.”

“At the receiver, the backend looks up that simulated packet and attempts authenticated decryption. If verification succeeds and the sequence number has not been seen before, the plaintext is returned. If authentication fails, the plaintext is not returned. If the sequence number has already been accepted, the packet is rejected as a replay.”

## Slide 9 — Packet inspector fields

**Say:**

“The packet inspector makes several fields visible. The SPI, or Security Parameters Index, identifies the simulated Security Association. The sequence number identifies the packet’s place in the sequence. The IV, also called the nonce in this AES-GCM demonstration, is a 12-byte value. The ciphertext is the unreadable encrypted message. In the API response, the Base64 ciphertext value includes the GCM tag at its end, and the interface also shows that same tag separately so it is easier to inspect.”

“The screen also shows an estimated packet-size field. Because this is a simplified representation and not a serialized wire-format ESP packet, treat the size as a UI demonstration value rather than a byte-accurate network capture.”

**If asked about other ESP fields:** “A real ESP packet format includes additional fields and formatting details; this simulator focuses on the fields needed to teach the selected authenticated-encryption flow.”

## Slide 10 — AES-256-GCM in simple terms

**Say:**

“AES is a symmetric cipher. Symmetric means the same secret key is used for encryption and decryption. The 256 in AES-256 refers to the key length in bits. GCM is a mode that combines encryption with authentication.”

“A simple analogy is a locked box with a tamper-evident seal. Encryption makes the contents unreadable to someone without the key. The authentication tag acts like a seal that fails verification if the protected information is changed. Because GCM combines these functions, we do not add a separate HMAC in this project.”

## Slide 11 — Nonce and associated data

**Say:**

“The nonce is a value supplied to AES-GCM for an encryption operation. This application generates a fresh random 96-bit nonce for each encrypted packet. Reusing a nonce with the same GCM key can seriously weaken security, so nonce uniqueness is an important rule.”

“Associated data is information that is authenticated but not encrypted. In this implementation, SPI, packet ID, and sequence number are supplied as associated data. That means the receiver checks them as part of authentication, even though those values are not hidden like the message.”

“This is the project’s educational AES-GCM construction. It should not be confused with all details of the standardized IPsec ESP AES-GCM profile.”

## Slide 12 — Security Association and sequence numbers

**Say:**

“A Security Association, or SA, is a set of parameters that lets sender and receiver agree how to protect packets. Our simulator represents one association with a fixed SPI and one AES key generated when the backend process starts. The key stays in process memory and is not written to SQLite.”

“The sender’s sequence counter increments for each created packet. The receiver records sequence numbers after successful verification. If a sequence number is already recorded, a later replay attempt is rejected.”

“For simplicity, the replay list and packet objects are stored in memory. They reset when the backend restarts or when the demo reset control is used. A real network implementation would need durable replay-window state and proper key management.”

## Slide 13 — API and component communication

**Say:**

“React communicates with FastAPI through REST endpoints. The dashboard endpoint returns summary statistics and recent events. The encrypt endpoint accepts a message and endpoint labels. The verify or decrypt endpoint authenticates the packet. The tamper endpoint deliberately changes a byte in the stored ciphertext for the demonstration. The replay endpoint tries to process a packet again. The reset endpoint clears the demo’s in-memory packet state and activity records.”

“The API returns JSON, so the frontend can render the packet fields without handling the secret key. FastAPI also provides an interactive API documentation page for developers.”

## Slide 14 — Application pages

**Say:**

“The application has four main pages. Dashboard gives an overview of security activity and a sender-to-receiver topology. ESP Packet Lab is the main send, inspect, and decrypt workflow. Tampering Lab demonstrates modification and replay attacks. Protocol Explorer explains packet fields and transport versus tunnel mode.”

“The visual design uses a dark technical interface, but the purpose is to keep the information readable rather than imitate a real network monitoring system.”

## Slide 15 — Dashboard

**Say:**

“On the Dashboard, the top cards show packet activity counts, protected and rejected events, and the simulated active association. The topology shows the conceptual path from sender through the ESP tunnel to receiver. The activity panel and recent events come from records stored in SQLite.”

“One precision point: the database records events such as encryption, decryption, authentication failure, and replay rejection. Therefore, the total shown represents activity records and can include more than one event for the same packet. It is an event overview, not a count of unique packets transmitted over a real network.”

**Action:** Point to each card, topology, chart, and recent event list.

## Slide 16 — Live demo: encrypt and decrypt

**Say while navigating:** 

“I will now demonstrate the main path. I open ESP Packet Lab and enter a short confidential message. I choose a sender and receiver, then click Encrypt and transmit.”

“The packet fields now appear. The message itself is not displayed as plaintext in the ciphertext field. I can point out the SPI, sequence number, nonce, ciphertext, authentication tag, and packet status.”

“Next I click Verify and decrypt. The backend first checks authenticated decryption. Only if it passes does the UI display the original message. This demonstrates that encryption is not just scrambling text in the browser; the backend performs the cryptographic operation.”

**Action:** Do not use a genuinely sensitive message. Use a short classroom example.

## Slide 17 — Live demo: ciphertext tampering

**Say while navigating:**

“Now I will demonstrate integrity protection. In the Tampering Lab, I choose Simulate packet tampering. The backend flips one bit in the packet’s encoded encrypted data while leaving the authentication context unchanged.”

“When I verify the packet, AES-GCM detects that the received protected data no longer matches the authentication tag. The result is rejected and the original plaintext is not returned.”

“This is a controlled demonstration: the application itself modifies its packet object. It is not attacking another computer or intercepting real network traffic.”

**Action:** Show the rejection reason and the tampering indicator.

## Slide 18 — Live demo: replay attack

**Say while navigating:**

“For replay protection, I create a fresh packet and verify it once. That sequence number is now recorded by the receiver. I then use Replay old packet to submit the same packet again.”

“The backend recognizes that this sequence number has already been accepted, logs a replay-blocked event, and rejects it. The original demonstration message is not returned on the replay attempt.”

“In real IPsec systems, replay protection commonly uses a sequence number and a replay window. Our teaching version remembers received sequence numbers but does not implement a production-size sliding window.”

## Slide 19 — SQLite activity and privacy

**Say:**

“SQLite stores event metadata such as packet ID, event type, status, sequence number, packet size, sender and receiver labels, and timestamp. The activity database does not store plaintext messages or encryption keys.”

“The current simulator keeps packet objects and the AES key in backend memory. This separation is useful for explaining what gets logged, but it does not provide production key storage or persistence for the simulated packets.”

## Slide 20 — Testing and validation

**Say:**

“The backend has automated API tests for health checks, successful encryption and verification, ciphertext tampering rejection, replay rejection, and resetting the demo state. The frontend was also built for production using the Vite build command.”

“These tests validate the core demonstration behaviors. They do not prove that the simulator is production-secure, that every IPsec standard requirement is implemented, or that it has been independently audited.”

## Slide 21 — Limitations

**Say:**

“There are deliberate scope limitations. The application does not implement IKE or IKEv2 key negotiation, operating-system network tunneling, real IP packet capture, interoperability with IPsec devices, or production authentication and authorization. The key, packet objects, and replay state are in process memory. The database is a small local SQLite activity log.”

“Therefore, the application should be used for learning and demonstration only. It must not be used to protect real confidential communication.”

## Slide 22 — Future improvements

**Say:**

“If this project were developed further, possible improvements include a more complete ESP packet model, a proper replay window, configurable Security Associations, persistent and protected key management, user authentication, stronger deployment controls, broader automated tests, and an isolated lab using real network namespaces.”

“Each of those changes would need careful standards research and security review. They are future work, not features that I claim are already implemented.”

## Slide 23 — Conclusion

**Say:**

“To conclude, SecureTunnel turns several abstract network-security ideas into something we can observe and test. We can encrypt and authenticate a message, inspect its packet representation, detect tampering, reject a replay, and review activity events.”

“The key learning is that confidentiality alone is not enough. A secure receiver also needs to verify integrity and consider replay protection. The project demonstrates these ideas with real AES-GCM operations while clearly identifying the parts that are simulated.”

## Slide 24 — Questions

**Say:**

“Thank you. I am happy to answer questions about the packet flow, AES-GCM, sequence numbers, Security Associations, the application architecture, or the boundaries between this simulator and a real IPsec VPN.”

---

## Quick viva answers

### What does ESP stand for?

Encapsulating Security Payload. It is an IPsec protocol format used to protect packet data.

### What is the difference between encryption and authentication?

Encryption hides information. Authentication verifies that protected data has not been changed and is valid for the cryptographic context. AES-GCM provides both together.

### Why is the nonce needed?

AES-GCM uses a nonce with the key for each encryption. The nonce must not be reused with the same key. This simulator generates a fresh random 96-bit nonce for each packet.

### Is the nonce secret?

No. A nonce can be visible in the packet; it does not replace the secret key.

### What happens if ciphertext changes?

Authenticated decryption fails. The application rejects the packet and does not return the plaintext.

### What is a replay attack?

It is resending a previously valid packet. The sequence number allows the receiver to recognize a packet it has already accepted.

### What is the SPI?

The Security Parameters Index is an identifier used to select a Security Association. This demo uses the fixed illustrative value `0x1001`.

### Does this application create a real VPN?

No. It simulates an ESP workflow in a web application and uses real AES-GCM cryptography, but it does not create an operating-system tunnel or implement IKEv2.

### Why not save the key in the database?

The activity database is for non-secret event history. Saving a raw key there would be poor security practice. In this demonstration, the key remains in backend process memory; production key management would need a secure key store.

### Does a passing test mean it is production-ready?

No. Tests show that selected behaviors work. Production readiness also requires threat modeling, deployment security, key management, access control, monitoring, standards compliance and independent review.
