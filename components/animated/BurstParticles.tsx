import React from 'react';
import { View } from 'react-native';
import Animated, {
    Easing,
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    interpolate,
  } from 'react-native-reanimated';
  import type { SharedValue } from 'react-native-reanimated';
  


const Particle: React.FC<{
    angle: number;
    dist: number;
    color: string;
    progress: SharedValue<number>;
}> = ({ angle, dist, color, progress }) => {
    const style = useAnimatedStyle(() => {
      const t = progress.value;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      return {
        transform: [
          { translateX: interpolate(t, [0, 1], [0, x]) },
          { translateY: interpolate(t, [0, 1], [0, y]) },
          { scale: interpolate(t, [0, 0.3, 1], [0, 1.2, 0.6]) },
        ],
        opacity: interpolate(t, [0, 0.2, 1], [0, 1, 0]),
      };
    });
    return <Animated.View style={[{ position: 'absolute', width: 8, height: 8, borderRadius: 999, opacity: 0, backgroundColor: color }, style]} />;
};
  
const BurstParticles: React.FC<{ color: string; active: boolean }> = ({ color, active }) => {
    const progress = useSharedValue(0);
  
    React.useEffect(() => {
      if (active) {
        progress.value = 0;
        progress.value = withSequence(
          withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400 })
        );
      }
    }, [active, progress]);
  
    const count = 8;
    const dist = 72;
  
    return (
      <View pointerEvents="none" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -6,
        marginTop: -6,
        width: 12,
        height: 12,
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <Particle
            key={i}
            angle={(i / count) * Math.PI * 2}
            dist={dist}
            color={color}
            progress={progress}
          />
        ))}
      </View>
    );
};

export default BurstParticles;
