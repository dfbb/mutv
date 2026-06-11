import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/035-easy-animation';

registerRoot(registerVisualPreset(effect));
