import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/066-scss-3d';

registerRoot(registerVisualPreset(effect));
