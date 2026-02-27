import {moderateScale, scale, verticalScale} from 'react-native-size-matters';

export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;

export const fs = (size: number) => moderateScale(size, 0.3);
