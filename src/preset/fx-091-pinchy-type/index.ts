import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/091-pinchy-type';

registerRoot(registerVisualPreset(effect));
