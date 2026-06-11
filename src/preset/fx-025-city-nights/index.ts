import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/025-city-nights';

registerRoot(registerVisualPreset(effect));
