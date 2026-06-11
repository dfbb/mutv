import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/061-css-text-4';

registerRoot(registerVisualPreset(effect));
