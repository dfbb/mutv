import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/016-nabla-color';

registerRoot(registerVisualPreset(effect));
