import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/063-typo-triple';

registerRoot(registerVisualPreset(effect));
