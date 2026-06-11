import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/051-text-shadow-3';

registerRoot(registerVisualPreset(effect));
