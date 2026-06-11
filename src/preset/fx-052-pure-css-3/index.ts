import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/052-pure-css-3';

registerRoot(registerVisualPreset(effect));
