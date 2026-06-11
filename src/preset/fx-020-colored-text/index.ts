import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/020-colored-text';

registerRoot(registerVisualPreset(effect));
