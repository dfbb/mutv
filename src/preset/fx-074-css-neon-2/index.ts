import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/074-css-neon-2';

registerRoot(registerVisualPreset(effect));
