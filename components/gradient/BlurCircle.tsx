// components/BlurBox/BlurCircle.tsx
import React, { useEffect, useRef } from "react";
import { BlurMask, Circle, CircleProps, Group } from "@shopify/react-native-skia";
import {
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const BlurCircleColors = [
    "#e20707ff",
    "#e20762ff",
    "#e207e2ff",
    "#e20707ff",
    "#e20762ff",
    "#e207e2ff",
    "#f1dc96ff",
];

type Props = CircleProps & {
  delay?: number;
};

const BlurCircle = ({ delay = 0, ...props }: Props) => {
  // Random color order per instance
  const colors = useRef([...BlurCircleColors].sort(() => Math.random() - 0.5))
    .current;

  const colorAnimationDuration = useRef(colors.length * 1500).current;

  const color = useSharedValue(0);
  const radius = useSharedValue(props.r);

  const radiusAnimationSize = useRef(props.r + props.r * 0.3).current;

  const animatedColor = useDerivedValue(() =>
    interpolateColor(
      color.value,
      colors.map((_, i) => i / (colors.length - 1)),
      [...colors]
    )
  );

  useEffect(() => {
    radius.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(radiusAnimationSize, { duration: 2500 }),
          withTiming(props.r, { duration: 2500 })
        ),
        -1
      )
    );

    color.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: colorAnimationDuration }),
          withTiming(0, { duration: colorAnimationDuration })
        ),
        -1
      )
    );
  }, [props.r, delay]);

    return (
    <Group>
        <Circle {...props} r={radius} color={animatedColor} />
        <BlurMask blur={30} style="normal" />
    </Group>
    );
};

export default BlurCircle;
