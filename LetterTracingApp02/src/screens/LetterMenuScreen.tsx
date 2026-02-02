// src/screens/LetterMenuScreen.tsx

import React, { useMemo, useState } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Image,
  Text,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { getAvailableLetters, isLetterAvailable } from '../letters';

const BG = require('../../assets/images/letters/Tracing_Menu_Background.png');

const { width: SCREEN_W } = Dimensions.get('window');

// Tweak for tablets vs phones
const isTablet = SCREEN_W > 700;
const COLS = isTablet ? 6 : 4;
const GAP = isTablet ? 16 : 12;

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function letterAsset(letter: string) {
  const map: Record<string, any> = {
    A: require('../../assets/images/letters/A.png'),
    B: require('../../assets/images/letters/B.png'),
    C: require('../../assets/images/letters/C.png'),
    D: require('../../assets/images/letters/D.png'),
    E: require('../../assets/images/letters/E.png'),
    F: require('../../assets/images/letters/F.png'),
    G: require('../../assets/images/letters/G.png'),
    H: require('../../assets/images/letters/H.png'),
    I: require('../../assets/images/letters/I.png'),
    J: require('../../assets/images/letters/J.png'),
    K: require('../../assets/images/letters/K.png'),
    L: require('../../assets/images/letters/L.png'),
    M: require('../../assets/images/letters/M.png'),
    N: require('../../assets/images/letters/N.png'),
    O: require('../../assets/images/letters/O.png'),
    P: require('../../assets/images/letters/P.png'),
    Q: require('../../assets/images/letters/Q.png'),
    R: require('../../assets/images/letters/R.png'),
    S: require('../../assets/images/letters/S.png'),
    T: require('../../assets/images/letters/T.png'),
    U: require('../../assets/images/letters/U.png'),
    V: require('../../assets/images/letters/V.png'),
    W: require('../../assets/images/letters/W.png'),
    X: require('../../assets/images/letters/X.png'),
    Y: require('../../assets/images/letters/Y.png'),
    Z: require('../../assets/images/letters/Z.png'),
  };
  return map[letter];
}

export default function LetterMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Get available letters from the letter registry
  const availableLetters = useMemo(() => getAvailableLetters(), []);

  // Card width derived from screen, columns and gaps
  const CARD_W = useMemo(
    () => Math.floor((SCREEN_W - GAP * (COLS + 1)) / COLS),
    []
  );
  const CARD_H = CARD_W; // square

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.header}>
        <Text style={styles.title}>Choose a Letter</Text>
        <Text style={styles.subtitle}>
          {availableLetters.length} of {ALL_LETTERS.length} letters available
        </Text>
      </View>

      <FlatList
        contentContainerStyle={[
          styles.grid,
          { paddingHorizontal: GAP, gap: GAP, paddingBottom: 28 },
        ]}
        data={ALL_LETTERS}
        keyExtractor={(item) => item}
        numColumns={COLS}
        renderItem={({ item }) => {
          const isAvailable = isLetterAvailable(item);
          
          return (
            <LiftedCard
              width={CARD_W}
              height={CARD_H}
              onPress={() => navigation.navigate('Tracing', { letter: item })}
              source={letterAsset(item)}
              disabled={!isAvailable}
              isAvailable={isAvailable}
            />
          );
        }}
      />
    </ImageBackground>
  );
}

// A reusable lifted card with transparent background, dual shadows and press scale
function LiftedCard({
  width,
  height,
  source,
  onPress,
  disabled = false,
  isAvailable = true,
}: {
  width: number;
  height: number;
  source: any;
  onPress: () => void;
  disabled?: boolean;
  isAvailable?: boolean;
}) {
  const scale = useState(new Animated.Value(1))[0];

  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
  };
  
  const pressOut = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <TouchableWithoutFeedback 
      onPressIn={pressIn} 
      onPressOut={pressOut} 
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.cardWrap,
          {
            width,
            height,
            transform: [{ scale }],
            opacity: isAvailable ? 1 : 0.4,
          },
        ]}
      >
        {/* Outer soft shadow */}
        <View style={[styles.shadowA, !isAvailable && styles.shadowDisabled]} />
        {/* Inner tighter shadow + content */}
        <View style={[styles.cardInner, !isAvailable && styles.cardDisabled]}>
          <Image source={source} style={styles.image} resizeMode="contain" />
          {/* Top subtle gloss for depth */}
          <View pointerEvents="none" style={styles.gloss} />
          {/* Coming Soon badge for unavailable letters */}
          {!isAvailable && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 6,
  },
  title: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: '900',
    color: '#0F172A',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  subtitle: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
  },
  grid: {
    justifyContent: 'center',
    marginTop: 10,
  },

  // Container that allows both shadow layers to breathe
  cardWrap: {
    borderRadius: 22,
  },

  // Outer soft shadow (ambient)
  shadowA: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
    borderRadius: 22,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: 0,
  },

  shadowDisabled: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
      },
      android: { elevation: 2 },
    }),
  },

  // Inner content with a tighter drop shadow; transparent background
  cardInner: {
    borderRadius: 22,
    overflow: 'visible',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
    flex: 1,
  },

  cardDisabled: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.06,
      },
      android: { elevation: 2 },
    }),
  },

  image: {
    width: '96%',
    height: '96%',
    borderRadius: 20,
  },

  gloss: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    height: '40%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  comingSoonBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(251,191,36,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FBBF24',
  },

  comingSoonText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350F',
    textTransform: 'uppercase',
  },
});
