import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/081-neon-sign';

registerRoot(registerVisualPreset(effect));
