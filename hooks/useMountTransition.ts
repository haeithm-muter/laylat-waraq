import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

/**
 * Fade+scale transition for popups that currently mount/unmount instantly
 * off a `visible` boolean (`if (!visible) return null`). Keeps rendering
 * for a beat after `visible` goes false so the exit animation can play,
 * then stops rendering once it's fully faded out.
 */
export function useMountTransition(visible: boolean) {
  const [rendered, setRendered] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 160, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setRendered(false);
        }
      );
    }
  }, [visible, progress]);

  return { rendered, progress };
}
