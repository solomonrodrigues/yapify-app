import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const SIZES = {
  HOME: {
    HEADER: 60
  },
  WINDOW: {
    HEIGHT: height,
    WIDTH: width
  }
};
