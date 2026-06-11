import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/026-text-shadow';

registerRoot(registerVisualPreset(effect));
