import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/029-text-animation-2';

registerRoot(registerVisualPreset(effect));
