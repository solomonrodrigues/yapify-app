// components/BlurBox/BlurBackground.tsx
import React, { useRef } from "react";
import { Canvas, BlurMask, Circle, Group } from "@shopify/react-native-skia";
import BlurCircle from "./BlurCircle";
import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

const BlurBackground = () => {
  const r = useRef(width / 2.5).current;
  const circles = useRef(new Array(6).fill(1)).current;
  const step = height / circles.length;

  const bigRadius = useRef(width * 1.5).current; // Large circle radius

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {/* Big subtle blurred circle behind to fill gaps */}
      <Group>
        <Circle
          cx={width / 2}
          cy={height / 2}
          r={bigRadius}
          color="rgba(250, 14, 179, 1)" // subtle pastel fill
        />
        <BlurMask blur={100} style="normal" />
      </Group>

      {/* Animated smaller circles on top */}
      <Group>
        <BlurMask blur={50} style="normal" />
        {circles.map((_, i) => (
          <BlurCircle
            key={i}
            cx={i % 2 ? width : 0}
            cy={step * i}
            r={r}
            delay={i * 1000}
          />
        ))}
      </Group>
    </Canvas>
  );
};

export default BlurBackground;
