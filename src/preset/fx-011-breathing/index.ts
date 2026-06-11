import {registerRoot} from 'remotion';
import {registerTextPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/text/011-breathing';

registerRoot(registerTextPreset(effect));
