import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/031-cool-text';

registerRoot(registerVisualPreset(effect));
