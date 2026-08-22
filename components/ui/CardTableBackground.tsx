import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Ellipse,
  Circle,
  Path,
  G,
  Text as SvgText,
} from 'react-native-svg';

/**
 * Original vector illustration for the Login screen: a card table at night,
 * string lights, and scattered cards — evoking "friends playing cards"
 * without relying on external art assets. Swap for commissioned artwork
 * later by replacing this component.
 */

type Suit = '♠' | '♥' | '♦' | '♣';

interface FloatingCard {
  x: number;
  y: number;
  rotation: number;
  suit: Suit;
  scale?: number;
  opacity?: number;
}

const RED_SUITS: Suit[] = ['♥', '♦'];

const FLOATING_CARDS: FloatingCard[] = [
  { x: 90, y: 90, rotation: -18, suit: '♠', scale: 1 },
  { x: 200, y: 340, rotation: 12, suit: '♥', scale: 1.1 },
  { x: 830, y: 110, rotation: 22, suit: '♦', scale: 1 },
  { x: 890, y: 330, rotation: -14, suit: '♣', scale: 1.05 },
  { x: 480, y: 60, rotation: -8, suit: '♥', scale: 0.85, opacity: 0.85 },
  { x: 60, y: 230, rotation: 8, suit: '♦', scale: 0.75, opacity: 0.7 },
  { x: 900, y: 220, rotation: -10, suit: '♠', scale: 0.75, opacity: 0.7 },
];

function PlayingCard({ x, y, rotation, suit, scale = 1, opacity = 1 }: FloatingCard) {
  const isRed = RED_SUITS.includes(suit);
  const fill = isRed ? '#C94A4A' : '#2B2118';
  const w = 64;
  const h = 92;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} opacity={opacity}>
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={10}
        fill="#F7EFDD"
        stroke="rgba(212,166,87,0.7)"
        strokeWidth={1.5}
      />
      <SvgText
        x={-w / 2 + 12}
        y={-h / 2 + 22}
        fontSize={16}
        fontWeight="bold"
        fill={fill}
        textAnchor="middle"
      >
        {suit}
      </SvgText>
      <SvgText x={0} y={8} fontSize={26} fill={fill} textAnchor="middle">
        {suit}
      </SvgText>
    </G>
  );
}

function StringLights({ startX, startY, endX, endY, color }: { startX: number; startY: number; endX: number; endY: number; color: string }) {
  const midX = (startX + endX) / 2;
  const midY = Math.max(startY, endY) + 70;
  const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  const bulbs = Array.from({ length: 7 }, (_, i) => {
    const t = (i + 1) / 8;
    const bx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
    const by = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;
    return { bx, by };
  });
  return (
    <G>
      <Path d={path} stroke="rgba(247,239,221,0.35)" strokeWidth={1.5} fill="none" />
      {bulbs.map(({ bx, by }, i) => (
        <Circle key={i} cx={bx} cy={by} r={i % 2 === 0 ? 5 : 4} fill={color} opacity={0.9} />
      ))}
    </G>
  );
}

export function CardTableBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B3D2E" />
            <Stop offset="1" stopColor="#082B20" />
          </LinearGradient>
          <RadialGradient id="glow" cx="50%" cy="38%" r="55%">
            <Stop offset="0" stopColor="#146044" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#0B3D2E" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="felt" cx="50%" cy="35%" r="75%">
            <Stop offset="0" stopColor="#1C6B4C" />
            <Stop offset="1" stopColor="#0E4632" />
          </RadialGradient>
        </Defs>

        {/* Night sky base + ambient glow behind the logo */}
        <Rect x={0} y={0} width={960} height={540} fill="url(#sky)" />
        <Rect x={0} y={0} width={960} height={540} fill="url(#glow)" />

        {/* Moon + stars */}
        <Circle cx={860} cy={70} r={34} fill="#F7EFDD" opacity={0.16} />
        <Circle cx={848} cy={62} r={30} fill="#082B20" opacity={0.9} />
        {[
          [120, 40, 2], [260, 30, 1.5], [400, 55, 2], [620, 35, 1.5],
          [720, 60, 2], [80, 130, 1.5], [500, 20, 1.5],
        ].map(([sx, sy, sr], i) => (
          <Circle key={i} cx={sx} cy={sy} r={sr} fill="#F7EFDD" opacity={0.5} />
        ))}

        {/* String lights across the top */}
        <StringLights startX={20} startY={20} endX={480} endY={60} color="#D4A657" />
        <StringLights startX={480} startY={60} endX={940} endY={20} color="#EC6FA0" />

        {/* Card table, viewed at an angle, anchored near the bottom */}
        <Ellipse cx={480} cy={620} rx={560} ry={230} fill="url(#felt)" stroke="#D4A657" strokeWidth={3} strokeOpacity={0.5} />
        <Ellipse cx={480} cy={610} rx={420} ry={165} fill="none" stroke="#F7EFDD" strokeOpacity={0.12} strokeWidth={2} />

        {/* Floating / scattered cards */}
        {FLOATING_CARDS.map((c, i) => (
          <PlayingCard key={i} {...c} />
        ))}
      </Svg>
    </View>
  );
}
