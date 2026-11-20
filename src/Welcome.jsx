import { useEffect, useState } from 'react';
import Header from './Header.jsx';

// Every mp4/webm/gif/jpg/png dropped into src/media is picked up automatically.
const files = import.meta.glob('./media/*.{mp4,webm,gif,jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const MEDIA = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => ({ src, isVideo: /\.(mp4|webm)$/i.test(path) }));
const SLIDE_MS = 8000;

export default function Welcome() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % MEDIA.length), SLIDE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hero">
      {MEDIA.map(({ src, isVideo }, i) => {
        const cls = `bg-video ${i === index ? 'active' : ''}`;
        return isVideo ? (
          <video key={src} className={cls} src={src} autoPlay muted loop playsInline />
        ) : (
          <img key={src} className={cls} src={src} alt="" />
        );
      })}
      <div className="overlay" />

      <Header />

      <main className="content">
        <h1>Hot, fresh &amp; fast.</h1>
        <p>The best pizza in the country, delivered to your door.</p>
      </main>
      <a className="scroll-cue" href="#menu">Browse the menu ↓</a>
    </div>
  );
}
