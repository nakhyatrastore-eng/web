'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const LAUNCH_AT = new Date('2026-08-09T14:32:47+05:30').getTime();

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(): TimeLeft | null {
  const remaining = LAUNCH_AT - Date.now();

  if (remaining <= 0) return null;

  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
}

function CountdownUnit({ value, label }: { value?: number; label: string }) {
  return (
    <div className="maintenance-countdown__unit">
      <span>{value === undefined ? '--' : String(value).padStart(2, '0')}</span>
      <small>{label}</small>
    </div>
  );
}

export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null | undefined>();

  useEffect(() => {
    const updateCountdown = () => setTimeLeft(getTimeLeft());
    const frame = window.requestAnimationFrame(updateCountdown);
    const timer = window.setInterval(updateCountdown, 1_000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  if (timeLeft === null) return children;

  return (
    <main className="maintenance-page">
      <div className="maintenance-page__glow" aria-hidden="true" />
      <div className="maintenance-page__grid" aria-hidden="true" />

      <header className="maintenance-header">
        <Link href="/" className="maintenance-brand" aria-label="Nakhyatra home">
          <Image
            src="/nakhyatra-mark.svg"
            width={38}
            height={38}
            priority
            alt=""
          />
          <span>Nakhyatra<span aria-hidden="true">.</span></span>
        </Link>
        <span className="maintenance-status">
          <i aria-hidden="true" />
          Refresh in progress
        </span>
      </header>

      <section className="maintenance-content" aria-labelledby="maintenance-title">
        <p className="maintenance-kicker">A sharper Nakhyatra is loading</p>
        <h1 id="maintenance-title">We&apos;re making<br />things <em>bold.</em></h1>
        <p className="maintenance-copy">
          The store is taking a short creative break. Fresh cases, fresh walls,
          and a better way to find your next favourite design are almost here.
        </p>

        <div
          className="maintenance-countdown"
          aria-label="Time remaining until launch"
          aria-live="off"
        >
          <CountdownUnit value={timeLeft?.days} label="Days" />
          <CountdownUnit value={timeLeft?.hours} label="Hours" />
          <CountdownUnit value={timeLeft?.minutes} label="Minutes" />
          <CountdownUnit value={timeLeft?.seconds} label="Seconds" />
        </div>

        <p className="sr-only" aria-live="polite">
          {timeLeft
            ? `${timeLeft.days} days, ${timeLeft.hours} hours, and ${timeLeft.minutes} minutes until launch.`
            : 'Loading countdown.'}
        </p>
      </section>

      <footer className="maintenance-footer">
        <p>Designed in India · Shipping pan-India</p>
        <a
          href="https://www.instagram.com/nakhyatra.store"
          target="_blank"
          rel="noopener noreferrer"
        >
          Follow the reveal <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </main>
  );
}
