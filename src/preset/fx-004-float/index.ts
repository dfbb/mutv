import {registerRoot} from 'remotion';
import {registerTextPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/text/004-float';

registerRoot(registerTextPreset(effect));
