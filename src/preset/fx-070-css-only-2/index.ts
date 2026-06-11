import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/070-css-only-2';

registerRoot(registerVisualPreset(effect));
