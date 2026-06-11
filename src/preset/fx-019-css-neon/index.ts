import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/019-css-neon';

registerRoot(registerVisualPreset(effect));
