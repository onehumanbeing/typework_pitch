import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/* ── Password gate ─────────────────────────────────────── */
const PASS = 'typework2026'

function useAuth() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('passwd') === PASS
  }, [])
}

function LockScreen() {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    if (input === PASS) {
      window.location.search = `?passwd=${PASS}`
    } else {
      setError(true)
      setTimeout(() => setError(false), 1500)
    }
  }
  return (
    <div style={{
      width:'100vw',height:'100vh',background:'#0a0e1a',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      fontFamily:"'Inter',sans-serif",color:'#fff',
    }}>
      <div style={{fontSize:18,fontWeight:600,letterSpacing:4,color:'#00d2be',marginBottom:24,textTransform:'uppercase'}}>
        Typework Pitch
      </div>
      <form onSubmit={submit} style={{display:'flex',gap:12}}>
        <input
          type="password"
          value={input}
          onChange={e=>setInput(e.target.value)}
          placeholder="Enter password"
          autoFocus
          style={{
            background:'rgba(255,255,255,0.06)',border: error ? '1.5px solid #ff4d6a' : '1.5px solid rgba(255,255,255,0.1)',
            borderRadius:10,padding:'12px 20px',fontSize:16,color:'#fff',outline:'none',width:260,
            transition:'border-color 0.2s',
          }}
        />
        <button type="submit" style={{
          background:'#00d2be',border:'none',borderRadius:10,padding:'12px 24px',
          fontSize:16,fontWeight:700,color:'#0b1120',cursor:'pointer',
        }}>Enter</button>
      </form>
      {error && <div style={{marginTop:14,fontSize:14,color:'#ff4d6a'}}>Wrong password</div>}
    </div>
  )
}

/*
  Slide types: 'video' | 'image' | 'html'

  Flow:
  0-3   → video (slide1–4.mp4)
  4     → html  (slide_5_market_who_joins)
  5     → html  (slide_meet_first_customer) ← ICP persona
  6     → html  (slide_what_typework_does)
  7     → html  (slide_5_shift_opportunity)
  8     → html  (Synergy 1: Opportunity Sharing — 商机共享)
  9     → html  (Synergy 2: Smart Bundling)
  10    → html  (Competitive Landscape)
  11    → html  (slide_moat)
  12    → html  (slide_team)
  13    → html  (slide_traction)
  14    → image (Closing)
*/

const SLIDES = [
  { type: 'video', src: '/videos/slide1.mp4' },
  { type: 'video', src: '/videos/slide2.mp4' },
  { type: 'video', src: '/videos/slide3.mp4' },
  { type: 'video', src: '/videos/slide4.mp4' },
  { type: 'html',  src: '/html/slide_5_market_who_joins.html' },
  { type: 'html',  src: '/html/slide_meet_first_customer.html' },
  { type: 'html',  src: '/html/slide_what_typework_does.html' },
  { type: 'html',  src: '/html/slide_5_shift_opportunity.html' },
  { type: 'html',  src: '/html/slide_synergy_opportunity_sharing.html' },
  { type: 'html',  src: '/html/slide_synergy_bundle.html' },
  { type: 'html',  src: '/html/slide_competitive.html' },
  { type: 'html',  src: '/html/slide_moat.html' },
  { type: 'html',  src: '/html/slide_team.html' },
  { type: 'html',  src: '/html/slide_traction.html' },
  { type: 'image', src: '/slides/slide-closing.png' },
]

const TOTAL = SLIDES.length
const LAST_VIDEO_INDEX = 3

export default function App() {
  const authed = useAuth()
  if (!authed) return <LockScreen />
  return <PitchDeck />
}

function PitchDeck() {
  const [current, setCurrent] = useState(0)
  const [videoState, setVideoState] = useState('poster')
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  const [jumpInput, setJumpInput] = useState('')
  const jumpTimer = useRef(null)

  const slide = SLIDES[current]
  const isVideo = slide.type === 'video'
  const lastClickRef = useRef(0)

  /* ── preload all media on mount ──────────────────────── */
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadDone, setLoadDone] = useState(false)

  useEffect(() => {
    const mediaSlides = SLIDES.filter(s => s.type === 'image' || s.type === 'video')
    const total = mediaSlides.length
    if (total === 0) { setLoadDone(true); return }
    let loaded = 0
    const tick = () => {
      loaded++
      setLoadProgress(loaded / total)
      if (loaded >= total) setTimeout(() => setLoadDone(true), 400)
    }
    mediaSlides.forEach(s => {
      if (s.type === 'image') {
        const img = new Image()
        img.onload = img.onerror = tick
        img.src = s.src
      } else {
        fetch(s.src).then(tick).catch(tick)
      }
    })
  }, [])

  /* ── iframe scaling to fit viewport ─────────────────── */
  const [iframeScale, setIframeScale] = useState(1)
  useEffect(() => {
    const calcScale = () => {
      const sx = window.innerWidth / 1920
      const sy = window.innerHeight / 1080
      setIframeScale(Math.min(sx, sy))
    }
    calcScale()
    window.addEventListener('resize', calcScale)
    return () => window.removeEventListener('resize', calcScale)
  }, [])

  /* ── navigation ─────────────────────────────────────── */
  const goNext = useCallback(() => {
    if (isVideo && videoState === 'poster') {
      setVideoState('playing')
      videoRef.current?.play()
      return
    }
    if (isVideo && videoState === 'playing') {
      const now = Date.now()
      if (now - lastClickRef.current < 500) {
        videoRef.current?.pause()
        if (current < TOTAL - 1) {
          setCurrent(c => c + 1)
          setVideoState('poster')
        }
      }
      lastClickRef.current = now
      return
    }
    if (current < TOTAL - 1) {
      setCurrent(c => c + 1)
      setVideoState('poster')
    }
  }, [current, isVideo, videoState])

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent(c => c - 1)
      setVideoState('poster')
    }
  }, [current])

  /* ── jump to slide: type number + Enter ──────────────── */
  const goTo = useCallback((n) => {
    const idx = Math.max(0, Math.min(n - 1, TOTAL - 1))
    setCurrent(idx)
    setVideoState('poster')
  }, [])

  /* ── keyboard (supports presentation clickers) ──────── */
  useEffect(() => {
    const onKey = (e) => {
      // Number keys → accumulate for jump (e.g. "1" "2" → slide 12)
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        setJumpInput(prev => prev + e.key)
        clearTimeout(jumpTimer.current)
        // Auto-clear after 1.5s if no Enter pressed
        jumpTimer.current = setTimeout(() => setJumpInput(''), 1500)
        return
      }

      // Enter with pending number → jump
      if (e.key === 'Enter' && jumpInput) {
        e.preventDefault()
        goTo(parseInt(jumpInput, 10))
        setJumpInput('')
        clearTimeout(jumpTimer.current)
        return
      }

      if (['ArrowRight', ' ', 'Enter', 'PageDown', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        goNext()
      } else if (['ArrowLeft', 'Backspace', 'PageUp', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Escape') {
        // Cancel jump input or exit fullscreen
        if (jumpInput) {
          setJumpInput('')
          clearTimeout(jumpTimer.current)
        } else if (document.fullscreenElement) {
          document.exitFullscreen()
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      } else if (e.key === 'F5') {
        e.preventDefault()
        containerRef.current?.requestFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, goTo, jumpInput])

  /* ── video ended ────────────────────────────────────── */
  const onVideoEnded = useCallback(() => {
    if (current === LAST_VIDEO_INDEX) {
      setVideoState('ended')
    } else if (current < TOTAL - 1) {
      setCurrent(c => c + 1)
      setVideoState('poster')
    }
  }, [current])

  /* ── touch / swipe ──────────────────────────────────── */
  const touchStart = useRef(null)
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    if (dx < -50) goNext()
    else if (dx > 50) goPrev()
    touchStart.current = null
  }

  /* ── render slide content ───────────────────────────── */
  const renderSlide = () => {
    if (slide.type === 'video') {
      return (
        <video
          ref={videoRef}
          key={slide.src}
          src={slide.src}
          style={styles.media}
          playsInline
          preload="auto"
          onEnded={onVideoEnded}
        />
      )
    }

    if (slide.type === 'html') {
      return (
        <div style={styles.iframeContainer}>
          <iframe
            key={slide.src}
            src={slide.src}
            style={{
              ...styles.iframe,
              transform: `scale(${iframeScale})`,
            }}
            title={`Slide ${current + 1}`}
            sandbox="allow-same-origin"
            scrolling="no"
          />
          {/* Transparent overlay to capture clicks/prevent iframe stealing focus */}
          <div style={styles.iframeOverlay} />
        </div>
      )
    }

    return (
      <img
        key={slide.src}
        src={slide.src}
        alt={`Slide ${current + 1}`}
        style={styles.media}
        draggable={false}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onClick={goNext}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Media loading bar */}
      {!loadDone && (
        <div style={styles.loadTrack}>
          <div style={{
            ...styles.loadBar,
            width: `${loadProgress * 100}%`,
          }} />
        </div>
      )}

      <div style={styles.slideWrapper}>
        {renderSlide()}
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressBar,
            width: `${((current + 1) / TOTAL) * 100}%`,
          }}
        />
      </div>

      {/* Slide counter */}
      <div style={styles.counter}>
        {current + 1} / {TOTAL}
      </div>

      {/* Jump input indicator */}
      {jumpInput && (
        <div style={styles.jumpBadge}>
          Go to: <strong>{jumpInput}</strong> ↵
        </div>
      )}

      {/* Nav arrows */}
      <button
        style={{ ...styles.arrow, left: 16, opacity: current === 0 ? 0.2 : 1 }}
        onClick={(e) => { e.stopPropagation(); goPrev() }}
        aria-label="Previous"
      >
        ‹
      </button>
      <button
        style={{ ...styles.arrow, right: 16, opacity: current === TOTAL - 1 ? 0.2 : 1 }}
        onClick={(e) => { e.stopPropagation(); goNext() }}
        aria-label="Next"
      >
        ›
      </button>
    </div>
  )
}

/* ── styles ──────────────────────────────────────────── */
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    background: '#0a0e1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
    overflow: 'hidden',
  },
  slideWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  iframeContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iframe: {
    width: '1920px',
    height: '1080px',
    border: 'none',
    transformOrigin: 'center center',
    /* Scale down to fit viewport — CSS will handle via JS below */
    position: 'absolute',
  },
  iframeOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'rgba(255,255,255,0.08)',
    zIndex: 5,
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #00d4aa, #00e5c0)',
    transition: 'width 0.35s ease',
  },
  counter: {
    position: 'absolute',
    bottom: 12,
    right: 20,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    zIndex: 5,
  },
  jumpBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    color: '#ffffff',
    fontSize: 20,
    padding: '12px 28px',
    borderRadius: 12,
    zIndex: 20,
    border: '1px solid rgba(255,255,255,0.1)',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
    pointerEvents: 'none',
  },
  loadTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'transparent',
    zIndex: 20,
  },
  loadBar: {
    height: '100%',
    background: 'rgba(255,255,255,0.25)',
    transition: 'width 0.3s ease',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 32,
    width: 44,
    height: 44,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
    zIndex: 10,
    backdropFilter: 'blur(4px)',
  },
}
