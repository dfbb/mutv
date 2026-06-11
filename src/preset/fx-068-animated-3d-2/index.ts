import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/068-animated-3d-2';

registerRoot(registerVisualPreset(effect));
