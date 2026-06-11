import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/094-long-shadow';

registerRoot(registerVisualPreset(effect));
