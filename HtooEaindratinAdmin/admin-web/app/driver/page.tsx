'use client'

export default function DriverWeb() {
  return (
    <main className="login">
      <div className="card" style={{ maxWidth: 500, margin: 'auto' }}>
        <p className="eyebrow">Driver Application</p>

        <h1>Open Driver App</h1>

        <p className="hero-copy">
          Driver operations are handled in the Driver mobile application.
        </p>

        <a
          href="exp://127.0.0.1:8081"
          className="btn"
          style={{
            display: 'block',
            textAlign: 'center',
            textDecoration: 'none',
            marginTop: 20,
          }}
        >
          Open Driver App
        </a>
      </div>
    </main>
  )
}