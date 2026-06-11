import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/015-breathe-animation';

registerRoot(registerVisualPreset(effect));
