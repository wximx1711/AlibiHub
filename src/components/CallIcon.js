import React from 'react';
import { Image } from 'react-native';
import { CALL_ICONS } from './callIconsData';

/**
 * CallIcon renders high-contrast, pixel-perfect white call handset & control icons.
 * Uses inline data URIs to guarantee zero asset-loading lag and 100% cross-platform consistency.
 */
export default function CallIcon({ name, size = 28, style, tintColor }) {
  const uri = CALL_ICONS[name];
  if (!uri) return null;

  return (
    <Image
      source={{ uri }}
      style={[
        {
          width: size,
          height: size,
        },
        tintColor ? { tintColor } : null,
        style,
      ]}
      resizeMode="contain"
    />
  );
}

