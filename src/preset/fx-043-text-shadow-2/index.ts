import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/043-text-shadow-2';

registerRoot(registerVisualPreset(effect));
