import React from "react";
import { Modal, Pressable, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";

type FilterPickerProps = {
  visible: boolean;
  onClose: () => void;
  options: (string | number)[];
  selected?: string | number | null;
  onSelect: (value: string | number | null) => void;
  placeholder?: string;
  theme: typeof Colors.light | typeof Colors.dark;
};

export const FilterPicker: React.FC<FilterPickerProps> = ({
  visible,
  onClose,
  options,
  selected,
  onSelect,
  placeholder = "Select",
  theme,
}) => {
  const styles = useThemedStyles(getStyles);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: theme.cardBackground }]} onPress={() => {}}>
          <FlatList
            data={options}
            keyExtractor={(item, index) => `${item.toString()}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, item === selected ? { backgroundColor: theme.accent } : {}]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <ThemedText style={item === selected ? { color: "#fff" } : {}}>{item}</ThemedText>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={{ marginTop: 8 }}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <ThemedText style={{ textAlign: "center" }}>Clear</ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
    StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
    modalContent: { width: 200, maxHeight: 300, borderRadius: 12, padding: 12, backgroundColor: theme.cardBackground },
    modalItem: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
    });
