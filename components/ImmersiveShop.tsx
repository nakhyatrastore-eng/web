'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  animate,
  createAnimatable,
  createDraggable,
  createScope,
  createTimer,
  createTimeline,
  splitText,
  spring,
  stagger,
  utils,
} from 'animejs';
import type { Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart-context';
import { formatMoney } from '@/lib/format';
import { useShoppingAssistant } from './ShoppingAssistant';
import { IconArrowRight, IconCart, IconX } from './icons';

type Category = 'all' | 'cases' | 'prints';
type SoundCue = 'enable' | 'touch' | 'orbit' | 'open' | 'select';
type DragInstance = ReturnType<typeof createDraggable>;

type SoundEngine = {
  context: AudioContext;
  oscillator: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
};

type PointerState = {
  x: number;
  y: number;
  smoothX: number;
  smoothY: number;
  nx: number;
  ny: number;
  velocity: number;
  down: boolean;
  pulse: number;
};

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  phase: number;
  size: number;
  drift: number;
};

const SCENES = [
  { accent: '#ff6600', rgb: [255, 102, 0] as const, css: '255 102 0', deep: '#120603' },
  { accent: '#d8b4fe', rgb: [216, 180, 254] as const, css: '216 180 254', deep: '#100817' },
  { accent: '#e5d13d', rgb: [229, 209, 61] as const, css: '229 209 61', deep: '#100f02' },
  { accent: '#ff5d67', rgb: [255, 93, 103] as const, css: '255 93 103', deep: '#150406' },
  { accent: '#ff3d2e', rgb: [255, 61, 46] as const, css: '255 61 46', deep: '#170302' },
] as const;

const CASE_LINES = [
  'CARRY / NO PERMISSION',
  'SOFT FACE / HARD SIGNAL',
  'TOUCH DAILY / STAY STRANGE',
  'POCKET ART / PUBLIC NOISE',
] as const;

const PRINT_LINES = [
  'OCCUPY / THE EMPTY WALL',
  'RIGID SIGNAL / NO FRAME',
  'HANG LOUD / LIVE LOUDER',
  'ALUMINIUM / AFTER DARK',
] as const;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function productCategory(product: Product): Exclude<Category, 'all'> {
  const signal = `${product.productType} ${product.title} ${product.tags.join(' ')}`.toLowerCase();
  if (/\b(case|cover|phone|mobile)\b/.test(signal) || product.deviceModels.length > 0) return 'cases';
  if (/\b(metal|poster|print|wall|aluminium|aluminum)\b/.test(signal)) return 'prints';
  return product.options.some((option) => option.name.toLowerCase() === 'size') ? 'prints' : 'cases';
}

function productHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sceneForProduct(product: Product) {
  const hash = productHash(product.handle);
  const palette = SCENES[hash % SCENES.length];
  const category = productCategory(product);
  const lines = category === 'cases' ? CASE_LINES : PRINT_LINES;
  const theme = product.theme?.trim();
  const titleWord = product.title.split(/\s+/).find((word) => word.length > 3) ?? product.title;
  return {
    ...palette,
    code: (theme || titleWord || 'OBJECT').slice(0, 12).toUpperCase(),
    line: lines[(hash >>> 4) % lines.length],
  };
}

function categoryLabel(category: Category) {
  if (category === 'cases') return 'Cases';
  if (category === 'prints') return 'Metal';
  return 'All objects';
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function wrappedDistance(index: number, active: number, length: number) {
  let distance = index - active;
  const half = length / 2;
  if (distance > half) distance -= length;
  if (distance < -half) distance += length;
  return distance;
}

function tone(
  context: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  start = 0,
  endFrequency = frequency,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime + start;
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playCue(context: AudioContext, cue: SoundCue, index = 0) {
  if (cue === 'enable') {
    tone(context, 74, 0.18, 0.032, 0, 210);
    tone(context, 330, 0.2, 0.018, 0.06, 680);
    return;
  }
  if (cue === 'touch') {
    tone(context, 64 + index * 7, 0.07, 0.016, 0, 104 + index * 9);
    return;
  }
  if (cue === 'orbit') {
    tone(context, 96 + index * 13, 0.18, 0.026, 0, 48);
    tone(context, 410 + index * 31, 0.13, 0.014, 0.025, 790);
    return;
  }
  if (cue === 'open') {
    tone(context, 88, 0.3, 0.028, 0, 320);
    tone(context, 360, 0.34, 0.016, 0.04, 740);
    return;
  }
  tone(context, 210, 0.08, 0.02, 0, 430);
  tone(context, 520, 0.12, 0.012, 0.04, 830);
}

function createSoundEngine(context: AudioContext): SoundEngine {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 58;
  filter.type = 'lowpass';
  filter.frequency.value = 260;
  filter.Q.value = 7;
  gain.gain.value = 0.0001;
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  return { context, oscillator, filter, gain };
}

function SoundGlyph() {
  return <span className="artifact-chamber__sound-glyph" aria-hidden="true"><i /><i /><i /><i /></span>;
}

function Spec({ children }: { children: ReactNode }) {
  return <span className="artifact-chamber__spec">{children}</span>;
}

export default function ImmersiveShop({ products }: { products: Product[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragInstance | null>(null);
  const orbitRef = useRef<((direction: -1 | 1) => void) | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const detailHeroRef = useRef<HTMLDivElement>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const originRef = useRef<DOMRect | null>(null);
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const soundOnRef = useRef(false);
  const didDragRef = useRef(false);
  const transitioningRef = useRef(false);
  const closingRef = useRef(false);
  const activeRef = useRef(0);
  const canvasColorRef = useRef<readonly [number, number, number]>(SCENES[0].rgb);
  const pointerRef = useRef<PointerState>({
    x: 0,
    y: 0,
    smoothX: 0,
    smoothY: 0,
    nx: 0,
    ny: 0,
    velocity: 0,
    down: false,
    pulse: 0,
  });

  const [category, setCategory] = useState<Category>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const { count, openCart } = useCart();
  const { openQuickAdd } = useShoppingAssistant();

  const categoryCounts = useMemo(() => products.reduce(
    (counts, product) => {
      counts[productCategory(product)] += 1;
      return counts;
    },
    { all: products.length, cases: 0, prints: 0 } as Record<Category, number>,
  ), [products]);

  const effectiveCategory: Category = category !== 'all' && categoryCounts[category] === 0
    ? 'all'
    : category;

  const visibleProducts = useMemo(
    () => products.filter((product) => effectiveCategory === 'all' || productCategory(product) === effectiveCategory),
    [effectiveCategory, products],
  );

  const availableCategories = useMemo(
    () => (['all', 'cases', 'prints'] as const).filter((item) => item === 'all' || categoryCounts[item] > 0),
    [categoryCounts],
  );

  const safeIndex = visibleProducts.length ? wrapIndex(activeIndex, visibleProducts.length) : 0;
  const activeProduct = visibleProducts[safeIndex] ?? products[0];
  const scene = activeProduct ? sceneForProduct(activeProduct) : { ...SCENES[0], code: 'OBJECT', line: 'TOUCH / ENTER' };
  const print = activeProduct ? productCategory(activeProduct) === 'prints' : false;
  const detailVideo = detailProduct?.media.find((media) => media.kind === 'video');

  useEffect(() => {
    canvasColorRef.current = scene.rgb;
  }, [scene.rgb]);

  const cue = useCallback((kind: SoundCue, index = activeRef.current) => {
    const engine = soundEngineRef.current;
    if (!soundOnRef.current || !engine) return;
    playCue(engine.context, kind, index);
  }, []);

  const scrubSound = useCallback((force: number, velocity: number, engaged: boolean) => {
    const engine = soundEngineRef.current;
    if (!soundOnRef.current || !engine) return;
    const now = engine.context.currentTime;
    const speed = Math.min(Math.abs(velocity), 1800) / 1800;
    engine.oscillator.frequency.setTargetAtTime(52 + force * 260 + speed * 180, now, 0.016);
    engine.filter.frequency.setTargetAtTime(220 + force * 1800 + speed * 800, now, 0.022);
    engine.gain.gain.setTargetAtTime(engaged ? 0.004 + force * 0.013 : 0.0001, now, engaged ? 0.018 : 0.055);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];

    const resize = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const total = width < 768 ? 34 : 58;
      particles = Array.from({ length: total }, (_, index) => ({
        angle: (Math.PI * 2 * index) / total,
        radius: Math.min(width, height) * (0.16 + (index % 9) * 0.035),
        speed: 0.00004 + (index % 7) * 0.000012,
        phase: (index * 1.618) % (Math.PI * 2),
        size: 0.6 + (index % 4) * 0.45,
        drift: 6 + (index % 6) * 3,
      }));
      if (!pointerRef.current.x) {
        pointerRef.current.x = width / 2;
        pointerRef.current.y = height / 2;
        pointerRef.current.smoothX = width / 2;
        pointerRef.current.smoothY = height / 2;
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const draw = (time: number, deltaTime: number) => {
      const pointer = pointerRef.current;
      pointer.smoothX = utils.damp(pointer.smoothX, pointer.x, deltaTime, 0.085);
      pointer.smoothY = utils.damp(pointer.smoothY, pointer.y, deltaTime, 0.085);
      pointer.pulse = utils.damp(pointer.pulse, 0, deltaTime, 0.035);
      const [red, green, blue] = canvasColorRef.current;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'lighter';

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const orbit = particle.angle + time * particle.speed;
        const wobble = Math.sin(time * 0.0007 + particle.phase) * particle.drift;
        const centerX = width * 0.5 + pointer.nx * width * (0.035 + (index % 4) * 0.008);
        const centerY = height * 0.44 + pointer.ny * height * (0.022 + (index % 5) * 0.006);
        const x = centerX + Math.cos(orbit) * (particle.radius + wobble);
        const y = centerY + Math.sin(orbit * 1.13) * (particle.radius * 0.56 + wobble);
        const previousX = centerX + Math.cos(orbit - 0.08) * (particle.radius + wobble);
        const previousY = centerY + Math.sin((orbit - 0.08) * 1.13) * (particle.radius * 0.56 + wobble);
        const distance = Math.hypot(pointer.smoothX - x, pointer.smoothY - y);
        const touchLight = pointer.down ? utils.clamp(1 - distance / 220, 0, 1) : 0;

        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(x, y);
        context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${0.05 + touchLight * 0.28})`;
        context.lineWidth = 0.6 + touchLight * 1.4;
        context.stroke();

        context.beginPath();
        context.arc(x, y, particle.size + touchLight * 2.2, 0, Math.PI * 2);
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.2 + touchLight * 0.65})`;
        context.fill();

        if (touchLight > 0.15 && index % 3 === 0) {
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(pointer.smoothX, pointer.smoothY);
          context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${touchLight * 0.09})`;
          context.lineWidth = 0.5;
          context.stroke();
        }
      }

      if (pointer.pulse > 0.01) {
        context.beginPath();
        context.arc(pointer.smoothX, pointer.smoothY, 26 + (1 - pointer.pulse) * 120, 0, Math.PI * 2);
        context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${pointer.pulse * 0.5})`;
        context.lineWidth = 1;
        context.stroke();
      }
      context.globalCompositeOperation = 'source-over';
    };

    if (reduceMotion) {
      draw(0, 16);
      return () => window.removeEventListener('resize', resize);
    }

    const timer = createTimer({
      duration: 1_000_000_000,
      frameRate: 45,
      onUpdate: (self) => draw(self.currentTime, self.deltaTime),
    });

    return () => {
      timer.revert();
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const frame = window.requestAnimationFrame(() => setIntroVisible(false));
      return () => window.cancelAnimationFrame(frame);
    }
    const scope = createScope({ root }).add(() => {
      const title = root.querySelector<HTMLElement>('.artifact-intro__title');
      const split = title ? splitText(title, { words: { wrap: 'clip' }, accessible: true }) : null;
      createTimeline({ defaults: { ease: 'out(4)' } })
        .add('.artifact-intro__code span', {
          opacity: { from: 0 },
          translateY: { from: '1rem' },
          delay: stagger(55),
          duration: 430,
        })
        .add(split?.words ?? [], {
          translateY: { from: '115%' },
          rotateX: { from: '65deg' },
          delay: stagger(90),
          duration: 650,
        }, 80)
        .add('.artifact-intro__cross', { scale: { from: 0 }, rotate: { from: '-90deg' }, duration: 620 }, 180)
        .add('.artifact-intro', {
          clipPath: ['polygon(0 0,100% 0,100% 100%,0 100%)', 'polygon(0 0,100% 0,100% 0,0 0)'],
          duration: 700,
          ease: 'inOut(4)',
        }, 850)
        .call(() => setIntroVisible(false), 1510);
    });
    return () => scope.revert();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const gesture = gestureRef.current;
    if (!root || !stage || !gesture || !visibleProducts.length) return;
    activeRef.current = safeIndex;
    root.dataset.touching = 'false';
    root.style.setProperty('--touch-x', '0');
    root.style.setProperty('--touch-y', '0');
    root.style.setProperty('--force', '0');

    const objectElements = Array.from(stage.querySelectorAll<HTMLElement>('.artifact-chamber__object'));
    const motions = objectElements.map((element) => createAnimatable(element, {
      translateX: 0,
      translateZ: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 0,
      opacity: 0,
    }));
    const activeAssembly = objectElements[safeIndex]?.querySelector<HTMLElement>('.artifact-chamber__assembly');
    const assemblyMotion = activeAssembly ? createAnimatable(activeAssembly, {
      rotateX: 110,
      rotateY: 110,
      translateY: 130,
      scale: 130,
      ease: 'out(3)',
    }) : null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const applyField = (dragX: number, dragY: number, smooth = false) => {
      const spacing = Math.min(stage.clientWidth * (stage.clientWidth < 768 ? 0.79 : 0.58), 520);
      const orbitOffset = dragX / Math.max(spacing, 1);
      const pointer = pointerRef.current;
      const duration = smooth ? 180 : 0;

      for (let index = 0; index < motions.length; index += 1) {
        const relative = wrappedDistance(index, safeIndex, visibleProducts.length) + orbitOffset;
        const distance = Math.abs(relative);
        const x = relative * spacing;
        const z = -distance * (stage.clientWidth < 768 ? 210 : 285);
        const rotateY = relative * -34;
        const rotateZ = relative * 1.8;
        const scale = Math.max(0.48, 1 - distance * 0.17);
        const opacity = utils.clamp(1 - distance * 0.34, 0.06, 1);
        motions[index].translateX(x, duration, 'out(3)');
        motions[index].translateZ(z, duration, 'out(3)');
        motions[index].rotateY(rotateY, duration, 'out(3)');
        motions[index].rotateZ(rotateZ, duration, 'out(3)');
        motions[index].scale(scale, duration, 'out(3)');
        motions[index].opacity(opacity, duration, 'out(3)');
        objectElements[index].style.zIndex = String(20 - Math.round(distance * 4));
        objectElements[index].dataset.position = distance < 0.48 ? 'active' : relative < 0 ? 'previous' : 'next';
      }

      const normalizedY = utils.clamp(dragY / Math.max(stage.clientHeight * 0.42, 1), -1, 1);
      if (assemblyMotion) {
        assemblyMotion.rotateY(pointer.nx * 11 + orbitOffset * 7);
        assemblyMotion.rotateX(pointer.ny * -8 + normalizedY * 12);
        assemblyMotion.translateY(dragY * 0.08);
        assemblyMotion.scale(1 + Math.abs(normalizedY) * 0.035);
      }
      const force = utils.clamp(Math.hypot(dragX, dragY) / Math.max(stage.clientWidth * 0.65, 1), 0, 1);
      root.style.setProperty('--touch-x', pointer.nx.toFixed(4));
      root.style.setProperty('--touch-y', pointer.ny.toFixed(4));
      root.style.setProperty('--force', force.toFixed(4));
      root.style.setProperty('--orbit', orbitOffset.toFixed(4));
      scrubSound(force, draggable?.velocity ?? 0, pointer.down);
    };

    const finishOrbit = (direction: -1 | 1, startX = 0, startY = 0) => {
      if (transitioningRef.current || visibleProducts.length < 2) return;
      transitioningRef.current = true;
      draggable.disable().stop();
      cue('orbit', safeIndex);
      const spacing = Math.min(stage.clientWidth * (stage.clientWidth < 768 ? 0.79 : 0.58), 520);
      const state = { x: startX, y: startY };
      animate(state, {
        x: -direction * spacing,
        y: 0,
        duration: 470,
        ease: 'out(4)',
        onRender: () => applyField(state.x, state.y),
        onComplete: () => {
          setActiveIndex((current) => wrapIndex(current + direction, visibleProducts.length));
          transitioningRef.current = false;
        },
      });
    };

    const pullOpen = (startX: number, startY: number) => {
      if (transitioningRef.current) return;
      transitioningRef.current = true;
      draggable.disable().stop();
      const state = { x: startX, y: startY };
      animate(state, {
        x: 0,
        y: -stage.clientHeight * 0.72,
        duration: 520,
        ease: 'inOut(4)',
        onRender: () => applyField(state.x, state.y),
        onComplete: () => {
          transitioningRef.current = false;
          originRef.current = objectElements[safeIndex]?.getBoundingClientRect() ?? null;
          setDetailProduct(activeProduct);
        },
      });
    };

    const draggable = createDraggable(gesture, {
      x: true,
      y: true,
      dragThreshold: 2,
      velocityMultiplier: 0.58,
      maxVelocity: 2600,
      releaseEase: spring({ stiffness: 105, damping: 16 }),
      cursor: { onHover: 'grab', onGrab: 'grabbing' },
      onGrab: () => {
        didDragRef.current = false;
        pointerRef.current.down = true;
        pointerRef.current.pulse = 1;
        root.dataset.touching = 'true';
        cue('touch', safeIndex);
      },
      onUpdate: (self) => {
        if (Math.hypot(self.x, self.y) > 7) didDragRef.current = true;
        pointerRef.current.velocity = self.velocity;
        applyField(self.x, self.y);
      },
      onRelease: (self) => {
        pointerRef.current.down = false;
        root.dataset.touching = 'false';
        scrubSound(0, self.velocity, false);
        const horizontal = Math.abs(self.x) > Math.abs(self.y) * 0.82;
        const verticalOpen = self.y < -Math.min(92, stage.clientHeight * 0.15) && !horizontal;
        const horizontalOrbit = Math.abs(self.x) > Math.min(86, stage.clientWidth * 0.2);
        if (verticalOpen) {
          pullOpen(self.x, self.y);
          return;
        }
        if (horizontalOrbit && visibleProducts.length > 1) {
          finishOrbit(self.x < 0 ? 1 : -1, self.x, self.y);
          return;
        }
        draggable.stop();
        const state = { x: self.x, y: self.y };
        animate(state, {
          x: 0,
          y: 0,
          ease: spring({ bounce: 0.32, duration: 560 }),
          onRender: () => applyField(state.x, state.y),
          onComplete: () => {
            draggable.reset();
            applyField(0, 0, true);
          },
        });
      },
    });

    const pointerMove = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      const pointer = pointerRef.current;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.nx = utils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
      pointer.ny = utils.clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);
      root.style.setProperty('--touch-px', `${event.clientX}px`);
      root.style.setProperty('--touch-py', `${event.clientY}px`);
      applyField(draggable.x, draggable.y, true);
    };

    const pointerLeave = () => {
      if (pointerRef.current.down) return;
      pointerRef.current.nx = 0;
      pointerRef.current.ny = 0;
      applyField(draggable.x, draggable.y, true);
    };

    gesture.addEventListener('pointermove', pointerMove, { passive: true });
    gesture.addEventListener('pointerleave', pointerLeave, { passive: true });
    dragRef.current = draggable;
    orbitRef.current = (direction) => finishOrbit(direction, 0, 0);
    applyField(0, 0, !reduced);

    return () => {
      gesture.removeEventListener('pointermove', pointerMove);
      gesture.removeEventListener('pointerleave', pointerLeave);
      orbitRef.current = null;
      dragRef.current = null;
      draggable.revert();
      motions.forEach((motion) => motion.revert());
      assemblyMotion?.revert();
    };
  }, [activeProduct, cue, safeIndex, scrubSound, visibleProducts.length]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !activeProduct) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const scope = createScope({ root }).add(() => {
      const title = root.querySelector<HTMLElement>('.artifact-chamber__title');
      const split = title ? splitText(title, { words: { wrap: 'clip' }, accessible: true }) : null;
      createTimeline({ defaults: { ease: 'out(4)' } })
        .add('.artifact-chamber__code span', {
          opacity: { from: 0 },
          translateX: { from: '-1.3rem' },
          delay: stagger(45),
          duration: 420,
        })
        .add('.artifact-chamber__active .artifact-layer', {
          opacity: { from: 0 },
          translateZ: { from: '-160px' },
          delay: stagger(45),
          duration: 720,
        }, 40)
        .add(split?.words ?? [], {
          translateY: { from: '115%' },
          rotateX: { from: '55deg' },
          delay: stagger(65),
          duration: 620,
        }, 250)
        .add('.artifact-chamber__reveal', {
          opacity: { from: 0 },
          translateY: { from: '0.8rem' },
          delay: stagger(45),
          duration: 480,
        }, 320);
    });
    return () => scope.revert();
  }, [activeProduct]);

  const closeDetail = useCallback(() => {
    const overlay = detailRef.current;
    const hero = detailHeroRef.current;
    if (closingRef.current) return;
    if (!overlay || !hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDetailProduct(null);
      return;
    }
    closingRef.current = true;
    const origin = originRef.current;
    const target = hero.getBoundingClientRect();
    const translateX = origin ? origin.left - target.left : 0;
    const translateY = origin ? origin.top - target.top : window.innerHeight * 0.4;
    const scaleX = origin ? origin.width / target.width : 0.76;
    const scaleY = origin ? origin.height / target.height : 0.76;
    createTimeline({ defaults: { ease: 'inOut(4)' } })
      .add('.artifact-dossier__copy, .artifact-dossier__contact, .artifact-dossier__header', {
        opacity: 0,
        translateY: '0.7rem',
        duration: 210,
      })
      .add(hero, { translateX, translateY, scaleX, scaleY, rotateY: '-8deg', duration: 520 }, 60)
      .add('.artifact-dossier__backdrop', { opacity: 0, duration: 360 }, 100)
      .call(() => {
        closingRef.current = false;
        setDetailProduct(null);
      }, 590);
  }, []);

  useEffect(() => {
    const overlay = detailRef.current;
    const hero = detailHeroRef.current;
    if (!detailProduct || !overlay || !hero) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    cue('open');

    const target = hero.getBoundingClientRect();
    const origin = originRef.current;
    const translateX = origin ? origin.left - target.left : 0;
    const translateY = origin ? origin.top - target.top : window.innerHeight * 0.38;
    const scaleX = origin ? origin.width / target.width : 0.76;
    const scaleY = origin ? origin.height / target.height : 0.76;
    hero.style.transformOrigin = 'top left';

    const scope = createScope({ root: overlay }).add(() => {
      const title = overlay.querySelector<HTMLElement>('.artifact-dossier__title');
      const split = title ? splitText(title, { words: { wrap: 'clip' }, accessible: true }) : null;
      const contactCards = overlay.querySelectorAll('.artifact-dossier__contact-card');
      const timeline = createTimeline({ defaults: { ease: 'out(4)' } })
        .add('.artifact-dossier__backdrop', { opacity: { from: 0 }, duration: 300 })
        .add(hero, {
          translateX: { from: translateX },
          translateY: { from: translateY },
          scaleX: { from: scaleX },
          scaleY: { from: scaleY },
          rotateY: { from: '-8deg' },
          duration: 720,
          ease: 'inOut(4)',
        }, 0)
        .add('.artifact-dossier__header', { opacity: { from: 0 }, translateY: { from: '-0.6rem' }, duration: 420 }, 260);
      if (contactCards.length) {
        timeline.add(contactCards, {
          opacity: { from: 0 },
          translateX: { from: '1.5rem' },
          delay: stagger(60),
          duration: 480,
        }, 290);
      }
      timeline
        .add(split?.words ?? [], {
          translateY: { from: '112%' },
          rotateX: { from: '55deg' },
          delay: stagger(60),
          duration: 580,
        }, 330)
        .add('.artifact-dossier__reveal', {
          opacity: { from: 0 },
          translateY: { from: '0.9rem' },
          delay: stagger(42),
          duration: 460,
        }, 390);
    });

    window.requestAnimationFrame(() => detailCloseRef.current?.focus());

    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetail();
        return;
      }
      if (event.key !== 'Tab' || !detailRef.current) return;
      const focusable = Array.from(detailRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => {
      scope.revert();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeys);
      previousFocus?.focus();
    };
  }, [closeDetail, cue, detailProduct]);

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      if (detailProduct) return;
      if (event.key === 'ArrowLeft') orbitRef.current?.(-1);
      if (event.key === 'ArrowRight') orbitRef.current?.(1);
      if (event.key === 'ArrowUp') {
        const activeObject = stageRef.current?.querySelector<HTMLElement>('[data-position="active"]');
        originRef.current = activeObject?.getBoundingClientRect() ?? null;
        setDetailProduct(activeProduct);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [activeProduct, detailProduct]);

  useEffect(() => () => {
    const engine = soundEngineRef.current;
    if (!engine) return;
    engine.oscillator.stop();
    void engine.context.close();
  }, []);

  function changeCategory(next: Category) {
    if (next === effectiveCategory || categoryCounts[next] === 0 || transitioningRef.current) return;
    cue('select');
    const root = rootRef.current;
    const targets = root?.querySelectorAll('.artifact-chamber__object, .artifact-chamber__info');
    if (!targets || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCategory(next);
      setActiveIndex(0);
      return;
    }
    transitioningRef.current = true;
    animate(targets, {
      opacity: [1, 0],
      translateZ: [0, '-100px'],
      duration: 230,
      ease: 'in(3)',
      onComplete: () => {
        setCategory(next);
        setActiveIndex(0);
        transitioningRef.current = false;
      },
    });
  }

  async function toggleSound() {
    if (soundOnRef.current) {
      soundOnRef.current = false;
      setSoundOn(false);
      scrubSound(0, 0, false);
      return;
    }
    if (!soundEngineRef.current) {
      soundEngineRef.current = createSoundEngine(new window.AudioContext());
    }
    await soundEngineRef.current.context.resume();
    soundOnRef.current = true;
    setSoundOn(true);
    playCue(soundEngineRef.current.context, 'enable');
  }

  function openActiveDetail() {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    const activeObject = stageRef.current?.querySelector<HTMLElement>('[data-position="active"]');
    originRef.current = activeObject?.getBoundingClientRect() ?? null;
    setDetailProduct(activeProduct);
  }

  function buy(product: Product) {
    cue('select');
    setDetailProduct(null);
    openQuickAdd(product);
  }

  if (!activeProduct) return null;

  const rootStyle = {
    '--scene-accent': scene.accent,
    '--scene-rgb': scene.css,
    '--scene-deep': scene.deep,
    '--drop-progress': `${((safeIndex + 1) / Math.max(visibleProducts.length, 1)) * 100}%`,
  } as CSSProperties;

  return (
    <main ref={rootRef} className="immersive-shop artifact-chamber" style={rootStyle} data-touching="false">
      <canvas ref={canvasRef} className="artifact-chamber__canvas" aria-hidden="true" />

      {introVisible ? (
        <div className="artifact-intro" aria-hidden="true">
          <div className="artifact-intro__code"><span>NAKHYATRA®</span><span>DROP / 01</span><span>{String(products.length).padStart(2, '0')} OBJECTS / LIVE</span></div>
          <p className="artifact-intro__title">Touch bends reality.</p>
          <i className="artifact-intro__cross" />
          <p>{products.length} {products.length === 1 ? 'object' : 'objects'} for screens, walls, and people who refuse default settings.</p>
        </div>
      ) : null}

      <div className="artifact-chamber__noise" aria-hidden="true" />
      <div className="artifact-chamber__vignette" aria-hidden="true" />
      <div className="artifact-chamber__touch" aria-hidden="true"><i /><span /></div>

      <header className="artifact-chamber__header">
        <Link href="/" className="artifact-chamber__brand" aria-label="Nakhyatra home">Nakhyatra<span>.</span></Link>
        <nav className="artifact-chamber__filters" aria-label="Filter objects">
          {availableCategories.map((item) => (
            <button key={item} type="button" onClick={() => changeCategory(item)} aria-pressed={effectiveCategory === item}>
              <i />{categoryLabel(item)}<b>{String(categoryCounts[item]).padStart(2, '0')}</b>
            </button>
          ))}
        </nav>
        <div className="artifact-chamber__tools">
          <button type="button" onClick={toggleSound} className={soundOn ? 'is-on' : ''} aria-pressed={soundOn} aria-label={soundOn ? 'Turn reactive sound off' : 'Turn reactive sound on'}>
            <SoundGlyph /><span>{soundOn ? 'Live' : 'Sound'}</span>
          </button>
          <button type="button" onClick={openCart} className="artifact-chamber__cart" aria-label={count ? `Open cart with ${count} items` : 'Open cart'}>
            <IconCart className="h-5 w-5" />{count ? <b>{count}</b> : null}
          </button>
        </div>
      </header>

      <div className="artifact-chamber__code" aria-hidden="true">
        <span>{scene.code}</span><span>{scene.code}</span><span>{scene.code}</span>
      </div>

      <section ref={stageRef} className="artifact-chamber__stage" aria-label="Touch-reactive product field">
        <div className="artifact-chamber__axis artifact-chamber__axis--x" aria-hidden="true" />
        <div className="artifact-chamber__axis artifact-chamber__axis--y" aria-hidden="true" />

        {visibleProducts.map((product, index) => {
          const productScene = sceneForProduct(product);
          const image = product.images[0];
          const active = index === safeIndex;
          return (
            <article
              key={product.id}
              className={`artifact-chamber__object ${active ? 'artifact-chamber__active' : ''} ${productCategory(product) === 'prints' ? 'is-print' : ''}`}
              data-object-index={index}
              data-available={product.availableForSale ? 'true' : 'false'}
              aria-hidden={!active}
            >
              <div className="artifact-chamber__assembly">
                {image ? (
                  <>
                    <div className="artifact-layer artifact-layer--echo artifact-layer--echo-a" aria-hidden="true"><Image src={image.url} alt="" fill sizes="(max-width: 767px) 78vw, 42vw" className="object-cover" /></div>
                    <div className="artifact-layer artifact-layer--echo artifact-layer--echo-b" aria-hidden="true"><Image src={image.url} alt="" fill sizes="(max-width: 767px) 78vw, 42vw" className="object-cover" /></div>
                    <div className="artifact-layer artifact-layer--shadow" aria-hidden="true" />
                    <div className="artifact-layer artifact-layer--plate">
                      <Image src={image.url} alt={active ? image.altText ?? product.title : ''} fill priority={active} sizes="(max-width: 767px) 78vw, 42vw" className="object-cover" />
                      <span className="artifact-layer__scan" aria-hidden="true" />
                      <span className="artifact-layer__grain" aria-hidden="true" />
                    </div>
                    <div className="artifact-layer artifact-layer--slice" aria-hidden="true"><Image src={image.url} alt="" fill sizes="(max-width: 767px) 78vw, 42vw" className="object-cover" /></div>
                  </>
                ) : null}
                <span className="artifact-layer artifact-layer--number">{String(index + 1).padStart(2, '0')}</span>
                <span className="artifact-layer artifact-layer--label">{productScene.line}</span>
                <span className="artifact-layer artifact-layer--coordinates">X {String(38 + index * 7).padStart(2, '0')} / Y {String(71 - index * 9).padStart(2, '0')}</span>
                <span className="artifact-layer artifact-layer--mark">N®</span>
                {!product.availableForSale ? <span className="artifact-layer artifact-layer--sold">ARCHIVE / SOLD</span> : null}
              </div>
            </article>
          );
        })}

        <button
          ref={gestureRef}
          type="button"
          className="artifact-chamber__gesture-plane"
          onClick={openActiveDetail}
          aria-label={`Touch and drag the scene to browse. Tap or pull up to inspect ${activeProduct.title}`}
        >
          <span className="sr-only">Drag horizontally to rotate products. Pull upward or tap to inspect.</span>
        </button>

        <div className="artifact-chamber__instructions" aria-hidden="true">
          <span>Drag anywhere</span><i /><span>Pull up to enter</span>
        </div>
      </section>

      <section key={activeProduct.id} className="artifact-chamber__info">
        <div className="artifact-chamber__eyebrow artifact-chamber__reveal">
          <span>Artifact {String(safeIndex + 1).padStart(2, '0')} / {String(visibleProducts.length).padStart(2, '0')}</span>
          <span className={activeProduct.availableForSale ? 'is-live' : 'is-archive'}>{activeProduct.availableForSale ? (print ? 'Rigid aluminium / wall' : 'Glass finish / exact fit') : 'Archive / unavailable'}</span>
        </div>
        <h1 className="artifact-chamber__title">{activeProduct.title}</h1>
        <div className="artifact-chamber__commerce artifact-chamber__reveal">
          <div className="artifact-chamber__price">
            <strong>{formatMoney(activeProduct.price, activeProduct.currency)}</strong>
            {activeProduct.compareAtPrice ? <del>{formatMoney(activeProduct.compareAtPrice, activeProduct.currency)}</del> : null}
          </div>
          <button type="button" onClick={() => {
            didDragRef.current = false;
            openActiveDetail();
          }}>
            <span>Enter artifact</span><span><IconArrowRight className="h-4 w-4" /></span>
          </button>
        </div>
        <div className="artifact-chamber__specs artifact-chamber__reveal">
          <Spec>{activeProduct.availableForSale ? (print ? `${activeProduct.variants.filter((variant) => variant.availableForSale).length} live sizes` : 'Exact phone fit') : 'Currently archived'}</Spec>
          <Spec>Printed to order</Spec>
          <Spec>Secure checkout</Spec>
        </div>
      </section>

      <footer className="artifact-chamber__footer">
        <p>{scene.line}</p>
        <div className="artifact-chamber__rail" aria-label={`Artifact ${safeIndex + 1} of ${visibleProducts.length}`}>
          {visibleProducts.map((product, index) => (
            <button key={product.id} type="button" onClick={() => setActiveIndex(index)} className={index === safeIndex ? 'is-active' : ''} aria-label={`Show ${product.title}`}>
              <span>{String(index + 1).padStart(2, '0')}</span><i />
            </button>
          ))}
        </div>
        <i className="artifact-chamber__meter" aria-hidden="true"><span /></i>
        <div className="artifact-chamber__arrows">
          <button type="button" onClick={() => orbitRef.current?.(-1)} disabled={visibleProducts.length < 2} aria-label="Previous artifact">←</button>
          <button type="button" onClick={() => orbitRef.current?.(1)} disabled={visibleProducts.length < 2} aria-label="Next artifact">→</button>
        </div>
      </footer>

      <p className="sr-only" aria-live="polite">Showing {activeProduct.title}, artifact {safeIndex + 1} of {visibleProducts.length}.</p>

      {detailProduct ? (
        <div ref={detailRef} className="artifact-dossier" role="dialog" aria-modal="true" aria-labelledby="artifact-dossier-title">
          <button type="button" className="artifact-dossier__backdrop" onClick={closeDetail} aria-label="Close artifact dossier" />
          <section className="artifact-dossier__sheet">
            <header className="artifact-dossier__header">
              <Link href="/" className="artifact-dossier__brand">Nakhyatra<span>.</span></Link>
              <p>Artifact dossier / {detailProduct.handle}</p>
              <button ref={detailCloseRef} type="button" onClick={closeDetail} aria-label="Close artifact dossier"><IconX className="h-5 w-5" /></button>
            </header>

            <div className="artifact-dossier__visuals">
              <div ref={detailHeroRef} className={`artifact-dossier__hero ${productCategory(detailProduct) === 'prints' ? 'is-print' : ''}`}>
                {detailVideo ? (
                  <video autoPlay muted loop playsInline poster={detailVideo.previewImage?.url ?? detailProduct.images[0]?.url} aria-label={detailVideo.alt ?? `${detailProduct.title} product video`}>
                    {detailVideo.sources.map((source) => <source key={source.url} src={source.url} type={source.mimeType} />)}
                  </video>
                ) : detailProduct.images[0] ? <Image src={detailProduct.images[0].url} alt={detailProduct.images[0].altText ?? detailProduct.title} fill priority sizes="(max-width: 767px) 92vw, 46vw" className="object-cover" /> : null}
                <span>PRIMARY / 01</span>
                <i aria-hidden="true" />
              </div>
              {detailProduct.images.length > 1 ? <div className="artifact-dossier__contact" aria-label={`${detailProduct.title} contact sheet`}>
                {detailProduct.images.slice(1, 5).map((image, index) => (
                  <div key={image.url} className="artifact-dossier__contact-card">
                    <Image src={image.url} alt={image.altText ?? `${detailProduct.title} view ${index + 2}`} fill sizes="(max-width: 767px) 62vw, 18vw" className="object-cover" />
                    <span>0{index + 2}</span>
                  </div>
                ))}
              </div> : null}
            </div>

            <div className="artifact-dossier__copy">
              <p className="artifact-dossier__eyebrow artifact-dossier__reveal">{productCategory(detailProduct) === 'cases' ? 'Carry the signal' : 'Occupy the wall'}</p>
              <h2 id="artifact-dossier-title" className="artifact-dossier__title">{detailProduct.title}</h2>
              <div className="artifact-dossier__price artifact-dossier__reveal">
                <strong>From {formatMoney(detailProduct.price, detailProduct.currency)}</strong>
                {detailProduct.compareAtPrice ? <del>{formatMoney(detailProduct.compareAtPrice, detailProduct.currency)}</del> : null}
              </div>
              <p className="artifact-dossier__description artifact-dossier__reveal">{detailProduct.description || (productCategory(detailProduct) === 'cases' ? 'A printed everyday object fitted to the exact phone you carry.' : 'A rigid metal artwork made to interrupt an empty wall.')}</p>
              <div className="artifact-dossier__specs artifact-dossier__reveal">
                <span><i>01</i> Printed to order</span>
                <span><i>02</i> Model or size verified</span>
                <span><i>03</i> Pan-India shipping</span>
              </div>
              <button type="button" onClick={() => buy(detailProduct)} disabled={!detailProduct.availableForSale} className="artifact-dossier__buy artifact-dossier__reveal">
                <span>{detailProduct.availableForSale ? (productCategory(detailProduct) === 'cases' ? 'Choose phone + acquire' : 'Choose size + acquire') : 'Archived / unavailable'}</span>
                <span><IconArrowRight className="h-5 w-5" /></span>
              </button>
              <Link href={`/products/${detailProduct.handle}`} className="artifact-dossier__link artifact-dossier__reveal">Technical file ↗</Link>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
