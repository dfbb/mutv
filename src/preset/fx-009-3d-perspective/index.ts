import {registerRoot} from 'remotion';
import {registerTextPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/text/009-3d-perspective';

registerRoot(registerTextPreset(effect));
