import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/073-css-3d-2';

registerRoot(registerVisualPreset(effect));
