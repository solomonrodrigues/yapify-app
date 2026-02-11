// components/BlurBox/BlurBox.tsx
import React, { useRef } from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import BlurBackground from "./BlurBackground";
import BlurEdge from "./BlurEdge";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { vec } from "@shopify/react-native-skia";

type Props = ViewProps & {
  children?: React.ReactNode;
  bottomBlur?: boolean;
  edgeColors?: { top: string[]; bottom: string[] };
};

const BlurBox = ({ bottomBlur = true, children, style, edgeColors, ...props }: Props) => {
  const insets = useSafeAreaInsets();
  const edgeHeight = useRef(60).current;

  const topColors = edgeColors?.top ?? ["#FFFFFF90", "#FFFFFF00"];
  const bottomColors = edgeColors?.bottom ?? ["#FFFFFF00", "#FFFFFF80"];

  return (
    <View style={[styles.wrapper, style]} {...props}>
      {/* Top fading edge */}
      <BlurEdge
        height={edgeHeight + insets.top}
        colors={topColors}
        start={vec(0, 0 + insets.top)}
        end={vec(0, edgeHeight + insets.top)}
        style={[styles.blur, styles.top]}
      />

      {/* Children content */}
      {children}

      {/* Bottom fading edge */}
      <BlurEdge
        enabled={bottomBlur}
        height={edgeHeight + insets.bottom}
        colors={bottomColors}
        start={vec(0, 0)}
        end={vec(0, edgeHeight + insets.bottom)}
        style={[styles.blur, styles.bottom]}
      />

      {/* Animated blur circles background */}
      <BlurBackground />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: "hidden",
  },
  blur: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
});

export default BlurBox;
