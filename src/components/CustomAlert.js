import React, { useCallback, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { C, R, S } from "../theme";

let showAlert = null;

const BUTTON_STYLES = {
  destructive: { color: C.redText, bg: C.redBg, border: "rgba(196,64,64,.3)" },
  cancel: { color: C.muted, bg: "transparent", border: C.border },
  default: { color: "#1a0800", bg: C.gold, border: "transparent" },
};

export function useAlert() {
  const show = useCallback((title, message, buttons = [{ text: "OK" }]) => {
    showAlert?.({ title, message, buttons });
  }, []);

  return { show };
}

export function AlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({ title: "", message: "", buttons: [] });

  showAlert = ({ title, message, buttons }) => {
    setConfig({ title, message, buttons });
    setVisible(true);
  };

  const dismiss = () => setVisible(false);

  const handlePress = (button) => {
    dismiss();
    setTimeout(() => button.onPress?.(), 150);
  };

  return (
    <>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <TouchableWithoutFeedback onPress={dismiss}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback>
              <View style={s.box}>
                <View style={s.topBar} />
                <Text style={s.title}>{config.title}</Text>
                {config.message ? (
                  <Text style={s.msg}>{config.message}</Text>
                ) : null}

                <View
                  style={[s.btns, config.buttons.length > 2 && s.btnsStacked]}
                >
                  {config.buttons.map((button, index) => {
                    const variant =
                      BUTTON_STYLES[button.style] || BUTTON_STYLES.default;
                    return (
                      <TouchableOpacity
                        key={`${button.text}-${index}`}
                        onPress={() => handlePress(button)}
                        style={[
                          s.btn,
                          {
                            backgroundColor: variant.bg,
                            borderColor: variant.border,
                          },
                          config.buttons.length <= 2 && s.btnFluid,
                          config.buttons.length > 2 && s.btnFull,
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text style={[s.btnTxt, { color: variant.color }]}>
                          {button.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

export const CustomAlert = {
  alert: (title, message, buttons) => {
    showAlert?.({
      title,
      message: message || "",
      buttons: buttons || [{ text: "OK" }],
    });
  },
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: S.xl,
  },
  box: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.goldBorder,
    overflow: "hidden",
  },
  topBar: { height: 3, backgroundColor: C.gold, opacity: 0.8 },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: C.cream,
    paddingHorizontal: S.xl,
    paddingTop: S.lg,
    paddingBottom: S.sm,
  },
  msg: {
    fontSize: 14,
    color: C.cream2,
    paddingHorizontal: S.xl,
    paddingBottom: S.lg,
    lineHeight: 20,
  },
  btns: {
    flexDirection: "row",
    padding: S.lg,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: S.sm,
  },
  btnsStacked: { flexDirection: "column" },
  btn: {
    paddingVertical: 11,
    paddingHorizontal: S.md,
    borderRadius: R.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnFluid: { flex: 1 },
  btnFull: { width: "100%" },
  btnTxt: { fontSize: 14, fontWeight: "600" },
});
