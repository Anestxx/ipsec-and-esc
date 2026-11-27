import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleAlert,
  Copy,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Radio,
  RefreshCcw,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API = 'http://localhost:8000'

async function api(path, options) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'packet', label: 'ESP Packet Lab', icon: SlidersHorizontal },
  { id: 'tampering', label: 'Tampering Lab', icon: ShieldX },
  { id: 'explorer', label: 'Protocol Explorer', icon: BookOpen },
]

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [dashboard, setDashboard] = useState({
    stats: { totalPackets: 0, protectedPackets: 0, rejectedPackets: 0, activeAssociations: 1 },
    events: [],
  })
  const [packet, setPacket] = useState(null)
  const [message, setMessage] = useState('Transfer confidential project information.')
  const [sender, setSender] = useState('Sender A')
  const [receiver, setReceiver] = useState('Receiver B')
  const [verification, setVerification] = useState(null)
  const [busy, setBusy] = useState(false)

  async function refreshDashboard() {
    try {
      setDashboard(await api('/api/dashboard'))
    } catch {
      setDashboard((current) => current)
    }
  }

  useEffect(() => {
    refreshDashboard()
  }, [])

  async function encryptPacket() {
    setBusy(true)
    try {
      const data = await api('/api/encrypt', {
        method: 'POST',
        body: JSON.stringify({ message, sender, receiver }),
      })
      setPacket(data.packet)
      setVerification(null)
      await refreshDashboard()
    } catch (error) {
      setVerification({ verified: false, reason: error.message, packetStatus: 'Error' })
    } finally {
      setBusy(false)
    }
  }

  async function verifyPacket() {
    if (!packet) return
    setBusy(true)
    try {
      const data = await api('/api/verify', {
        method: 'POST',
        body: JSON.stringify({ packet_id: packet.packetId }),
      })
      setVerification(data)
      await refreshDashboard()
    } finally {
      setBusy(false)
    }
  }

  async function tamperPacket() {
    if (!packet) return
    setBusy(true)
    try {
      const data = await api('/api/tamper', {
        method: 'POST',
        body: JSON.stringify({ packet_id: packet.packetId }),
      })
      setPacket(data.packet)
      setVerification(null)
      await refreshDashboard()
    } finally {
      setBusy(false)
    }
  }

  async function replayPacket() {
    if (!packet) return
    setBusy(true)
    try {
      const data = await api('/api/replay', {
        method: 'POST',
        body: JSON.stringify({ packet_id: packet.packetId }),
      })
      setVerification(data)
      await refreshDashboard()
    } finally {
      setBusy(false)
    }
  }

  async function resetDemo() {
    setBusy(true)
    try {
      await api('/api/reset', { method: 'POST' })
      setPacket(null)
      setVerification(null)
      await refreshDashboard()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><LockKeyhole size={18} /></div>
          <div>
            <strong>SecureTunnel</strong>
            <span>ESP Simulator</span>
          </div>
        </div>
        <nav>
          <span className="nav-label">Workspace</span>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={activePage === item.id ? 'nav-item active' : 'nav-item'}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={17} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">AC</div>
          <div><strong>Admin Console</strong><span>Security operator</span></div>
          <ChevronDown size={14} />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">IPsec / Encapsulating Security Payload</p>
            <h1>{navItems.find((item) => item.id === activePage)?.label}</h1>
          </div>
          <div className="top-actions">
            <div className="status-pill"><span></span>System operational</div>
            <button className="reset-button" onClick={resetDemo} disabled={busy}>
              <RefreshCcw size={14} /> Reset demo
            </button>
            <button className="icon-button" onClick={refreshDashboard} aria-label="Refresh">
              <RefreshCcw size={16} />
            </button>
          </div>
        </header>

        {activePage === 'dashboard' && (
          <Dashboard dashboard={dashboard} setActivePage={setActivePage} />
        )}
        {activePage === 'packet' && (
          <PacketLab
            message={message}
            setMessage={setMessage}
            sender={sender}
            setSender={setSender}
            receiver={receiver}
            setReceiver={setReceiver}
            packet={packet}
            verification={verification}
            busy={busy}
            encryptPacket={encryptPacket}
            verifyPacket={verifyPacket}
          />
        )}
        {activePage === 'tampering' && (
          <TamperingLab
            packet={packet}
            verification={verification}
            busy={busy}
            encryptPacket={encryptPacket}
            tamperPacket={tamperPacket}
            verifyPacket={verifyPacket}
            replayPacket={replayPacket}
          />
        )}
        {activePage === 'explorer' && <ProtocolExplorer />}
      </main>
    </div>
  )
}

function Dashboard({ dashboard, setActivePage }) {
  const stats = dashboard.stats
  const chartData = (dashboard.events || []).slice(0, 8).reverse().map((event, index) => ({
    name: `P${index + 1}`,
    protected: event.status === 'protected' ? 1 : 0,
    rejected: event.status === 'rejected' ? 1 : 0,
  }))
  const cards = [
    { label: 'Total packets', value: stats.totalPackets, icon: Activity, tone: 'blue' },
    { label: 'Protected packets', value: stats.protectedPackets, icon: ShieldCheck, tone: 'green' },
    { label: 'Rejected packets', value: stats.rejectedPackets, icon: ShieldX, tone: 'red' },
    { label: 'Active associations', value: stats.activeAssociations, icon: Network, tone: 'violet' },
  ]

  return (
    <div className="content">
      <section className="stats-grid">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article className="stat-card" key={card.label}>
              <div className={`stat-icon ${card.tone}`}><Icon size={19} /></div>
              <div><span>{card.label}</span><strong>{String(card.value).padStart(2, '0')}</strong></div>
              <Activity size={14} className="trend-icon" />
            </article>
          )
        })}
      </section>

      <section className="dashboard-grid">
        <article className="panel topology-panel">
          <PanelHeader title="Network topology" subtitle="Simulated security association" />
          <div className="topology">
            <Node label="Sender" sublabel="Endpoint A" />
            <div className="tunnel-line">
              <span className="packet-dot"></span>
              <div><LockKeyhole size={16} /> IPsec ESP tunnel</div>
              <small>AES-256-GCM</small>
            </div>
            <Node label="Receiver" sublabel="Endpoint B" />
          </div>
          <div className="association-bar">
            <span><i></i> Security Association Active</span>
            <code>SPI 0x1001</code>
          </div>
        </article>

        <article className="panel chart-panel">
          <PanelHeader title="Traffic activity" subtitle="Protected vs rejected packets" />
          <div className="chart-wrap">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="protected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f85ff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f85ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#242c3b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#6f7b91" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#6f7b91" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#151c29', border: '1px solid #263247' }} />
                  <Area type="monotone" dataKey="protected" stroke="#4f85ff" fill="url(#protected)" />
                  <Area type="monotone" dataKey="rejected" stroke="#ef6a73" fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart"><Radio size={22} /> Awaiting packet activity</div>
            )}
          </div>
        </article>

        <article className="panel events-panel">
          <PanelHeader title="Recent events" subtitle="Latest packet activity" />
          <div className="event-list">
            {(dashboard.events || []).slice(0, 6).map((event, index) => (
              <div className="event-row" key={`${event.id}-${index}`}>
                <div className={event.status === 'rejected' ? 'event-dot rejected' : 'event-dot'}>
                  {event.status === 'rejected' ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
                </div>
                <div><strong>{event.event_type}</strong><span>{event.packet_id}</span></div>
                <time>{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
            ))}
            {!dashboard.events?.length && <div className="empty-events">No events yet</div>}
          </div>
        </article>
      </section>

      <button className="floating-action" onClick={() => setActivePage('packet')}>
        <Zap size={17} /> Open Packet Lab <ArrowRight size={15} />
      </button>
    </div>
  )
}

function Node({ label, sublabel }) {
  return (
    <div className="node">
      <div className="node-icon"><Radio size={19} /></div>
      <strong>{label}</strong>
      <span>{sublabel}</span>
    </div>
  )
}

function PanelHeader({ title, subtitle }) {
  return (
    <div className="panel-header">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
      <button className="icon-button" aria-label="Panel options">•••</button>
    </div>
  )
}

function PacketLab(props) {
  const { packet, verification } = props
  return (
    <div className="content lab-layout">
      <article className="panel sender-panel">
        <PanelHeader title="Sender" subtitle="Create an encrypted ESP packet" />
        <div className="field-row">
          <label>Sender
            <select value={props.sender} onChange={(event) => props.setSender(event.target.value)}>
              <option>Sender A</option><option>Sender C</option>
            </select>
          </label>
          <label>Receiver
            <select value={props.receiver} onChange={(event) => props.setReceiver(event.target.value)}>
              <option>Receiver B</option><option>Receiver D</option>
            </select>
          </label>
        </div>
        <label className="message-label">Plaintext message
          <textarea
            value={props.message}
            onChange={(event) => props.setMessage(event.target.value)}
            maxLength={5000}
            placeholder="Enter confidential information..."
          />
          <span>{props.message.length} / 5000</span>
        </label>
        <button className="primary-button" onClick={props.encryptPacket} disabled={props.busy}>
          <LockKeyhole size={16} /> {props.busy ? 'Encrypting...' : 'Encrypt & transmit'}
        </button>
      </article>

      <article className="panel packet-panel">
        <PanelHeader title="Protected packet" subtitle="ESP packet inspector" />
        {packet ? (
          <div className="packet-fields">
            <PacketField label="Security Parameters Index" value={packet.spi} />
            <PacketField label="Sequence number" value={String(packet.sequenceNumber).padStart(6, '0')} />
            <PacketField label="Explicit IV / nonce" value={packet.iv} mono />
            <PacketField label="Ciphertext" value={packet.ciphertext} mono />
            <PacketField label="Authentication tag" value={packet.authenticationTag} mono accent />
            <div className="packet-meta">
              <span>Packet size <strong>{packet.packetSize} bytes</strong></span>
              <span>Status <strong className="status-encrypted">{packet.status}</strong></span>
            </div>
          </div>
        ) : (
          <EmptyPacket />
        )}
      </article>

      <article className="panel receiver-panel">
        <PanelHeader title="Receiver" subtitle="Authentication & decryption" />
        {packet ? (
          <div className="receiver-content">
            <div className={verification?.verified ? 'verification verified' : verification ? 'verification rejected' : 'verification waiting'}>
              {verification?.verified ? <ShieldCheck size={22} /> : verification ? <ShieldX size={22} /> : <LockKeyhole size={22} />}
              <div>
                <span>Packet verification</span>
                <strong>{verification?.packetStatus || 'Awaiting verification'}</strong>
              </div>
            </div>
            {verification?.verified && (
              <div className="plaintext-box"><span>Decrypted message</span><p>{verification.message}</p></div>
            )}
            {verification?.reason && !verification.verified && <p className="reason-text">{verification.reason}</p>}
            <button className="secondary-button" onClick={props.verifyPacket} disabled={props.busy}>
              <ShieldCheck size={16} /> Verify & decrypt
            </button>
          </div>
        ) : (
          <EmptyPacket compact />
        )}
      </article>
    </div>
  )
}

function PacketField({ label, value, mono, accent }) {
  return (
    <div className="packet-field">
      <span>{label}</span>
      <div className={mono ? 'hex-value' : accent ? 'hex-value accent' : 'normal-value'}>
        <code>{value}</code>
        {mono && <button onClick={() => navigator.clipboard?.writeText(value)} aria-label="Copy value"><Copy size={13} /></button>}
      </div>
    </div>
  )
}

function EmptyPacket({ compact }) {
  return (
    <div className={compact ? 'empty-packet compact' : 'empty-packet'}>
      <LockKeyhole size={24} />
      <strong>No protected packet</strong>
      <span>Encrypt a message to inspect the ESP data.</span>
    </div>
  )
}

function TamperingLab({ packet, verification, busy, encryptPacket, tamperPacket, verifyPacket, replayPacket }) {
  return (
    <div className="content tampering-layout">
      <article className="panel tamper-panel">
        <PanelHeader title="Attack controls" subtitle="Test ESP integrity mechanisms" />
        {!packet ? (
          <div className="attack-empty"><CircleAlert size={24} /><strong>Create a packet first</strong><span>Start in the Packet Lab or generate a sample here.</span></div>
        ) : (
          <div className="attack-controls">
            <div className="attack-card">
              <div className="attack-icon"><ShieldX size={18} /></div>
              <div><strong>Modify ciphertext</strong><span>Flip one byte while preserving the authentication tag.</span></div>
            </div>
            <button className="danger-button" onClick={tamperPacket} disabled={busy || packet.tampered}><ShieldX size={16} /> Simulate packet tampering</button>
            <div className="attack-card replay">
              <div className="attack-icon"><RefreshCcw size={18} /></div>
              <div><strong>Replay captured packet</strong><span>Resend the packet with the original sequence number.</span></div>
            </div>
            <button className="warning-button" onClick={replayPacket} disabled={busy}><RefreshCcw size={16} /> Replay old packet</button>
          </div>
        )}
        <button className="secondary-button generate" onClick={encryptPacket} disabled={busy}><LockKeyhole size={16} /> Generate new packet</button>
      </article>

      <article className="panel forensic-panel">
        <PanelHeader title="Packet verification" subtitle="Receiver-side security analysis" />
        {packet ? (
          <div className="forensic-content">
            <div className="forensic-row"><span>Packet ID</span><code>{packet.packetId}</code></div>
            <div className="forensic-row"><span>Sequence</span><code>{String(packet.sequenceNumber).padStart(6, '0')}</code></div>
            <div className="forensic-row"><span>Ciphertext</span><code className="forensic-value">{packet.ciphertext}</code></div>
            <div className="forensic-row"><span>Tag</span><code className="forensic-value">{packet.authenticationTag}</code></div>
            {packet.tampered && <div className="tamper-indicator"><ShieldX size={15} /> Byte modification detected in local sample</div>}
            <button className="primary-button" onClick={verifyPacket} disabled={busy}><ShieldCheck size={16} /> Verify packet</button>
            {verification && (
              <div className={verification.verified ? 'attack-result success' : 'attack-result'}>
                {verification.verified ? <ShieldCheck size={22} /> : <ShieldX size={22} />}
                <div><span>Result</span><strong>{verification.verified ? 'Accepted' : 'Rejected'}</strong><p>{verification.reason}</p></div>
              </div>
            )}
          </div>
        ) : <EmptyPacket />}
      </article>
    </div>
  )
}

function ProtocolExplorer() {
  const [mode, setMode] = useState('transport')
  const fields = [
    ['SPI', 'Identifies the active Security Association'],
    ['Sequence Number', 'Detects replayed or out-of-window packets'],
    ['IV / nonce', 'Supplies the AES-GCM initialization value'],
    ['Encrypted payload', 'Carries confidential packet data'],
    ['Authentication tag', 'Verifies integrity and authenticity'],
  ]
  return (
    <div className="content explorer-layout">
      <article className="panel explorer-structure">
        <PanelHeader title="ESP packet structure" subtitle="Encapsulating Security Payload format" />
        <div className="packet-structure">
          {fields.map(([name, description], index) => (
            <div className={`structure-field field-${index}`} key={name}>
              <strong>{name}</strong><span>{description}</span>
            </div>
          ))}
        </div>
        <div className="legend-row">
          <span><i className="legend-header"></i> ESP header</span>
          <span><i className="legend-protected"></i> Protected data</span>
          <span><i className="legend-tag"></i> Integrity tag</span>
        </div>
      </article>
      <article className="panel mode-panel">
        <PanelHeader title="Operating modes" subtitle="Compare ESP protection models" />
        <div className="mode-tabs">
          <button className={mode === 'transport' ? 'active' : ''} onClick={() => setMode('transport')}>Transport mode</button>
          <button className={mode === 'tunnel' ? 'active' : ''} onClick={() => setMode('tunnel')}>Tunnel mode</button>
        </div>
        <div className="mode-diagram">
          {mode === 'transport' ? (
            <>
              <span>Original IP Header</span><strong>ESP Protected Payload</strong>
            </>
          ) : (
            <>
              <strong>New IP Header</strong><span>Original IP Packet</span><strong>ESP Trailer</strong>
            </>
          )}
        </div>
        <p className="mode-description">
          {mode === 'transport'
            ? 'Transport mode protects the IP payload while retaining the original IP header. It is commonly used for host-to-host communication.'
            : 'Tunnel mode encapsulates the complete original IP packet in an ESP-protected tunnel, hiding the original network address details.'}
        </p>
      </article>
      <article className="panel concepts-panel">
        <PanelHeader title="Core concepts" subtitle="Theory for the viva" />
        <div className="concept-grid">
          <Concept title="Security Association" text="A negotiated set of cryptographic parameters, including the SPI and AES key." />
          <Concept title="Replay protection" text="Receiver tracking rejects duplicate or previously processed sequence numbers." />
          <Concept title="AES-GCM" text="Authenticated encryption provides confidentiality, integrity and authentication." />
        </div>
      </article>
    </div>
  )
}

function Concept({ title, text }) {
  return <div className="concept"><strong>{title}</strong><p>{text}</p></div>
}

export default App
