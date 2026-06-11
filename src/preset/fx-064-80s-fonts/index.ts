import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/064-80s-fonts';

registerRoot(registerVisualPreset(effect));
