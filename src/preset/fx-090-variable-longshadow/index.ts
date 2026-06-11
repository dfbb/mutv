import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/090-variable-longshadow';

registerRoot(registerVisualPreset(effect));
