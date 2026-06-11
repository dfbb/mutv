import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/076-css-neon-3';

registerRoot(registerVisualPreset(effect));
