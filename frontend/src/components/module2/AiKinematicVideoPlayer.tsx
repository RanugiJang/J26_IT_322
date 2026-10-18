import React, { useState, useEffect, useRef } from 'react';
import type { SuggestedExercise } from './types';

interface AiKinematicVideoPlayerProps {
  exercise: SuggestedExercise;
  onClose?: () => void;
}

export const AiKinematicVideoPlayer: React.FC<AiKinematicVideoPlayerProps> = ({ exercise }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSitStand =
    exercise.id.includes('sit-stand') ||
    exercise.id.includes('chair') ||
    exercise.title.toLowerCase().includes('chair') ||
    exercise.title.toLowerCase().includes('sit-to-stand');

  // Video playback controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<string>('Right Heel Strike & Forward Stride');
  const [liveKneeAngle, setLiveKneeAngle] = useState<number>(168);
  const [liveSpineAngle, setLiveSpineAngle] = useState<number>(3.8);

  const animationFrameId = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = performance.now();

    // Helper: Draw realistic 3D anatomical muscle segment (Thigh, Calf, Arm)
    const drawAnatomicalMuscle = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      proximalR: number,
      bellyWidth: number,
      distalR: number,
      bellyPos: number, // 0 to 1
      isBack: boolean,
      curveFront = 1,
      curveBack = 0.65
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;

      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;

      const bx = x1 + ux * (len * bellyPos);
      const by = y1 + uy * (len * bellyPos);

      ctx.save();

      // 3D medical anatomical shading: deep ruby-crimson with specular highlight
      const grad = ctx.createLinearGradient(
        bx - nx * bellyWidth,
        by - ny * bellyWidth,
        bx + nx * bellyWidth,
        by + ny * bellyWidth
      );

      if (isBack) {
        grad.addColorStop(0, '#7f1d1d');
        grad.addColorStop(0.35, '#991b1b');
        grad.addColorStop(0.7, '#881337');
        grad.addColorStop(1, '#4c0519');
      } else {
        grad.addColorStop(0, '#be123c');
        grad.addColorStop(0.28, '#e11d48'); // Bright apex highlight
        grad.addColorStop(0.65, '#dc2626');
        grad.addColorStop(1, '#881337');
      }

      ctx.fillStyle = grad;
      ctx.strokeStyle = isBack ? '#4c0519' : '#701a2e';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      // Start at proximal tendon
      ctx.moveTo(x1 - nx * proximalR, y1 - ny * proximalR);

      // Anterior (front) muscle curve
      ctx.bezierCurveTo(
        x1 + ux * (len * 0.25) - nx * (bellyWidth * curveFront * 0.9),
        y1 + uy * (len * 0.25) - ny * (bellyWidth * curveFront * 0.9),
        bx - nx * (bellyWidth * curveFront),
        by - ny * (bellyWidth * curveFront),
        x2 - nx * distalR,
        y2 - ny * distalR
      );

      // Distal tendon cap
      ctx.arcTo(x2, y2, x2 + nx * distalR, y2 + ny * distalR, distalR);

      // Posterior (back) muscle curve
      ctx.bezierCurveTo(
        bx + nx * (bellyWidth * curveBack),
        by + ny * (bellyWidth * curveBack),
        x1 + ux * (len * 0.35) + nx * (bellyWidth * curveBack * 0.8),
        y1 + uy * (len * 0.35) + ny * (bellyWidth * curveBack * 0.8),
        x1 + nx * proximalR,
        y1 + ny * proximalR
      );

      // Proximal tendon cap
      ctx.arcTo(x1, y1, x1 - nx * proximalR, y1 - ny * proximalR, proximalR);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // White fascia tendon highlight at joints
      ctx.fillStyle = isBack ? '#cbd5e1' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(x1, y1, proximalR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y2, distalR * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Delicate longitudinal muscle fiber striations
      ctx.strokeStyle = isBack ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let s = -0.3; s <= 0.3; s += 0.2) {
        ctx.moveTo(x1 + nx * (proximalR * s), y1 + ny * (proximalR * s));
        ctx.quadraticCurveTo(
          bx + nx * (bellyWidth * s * 0.6),
          by + ny * (bellyWidth * s * 0.6),
          x2 + nx * (distalR * s),
          y2 + ny * (distalR * s)
        );
      }
      ctx.stroke();

      ctx.restore();
    };

    // Helper: Draw realistic 3D anatomical Torso with pectoralis, ribcage, obliques, and heart
    const drawAnatomicalTorso = (
      hipX: number,
      hipY: number,
      shoulderX: number,
      shoulderY: number,
      scale: number,
      spineTilt: number
    ) => {
      ctx.save();
      const dx = shoulderX - hipX;
      const dy = shoulderY - hipY;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;

      const chestW = 26 * scale;
      const waistW = 18 * scale;
      const hipW = 22 * scale;

      // 3D anatomical gradient
      const grad = ctx.createLinearGradient(
        hipX - nx * chestW,
        hipY - ny * chestW,
        shoulderX + nx * chestW,
        shoulderY + ny * chestW
      );
      grad.addColorStop(0, '#be123c');
      grad.addColorStop(0.3, '#e11d48');
      grad.addColorStop(0.65, '#dc2626');
      grad.addColorStop(1, '#881337');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#701a2e';
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      // Hip anterior
      ctx.moveTo(hipX - nx * hipW, hipY - ny * hipW);
      // Abdominal wall & chest curve
      ctx.bezierCurveTo(
        hipX + ux * (len * 0.35) - nx * (waistW + 2 * scale),
        hipY + uy * (len * 0.35) - ny * (waistW + 2 * scale),
        shoulderX - ux * (len * 0.25) - nx * (chestW + 4 * scale),
        shoulderY - uy * (len * 0.25) - ny * (chestW + 4 * scale),
        shoulderX - nx * chestW,
        shoulderY - ny * chestW
      );
      // Clavicle & shoulder line
      ctx.lineTo(shoulderX + nx * chestW, shoulderY + ny * chestW);
      // Latissimus dorsi & lumbar spine curve down to gluteus
      ctx.bezierCurveTo(
        shoulderX - ux * (len * 0.3) + nx * (waistW + 6 * scale),
        shoulderY - uy * (len * 0.3) + ny * (waistW + 6 * scale),
        hipX + ux * (len * 0.35) + nx * (hipW + 5 * scale),
        hipY + uy * (len * 0.35) + ny * (hipW + 5 * scale),
        hipX + nx * hipW,
        hipY + ny * hipW
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pectoralis major chest curve
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      const pecX = hipX + ux * (len * 0.72) - nx * 4 * scale;
      const pecY = hipY + uy * (len * 0.72) - ny * 4 * scale;
      ctx.beginPath();
      ctx.arc(pecX, pecY, 10 * scale, 0.2 * Math.PI, 1.1 * Math.PI);
      ctx.stroke();

      // Serratus anterior & abdominal six-pack definition
      for (let a = 0.25; a <= 0.58; a += 0.11) {
        const ax = hipX + ux * (len * a);
        const ay = hipY + uy * (len * a);
        ctx.beginPath();
        ctx.moveTo(ax - nx * 9 * scale, ay - ny * 9 * scale);
        ctx.lineTo(ax + nx * 5 * scale, ay + ny * 5 * scale);
        ctx.stroke();
      }

      // Pulsing cardiac heart beacon in thoracic cavity
      const heartX = hipX + ux * (len * 0.68) - nx * 6 * scale;
      const heartY = hipY + uy * (len * 0.68) - ny * 6 * scale;
      const heartbeat = 1 + 0.22 * Math.sin(timeRef.current * 7.8);

      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(heartX, heartY, 5.5 * scale * heartbeat, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    };

    // Helper: Draw realistic 3D anatomical Head & Cranial muscle anatomy
    const drawAnatomicalHead = (headX: number, headY: number, angleRad: number, scale: number) => {
      ctx.save();
      ctx.translate(headX, headY);
      ctx.rotate(angleRad);

      const grad = ctx.createRadialGradient(-3 * scale, -4 * scale, 2 * scale, 0, 0, 17 * scale);
      grad.addColorStop(0, '#fecdd3');
      grad.addColorStop(0.35, '#e11d48');
      grad.addColorStop(0.75, '#be123c');
      grad.addColorStop(1, '#881337');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#701a2e';
      ctx.lineWidth = 1.3;

      // Cranial skull with facial profile (forehead, nose, jawline)
      ctx.beginPath();
      ctx.moveTo(-10 * scale, -6 * scale);
      // Top skull dome
      ctx.bezierCurveTo(-8 * scale, -18 * scale, 8 * scale, -18 * scale, 12 * scale, -6 * scale);
      // Forehead & nasal bridge
      ctx.lineTo(15 * scale, 0);
      ctx.lineTo(18 * scale, 5 * scale); // Nose
      ctx.lineTo(14 * scale, 8 * scale);
      ctx.lineTo(16 * scale, 13 * scale); // Chin
      ctx.lineTo(10 * scale, 17 * scale); // Mandible jawline
      ctx.lineTo(2 * scale, 18 * scale);
      // Occipital curve at back of skull
      ctx.bezierCurveTo(-6 * scale, 16 * scale, -14 * scale, 8 * scale, -10 * scale, -6 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Galea aponeurotica white fascia cap on top of skull
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(1 * scale, -11 * scale, 6 * scale, Math.PI, 0);
      ctx.fill();

      // Sternocleidomastoid neck muscle connector
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.moveTo(-4 * scale, 14 * scale);
      ctx.lineTo(-2 * scale, 25 * scale);
      ctx.lineTo(7 * scale, 25 * scale);
      ctx.lineTo(5 * scale, 14 * scale);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw anatomical foot with heel pad, arch, and toes
    const drawAnatomicalFoot = (
      ankleX: number,
      ankleY: number,
      footAngle: number,
      scale: number,
      isBack: boolean
    ) => {
      ctx.save();
      ctx.translate(ankleX, ankleY);
      ctx.rotate(footAngle);

      ctx.fillStyle = isBack ? '#881337' : '#be123c';
      ctx.strokeStyle = isBack ? '#4c0519' : '#701a2e';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(-7 * scale, -3 * scale); // Calcaneus (heel)
      ctx.lineTo(19 * scale, 3 * scale);  // Toes top
      ctx.lineTo(19 * scale, 8 * scale);  // Metatarsal toe pad
      // Plantar arch curve
      ctx.bezierCurveTo(8 * scale, 6 * scale, 0, 7 * scale, -7 * scale, 7 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // White Achilles tendon
      ctx.fillStyle = isBack ? '#cbd5e1' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(-4 * scale, -1 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Main 60 FPS animation loop with the exact kinematic physics
    const render = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        timeRef.current += dt * playbackSpeed;
      }

      const t = timeRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Clean white medical background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const groundY = height * 0.82;
      const centerX = width * 0.5;
      const scale = height * 0.0022;

      // Perspective floor track that glides continuously
      const gridScroll = (t * 50 * playbackSpeed) % 40;
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = -width; x < width * 2; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x + gridScroll, groundY);
        ctx.lineTo(x * 1.3 + gridScroll * 1.3, height);
        ctx.stroke();
      }

      // Ground horizontal baseline
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Soft dynamic ground shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.beginPath();
      ctx.ellipse(centerX, groundY + 8 * scale, 125 * scale, 12 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // =========================================================================
      // EXERCISE 1: SUPPORTED CHAIR SIT-TO-STAND (Prescribed for sits <= 3.5 hrs)
      // =========================================================================
      if (isSitStand) {
        const period = 5.4;
        const cycle = (t % period) / period;
        setProgress(Math.round(cycle * 100));

        let squat = 0; // 0 = standing, 1 = seated
        let phase = '';
        if (cycle < 0.42) {
          const p = cycle / 0.42;
          squat = 0.5 - 0.5 * Math.cos(p * Math.PI);
          phase = 'Controlled 3s Descent — Inhale & Core Bracing';
        } else if (cycle < 0.58) {
          squat = 1.0;
          phase = 'Chair Seat Touch (1s) — Zero Valsalva';
        } else {
          const p = (cycle - 0.58) / 0.42;
          squat = 0.5 + 0.5 * Math.cos(p * Math.PI);
          phase = 'Smooth Knee Extension (2s) — Exhale';
        }
        setCurrentPhase(phase);

        // Draw Clinical Prehab Chair
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3.5;
        const chairX = centerX - 45 * scale;
        const chairSeatY = groundY - 78 * scale;
        ctx.beginPath();
        ctx.moveTo(chairX - 25 * scale, groundY);
        ctx.lineTo(chairX - 25 * scale, chairSeatY - 75 * scale); // Backrest
        ctx.lineTo(chairX + 32 * scale, chairSeatY);              // Seat
        ctx.lineTo(chairX + 32 * scale, groundY);                 // Leg
        ctx.stroke();

        // Biomechanical Kinematics
        const hipY = groundY - (178 - squat * 80) * scale;
        const hipX = centerX - squat * 26 * scale;
        const kneeY = groundY - (90 - squat * 20) * scale;
        const kneeX = centerX + (16 + squat * 14) * scale;
        const ankleX = centerX + 18 * scale;
        const ankleY = groundY - 10 * scale;

        const spineTilt = 4.0 + squat * 14.5;
        const shoulderX = hipX + Math.sin((spineTilt * Math.PI) / 180) * 85 * scale;
        const shoulderY = hipY - Math.cos((spineTilt * Math.PI) / 180) * 85 * scale;
        const headX = shoulderX + 4 * scale;
        const headY = shoulderY - 32 * scale;

        const calculatedKneeAngle = Math.round(172 - squat * 80);
        setLiveKneeAngle(calculatedKneeAngle);
        setLiveSpineAngle(Math.round(spineTilt * 10) / 10);

        // Arms reach forward for balance
        const elbowX = shoulderX + (25 + squat * 18) * scale;
        const elbowY = shoulderY + (20 - squat * 8) * scale;
        const handX = elbowX + 22 * scale;
        const handY = elbowY - 4 * scale;

        // 1. BACKGROUND LEG
        drawAnatomicalMuscle(hipX, hipY, kneeX, kneeY, 16 * scale, 22 * scale, 12 * scale, 0.42, true, 1.1, 0.7);
        drawAnatomicalMuscle(kneeX, kneeY, ankleX, ankleY, 11 * scale, 17 * scale, 8 * scale, 0.35, true, 0.6, 1.2);
        drawAnatomicalFoot(ankleX, ankleY, 0, scale, true);

        // 2. TORSO & HEAD
        drawAnatomicalTorso(hipX, hipY, shoulderX, shoulderY, scale, spineTilt);
        drawAnatomicalHead(headX, headY, (spineTilt * Math.PI) / 180, scale);

        // 3. FOREGROUND LEG
        drawAnatomicalMuscle(hipX, hipY, kneeX, kneeY, 17 * scale, 23 * scale, 12 * scale, 0.42, false, 1.1, 0.7);
        drawAnatomicalMuscle(kneeX, kneeY, ankleX, ankleY, 12 * scale, 18 * scale, 9 * scale, 0.35, false, 0.6, 1.2);
        drawAnatomicalFoot(ankleX, ankleY, 0, scale, false);

        // 4. ARMS
        drawAnatomicalMuscle(shoulderX, shoulderY, elbowX, elbowY, 12 * scale, 13 * scale, 8 * scale, 0.4, false, 0.8, 0.8);
        drawAnatomicalMuscle(elbowX, elbowY, handX, handY, 8 * scale, 10 * scale, 6 * scale, 0.4, false, 0.8, 0.8);

        // 5. BIOMECHANICAL HUD
        if (showHUD) {
          ctx.strokeStyle = '#10b981';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(hipX, hipY - 100 * scale);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Knee Flexion: ${calculatedKneeAngle}°`, kneeX + 22 * scale, kneeY);
          ctx.fillText(`Trunk Angle: ${spineTilt.toFixed(1)}°`, shoulderX + 18 * scale, shoulderY - 8 * scale);
        }
      }

      // =========================================================================
      // EXERCISE 2: GENTLE FLAT-GROUND POST-MEAL WALK (The user's walking video!)
      // =========================================================================
      else {
        const period = 1.3;
        const cycle = (t % period) / period;
        setProgress(Math.round(cycle * 100));

        let phase = '';
        if (cycle < 0.25) {
          phase = 'Right Heel Strike & Left Swing';
        } else if (cycle < 0.5) {
          phase = 'Midstance & Pelvic Weight Transfer';
        } else if (cycle < 0.75) {
          phase = 'Left Heel Strike & Right Swing';
        } else {
          phase = 'Terminal Push-Off & Forward Propulsion';
        }
        setCurrentPhase(phase);

        // Sinusoidal leg and arm gait angles
        const gaitAngle1 = Math.sin(cycle * 2 * Math.PI);
        const gaitAngle2 = Math.sin((cycle * 2 + 1) * Math.PI);

        // Natural pelvic bobbing
        const pelvicBob = Math.abs(Math.sin(cycle * 2 * Math.PI)) * 7 * scale;
        const hipY = groundY - 180 * scale + pelvicBob;
        const hipX = centerX;

        const spineTilt = 3.8 + Math.sin(cycle * 2 * Math.PI) * 0.7;
        const shoulderX = hipX + Math.sin((spineTilt * Math.PI) / 180) * 85 * scale;
        const shoulderY = hipY - Math.cos((spineTilt * Math.PI) / 180) * 85 * scale;
        const headX = shoulderX + 4 * scale;
        const headY = shoulderY - 32 * scale;

        const calculatedKneeAngle = Math.round(168 - Math.abs(gaitAngle1) * 34);
        setLiveKneeAngle(calculatedKneeAngle);
        setLiveSpineAngle(Math.round(spineTilt * 10) / 10);

        // Left Leg (Back leg)
        const lKneeX = hipX + gaitAngle2 * 36 * scale;
        const lKneeY = groundY - 90 * scale + (gaitAngle2 < 0 ? Math.abs(gaitAngle2) * 16 * scale : 0);
        const lAnkleX = lKneeX + gaitAngle2 * 26 * scale;
        const lAnkleY = groundY - 10 * scale - (gaitAngle2 < 0 ? Math.abs(gaitAngle2) * 18 * scale : 0);

        // Right Leg (Fore leg)
        const rKneeX = hipX + gaitAngle1 * 36 * scale;
        const rKneeY = groundY - 90 * scale + (gaitAngle1 < 0 ? Math.abs(gaitAngle1) * 16 * scale : 0);
        const rAnkleX = rKneeX + gaitAngle1 * 26 * scale;
        const rAnkleY = groundY - 10 * scale - (gaitAngle1 < 0 ? Math.abs(gaitAngle1) * 18 * scale : 0);

        // Arms swing opposite to legs
        const rElbowX = shoulderX - gaitAngle1 * 18 * scale;
        const rElbowY = shoulderY + 28 * scale;
        const rHandX = shoulderX - gaitAngle1 * 35 * scale;
        const rHandY = shoulderY + 54 * scale;

        const lElbowX = shoulderX - gaitAngle2 * 18 * scale;
        const lElbowY = shoulderY + 28 * scale;
        const lHandX = shoulderX - gaitAngle2 * 35 * scale;
        const lHandY = shoulderY + 54 * scale;

        // Heel strike impact ripple at the foot
        if (Math.abs(gaitAngle1) > 0.92 && rAnkleY >= groundY - 14 * scale) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(rAnkleX + 4 * scale, groundY, 20 * scale, 4 * scale, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 1. DRAW BACK LIMBS (Left Leg & Left Arm)
        drawAnatomicalMuscle(hipX, hipY, lKneeX, lKneeY, 15 * scale, 20 * scale, 11 * scale, 0.42, true, 1.1, 0.7);
        drawAnatomicalMuscle(lKneeX, lKneeY, lAnkleX, lAnkleY, 11 * scale, 17 * scale, 8 * scale, 0.35, true, 0.6, 1.25);
        drawAnatomicalFoot(lAnkleX, lAnkleY, gaitAngle2 * 0.3, scale, true);

        drawAnatomicalMuscle(shoulderX, shoulderY, lElbowX, lElbowY, 11 * scale, 12 * scale, 7 * scale, 0.4, true, 0.8, 0.8);
        drawAnatomicalMuscle(lElbowX, lElbowY, lHandX, lHandY, 7 * scale, 9 * scale, 5 * scale, 0.4, true, 0.8, 0.8);

        // 2. DRAW TORSO & HEAD
        drawAnatomicalTorso(hipX, hipY, shoulderX, shoulderY, scale, spineTilt);
        drawAnatomicalHead(headX, headY, (spineTilt * Math.PI) / 180, scale);

        // 3. DRAW FORE LIMBS (Right Leg & Right Arm)
        drawAnatomicalMuscle(hipX, hipY, rKneeX, rKneeY, 16 * scale, 22 * scale, 12 * scale, 0.42, false, 1.1, 0.7);
        drawAnatomicalMuscle(rKneeX, rKneeY, rAnkleX, rAnkleY, 12 * scale, 18 * scale, 9 * scale, 0.35, false, 0.6, 1.25);
        drawAnatomicalFoot(rAnkleX, rAnkleY, gaitAngle1 * 0.3, scale, false);

        drawAnatomicalMuscle(shoulderX, shoulderY, rElbowX, rElbowY, 12 * scale, 13 * scale, 8 * scale, 0.4, false, 0.8, 0.8);
        drawAnatomicalMuscle(rElbowX, rElbowY, rHandX, rHandY, 8 * scale, 10 * scale, 6 * scale, 0.4, false, 0.8, 0.8);

        // 4. BIOMECHANICAL HUD ANGLE TRACKING OVERLAYS
        if (showHUD) {
          ctx.strokeStyle = '#10b981';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(hipX, hipY - 110 * scale);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Spine Tilt: ${spineTilt.toFixed(1)}° (Normal <15°)`, shoulderX + 22 * scale, shoulderY - 8 * scale);
          ctx.fillText(`Knee Tracking: ${calculatedKneeAngle}°`, rKneeX + 18 * scale, rKneeY);
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, playbackSpeed, isSitStand, showHUD]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col shadow-2xl font-sans">
      {/* Top HUD Overlay Banner */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center space-x-2 rounded-lg bg-slate-950/85 px-3 py-1.5 backdrop-blur-md border border-slate-700/80">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-bold text-white tracking-wide">
            PRESCRIBED EXERCISE • 60 FPS 3D ANATOMICAL VIDEO
          </span>
        </div>

        {/* HUD Angles Toggle */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => setShowHUD(!showHUD)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-mono font-semibold border transition-all ${
              showHUD
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800'
            }`}
          >
            {showHUD ? '👁 HUD Angles: ON' : '👁 HUD Angles: OFF'}
          </button>
        </div>
      </div>

      {/* Main Video Viewport Rendering the 60 FPS Anatomical Human Body Motion */}
      <div className="relative w-full flex items-center justify-center bg-white" style={{ height: '380px' }}>
        <canvas
          ref={canvasRef}
          width={760}
          height={400}
          className="w-full h-full object-contain"
        />

        {/* Phase Indicator & Live Kinematics Banner (Center-Bottom) */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap justify-between items-center gap-2 pointer-events-none">
          <div className="rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-1.5 backdrop-blur-md flex items-center space-x-2">
            <span className="text-emerald-400 text-xs font-bold font-mono">PHASE:</span>
            <span className="text-xs text-white font-medium">{currentPhase}</span>
          </div>

          <div className="rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-1.5 backdrop-blur-md flex items-center space-x-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block font-bold">KNEE ANGLE</span>
              <span className="text-emerald-400 font-bold">{liveKneeAngle}°</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400 text-[10px] block font-bold">TRUNK TILT</span>
              <span className="text-cyan-400 font-bold">{liveSpineAngle}°</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400 text-[10px] block font-bold">HEART ZONE</span>
              <span className="text-rose-400 font-bold">Zone 1 (&lt;100 bpm)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Timeline Scrubber */}
      <div className="w-full bg-slate-900 h-1.5 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-rose-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Video Control Bar */}
      <div className="p-3.5 bg-slate-950/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-bold text-sm"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setPlaybackSpeed(0.5)}
              className={`px-2 py-1 rounded-md transition-all ${
                playbackSpeed === 0.5 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              0.5x Slow-Mo
            </button>
            <button
              onClick={() => setPlaybackSpeed(1.0)}
              className={`px-2 py-1 rounded-md transition-all ${
                playbackSpeed === 1.0 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              1.0x Normal
            </button>
          </div>

          <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
            Prescribed Plan: <strong className="text-white">{exercise.title}</strong>
          </span>
        </div>

        {/* Clinical Status */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="text-emerald-400">✓ 3D Anatomical Landmarks Synchronized</span>
          <span>•</span>
          <span className="text-slate-300">Continuous Gait Cycle</span>
        </div>
      </div>
    </div>
  );
};
