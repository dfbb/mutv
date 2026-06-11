import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/072-3d-text-3';

registerRoot(registerVisualPreset(effect));
