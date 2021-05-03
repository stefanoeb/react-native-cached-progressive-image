import React, { useRef, useState, ReactNode } from "react";
import {
  View,
  Animated,
  StyleSheet,
  Image,
  ViewStyle,
  StyleProp,
  ImageSourcePropType,
  ImageStyle,
} from "react-native";
import FastImage, { FastImageProps } from "react-native-fast-image";

export interface CachedImageWithProgressiveLoadProps extends FastImageProps {
  viewStyle?: StyleProp<ViewStyle>;
  thumbnailFadeDuration?: number;
  imageFadeDuration?: number;
  thumbnailSource?: ImageSourcePropType;
  thumbnailBlurRadius?: number;
  fallbackSource?: ImageSourcePropType;
  children?: ReactNode;
}

const { Value, createAnimatedComponent, timing } = Animated;

const AnimatedFastImage = createAnimatedComponent(FastImage);
const AnimatedImage = createAnimatedComponent(Image);

const CachedImageWithProgressiveLoad = ({
  viewStyle,
  thumbnailFadeDuration = 250,
  imageFadeDuration = 250,
  thumbnailSource,
  source,
  onLoadEnd,
  resizeMode,
  thumbnailBlurRadius = 1,
  style,
  fallbackSource = { uri: "" },
  onError,
  children,
  ...otherProps
}: CachedImageWithProgressiveLoadProps) => {
  const imageOpacity = useRef(new Value(1)).current;
  const thumbnailOpacity = useRef(new Value(0)).current;
  const thumbnailAnimationProgress = useRef<
    Animated.CompositeAnimation | undefined
  >();
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const onImageLoad = () => {
    setHasLoaded(true);

    timing(imageOpacity, {
      toValue: 1,
      duration: imageFadeDuration,
      useNativeDriver: true,
    }).start(() => {
      thumbnailAnimationProgress.current?.stop();
      timing(thumbnailOpacity, {
        toValue: 0,
        duration: thumbnailFadeDuration,
        useNativeDriver: true,
      }).start();
    });

    onLoadEnd && onLoadEnd();
  };

  const onThumbnailLoad = () => {
    if (!hasLoaded) {
      const progress = timing(thumbnailOpacity, {
        toValue: 1,
        duration: thumbnailFadeDuration,
        useNativeDriver: true,
      });
      thumbnailAnimationProgress.current = progress;
      thumbnailAnimationProgress.current.start();
    }
  };

  const onImageLoadError = () => {
    setHasError(true);
    onError && onError();
  };

  return (
    <View style={[styles.imageContainerStyle, viewStyle]}>
      {thumbnailSource ? (
        <AnimatedImage
          onLoadEnd={onThumbnailLoad}
          style={[
            styles.thumbnailImageStyle,
            { opacity: thumbnailOpacity },
            style as StyleProp<ImageStyle>,
          ]}
          source={thumbnailSource}
          blurRadius={thumbnailBlurRadius}
          resizeMode={resizeMode}
        >
          {children}
        </AnimatedImage>
      ) : null}
      <AnimatedFastImage
        resizeMode={resizeMode}
        onLoadEnd={onImageLoad}
        onError={hasError ? () => null : onImageLoadError}
        source={hasError ? (fallbackSource as typeof source) : source}
        style={[styles.imageStyle, { opacity: imageOpacity }, style]}
        {...otherProps}
      >
        {children}
      </AnimatedFastImage>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainerStyle: {
    overflow: "hidden",
  },
  thumbnailImageStyle: {
    ...StyleSheet.absoluteFillObject,
  },
  imageStyle: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default CachedImageWithProgressiveLoad;
