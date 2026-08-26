import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#D4A657', '#3FBE7A', '#EC6FA0', '#4C8DFF', '#E3A93B', '#F7EFDD'];
const PIECE_COUNT = 34;

interface Piece {
  key: number;
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
}

/**
 * Lightweight celebration for the results screen — plain Animated values so
 * it needs no extra dependency, and every piece runs on the native driver.
 */
export function Confetti() {
  const { width, height } = Dimensions.get('window');

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        key: i,
        left: Math.random() * width,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 900,
        duration: 2600 + Math.random() * 1800,
        drift: (Math.random() - 0.5) * 90,
      })),
    [width]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.key} piece={piece} fallTo={height + 40} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, fallTo }: { piece: Piece; fallTo: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(piece.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: piece.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [piece.delay, piece.duration, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-40, fallTo] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.left,
          width: piece.size,
          height: piece.size * 1.6,
          backgroundColor: piece.color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
