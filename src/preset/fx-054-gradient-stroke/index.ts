import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/054-gradient-stroke';

registerRoot(registerVisualPreset(effect));
