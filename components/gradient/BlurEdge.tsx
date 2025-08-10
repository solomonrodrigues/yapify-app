// components/BlurBox/BlurEdge.tsx
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Canvas, LinearGradient, Rect, SkPoint, AnimatedProp } from "@shopify/react-native-skia";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

type Props = {
  enabled?: boolean;
  height: number;
  colors: string[];
  style?: StyleProp<ViewStyle>;
  start: AnimatedProp<SkPoint>;
  end: AnimatedProp<SkPoint>;
};

const BlurEdge: React.FC<Props> = ({ enabled = true, height, style, ...props }) => {
  if (!enabled) return null;

  return (
    <Canvas style={[style, { height }]}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient {...props} />
      </Rect>
    </Canvas>
  );
};

export default BlurEdge;
