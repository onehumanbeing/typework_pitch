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
  11    → html  (GTM Strategy)
  12    → html  (slide_team)
  13    → html  (slide_traction)
  14    → image (Closing)
*/

const SLIDES = [
  { type: 'video', src: '/videos/slide1.mp4', endFrame: '/endframes/video1.png' },
  { type: 'video', src: '/videos/slide2.mp4', endFrame: '/endframes/video2.png' },
  { type: 'video', src: '/videos/slide3.mp4', endFrame: '/endframes/video3.png' },
  { type: 'video', src: '/videos/slide4.mp4', endFrame: '/endframes/video4.png' },
  { type: 'html',  src: '/html/slide_5_market_who_joins.html' },
  { type: 'html',  src: '/html/slide_meet_first_customer.html' },
  { type: 'html',  src: '/html/slide_what_typework_does.html' },
  { type: 'html',  src: '/html/slide_5_shift_opportunity.html' },
  { type: 'html',  src: '/html/slide_synergy_opportunity_sharing.html' },
  { type: 'html',  src: '/html/slide_synergy_bundle.html' },
  { type: 'html',  src: '/html/slide_competitive.html' },
  { type: 'html',  src: '/html/slide_gtm_strategy.html' },
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
  /* overlayImage: when a video nears its end, we paint its endFrame
     image on top of the whole slideWrapper to cover the browser's
     end-of-video flash. Held persistent across slide transitions
     until the next slide has time to mount, then cleared. */
  const [overlayImage, setOverlayImage] = useState(null)
  const overlayTimerRef = useRef(null)
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  const [jumpInput, setJumpInput] = useState('')
  const jumpTimer = useRef(null)

  /* ── training mode (narration panel) ───────────────── */
  const [trainingOpen, setTrainingOpen] = useState(false)
  const [narrationData, setNarrationData] = useState([])

  useEffect(() => {
    fetch('/narration.json')
      .then(r => r.json())
      .then(setNarrationData)
      .catch(() => {})
  }, [])

  const currentNarration = narrationData.find(n => n.slide === current)

  const slide = SLIDES[current]
  const isVideo = slide.type === 'video'
  const lastClickRef = useRef(0)

  /* ── preload all media on mount ──────────────────────── */
  /* Tracks every slide: images, videos, AND html iframes.
     Iframes call tickLoad via their onLoad handler, so loadDone
     only becomes true after every iframe has fully rendered — this
     prevents the jump-flash on Vercel where network latency matters. */
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadDone, setLoadDone] = useState(false)
  const loadedRef = useRef(0)
  const loadedSetRef = useRef(new Set())

  const tickLoad = useCallback((key) => {
    if (loadedSetRef.current.has(key)) return
    loadedSetRef.current.add(key)
    loadedRef.current++
    const progress = loadedRef.current / SLIDES.length
    setLoadProgress(progress)
    if (loadedRef.current >= SLIDES.length) {
      setTimeout(() => setLoadDone(true), 400)
    }
  }, [])

  useEffect(() => {
    SLIDES.forEach(s => {
      if (s.type === 'image') {
        const img = new Image()
        const done = () => tickLoad(s.src)
        img.onload = img.onerror = done
        img.src = s.src
      } else if (s.type === 'video') {
        fetch(s.src).then(() => tickLoad(s.src)).catch(() => tickLoad(s.src))
        // also warm the end-frame image so it paints instantly when the
        // rAF loop shows it as an overlay at the end of the video
        if (s.endFrame) {
          const ef = new Image()
          ef.src = s.endFrame
        }
      }
      // html iframes tick via their onLoad prop in the render tree
    })
    // Safety: never block forever — if something stalls, release after 12s
    const safety = setTimeout(() => setLoadDone(true), 12000)
    return () => clearTimeout(safety)
  }, [tickLoad])

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

  /* clear any lingering end-frame overlay (used by all nav paths) */
  const clearOverlay = useCallback(() => {
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current)
      overlayTimerRef.current = null
    }
    setOverlayImage(null)
  }, [])

  /* ── navigation ─────────────────────────────────────── */
  const goNext = useCallback(() => {
    if (isVideo && videoState === 'poster') {
      clearOverlay()
      setVideoState('playing')
      videoRef.current?.play()
      return
    }
    if (isVideo && videoState === 'playing') {
      const now = Date.now()
      if (now - lastClickRef.current < 500) {
        videoRef.current?.pause()
        if (current < TOTAL - 1) {
          clearOverlay()
          setCurrent(c => c + 1)
          setVideoState('poster')
        }
      }
      lastClickRef.current = now
      return
    }
    if (current < TOTAL - 1) {
      clearOverlay()
      setCurrent(c => c + 1)
      setVideoState('poster')
    }
  }, [current, isVideo, videoState, clearOverlay])

  const goPrev = useCallback(() => {
    if (current > 0) {
      clearOverlay()
      setCurrent(c => c - 1)
      setVideoState('poster')
    }
  }, [current, clearOverlay])

  /* ── jump to slide: type number + Enter ──────────────── */
  const goTo = useCallback((n) => {
    const idx = Math.max(0, Math.min(n - 1, TOTAL - 1))
    clearOverlay()
    setCurrent(idx)
    setVideoState('poster')
  }, [clearOverlay])

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
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        setTrainingOpen(prev => !prev)
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

  /* ── pause every video ~0.3s before its end and paint its
         endFrame image over the whole slideWrapper, so the browser's
         end-of-video black flash is completely covered by a still
         image. The overlay persists across the slide transition
         until the next slide has time to mount. ──────────────── */
  useEffect(() => {
    if (SLIDES[current].type !== 'video') return
    const v = videoRef.current
    if (!v) return

    let rafId = null
    let handled = false
    const check = () => {
      const vid = videoRef.current
      if (!vid || handled) { rafId = null; return }
      if (vid.paused || vid.ended) { rafId = null; return }
      if (vid.duration && !isNaN(vid.duration) && vid.duration - vid.currentTime < 0.3) {
        handled = true
        vid.pause()

        // Show the end-frame overlay immediately to cover the flash.
        const endFrame = SLIDES[current].endFrame
        if (endFrame) setOverlayImage(endFrame)

        if (current === LAST_VIDEO_INDEX) {
          setVideoState('ended')
          // Last video: keep overlay visible as the final still
          // (cleared when user navigates away).
        } else if (current < TOTAL - 1) {
          // Give the overlay one paint cycle to appear, then advance.
          // Keep the overlay up for ~500ms so the next slide has time
          // to fully mount and decode its first frame.
          requestAnimationFrame(() => {
            setCurrent(c => c + 1)
            setVideoState('poster')
            if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
            overlayTimerRef.current = setTimeout(() => {
              setOverlayImage(null)
              overlayTimerRef.current = null
            }, 500)
          })
        }
        rafId = null
        return
      }
      rafId = requestAnimationFrame(check)
    }

    const startCheck = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(check)
    }

    v.addEventListener('play', startCheck)
    if (!v.paused) startCheck()

    return () => {
      v.removeEventListener('play', startCheck)
      if (rafId) cancelAnimationFrame(rafId)
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
  /* Note: HTML iframes are NOT rendered here — they are mounted once
     (all at startup) and shown/hidden via display so jumping to any
     slide is instant with no reload flash. */
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
      return null
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

        {/* All HTML iframes are mounted once and stacked absolutely.
            We toggle opacity (not display) so the browser keeps
            painting every iframe — switching becomes truly instant
            with no repaint flash. */}
        {SLIDES.map((s, i) => (
          s.type === 'html' ? (
            <div
              key={s.src}
              style={{
                ...styles.iframeContainer,
                position: 'absolute',
                inset: 0,
                opacity: i === current ? 1 : 0,
                pointerEvents: i === current ? 'auto' : 'none',
                zIndex: i === current ? 2 : 1,
              }}
            >
              <iframe
                src={s.src}
                style={{
                  ...styles.iframe,
                  transform: `scale(${iframeScale})`,
                }}
                title={`Slide ${i + 1}`}
                sandbox="allow-same-origin"
                scrolling="no"
                onLoad={() => tickLoad(s.src)}
              />
              {/* Transparent overlay to capture clicks/prevent iframe stealing focus */}
              <div style={styles.iframeOverlay} />
            </div>
          ) : null
        ))}

        {/* End-frame still overlay — covers browser end-of-video flash */}
        {overlayImage && (
          <img
            src={overlayImage}
            alt=""
            draggable={false}
            style={styles.endFrameOverlay}
          />
        )}
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

      {/* Training mode — narration panel */}
      <div
        style={{
          ...styles.narrationPanel,
          transform: trainingOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.narrationHeader}>
          <div style={styles.narrationBadge}>TRAINING MODE</div>
          <button
            style={styles.narrationClose}
            onClick={() => setTrainingOpen(false)}
          >✕</button>
        </div>
        {currentNarration ? (
          <>
            <div style={styles.narrationSlideInfo}>
              Slide {current + 1} — {currentNarration.title}
            </div>
            <div style={styles.narrationScript}>
              {currentNarration.script.split('\n').map((line, i) => (
                <p key={i} style={{ marginBottom: line === '' ? 16 : 10 }}>
                  {line}
                </p>
              ))}
            </div>
          </>
        ) : (
          <div style={styles.narrationEmpty}>
            No narration for this slide.
          </div>
        )}
        <div style={styles.narrationHint}>
          Press <strong>Q</strong> to close
        </div>
      </div>
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
  endFrameOverlay: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    zIndex: 4,
    pointerEvents: 'none',
    userSelect: 'none',
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
  /* ── Training mode narration panel ────────────────── */
  narrationPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 420,
    height: '100%',
    background: 'rgba(11,17,32,0.95)',
    backdropFilter: 'blur(20px)',
    borderLeft: '1px solid rgba(0,210,190,0.15)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'default',
    fontFamily: "'Inter', sans-serif",
  },
  narrationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  narrationBadge: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    color: '#00d2be',
    background: 'rgba(0,210,190,0.1)',
    border: '1.5px solid rgba(0,210,190,0.25)',
    borderRadius: 20,
    padding: '6px 14px',
  },
  narrationClose: {
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    width: 32,
    height: 32,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  narrationSlideInfo: {
    padding: '16px 24px 8px',
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  narrationScript: {
    flex: 1,
    padding: '8px 24px 20px',
    fontSize: 16,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.7,
    overflowY: 'auto',
  },
  narrationEmpty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: 'rgba(255,255,255,0.25)',
  },
  narrationHint: {
    padding: '12px 24px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
  },
}
