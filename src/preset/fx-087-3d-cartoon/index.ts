import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/087-3d-cartoon';

registerRoot(registerVisualPreset(effect));
