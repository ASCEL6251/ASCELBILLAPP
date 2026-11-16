import { useEffect, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '@/lib/theme';
import { Button, Row, T } from './ui';

const VB_W = 320;
const VB_H = 120;

/** Finger-drawn signature, stored as an SVG path in a 320×120 viewBox (same box the invoice templates use). */
export function SignaturePad({
  value,
  onChange,
  onDrawing,
}: {
  value: string;
  onChange: (path: string) => void;
  /** Fires true while a finger is down, so the parent can lock its scroll. */
  onDrawing?: (drawing: boolean) => void;
}) {
  const [path, setPath] = useState(value);
  // One mutable store per pad: pan callbacks read and write it outside render.
  const [store] = useState(() => ({ width: VB_W, cur: value, onChange, onDrawing }));
  useEffect(() => {
    patchStore(store, { onChange, onDrawing });
  });
  const [responder] = useState(() => createResponder(store, setPath));

  return (
    <View>
      <View
        style={styles.pad}
        onLayout={(e) => patchStore(store, { width: e.nativeEvent.layout.width || VB_W })}
        {...responder.panHandlers}
      >
        <Svg width="100%" height="100%" pointerEvents="none" viewBox={`0 0 ${VB_W} ${VB_H}`}>
          <Path d={path || 'M0 0'} stroke={colors.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        {!path ? (
          <View style={styles.hint} pointerEvents="none">
            <T v="small">Sign here with your finger</T>
          </View>
        ) : null}
        <View style={styles.baseline} pointerEvents="none" />
      </View>
      <Row style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <Button
          small
          kind="ghost"
          title="Clear"
          icon="refresh"
          onPress={() => {
            patchStore(store, { cur: '' });
            setPath('');
            onChange('');
          }}
        />
      </Row>
    </View>
  );
}

type PadStore = { width: number; cur: string; onChange: (path: string) => void; onDrawing?: (drawing: boolean) => void };

/** The pad's store lives outside React state on purpose: pan events update it at 60fps. */
function patchStore(store: PadStore, patch: Partial<PadStore>) {
  Object.assign(store, patch);
}

function createResponder(store: PadStore, setPath: (p: string) => void) {
  const pt = (x: number, y: number) => {
    const scale = VB_W / store.width;
    return `${(x * scale).toFixed(1)} ${(y * scale).toFixed(1)}`;
  };
  const end = () => {
    store.onDrawing?.(false);
    store.onChange(store.cur);
  };
  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    onPanResponderGrant: (e) => {
      store.onDrawing?.(true);
      const { locationX, locationY } = e.nativeEvent;
      store.cur = `${store.cur} M ${pt(locationX, locationY)}`.trim();
      setPath(store.cur);
    },
    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      store.cur = `${store.cur} L ${pt(locationX, locationY)}`;
      setPath(store.cur);
    },
    onPanResponderRelease: end,
    onPanResponderTerminate: end,
  });
}

const styles = StyleSheet.create({
  pad: {
    width: '100%',
    aspectRatio: VB_W / VB_H,
    backgroundColor: '#fff',
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  hint: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  baseline: { position: 'absolute', left: 24, right: 24, bottom: 26, height: 1, backgroundColor: colors.lineStrong },
});
