import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/037-rainbow-effect';

registerRoot(registerVisualPreset(effect));
