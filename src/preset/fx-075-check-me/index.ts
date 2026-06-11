import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/075-check-me';

registerRoot(registerVisualPreset(effect));
