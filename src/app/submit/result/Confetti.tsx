'use client';

import { useEffect, useRef } from 'react';

interface ConfettiPiece {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    shape: 'rect' | 'circle';
    rotation: number;
    rotationSpeed: number;
    velocityX: number;
    velocityY: number;
    gravity: number;
    opacity: number;
    decay: number;
}

const COLORS = [
    '#34b27b', '#2ecc71', '#27ae60',
    '#f1c40f', '#f39c12', '#e67e22',
    '#3498db', '#2980b9',
    '#9b59b6', '#8e44ad',
    '#e74c3c', '#e91e63',
    '#00bcd4', '#1abc9c',
    '#ff6b6b', '#ffd93d',
];

function createPiece(cx: number, cy: number): ConfettiPiece {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 10;
    return {
        x: cx,
        y: cy,
        w: 5 + Math.random() * 7,
        h: 3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - 6,
        gravity: 0.12 + Math.random() * 0.06,
        opacity: 1,
        decay: 0.004 + Math.random() * 0.003,
    };
}

export default function Confetti() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let pieces: ConfettiPiece[] = [];

        function resize(): void {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        resize();
        window.addEventListener('resize', resize);

        // Find the 🎉 emoji element and blast from its position
        const emojiEl = document.getElementById('confetti-origin');
        let cx = canvas.width / 2;
        let cy = canvas.height / 2;

        if (emojiEl) {
            const rect = emojiEl.getBoundingClientRect();
            cx = rect.left + rect.width / 2;
            cy = rect.top + rect.height / 2;
        }

        const count = Math.min(200, Math.floor(window.innerWidth / 4));
        for (let i = 0; i < count; i++) {
            pieces.push(createPiece(cx, cy));
        }

        function draw(): void {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = pieces.length - 1; i >= 0; i--) {
                const p = pieces[i];

                p.x += p.velocityX;
                p.y += p.velocityY;
                p.velocityY += p.gravity;
                p.velocityX *= 0.99;
                p.rotation += p.rotationSpeed;
                p.opacity -= p.decay;

                if (p.opacity <= 0 || p.y > canvas.height + 40) {
                    pieces.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;

                if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                }

                ctx.restore();
            }

            if (pieces.length > 0) {
                animationId = requestAnimationFrame(draw);
            }
        }

        animationId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-50"
            aria-hidden="true"
        />
    );
}
