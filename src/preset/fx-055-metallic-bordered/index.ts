import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/055-metallic-bordered';

registerRoot(registerVisualPreset(effect));
