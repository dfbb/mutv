import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/078-css-neon-4';

registerRoot(registerVisualPreset(effect));
