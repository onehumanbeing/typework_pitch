import { useState, useEffect, useRef, useCallback } from 'react'

/*
  Slide map
  ─────────
  Indices 0-3  → video slides  (slide1–4.mp4)
  Index   4    → slide_5_market_who_joins.png
  Index   5    → 7.png  (What Typework Does)
  Indices 6-15 → PPTX exports  slide-07…slide-16
*/

const VIDEO_SLIDES = [
  '/videos/slide1.mp4',
  '/videos/slide2.mp4',
  '/videos/slide3.mp4',
  '/videos/slide4.mp4',
]

const IMAGE_SLIDES = [
  '/slides/slide-05.png',
  '/slides/slide-06.png',
  '/slides/slide-07.jpg',
  '/slides/slide-08.jpg',
  '/slides/slide-09.jpg',
  '/slides/slide-10.jpg',
  '/slides/slide-11.jpg',
  '/slides/slide-12.jpg',
  '/slides/slide-13.jpg',
  '/slides/slide-14.jpg',
  '/slides/slide-15.jpg',
  '/slides/slide-16.jpg',
]

const TOTAL = VIDEO_SLIDES.length + IMAGE_SLIDES.length // 16

export default function App() {
  const [current, setCurrent] = useState(0)
  // For video slides: 'poster' = first frame, 'playing' = running, 'ended' = last frame
  const [videoState, setVideoState] = useState('poster')
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  const isVideo = current < VIDEO_SLIDES.length
  const isLastVideo = current === VIDEO_SLIDES.length - 1

  /* ── navigation ─────────────────────────────────────── */
  const goNext = useCallback(() => {
    if (isVideo && videoState === 'poster') {
      // First click on a video slide → play the video
      setVideoState('playing')
      videoRef.current?.play()
      return
    }
    // If video is still playing, ignore (let it finish)
    if (isVideo && videoState === 'playing') return
    // 'ended' or image slide → advance
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

  /* ── keyboard ───────────────────────────────────────── */
  // Presentation clickers typically send: PageDown/PageUp, ArrowRight/ArrowLeft,
  // Space, Enter. Some also send F5 (start) or 'b'/period (blank).
  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowRight', ' ', 'Enter', 'PageDown', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        goNext()
      } else if (['ArrowLeft', 'Backspace', 'PageUp', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      } else if (e.key === 'F5') {
        // Some clickers send F5 to start — go fullscreen
        e.preventDefault()
        containerRef.current?.requestFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  /* ── video ended ────────────────────────────────────── */
  const onVideoEnded = useCallback(() => {
    if (isLastVideo) {
      // Last video: freeze on final frame, wait for user to advance
      setVideoState('ended')
    } else if (current < TOTAL - 1) {
      // Other videos: auto-advance to next slide (whose first frame = this video's last frame)
      setCurrent(c => c + 1)
      setVideoState('poster')
    }
  }, [current, isLastVideo])

  /* ── touch / swipe support ──────────────────────────── */
  const touchStart = useRef(null)
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    if (dx < -50) goNext()
    else if (dx > 50) goPrev()
    touchStart.current = null
  }

  /* ── render ─────────────────────────────────────────── */
  const imageIndex = current - VIDEO_SLIDES.length

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onClick={goNext}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide area */}
      <div style={styles.slideWrapper}>
        {isVideo ? (
          <video
            ref={videoRef}
            key={VIDEO_SLIDES[current]}
            src={VIDEO_SLIDES[current]}
            style={styles.media}
            playsInline
            preload="auto"
            muted={false}
            onEnded={onVideoEnded}
          />
        ) : (
          <img
            key={IMAGE_SLIDES[imageIndex]}
            src={IMAGE_SLIDES[imageIndex]}
            alt={`Slide ${current + 1}`}
            style={styles.media}
            draggable={false}
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

      {/* Nav arrows (desktop) */}
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
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'rgba(255,255,255,0.08)',
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
