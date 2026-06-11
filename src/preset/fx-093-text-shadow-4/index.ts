import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/093-text-shadow-4';

registerRoot(registerVisualPreset(effect));
