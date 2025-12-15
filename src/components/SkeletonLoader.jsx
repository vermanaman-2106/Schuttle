import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';

export const SkeletonLoader = ({ width, height, style, borderRadius: br }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width || '100%',
          height: height || 20,
          borderRadius: br || borderRadius.md,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const RideCardSkeleton = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.cardHeader}>
      <SkeletonLoader height={20} width="60%" style={styles.skeletonMargin} />
      <SkeletonLoader height={20} width="30%" />
    </View>
    <SkeletonLoader height={16} width="80%" style={styles.skeletonMargin} />
    <SkeletonLoader height={16} width="70%" style={styles.skeletonMargin} />
    <View style={styles.divider} />
    <SkeletonLoader height={16} width="50%" style={styles.skeletonMargin} />
    <SkeletonLoader height={16} width="60%" style={styles.skeletonMargin} />
    <SkeletonLoader height={16} width="40%" />
  </View>
);

export const BookingCardSkeleton = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.cardHeader}>
      <SkeletonLoader height={20} width="65%" style={styles.skeletonMargin} />
      <SkeletonLoader height={20} width="25%" />
    </View>
    <SkeletonLoader height={16} width="75%" style={styles.skeletonMargin} />
    <View style={styles.divider} />
    <SkeletonLoader height={16} width="60%" style={styles.skeletonMargin} />
    <SkeletonLoader height={16} width="70%" style={styles.skeletonMargin} />
    <SkeletonLoader height={16} width="50%" />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.cardBackground,
  },
  cardSkeleton: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  skeletonMargin: {
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});


