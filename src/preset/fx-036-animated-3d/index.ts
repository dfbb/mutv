import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/036-animated-3d';

registerRoot(registerVisualPreset(effect));
