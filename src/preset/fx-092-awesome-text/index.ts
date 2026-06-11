import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/092-awesome-text';

registerRoot(registerVisualPreset(effect));
