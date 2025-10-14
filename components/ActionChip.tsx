import { TouchableOpacity, Text } from "react-native";
import { IconSymbol, IconSymbolName } from "./ui/IconSymbol";

const ActionChip = ({
    icon,
    activeIcon,
    active,
    label,
    onPress,
    color,
    disabled,
  }: {
    icon: IconSymbolName;
    activeIcon?: IconSymbolName;
    active?: boolean;
    label: string | number;
    onPress?: () => void;
    color: string;
    disabled?: boolean;
  }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: color,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <IconSymbol
          name={active ? activeIcon ?? icon : icon}
          size={16}
          color={active ? color : color}
          style={{ marginRight: 6 }}
        />
        <Text style={{ fontSize: 14, color: color }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  export default ActionChip
