import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/032-pure-css-2';

registerRoot(registerVisualPreset(effect));
