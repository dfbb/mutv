import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/018-pure-css';

registerRoot(registerVisualPreset(effect));
