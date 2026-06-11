import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/039-animated-text';

registerRoot(registerVisualPreset(effect));
