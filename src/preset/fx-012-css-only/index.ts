import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/012-css-only';

registerRoot(registerVisualPreset(effect));
