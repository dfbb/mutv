import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/095-css3-text';

registerRoot(registerVisualPreset(effect));
